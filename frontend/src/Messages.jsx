import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders, authFormHeaders } from "./api";
import Navbar from "./Navbar";
import VoiceRecorder from "./VoiceRecorder";
import AudioPlayer from "./AudioPlayer";
import MessageTextInput from "./MessageTextInput";
import MediaUploadButton from "./MediaUploadButton";

export default function Messages() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);   // photo confirmation
  const [sending, setSending] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const selected = conversations.find(c => c._id === selectedId);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  // ---------------- FETCH ----------------
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${user.username}`, {
        headers: authHeaders()
      });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return navigate("/login");
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [conversations, selectedId]);

  useEffect(() => {
    if (!selected || !user) return;
    markConvAsSeen(selected);
  }, [selected?._id, selected?.reponses?.length]);

  // ---------------- OPEN ----------------
  const openConversation = async (conv) => {
    setSelectedId(conv._id);
    setReply("");
    setSelectedFiles([]);
    setPendingFiles([]);
    try {
      await fetch(`/api/messages/${conv._id}/lu`, { method: "PATCH", headers: authHeaders() });
    } catch (err) { console.error("Erreur mark as read:", err); }
    markConvAsSeen(conv);
  };

  const markConvAsSeen = async (conv) => {
    const thread = buildThread(conv);
    for (const msg of thread) {
      if (msg.de !== user.username && !msg.vu) {
        const idx = msg.isMain ? "main" : msg.replyIndex;
        try {
          await fetch(`/api/messages/${conv._id}/message/${idx}/seen`, {
            method: "POST",
            headers: authHeaders(),
          });
        } catch (_) {}
      }
    }
  };

  // ---------------- DELETE MESSAGE ----------------
  const deleteMessage = async (messageIndex, isMainMessage = false) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      const indexToDelete = isMainMessage ? "main" : messageIndex;
      const res = await fetch(`/api/messages/${selected._id}/message/${indexToDelete}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        await fetchMessages();
      } else {
        alert(data.message || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la suppression du message");
    }
  };

  // ---------------- SEND (texte + fichiers + vocal) ----------------
  const sendReply = async (audioFile = null, directFiles = null) => {
    const textToSend  = reply.trim();
    const filesToSend = directFiles ?? selectedFiles;
    const hasText  = textToSend.length > 0;
    const hasFiles = filesToSend.length > 0;
    const hasAudio = !!audioFile;
    if (!hasText && !hasFiles && !hasAudio) return;
    if (!selected || sending) return;

    setSending(true);

    if (!directFiles) {
      setReply("");
      setSelectedFiles([]);
    }

    try {
      let res;

      if (hasFiles || hasAudio) {
        const formData = new FormData();
        if (textToSend) formData.append("message", textToSend);
        filesToSend.forEach(f => formData.append("media", f));
        if (hasAudio) formData.append("media", audioFile);

        res = await fetch(`/api/messages/${selected._id}/reponse`, {
          method: "POST",
          headers: authFormHeaders(),
          body: formData,
        });
      } else {
        res = await fetch(`/api/messages/${selected._id}/reponse`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ message: textToSend }),
        });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const updatedConv = await res.json();

      if (updatedConv?._id) {
        setConversations(prev =>
          prev.map(c => c._id === updatedConv._id ? updatedConv : c)
        );
        setSelectedId(updatedConv._id);
      } else {
        await fetchMessages();
      }

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Erreur lors de l'envoi:", err);
      if (!directFiles) {
        setReply(textToSend);
        setSelectedFiles(filesToSend);
      }
      alert("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  // Confirm and send pending photos
  const confirmSendPhotos = async () => {
    const files = [...pendingFiles];
    setPendingFiles([]);
    await sendReply(null, files);
  };

  // ---------------- THREAD ----------------
  const buildThread = (conv) => {
    if (!conv) return [];
    return [
      { de: conv.de, message: conv.message, media: conv.media || [], createdAt: conv.createdAt, isMain: true, vu: conv.vu, vuAt: conv.vuAt },
      ...(conv.reponses || []).map((r, index) => ({ ...r, replyIndex: index })),
    ];
  };

  // ---------------- UTILS ----------------
  const getOther = (conv) => conv.de === user.username ? conv.a : conv.de;

  const getLastPreview = (conv) => {
    const last = conv.reponses?.length > 0
      ? conv.reponses[conv.reponses.length - 1]
      : { message: conv.message, media: conv.media };
    if (last.message) return last.message;
    const type = last.media?.[0]?.type;
    if (type === "audio") return "🎤 Message vocal";
    if (type === "video") return "🎬 Vidéo";
    if (type === "image") return "📷 Photo";
    return "";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "maintenant";
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };

  const getLastMessageTime = (conv) => {
    if (conv.reponses?.length > 0) return conv.reponses[conv.reponses.length - 1].createdAt;
    return conv.createdAt;
  };

  const getUnreadCount = (conv) => {
    if (!user?.username) return 0;
    let count = 0;
    // Main message from other user, not yet seen
    if (conv.de !== user.username && conv.vu !== true) count++;
    // Replies from other user, not yet seen
    (conv.reponses || []).forEach(r => {
      if (r.de && r.de !== user.username && r.vu !== true) count++;
    });
    // Fallback: conv-level read flag
    if (count === 0 && conv.lu === false && conv.a === user.username) return 1;
    return count;
  };

  // ---------------- UI ----------------
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#07021A] via-[#08031D] to-[#07021A] text-white">
      <Navbar />

      {/* Media confirmation modal */}
      {pendingFiles.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative w-[380px] max-w-[92vw] rounded-3xl overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.8)]"
            style={{ background: "linear-gradient(160deg,#0f0525 0%,#0a0a1e 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Header */}
            <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.25),rgba(31,72,181,0.25))", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Envoyer les médias</p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {pendingFiles.length} fichier{pendingFiles.length > 1 ? "s" : ""} sélectionné{pendingFiles.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview grid */}
            <div className="p-4">
              <div className={`grid gap-2 ${pendingFiles.length === 1 ? "grid-cols-1" : pendingFiles.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {pendingFiles.map((f, i) => {
                  const url = URL.createObjectURL(f);
                  const isVideo = f.type.startsWith("video/");
                  const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
                  return (
                    <div key={i} className="relative group rounded-xl overflow-hidden"
                      style={{ aspectRatio: pendingFiles.length === 1 ? "16/9" : "1/1" }}>
                      {isVideo ? (
                        <video
                          src={url}
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      )}
                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                      {/* Type badge */}
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium text-white/80"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
                        {isVideo ? (
                          <>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            Vidéo
                          </>
                        ) : (
                          <>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            Photo
                          </>
                        )}
                        · {sizeMB}Mo
                      </div>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingFiles([])}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmSendPhotos}
                disabled={sending}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#8B5CF6,#1F48B5)", boxShadow: "0 4px 20px rgba(139,92,246,0.35)" }}
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <div className={`${selectedId ? "hidden sm:flex" : "flex"} w-full sm:w-[300px] flex-col flex-shrink-0`}
          style={{ background: "linear-gradient(180deg,#060218 0%,#080a28 100%)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(31,72,181,0.2))", border: "1px solid rgba(139,92,246,0.18)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-bold tracking-tight text-white">Messages</p>
                  <p className="text-[10px] text-white/25">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {(() => {
                const totalUnread = conversations.reduce((acc, c) => acc + getUnreadCount(c), 0);
                return totalUnread > 0 ? (
                  <div className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#8B5CF6,#1F48B5)", boxShadow: "0 0 12px rgba(139,92,246,0.5)" }}>
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(196,181,253,0.2) transparent" }}>
            {loading ? (
              <div className="p-6 flex flex-col gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-white/[0.05] flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/[0.05] rounded-full w-3/4" />
                      <div className="h-2 bg-white/[0.03] rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pb-8 text-white/30">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm">Aucune conversation</p>
              </div>
            ) : (
              conversations.map(conv => {
                const otherUser = getOther(conv);
                const isActive = selected?._id === conv._id;
                const unreadCount = getUnreadCount(conv);
                const hasUnread = unreadCount > 0;
                return (
                  <div
                    key={conv._id}
                    onClick={() => openConversation(conv)}
                    className="px-4 py-3.5 cursor-pointer transition-all duration-150 relative"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: isActive
                        ? "linear-gradient(90deg,rgba(139,92,246,0.12) 0%,rgba(139,92,246,0.04) 100%)"
                        : hasUnread
                        ? "rgba(139,92,246,0.04)"
                        : "transparent"
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive ? "linear-gradient(90deg,rgba(139,92,246,0.12) 0%,rgba(139,92,246,0.04) 100%)" : hasUnread ? "rgba(139,92,246,0.04)" : "transparent"; }}
                  >
                    {/* Active accent bar */}
                    {isActive && (
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                        style={{ background: "linear-gradient(180deg,#8B5CF6,#6366f1)" }} />
                    )}
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-11 h-11 rounded-full overflow-hidden ${hasUnread ? "ring-[1.5px] ring-violet-500/70" : "ring-1 ring-white/[0.06]"}`}>
                          {conv.otherUserPhoto ? (
                            <img
                              src={conv.otherUserPhoto}
                              alt={otherUser}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">${otherUser[0]?.toUpperCase() || "?"}</div>`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                              {otherUser[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        {hasUnread && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                            style={{ background: "linear-gradient(135deg,#8B5CF6,#6366f1)", borderColor: "#060218", boxShadow: "0 0 8px rgba(139,92,246,0.8)" }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1 mb-[3px]">
                          <p className={`truncate leading-tight ${hasUnread
                            ? "text-[13.5px] font-bold text-white tracking-tight"
                            : "text-[13px] font-semibold text-white/65 tracking-tight"
                          }`}>
                            {otherUser}
                          </p>
                          <span className={`text-[10px] flex-shrink-0 font-medium ${hasUnread ? "text-violet-300/90" : "text-white/20"}`}>
                            {formatRelativeTime(getLastMessageTime(conv))}
                          </span>
                        </div>
                        {conv.annonceTitre && (
                          <p className="text-[10px] text-violet-400/45 truncate mb-[2px] font-medium">📦 {conv.annonceTitre}</p>
                        )}
                        <div className="flex items-center justify-between gap-1.5">
                          <p className={`text-[11.5px] truncate flex-1 ${hasUnread ? "text-white/55 font-medium" : "text-white/28"}`}>
                            {getLastPreview(conv)}
                          </p>
                          {hasUnread && (
                            <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ background: "linear-gradient(135deg,#8B5CF6,#4f46e5)", boxShadow: "0 0 10px rgba(139,92,246,0.55)" }}>
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── CHAT ── */}
        <div className={`${selectedId ? "flex" : "hidden"} sm:flex flex-1 flex-col overflow-hidden`}>

          {!selected ? (
            <div className="flex flex-col items-center justify-center flex-1 text-white/25">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
                style={{ background: "rgba(196,181,253,0.1)", border: "1px solid rgba(196,181,253,0.15)" }}>
                💬
              </div>
              <p className="text-base font-medium text-white/40">Sélectionne une conversation</p>
              <p className="text-xs text-white/20 mt-1">pour commencer à discuter</p>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="px-3 sm:px-5 py-3.5 flex items-center gap-3 flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,rgba(109,40,217,0.12) 0%,rgba(15,15,30,0) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)"
                }}>
                {/* Back button (mobile only) */}
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.07] transition-all flex-shrink-0"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/[0.1]">
                  {selected.otherUserPhoto ? (
                    <img
                      src={selected.otherUserPhoto}
                      alt={getOther(selected)}
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center font-bold text-white text-sm">${getOther(selected)[0]?.toUpperCase() || "?"}</div>`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center font-bold text-white text-sm">
                      {getOther(selected)[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm text-white cursor-pointer hover:text-violet-300 transition-colors"
                    onClick={() => navigate(`/profil/${getOther(selected)}`)}
                  >
                    {getOther(selected)}
                  </p>
                  {selected.annonceTitre && (
                    <p className="text-[11px] text-white/35 truncate">📦 {selected.annonceTitre}</p>
                  )}
                </div>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(196,181,253,0.15) transparent" }}>
                {buildThread(selected).map((msg, i) => {
                  const isMe = msg.de === user.username;
                  const hasText  = msg.message?.trim().length > 0;
                  const hasMedia = msg.media?.length > 0;
                  const photoOnly = !hasText && hasMedia && msg.media.every(m => m.type === "image");
                  if (!hasText && !hasMedia) return null;

                  return (
                    <div key={i} className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}>
                     {photoOnly ? (
  /* Photo-only: no bubble, images in a clean grid */
  <div className={`flex flex-col gap-1.5 ${isMe ? "items-end" : "items-start"}`}>
    <div className={`${msg.media.length > 1 ? "grid grid-cols-2 gap-1.5" : "flex"}`}
      style={{ maxWidth: msg.media.length > 1 ? "260px" : "220px" }}>
      {msg.media.map((media, idx) => (
        <div key={idx} className="relative group overflow-hidden rounded-2xl"
          style={{ borderRadius: msg.media.length > 1 ? (idx === 0 ? "16px 4px 4px 16px" : idx === 1 ? "4px 16px 16px 4px" : "8px") : "18px" }}>
          <img
            src={media.url}
            className="w-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-[1.03]"
            style={{ maxHeight: msg.media.length === 1 ? "240px" : "140px", display: "block" }}
            alt="photo"
            onClick={() => setZoomedImage(media.url)}
          />
          {/* Expand icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all cursor-pointer"
            onClick={() => setZoomedImage(media.url)}>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
) : (
                        <div className={`max-w-[80%] sm:max-w-[68%] overflow-hidden ${
                          isMe
                            ? "rounded-2xl rounded-br-sm shadow-[0_4px_24px_rgba(109,40,217,0.3)]"
                            : "rounded-2xl rounded-bl-sm"
                        }`}
                          style={isMe
                            ? { background: "linear-gradient(135deg,#8B5CF6,#1F48B5)" }
                            : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }
                          }
                        >
                          {hasMedia && (
                            <div className="flex flex-col gap-0">
                              {msg.media.map((media, idx) => (
                                <div key={idx}>
                                 {media.type === "image" ? (
  <div className="relative group cursor-pointer overflow-hidden" onClick={() => setZoomedImage(media.url)}>
    <img
      src={media.url}
      className="w-full max-w-[260px] object-cover transition-transform duration-200 group-hover:scale-[1.02]"
      style={{ maxHeight: "220px", display: "block" }}
      alt="message"
    />
    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/15 transition-all">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </div>
    </div>
  </div>
) : media.type === "video" ? (
                                    <div className="relative overflow-hidden" style={{ maxWidth: "260px" }}>
                                      <video
                                        src={media.url}
                                        controls
                                        className="w-full block"
                                        style={{ maxHeight: "220px", background: "#000" }}
                                      />
                                    </div>
                                  ) : media.type === "audio" ? (
                                    <div className="px-3 py-2">
                                      <AudioPlayer src={media.url} isMe={isMe} />
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}
                          {hasText && (
                            <p className="text-sm leading-relaxed text-white px-4 py-2.5">{msg.message}</p>
                          )}
                        </div>
                      )}

                      {/* Status + time + delete */}
                      <div className={`flex items-center gap-2 mt-1 ${isMe ? "flex-row-reverse" : ""}`}>
                        {msg.createdAt && (
                          <span className="text-[10px] text-white/20">{formatTime(msg.createdAt)}</span>
                        )}
                        {isMe && (
                          <>
                            <span className={`text-[10px] font-medium ${msg.vu ? "text-violet-400" : "text-white/25"}`}>
                              {msg.vu ? " ✓✓Vu" : "✓"}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteMessage(msg.replyIndex, msg.isMain === true)}
                              className="text-[10px] text-red-400/50 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* INPUT */}
              <div className="px-3 py-3 flex-shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,2,24,0.92)", backdropFilter: "blur(12px)" }}>

                {/* Selected files preview */}
                {selectedFiles.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-violet-200/70"
                        style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        {f.name.length > 18 ? f.name.slice(0, 15) + "…" : f.name}
                        <button type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-white/30 hover:text-white ml-0.5">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Hidden file input */}
                  <input type="file" multiple hidden ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = "";
                      if (files.length > 0) setPendingFiles(files);
                    }}
                  />

                  {/* Attach button — hidden while recording */}
                  {!isVoiceRecording && (
                    <MediaUploadButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                    />
                  )}

                  {/* Voice recorder — expands to flex-1 while recording */}
                  <VoiceRecorder
                    onRecordingComplete={(audioFile) => sendReply(audioFile)}
                    onRecordingStart={() => setIsVoiceRecording(true)}
                    onRecordingEnd={() => setIsVoiceRecording(false)}
                    disabled={!selected || sending}
                  />

                  {/* Text input — hidden while recording */}
                  {!isVoiceRecording && (
                    <MessageTextInput
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !sending && sendReply()}
                      placeholder="Écrire un message…"
                      disabled={sending}
                    />
                  )}

                  {/* Send button — hidden while recording */}
                  {!isVoiceRecording && (
                  <button
                    type="button"
                    onClick={() => sendReply()}
                    disabled={(!reply.trim() && selectedFiles.length === 0) || sending}
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0 disabled:opacity-25 hover:opacity-90 active:scale-95"
                    style={{ background: (reply.trim() || selectedFiles.length > 0) && !sending
                      ? "linear-gradient(135deg,#8B5CF6,#1F48B5)"
                      : "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                    )}
                  </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
