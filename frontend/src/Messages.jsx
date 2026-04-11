import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders } from "./api";
import Navbar from "./Navbar";

export default function Messages() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const selectedRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setTimeout(() => setMounted(true), 50);
    fetchMessages();
    // Polling toutes les 2 secondes
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [selected]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${user.username}`, { headers: authHeaders() });
      const data = await res.json();
      setConversations(data);

      // Mettre à jour la conversation ouverte si elle a de nouveaux messages
      const current = selectedRef.current;
      if (current) {
        const updated = data.find(c => c._id === current._id);
        if (updated) {
          const newCount = (updated.reponses?.length || 0) + 1;
          const oldCount = (current.reponses?.length || 0) + 1;
          if (newCount > oldCount) {
            setSelected(updated);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conv) => {
    setSelected(conv);
    setReply("");
    if (!conv.lu && conv.a === user.username) {
      await fetch(`/api/messages/${conv._id}/lu`, { method: "PATCH", headers: authHeaders() });
      setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, lu: true } : c));
    }
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selected._id}/reponse`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message: reply.trim() }),
      });
      const updated = await res.json();
      setSelected(updated);
      setConversations(prev => prev.map(c => c._id === updated._id ? updated : c));
      setReply("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const getOther = (conv) => conv.de === user.username ? conv.a : conv.de;
  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || "??";
  const unreadCount = conversations.filter(c => !c.lu && c.a === user.username).length;

  const buildThread = (conv) => {
    if (!conv) return [];
    const thread = [{ de: conv.de, message: conv.message, createdAt: conv.createdAt }];
    (conv.reponses || []).forEach(r => thread.push(r));
    return thread;
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="h-screen bg-[#07070f] text-white flex flex-col overflow-hidden">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) forwards; }
        .fade-in { animation: fadeIn 0.3s cubic-bezier(.22,1,.36,1) forwards; }
        .spinner { animation: spin 0.75s linear infinite; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.18); border-radius: 99px; }
        .bubble-in { animation: fadeIn 0.2s ease forwards; }
      `}</style>

      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] [background-size:60px_60px]" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-pink-600/8 blur-[120px]" />
      </div>

      <Navbar />

      {/* ── Layout ── */}
      <div className={`relative z-10 flex flex-1 overflow-hidden ${mounted ? "fade-up" : "opacity-0"}`}>

        {/* ── Sidebar ── */}
        <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-white/[0.05]">

          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-black tracking-tight">Messagerie</h1>
                <p className="text-xs text-white/30 mt-0.5">
                  {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                </p>
              </div>
              {unreadCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                  {unreadCount} nouveau{unreadCount > 1 ? "x" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto custom-scroll px-3 pb-4 flex flex-col gap-1">
            {loading ? (
              <div className="flex justify-center py-16">
                <span className="spinner w-5 h-5 border-2 border-white/10 border-t-violet-400 rounded-full inline-block" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <p className="text-sm text-white/40 font-medium">Aucun message</p>
                  <p className="text-xs text-white/20 mt-1">Contactez un vendeur depuis une annonce</p>
                </div>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOther(conv);
                const isUnread = !conv.lu && conv.a === user.username;
                const isActive = selected?._id === conv._id;
                const lastMsg = conv.reponses?.length > 0
                  ? conv.reponses[conv.reponses.length - 1]
                  : { de: conv.de, message: conv.message };

                return (
                  <div
                    key={conv._id}
                    onClick={() => openConversation(conv)}
                    className={`relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                      isActive
                        ? "bg-violet-600/15 border border-violet-500/25 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                        : "hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black bg-gradient-to-br ${
                        isActive ? "from-violet-500 to-purple-700" : "from-violet-700/60 to-pink-700/60"
                      } transition-all`}>
                        {getInitials(other)}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-violet-400 border-2 border-[#07070f] shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm font-semibold truncate ${isUnread ? "text-white" : "text-white/65"}`}>
                          {other}
                        </p>
                        <span className="text-[10px] text-white/20 flex-shrink-0 ml-2">
                          {formatDate(conv.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-violet-400/60 truncate mb-0.5 flex items-center gap-1">
                        <span>📦</span> {conv.annonceTitre}
                      </p>
                      <p className={`text-xs truncate ${isUnread ? "text-white/55 font-medium" : "text-white/25"}`}>
                        {lastMsg.de === user.username ? <span className="text-white/35">Vous · </span> : ""}{lastMsg.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat zone ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <div className="flex flex-col h-full fade-in">
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-white/[0.05] bg-[#07070f]/60 backdrop-blur-sm flex items-center gap-4 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-sm font-black shadow-lg">
                  {getInitials(getOther(selected))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white">{getOther(selected)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-violet-400/70">📦</span>
                    <p className="text-[11px] text-white/35 truncate">{selected.annonceTitre}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/annonces/${selected.annonceId}`)}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-violet-400 px-3 py-2 rounded-lg hover:bg-violet-500/10 border border-white/[0.05] hover:border-violet-500/25 transition-all"
                >
                  Voir l'annonce
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>

              {/* Messages thread */}
              <div className="flex-1 overflow-y-auto custom-scroll px-6 py-6 flex flex-col gap-4">
                {buildThread(selected).map((msg, i) => {
                  const isMe = msg.de === user.username;
                  const showDate = i === 0;
                  return (
                    <div key={i}>
                      {showDate && (
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 h-px bg-white/[0.05]" />
                          <span className="text-[10px] text-white/20 px-2">
                            {formatDate(msg.createdAt)}
                          </span>
                          <div className="flex-1 h-px bg-white/[0.05]" />
                        </div>
                      )}
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"} bubble-in`}>
                        <div className={`flex gap-2.5 max-w-[68%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Mini avatar */}
                          <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-auto mb-5 bg-gradient-to-br ${
                            isMe ? "from-violet-500 to-purple-700" : "from-slate-600 to-slate-700"
                          }`}>
                            {getInitials(msg.de)}
                          </div>
                          <div className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(139,92,246,0.25)]"
                                : "bg-white/[0.06] border border-white/[0.07] text-white/80 rounded-tl-sm"
                            }`}>
                              {msg.message}
                            </div>
                            <span className="text-[10px] text-white/20 px-1">{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-white/[0.05] bg-[#07070f]/60 backdrop-blur-sm flex-shrink-0">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                  reply ? "bg-white/[0.05] border-violet-500/30 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]" : "bg-white/[0.03] border-white/[0.07]"
                }`}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                    placeholder="Écrire un message..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                      reply.trim()
                        ? "bg-violet-600 hover:bg-violet-500 shadow-[0_4px_14px_rgba(139,92,246,0.4)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.5)]"
                        : "bg-white/[0.05] cursor-not-allowed"
                    }`}
                  >
                    {sending
                      ? <span className="spinner w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={reply.trim() ? "text-white" : "text-white/20"}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    }
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-1 shadow-[0_0_40px_rgba(139,92,246,0.1)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400/80"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
              </div>
              <div>
                <p className="text-white/60 font-semibold text-sm">Aucune conversation sélectionnée</p>
                <p className="text-white/20 text-xs mt-1 leading-relaxed">Choisissez une conversation dans la liste<br/>pour voir vos échanges</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
