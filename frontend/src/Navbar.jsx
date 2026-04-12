import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authHeaders } from "./api";
import { AuthBtn } from "./Components";
import BellIcon from "./BellIcon";
import ChatButton from "./ChatButton";
import SparkleNavbar from "./SparkleNavbar";

const NAV_ITEMS = [
  { label: "Accueil", path: "/" },
  { label: "Annonces", path: "/annonces" },
  { label: "Profil", action: "search" },
  { label: "Forum", path: "/forum" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  const [notifUnread, setNotifUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 🔍 RECHERCHE
  useEffect(() => {
    if (!searchQ.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}`)
        .then(r => r.json())
        .then(d => setSearchResults(d))
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  // 🔔 NOTIFICATIONS
  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      fetch(`/api/notifications/${user.username}/unread`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setNotifUnread(d.count || 0))
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (!notifOpen || !user) return;
    setNotifLoading(true);
    fetch(`/api/notifications/${user.username}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        setNotifications(Array.isArray(d) ? d : []);
        setNotifLoading(false);
      })
      .catch(() => setNotifLoading(false));
  }, [notifOpen, user]);

  const markNotificationAsRead = async (notifId) => {
    try {
      await fetch(`/api/notifications/${notifId}/lu`, { method: "PATCH", headers: authHeaders() });
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, lu: true } : n));
      setNotifUnread(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    if (!user || notifUnread === 0) return;
    try {
      await fetch(`/api/notifications/${user.username}/tout-lire`, { method: "PATCH", headers: authHeaders() });
      setNotifUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // 💬 CHAT
  useEffect(() => {
    if (!chatOpen || !user) return;
    setLoading(true);
    const fetchConversations = () => {
      fetch(`/api/messages/${user.username}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
          setConversations(Array.isArray(data) ? data : []);
          setLoading(false);
          if (selectedConv) {
            const updatedSelected = data.find(c => c._id === selectedConv._id);
            if (updatedSelected) setSelectedConv(updatedSelected);
          }
        })
        .catch(() => setLoading(false));
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, [chatOpen, user, selectedConv?._id]);

  useEffect(() => {
    if (selectedConv) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [selectedConv, selectedConv?.reponses?.length]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (chatRef.current && !chatRef.current.contains(e.target) && !e.target.closest('.chat-trigger')) {
        setChatOpen(false);
        setSelectedConv(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQ("");
    setSearchResults([]);
  };

  const getOther = (conv) => {
    if (!user) return "";
    return conv.de === user.username ? conv.a : conv.de;
  };

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || "??";

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const formatNotifTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMins = Math.floor((now - d) / 60000);
    const diffHours = Math.floor((now - d) / 3600000);
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const openConversation = async (conv) => {
    setSelectedConv(conv);
    setReplyText("");
    if (!conv.lu && conv.a === user.username) {
      try {
        await fetch(`/api/messages/${conv._id}/lu`, { method: "PATCH", headers: authHeaders() });
        setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, lu: true } : c));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selectedConv._id}/reponse`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const updated = await res.json();
      setSelectedConv(updated);
      setConversations(prev => prev.map(c => c._id === updated._id ? updated : c));
      setReplyText("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const buildThread = (conv) => {
    if (!conv) return [];
    const thread = [{ de: conv.de, message: conv.message, createdAt: conv.createdAt }];
    if (conv.reponses && Array.isArray(conv.reponses)) conv.reponses.forEach(r => thread.push(r));
    return thread;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'commentaire': return '💬';
      case 'forum': return '📝';
      case 'message': return '💌';
      case 'like': return '❤️';
      default: return '🔔';
    }
  };

  const getNotificationAction = (notif) => {
    if (notif.type === 'commentaire' && notif.annonceId) return () => navigate(`/annonces/${notif.annonceId}`);
    if (notif.type === 'forum' && notif.postId) return () => navigate(`/forum`);
    if (notif.type === 'message') return () => { setChatOpen(true); setNotifOpen(false); };
    return () => navigate("/");
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const handleNavClick = (item) => {
    if (item.action === "search") setSearchOpen(true);
    else navigate(item.path);
    setMobileMenuOpen(false);
  };

  const openNotifications = () => {
    setNotifOpen(true);
    setProfileOpen(false);
    setMobileMenuOpen(false);
  };

  // Composant dropdown notifications (pour desktop)
  const NotificationsDropdown = () => (
    <div className="absolute right-0 top-12 w-80 bg-[#0c0c18] border border-white/10 rounded-xl shadow-2xl z-[200] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-bold text-white">🔔 Notifications</span>
        {notifUnread > 0 && (
          <button onClick={markAllRead} className="text-[10px] text-violet-400 hover:text-violet-300">
            Tout marquer comme lu
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2 opacity-30">🔔</div>
            <p className="text-white/30 text-sm">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => {
                markNotificationAsRead(notif._id);
                getNotificationAction(notif)();
                setNotifOpen(false);
              }}
              className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/5 hover:bg-white/5 ${!notif.lu ? 'bg-violet-500/5' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-lg flex-shrink-0">
                {getNotificationIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${!notif.lu ? 'text-white' : 'text-white/60'}`}>{notif.message}</p>
                <p className="text-[10px] text-white/25 mt-1">{formatNotifTime(notif.createdAt)}</p>
              </div>
              {!notif.lu && <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">

        {/* Menu Burger - visible seulement sur mobile (à gauche) */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-white text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            ☰
          </button>
        </div>

        {/* Logo */}
        <div
          className="text-xl font-black text-white cursor-pointer md:relative md:left-0 md:translate-x-0"
          onClick={() => navigate("/")}
        >
          sellekni
        </div>

        {/* Desktop Navigation - centré */}
        <div className="hidden md:flex md:flex-1 md:justify-center">
          <SparkleNavbar
            items={NAV_ITEMS.map(i => ({ key: i.label, label: i.label }))}
            color="#8b5cf6"
            initialIndex={(() => {
              const p = location.pathname;
              if (p === "/") return 0;
              if (p.startsWith("/annonces")) return 1;
              if (p.startsWith("/profil") || p.startsWith("/profile")) return 2;
              if (p.startsWith("/forum")) return 3;
              return 0;
            })()}
            onNavigate={(index) => {
              const item = NAV_ITEMS[index];
              if (!item) return;
              if (item.action === "search") setSearchOpen(true);
              else navigate(item.path);
            }}
          />
        </div>

        {/* Boutons droite */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* 💬 CHAT BUTTON */}
              <div className="relative chat-trigger">
                {/* Mobile : lien direct vers /messages */}
                <div className="md:hidden">
                  <button
                    onClick={() => navigate("/messages")}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10 transition-colors"
                  >
                    💬
                  </button>
                </div>
                {/* Desktop : ChatButton avec animation */}
                <div className="hidden md:block">
                  <ChatButton onClick={() => setChatOpen(true)} />
                </div>
                {/* Badge messages non lus */}
                {conversations.some(c => !c.lu && c.a === user.username) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0f] z-10" />
                )}
              </div>

              {/* 🔔 NOTIFICATION BELL - Desktop uniquement */}
              <div className="relative hidden md:block" ref={notifRef}>
                <BellIcon unreadCount={notifUnread} onClick={() => setNotifOpen(!notifOpen)} />
                {notifOpen && <NotificationsDropdown />}
              </div>

              {/* 👤 PROFIL */}
              <div className="relative" ref={profileRef}>
                <div
                  onClick={() => setProfileOpen(o => !o)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 border-2 border-violet-500/40 flex items-center justify-center text-white font-bold cursor-pointer relative"
                >
                  {user.username?.slice(0, 1).toUpperCase()}
                  {/* Badge notif sur mobile uniquement */}
                  {notifUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center px-1 md:hidden">
                      {notifUnread > 9 ? '9+' : notifUnread}
                    </span>
                  )}
                </div>

                {profileOpen && (
                  <div className="absolute right-0 top-12 bg-[#0c0c18] text-white rounded-xl shadow-xl min-w-[170px] z-50 border border-white/[0.08] overflow-hidden">
                    <button onClick={openNotifications} className="block w-full text-left px-4 py-2.5 hover:bg-white/10 text-sm md:hidden">
                      🔔 Notifications {notifUnread > 0 && `(${notifUnread})`}
                    </button>
                    <button onClick={() => { navigate("/profile"); setProfileOpen(false); }} className="block w-full text-left px-4 py-2.5 hover:bg-white/10 text-sm">
                      👤 Mon Profil
                    </button>
                    <button onClick={logout} className="block w-full text-left px-4 py-2.5 hover:bg-white/10 text-red-400 text-sm">
                      🚪 Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <AuthBtn onClick={() => navigate("/login")}>Connexion</AuthBtn>
              <AuthBtn onClick={() => navigate("/signin")}>Inscription</AuthBtn>
            </>
          )}
        </div>
      </nav>

      {/* PANEL MENU MOBILE - Slide from left */}
      {mobileMenuOpen && (
        <>
          {/* Overlay sombre */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panneau latéral gauche */}
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-[#0c0c18] shadow-2xl z-[200] flex flex-col md:hidden animate-slide-in-left">
            {/* En-tête du panneau */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="text-xl font-bold text-white">Menu</div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/50 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Contenu du menu */}
            <div className="flex-1 py-4">
              {NAV_ITEMS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.action === "search") {
                      setSearchOpen(true);
                    } else {
                      navigate(item.path);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 text-base transition-colors ${
                    (item.path === location.pathname) ||
                    (item.path === "/" && location.pathname === "/") ||
                    (item.path === "/annonces" && location.pathname.startsWith("/annonces")) ||
                    (item.path === "/forum" && location.pathname.startsWith("/forum"))
                      ? "text-violet-400 bg-violet-500/10 border-l-4 border-violet-500"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Pied du panneau */}
            <div className="p-4 border-t border-white/10">
              <div className="text-xs text-white/30 text-center">
                sellekni © 2025
              </div>
            </div>
          </div>
        </>
      )}

      {/* PANEL NOTIFICATIONS MOBILE */}
      {notifOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setNotifOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0c0c18] shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0c0c18] border-b border-white/10 p-4 flex justify-between items-center">
              <span className="text-sm font-bold text-white">🔔 Notifications</span>
              <button onClick={() => setNotifOpen(false)} className="text-white/50 text-xl">✕</button>
            </div>
            <div className="p-2">
              {notifLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2 opacity-30">🔔</div>
                  <p className="text-white/30 text-sm">Aucune notification</p>
                </div>
              ) : (
                <>
                  {notifUnread > 0 && (
                    <div className="px-4 py-2 text-right">
                      <button onClick={markAllRead} className="text-xs text-violet-400">Tout marquer comme lu</button>
                    </div>
                  )}
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => {
                        markNotificationAsRead(notif._id);
                        getNotificationAction(notif)();
                        setNotifOpen(false);
                      }}
                      className={`flex gap-3 p-4 cursor-pointer transition-colors border-b border-white/5 hover:bg-white/5 ${!notif.lu ? 'bg-violet-500/5' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-lg flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.lu ? 'text-white' : 'text-white/60'}`}>{notif.message}</p>
                        <p className="text-[10px] text-white/25 mt-1">{formatNotifTime(notif.createdAt)}</p>
                      </div>
                      {!notif.lu && <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-2" />}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECHERCHE */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md" onClick={e => { if (e.target === e.currentTarget) closeSearch(); }}>
          <div className="w-full max-w-lg bg-[#0c0c18] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 flex items-center gap-2 border border-violet-500/25 bg-violet-500/5 rounded-lg h-10 px-3">
                <svg className="w-4 h-4 text-violet-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input autoFocus type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Rechercher un utilisateur..." className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
                {searchLoading ? <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" /> : <kbd className="text-[10px] text-violet-400/60">⌘K</kbd>}
              </div>
              <button onClick={closeSearch} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/30">✕</button>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {!searchQ ? (
                <div className="flex flex-col items-center py-10">
                  <p className="text-white/25 text-sm">Tapez un nom d'utilisateur</p>
                </div>
              ) : searchResults.length === 0 && !searchLoading ? (
                <p className="text-center text-white/30 text-sm py-8">Aucun utilisateur trouvé</p>
              ) : (
                searchResults.map(u => (
                  <div key={u.username} onClick={() => { navigate(`/profil/${u.username}`); closeSearch(); }} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.04] border-b border-white/[0.04]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${u.role === "technicien" ? "bg-gradient-to-br from-blue-600 to-violet-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                      {u.photo ? <img src={u.photo} alt={u.username} className="w-full h-full object-cover rounded-xl" /> : u.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{u.username}</p>
                      <p className="text-xs text-white/35">{u.role === "technicien" ? "🔧 Technicien" : "🛒 Client"}{u.ville ? ` · ${u.ville}` : ""}</p>
                    </div>
                    {u.moyenne && <span className="text-xs text-yellow-400">⭐ {u.moyenne}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHAT PANEL DESKTOP */}
      {chatOpen && (
        <div ref={chatRef} className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-[#0c0c18] border-l border-white/[0.08] z-[100] flex flex-col shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <span className="font-bold text-white">💬 Messages</span>
            <div className="flex gap-2">
              <button onClick={() => { setChatOpen(false); navigate("/messages"); }} className="text-white/40 hover:text-white text-sm">⛶</button>
              <button onClick={() => { setChatOpen(false); setSelectedConv(null); }} className="text-white/40 hover:text-white text-xl">✕</button>
            </div>
          </div>

          {!selectedConv ? (
            <div className="flex-1 overflow-y-auto">
              {loading && conversations.length === 0 ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" /></div>
              ) : conversations.length === 0 ? (
                <p className="text-white/40 text-center mt-10 text-sm">Aucune discussion</p>
              ) : (
                conversations.map((conv) => {
                  const other = getOther(conv);
                  const isUnread = !conv.lu && conv.a === user?.username;
                  const lastMsg = conv.reponses?.length > 0 ? conv.reponses[conv.reponses.length - 1] : { de: conv.de, message: conv.message };
                  return (
                    <div key={conv._id} onClick={() => openConversation(conv)} className={`p-3 border-b border-white/10 cursor-pointer hover:bg-white/5 ${isUnread ? 'bg-violet-500/10' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">{getInitials(other)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className={`text-sm font-semibold truncate ${isUnread ? 'text-white' : 'text-white/70'}`}>{other}</p>
                            <span className="text-[10px] text-white/30">{formatDate(conv.createdAt)}</span>
                          </div>
                          <p className="text-[11px] text-white/40 truncate">{conv.annonceTitre}</p>
                          <p className={`text-xs truncate ${isUnread ? 'text-white/60' : 'text-white/30'}`}>
                            {lastMsg.de === user?.username && <span className="text-white/40">Vous: </span>}
                            {lastMsg.message?.substring(0, 50)}
                          </p>
                        </div>
                        {isUnread && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-3 p-3 border-b border-white/10">
                <button onClick={() => setSelectedConv(null)} className="text-white/50 hover:text-white text-lg">←</button>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs">{getInitials(getOther(selectedConv))}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{getOther(selectedConv)}</p>
                  <p className="text-[10px] text-white/30 truncate">{selectedConv.annonceTitre}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {buildThread(selectedConv).map((msg, idx) => {
                  const isMe = msg.de === user?.username;
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-lg text-sm break-words ${isMe ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-white/10 text-white/80 rounded-bl-sm'}`}>
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-white/20 mt-1 block">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !sending && sendReply()} placeholder="Écrire un message..." className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50" disabled={sending} />
                  <button onClick={sendReply} disabled={!replyText.trim() || sending} className={`px-4 py-2 rounded-lg text-sm font-medium ${replyText.trim() && !sending ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                    {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Envoyer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Animation CSS */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
