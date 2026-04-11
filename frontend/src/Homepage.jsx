import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authHeaders } from "./api";
import Navbar from "./Navbar";
import { AuthBtn } from "./Components";

export default function Homepage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const FLIP_WORDS = ["technicien", "plombier", "électricien", "réparateur", "carreleur"];
  const [wordIdx, setWordIdx] = useState(0);
  const [flipState, setFlipState] = useState("idle"); // idle | out | in
  const [unread, setUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(0);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setFlipState("out");
      setTimeout(() => {
        setWordIdx(i => (i + 1) % FLIP_WORDS.length);
        setFlipState("in");
        setTimeout(() => setFlipState("idle"), 350);
      }, 350);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}`)
        .then(res => res.json())
        .then(data => setSearchResults(data))
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQ]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      fetch(`/api/messages/${user.username}/unread`, { headers: authHeaders() })
        .then(res => res.json())
        .then(data => setUnread(data.count || 0))
        .catch(() => {});
      fetch(`/api/notifications/${user.username}/unread`, { headers: authHeaders() })
        .then(res => res.json())
        .then(data => setNotifUnread(data.count || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!notifOpen || !user) return;
    fetch(`/api/notifications/${user.username}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [notifOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    if (!user || notifUnread === 0) return;
    await fetch(`/api/notifications/${user.username}/tout-lire`, { method: "PATCH", headers: authHeaders() });
    setNotifUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  };

  useEffect(() => {
    fetch("/api/test")
      .then(res => res.json())
      .then(data => console.log("API OK:", data))
      .catch(err => console.error("API ERROR:", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ping-slow {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes flipOut { 0% { transform: rotateX(0deg) translateY(0); opacity:1; } 100% { transform: rotateX(90deg) translateY(-30%); opacity:0; } }
        @keyframes flipIn  { 0% { transform: rotateX(-90deg) translateY(30%); opacity:0; } 100% { transform: rotateX(0deg) translateY(0); opacity:1; } }
        .flip-out { animation: flipOut 0.35s cubic-bezier(.22,1,.36,1) forwards; }
        .flip-in  { animation: flipIn  0.35s cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes float1 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes float2 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes float3 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-16px); } }
        @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-up   { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
        .fade-in   { animation: fadeIn 0.5s ease both; }
        .ping-slow { animation: ping-slow 2.5s ease-out infinite; }
        .float1 { animation: float1 5s ease-in-out infinite; }
        .float2 { animation: float2 6.5s ease-in-out infinite; }
        .float3 { animation: float3 4s ease-in-out infinite; }
        .rotate-slow { animation: rotateSlow 20s linear infinite; }
        .nav-link { position: relative; padding-bottom: 2px; }
        .nav-link::after { content: ''; position: absolute; bottom: 0; left: 0; right: 100%; height: 1.5px; background: #8b5cf6; transition: right 0.3s ease; }
        .nav-link:hover::after, .nav-link.active::after { right: 0; }
      `}</style>

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Orbs */}
      <div className="fixed top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[100px] animate-pulse pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[450px] h-[450px] rounded-full bg-pink-500/10 blur-[90px] animate-pulse pointer-events-none z-0" style={{ animationDelay: "1s" }} />

      <Navbar />

      {/* ── MODAL RECHERCHE PROFIL ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) { setSearchOpen(false); setSearchQ(""); setSearchResults([]); }}}
        >
          <div className="w-full max-w-lg bg-[#0c0c18] border border-white/[0.08] rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(139,92,246,0.08)] overflow-hidden">

            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="relative flex-1 inline-flex items-center border border-violet-500/25 bg-violet-500/5 rounded-lg h-9 px-3 gap-2 focus-within:border-violet-500/50 focus-within:bg-violet-500/8 transition-all duration-200">
                <svg className="text-violet-400/70 flex-shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  autoFocus
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Rechercher un profil..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                />
                {searchLoading
                  ? <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin flex-shrink-0" />
                  : <kbd className="pointer-events-none flex-shrink-0 flex h-5 select-none items-center gap-0.5 rounded border border-violet-500/20 bg-violet-500/10 px-1.5 font-mono text-[10px] font-medium text-violet-400/60">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                }
              </div>
              <button onClick={() => { setSearchOpen(false); setSearchQ(""); setSearchResults([]); }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/30 hover:text-white/70 text-xs border border-white/[0.06] transition-all flex-shrink-0">✕</button>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

            {/* Résultats */}
            <div className="max-h-80 overflow-y-auto py-2">
              {!searchQ ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <span className="text-3xl opacity-20">👥</span>
                  <p className="text-white/25 text-xs">Tapez un nom d'utilisateur</p>
                </div>
              ) : searchQ && searchResults.length === 0 && !searchLoading ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <span className="text-3xl opacity-20">🔍</span>
                  <p className="text-white/30 text-sm">Aucun utilisateur trouvé</p>
                </div>
              ) : (
                searchResults.map(u => (
                  <div
                    key={u.username}
                    onClick={() => { navigate(`/profil/${u.username}`); setSearchOpen(false); setSearchQ(""); setSearchResults([]); }}
                    className="group flex items-center gap-4 mx-2 px-3 py-3 rounded-xl hover:bg-white/[0.05] cursor-pointer transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 overflow-hidden ring-1 ring-white/[0.08] ${u.role === "technicien" ? "bg-gradient-to-br from-blue-600 to-violet-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                      {u.photo
                        ? <img src={u.photo} alt="" className="w-full h-full object-cover" />
                        : u.username?.slice(0, 2).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{u.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${u.role === "technicien" ? "bg-blue-500/15 text-blue-300" : "bg-violet-500/15 text-violet-300"}`}>{u.role}</span>
                        {u.ville && <span className="text-[10px] text-white/25">📍 {u.ville}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {u.moyenne > 0 && (
                        <span className="text-xs text-yellow-400 font-bold">★ {u.moyenne}</span>
                      )}
                      <svg className="text-white/20 group-hover:text-violet-400 transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
            <div className="flex items-center justify-between px-5 py-2.5">
              <span className="text-[10px] text-white/15">{searchResults.length > 0 ? `${searchResults.length} résultat${searchResults.length > 1 ? "s" : ""}` : ""}</span>
              <span className="text-[10px] text-white/15">Entrée pour visiter</span>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className={`relative z-10 min-h-[85vh] flex items-center px-8 md:px-16 ${mounted ? "fade-up" : "opacity-0"}`} style={{ animationDelay: "0.1s" }}>
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Gauche : texte */}
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold tracking-[0.2em] text-violet-400 uppercase mb-6">
              Maintenance · Réparation · Proximité
            </span>
            <h1 className="text-5xl md:text-[4.5rem] font-black tracking-tight leading-[1.05] mb-6">
              {user?.role === "technicien" ? (
                <>
                  Proposez vos services aux{" "}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                    autres utilisateurs.
                  </span>
                </>
              ) : (
                <>
                  Trouvez le bon{" "}
                  <span style={{ perspective: "600px", display: "inline-block" }}>
                    <span
                      className={flipState === "out" ? "flip-out" : flipState === "in" ? "flip-in" : ""}
                      style={{ display: "inline-block", transformOrigin: "center center",
                        background: "linear-gradient(to right, #c084fc, #f472b6, #a78bfa)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        backgroundClip: "text" }}
                    >
                      {FLIP_WORDS[wordIdx]}.
                    </span>
                  </span>
                </>
              )}
            </h1>
            <p className="text-white/40 text-lg font-light max-w-sm mb-10 leading-relaxed">
              Clients et professionnels se connectent en quelques secondes pour tous vos besoins en maintenance & réparation.
            </p>
            {user && (
              <div className="flex items-center gap-4">
                <AuthBtn onClick={() => navigate("/annonces")} variant="violet">Voir les annonces →</AuthBtn>
              </div>
            )}
          </div>

          {/* Droite : visuel */}
          <div className="relative flex items-center justify-center h-[480px]">
            {/* Cercle rotatif de fond */}
            <div className="rotate-slow absolute w-[380px] h-[380px] rounded-full border border-violet-500/10" />
            <div className="rotate-slow absolute w-[300px] h-[300px] rounded-full border border-pink-500/10" style={{ animationDirection: "reverse", animationDuration: "30s" }} />

            {/* Glow central */}
            <div className="absolute w-48 h-48 rounded-full bg-violet-600/20 blur-[60px]" />
            <div className="absolute w-32 h-32 rounded-full bg-pink-500/15 blur-[40px]" />

            {/* Icônes flottantes */}
            {[
              { icon: "🔧", cls: "float1", pos: "top-[10%] left-[22%]", size: "text-4xl", bg: "from-violet-600/30 to-purple-700/20" },
              { icon: "⚙️", cls: "float2", pos: "top-[8%] right-[20%]", size: "text-5xl", bg: "from-pink-600/30 to-rose-700/20" },
              { icon: "🔩", cls: "float3", pos: "top-[42%] left-[8%]", size: "text-3xl", bg: "from-blue-600/20 to-violet-600/20" },
              { icon: "🛠️", cls: "float1", pos: "top-[38%] right-[6%]", size: "text-4xl", bg: "from-violet-700/30 to-pink-600/20" },
              { icon: "🔨", cls: "float2", pos: "bottom-[18%] left-[20%]", size: "text-3xl", bg: "from-purple-600/20 to-violet-700/20" },
              { icon: "🪛", cls: "float3", pos: "bottom-[14%] right-[22%]", size: "text-4xl", bg: "from-pink-600/20 to-purple-600/20" },
            ].map((item, i) => (
              <div key={i} className={`absolute ${item.pos} ${item.cls}`}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.bg} border border-white/[0.08] backdrop-blur-sm flex items-center justify-center shadow-lg`}>
                  <span className={item.size}>{item.icon}</span>
                </div>
              </div>
            ))}

            {/* Carte centrale */}
            <div className="relative z-10 bg-white/[0.04] border border-white/[0.1] rounded-3xl px-8 py-7 text-center backdrop-blur-md shadow-[0_0_60px_rgba(139,92,246,0.15)]">
              <div className="text-5xl mb-3">🛠️</div>
              <p className="text-lg font-black text-white">sellekni</p>
              <p className="text-xs text-white/35 mt-1">La plateforme des techniciens</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-white/40">Disponible partout en Algérie</span>
              </div>
            </div>

            {/* Petits points décoratifs */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-violet-400/30"
                style={{
                  top: `${15 + i * 10}%`,
                  left: `${10 + (i % 4) * 22}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-8 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <span>🛠️</span>
            <span className="font-bold text-white/60">sellekni</span>
            <span>— © 2025</span>
          </div>
          <div className="flex gap-6 text-xs text-white/30">
            {["Mentions légales", "Confidentialité", "Contact", "Aide"].map((link) => (
              <span key={link} className="hover:text-white/60 cursor-pointer transition-colors">{link}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}