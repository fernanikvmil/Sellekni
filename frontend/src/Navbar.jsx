import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authHeaders, authFormHeaders } from "./api";
import { AuthBtn, SearchableDropdown } from "./Components";
import BellIcon from "./BellIcon";
import ChatButton from "./ChatButton";
import SparkleNavbar from "./SparkleNavbar";
import VoiceRecorder from "./VoiceRecorder";
import AudioPlayer from "./AudioPlayer";
import AIChat from "./AIChat";
import MessageTextInput from "./MessageTextInput";
import MediaUploadButton from "./MediaUploadButton";

const NAV_ITEMS = [
  { label: "Accueil", path: "/" },
  { label: "Annonces", path: "/annonces" },
  { label: "Profil", action: "search" },
  { label: "Forum", path: "/forum" },
  { label: "Map", path: "/map" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  useEffect(() => {
    const sync = () => setUser(JSON.parse(localStorage.getItem("user") || "null"));
    window.addEventListener("storage", sync);
    window.addEventListener("userUpdated", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("userUpdated", sync); };
  }, []);

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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]); // photo confirmation

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchWilaya, setSearchWilaya] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const WILAYAS = [
    "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra",
    "Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret",
    "Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda",
    "Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem",
    "M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj",
    "Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
    "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
    "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal",
    "Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa",
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef   = useRef(null);
  const notifRef     = useRef(null);
  const chatRef      = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
const modalRef = useRef(null);
  // Charger l'historique quand la modale s'ouvre
  useEffect(() => {
    if (searchOpen && user) {
      loadSearchHistory();
    }
  }, [searchOpen, user]);

  const closeZoomModal = (e) => {
     e.stopPropagation(); 
  if (e.target === e.currentTarget) setZoomedImage(null);
};

  const loadSearchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/search-history", { headers: authHeaders() });
      const data = await res.json();
      setSearchHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setSearchHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const addToSearchHistory = async (profileData) => {
    if (!user) return;
    try {
      await fetch("/api/search-history/add", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(profileData),
      });
      loadSearchHistory();
    } catch (err) {}
  };

  const removeFromHistory = async (username, e) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await fetch(`/api/search-history/${username}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setSearchHistory(prev => prev.filter(item => item.username !== username));
    } catch (err) {}
  };

  const clearAllHistory = async () => {
    if (!user || !window.confirm("Effacer tout l'historique de recherche ?")) return;
    try {
      await fetch("/api/search-history", {
        method: "DELETE",
        headers: authHeaders(),
      });
      setSearchHistory([]);
    } catch (err) {}
  };

  // 🔍 RECHERCHE
  useEffect(() => {
    if (!searchQ.trim() && searchWilaya === "all") {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set("q", searchQ.trim());
      if (searchWilaya !== "all") params.set("wilaya", searchWilaya);
      fetch(`/api/users/search?${params}`)
        .then(r => r.json())
        .then(d => setSearchResults(d))
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, searchWilaya]);

  // 🔔 NOTIFICATIONS — polling 5s
  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      fetch(`/api/notifications/${user.username}/unread`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setNotifUnread(d.count || 0))
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 5000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (!notifOpen || !user) return;
    setNotifLoading(true);
    fetch(`/api/notifications/${user.username}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setNotifications(Array.isArray(d) ? d : []); setNotifLoading(false); })
      .catch(() => setNotifLoading(false));
  }, [notifOpen, user]);

  const markNotificationAsRead = async (notifId) => {
    try {
      await fetch(`/api/notifications/${notifId}/lu`, { method: "PATCH", headers: authHeaders() });
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, lu: true } : n));
      setNotifUnread(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    if (!user || notifUnread === 0) return;
    try {
      await fetch(`/api/notifications/${user.username}/tout-lire`, { method: "PATCH", headers: authHeaders() });
      setNotifUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    } catch (err) { console.error(err); }
  };

  // 💬 CHAT — polling 3s
  useEffect(() => {
    if (!chatOpen || !user) return;
    setLoading(true);
    const fetch_ = () => {
      fetch(`/api/messages/${user.username}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
          const arr = Array.isArray(data) ? data : [];
          setConversations(arr);
          setLoading(false);
          if (selectedConv) {
            const updated = arr.find(c => c._id === selectedConv._id);
            if (updated) setSelectedConv(updated);
          }
        })
        .catch(() => setLoading(false));
    };
    fetch_();
    const iv = setInterval(fetch_, 3000);
    return () => clearInterval(iv);
  }, [chatOpen, user, selectedConv?._id]);
useEffect(() => {
  const handleClickOutside = (event) => {
    const isInsideProfile = profileRef.current?.contains(event.target);
    const isInsideNotif = notifRef.current?.contains(event.target);
    const isInsideChat = chatRef.current?.contains(event.target);
    const isInsideModal = modalRef.current?.contains(event.target);
    const isInsidePendingModal = document.getElementById('pending-modal')?.contains(event.target);
    const isInsideZoomModal = document.getElementById('zoom-modal')?.contains(event.target); // ← AJOUTEZ

    // 🔥 si clique dans modal ou modal pending ou zoom modal → NE RIEN FAIRE
    if (isInsideModal || isInsidePendingModal || isInsideZoomModal) return; // ← AJOUTEZ isInsideZoomModal

    if (!isInsideProfile) setProfileOpen(false);
    if (!isInsideNotif) setNotifOpen(false);

    // ⚠️ ferme chat seulement si pas dans chat ET pas de fichiers en attente
    if (!isInsideChat && pendingFiles.length === 0) {
      setChatOpen(false);
      setSelectedConv(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [pendingFiles.length]);
  useEffect(() => {
    if (selectedConv) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [selectedConv, selectedConv?.reponses?.length]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

 

  const closeSearch = () => { setSearchOpen(false); setSearchQ(""); setSearchWilaya("all"); setSearchResults([]); setSearchHistory([]); };

  const getOther     = (conv) => (!user ? "" : conv.de === user.username ? conv.a : conv.de);
  const getInitials  = (name) => name?.slice(0, 2).toUpperCase() || "??";

  const formatDate = (date) => {
    const d = new Date(date), now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const formatNotifTime = (date) => {
    const d = new Date(date), now = new Date();
    const dm = Math.floor((now - d) / 60000);
    const dh = Math.floor((now - d) / 3600000);
    const dd = Math.floor((now - d) / 86400000);
    if (dm < 1)  return "À l'instant";
    if (dm < 60) return `Il y a ${dm} min`;
    if (dh < 24) return `Il y a ${dh} h`;
    if (dd === 1) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const openConversation = async (conv) => {
    setSelectedConv(conv);
    setReplyText("");
    setSelectedFiles([]);
    if (!conv.lu && conv.a === user.username) {
      try {
        await fetch(`/api/messages/${conv._id}/lu`, { method: "PATCH", headers: authHeaders() });
        setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, lu: true } : c));
      } catch (err) { console.error(err); }
    }
  };

  // Envoie texte + fichiers + vocal
  const sendReply = async (audioFile = null, directFiles = null) => {
    const textToSend   = replyText.trim();
    const filesToSend  = directFiles ?? selectedFiles;
    const hasText  = textToSend.length > 0;
    const hasFiles = filesToSend.length > 0;
    const hasAudio = !!audioFile;
    if (!hasText && !hasFiles && !hasAudio) return;
    if (!selectedConv || sending) return;

    setSending(true);
    if (!directFiles) {
      setReplyText("");
      setSelectedFiles([]);
    }

    try {
      let res;
      if (hasFiles || hasAudio) {
        const formData = new FormData();
        if (textToSend) formData.append("message", textToSend);
        filesToSend.forEach(f => formData.append("media", f));
        if (hasAudio) formData.append("media", audioFile);
        res = await fetch(`/api/messages/${selectedConv._id}/reponse`, {
          method: "POST",
          headers: authFormHeaders(),
          body: formData,
        });
      } else {
        res = await fetch(`/api/messages/${selectedConv._id}/reponse`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ message: textToSend }),
        });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const updated = await res.json();
      if (updated?._id) {
        setSelectedConv(updated);
        setConversations(prev => prev.map(c => c._id === updated._id ? updated : c));
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Erreur envoi:", err);
      if (!directFiles) {
        setReplyText(textToSend);
        setSelectedFiles(filesToSend);
      }
    } finally {
      setSending(false);
    }
  };

  // Supprimer un message
  const deleteMessage = async (replyIndex, isMain = false) => {
    if (!selectedConv || !window.confirm("Supprimer ce message ?")) return;
    try {
      const idx = isMain ? "main" : replyIndex;
      const res = await fetch(`/api/messages/${selectedConv._id}/message/${idx}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        const r = await fetch(`/api/messages/${user.username}`, { headers: authHeaders() });
        const arr = await r.json();
        setConversations(Array.isArray(arr) ? arr : []);
        const updated = arr.find(c => c._id === selectedConv._id);
        if (updated) setSelectedConv(updated);
      } else {
        alert(data.message || "Erreur lors de la suppression");
      }
    } catch (err) { console.error(err); }
  };

  const buildThread = (conv) => {
    if (!conv) return [];
    return [
      { de: conv.de, message: conv.message, media: conv.media || [], createdAt: conv.createdAt, isMain: true, vu: conv.vu, vuAt: conv.vuAt },
      ...(conv.reponses || []).map((r, i) => ({ ...r, replyIndex: i })),
    ];
  };

  // Auto-mark messages as "vu"
  useEffect(() => {
    if (!selectedConv || !user) return;
    const thread = buildThread(selectedConv);
    thread.forEach((msg) => {
      if (msg.de !== user.username && !msg.vu) {
        const msgIndex = msg.isMain ? "main" : msg.replyIndex;
        fetch(`/api/messages/${selectedConv._id}/message/${msgIndex}/seen`, {
          method: "POST",
          headers: authHeaders(),
        }).catch(() => {});
      }
    });
  }, [selectedConv?._id, selectedConv?.reponses?.length]);

  const getNotificationMeta = (type) => {
    switch (type) {
      case "commentaire":
      case "commentaire_annonce":
      case "commentaire_service":
        return {
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          ),
          gradient: "from-violet-500 to-cyan-400",
          border: "border-violet-500/20",
          glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]",
        };
      case "forum":
        return {
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          ),
          gradient: "from-violet-600 to-violet-400",
          border: "border-violet-600/20",
          glow: "shadow-[0_0_12px_rgba(196,181,253,0.25)]",
        };
      case "message":
        return {
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          ),
          gradient: "from-emerald-500 to-teal-400",
          border: "border-emerald-500/20",
          glow: "shadow-[0_0_12px_rgba(16,185,129,0.25)]",
        };
      case "like":
        return {
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          ),
          gradient: "from-rose-500 to-pink-400",
          border: "border-rose-500/20",
          glow: "shadow-[0_0_12px_rgba(244,63,94,0.25)]",
        };
      default:
        return {
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          ),
          gradient: "from-slate-500 to-slate-400",
          border: "border-white/10",
          glow: "",
        };
    }
  };
  // Keep legacy helper for any place still using getNotificationIcon
  const getNotificationIcon = (type) => getNotificationMeta(type).icon;

  const getNotificationAction = (notif) => {
    if (notif.type === "commentaire_annonce" && notif.postId)  return () => navigate(`/annonces/${notif.postId}`);
    if (notif.type === "commentaire_service" && notif.postId)  return () => navigate(`/services/${notif.postId}`);
    if ((notif.type === "commentaire" || notif.type === "forum" || notif.type === "like") && notif.postId)
      return () => navigate("/forum");
    if (notif.type === "message") return () => { setChatOpen(true); setNotifOpen(false); };
    return () => navigate("/");
  };

  const isAdmin = !!(user?.isAdmin || localStorage.getItem("adminToken"));

  const logout = () => {
    localStorage.clear();
    setProfileOpen(false);
    setNotifOpen(false);
    setChatOpen(false);
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setSelectedConv(null);
    window.location.href = "/";
  };

  const openNotifications = () => {
    setNotifOpen(true);
    setProfileOpen(false);
    setMobileMenuOpen(false);
  };

  const NotificationsDropdown = () => (
    <div className="absolute right-0 top-12 w-[340px] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-[200] overflow-hidden" style={{ background: "#0A031E", border: "1px solid rgba(196,181,253,0.08)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(196,181,253,0.1)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white">Notifications</span>
          {notifUnread > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-[#8B5CF6]" style={{ background: "rgba(196,181,253,0.1)" }}>
              {notifUnread}
            </span>
          )}
        </div>
        {notifUnread > 0 && (
          <button onClick={markAllRead} className="text-[10px] text-[#C4B5FD]/50 hover:text-[#C4B5FD] transition-colors px-2 py-1 rounded-lg hover:bg-[#C4B5FD]/[0.07]">
            Tout lire
          </button>
        )}
      </div>

      <div className="max-h-[380px] overflow-y-auto">
        {notifLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-white/10 border-t-[#8B5CF6] rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p className="text-white/25 text-sm">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const meta = getNotificationMeta(notif.type);
            return (
              <div
                key={notif._id}
                onClick={() => { markNotificationAsRead(notif._id); getNotificationAction(notif)(); setNotifOpen(false); }}
                className={`flex gap-3 px-3 py-3 cursor-pointer transition-all border-b border-white/[0.04] hover:bg-white/[0.04] relative group ${!notif.lu ? "bg-[#C4B5FD]/[0.03]" : ""}`}
              >
                {/* Unread left accent */}
                {!notif.lu && (
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[#8B5CF6]/60 rounded-full" />
                )}

                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white flex-shrink-0 ${meta.glow}`}>
                  {meta.icon}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <p className={`text-xs leading-relaxed ${!notif.lu ? "text-white font-medium" : "text-white/55"}`}>
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-white/25 mt-1">{formatNotifTime(notif.createdAt)}</p>
                </div>

                {/* Unread dot */}
                {!notif.lu && (
                  <div className="w-2 h-2 rounded-full bg-[#8B5CF6] flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 backdrop-blur-xl" style={{ background: "rgba(14,5,32,0.92)", borderBottom: "1px solid rgba(196,181,253,0.12)" }}>

        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(true)} className="text-white text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
            ☰
          </button>
        </div>

        <div className="cursor-pointer md:relative md:left-0 md:translate-x-0 flex items-center gap-2" onClick={() => navigate("/")}>
          <img src="/logo.png" alt="Sellekni" className="h-8 w-auto object-contain" />
          <span className="hidden sm:inline text-xl font-black text-[#C4B5FD] tracking-tight">Sellekni</span>
        </div>

        <div className="hidden md:flex md:flex-1 md:justify-center">
          <SparkleNavbar
            key={(() => {
              const p = location.pathname;
              if (p === "/") return 0;
              if (p.startsWith("/annonces")) return 1;
              if (p.startsWith("/profil") || p.startsWith("/profile")) return 2;
              if (p.startsWith("/forum")) return 3;
              if (p.startsWith("/map")) return 4;
              return 0;
            })()}
            items={NAV_ITEMS.map(i => ({ key: i.label, label: i.label }))}
            color="#C4B5FD"
            initialIndex={(() => {
              const p = location.pathname;
              if (p === "/") return 0;
              if (p.startsWith("/annonces")) return 1;
              if (p.startsWith("/profil") || p.startsWith("/profile")) return 2;
              if (p.startsWith("/forum")) return 3;
              if (p.startsWith("/map")) return 4;
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

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* 💬 CHAT */}
              <div className="relative chat-trigger">
                <div className="md:hidden">
                  <button onClick={() => navigate("/messages")} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10 transition-colors">
                    💬
                  </button>
                </div>
                <div className="hidden md:block">
                  <ChatButton onClick={() => setChatOpen(true)} />
                </div>
                {conversations.some(c => !c.lu && c.a === user.username) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0E0520] z-10" />
                )}
              </div>

              {/* 🔔 NOTIFS desktop */}
              <div className="relative hidden md:block" ref={notifRef}>
                <BellIcon unreadCount={notifUnread} onClick={() => setNotifOpen(!notifOpen)} />
                {notifOpen && <NotificationsDropdown />}
              </div>

              {/* 👤 PROFIL */}
              <div className="relative" ref={profileRef}>
                <div onClick={() => setProfileOpen(o => !o)} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#C4B5FD] flex items-center justify-center text-white font-bold cursor-pointer relative overflow-hidden" style={{ border: "2px solid rgba(196,181,253,0.25)" }}>
                  {user.photo
                    ? <img src={user.photo} alt="avatar" className="w-full h-full object-cover rounded-full" />
                    : user.username?.slice(0, 1).toUpperCase()
                  }
                  {notifUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center px-1 md:hidden">
                      {notifUnread > 9 ? "9+" : notifUnread}
                    </span>
                  )}
                </div>
                {profileOpen && (
                  <div className="absolute right-0 top-12 text-white rounded-xl shadow-xl min-w-[185px] z-50 overflow-hidden" style={{ background: "#0A031E", border: "1px solid rgba(196,181,253,0.08)" }}>
                    <button onClick={openNotifications} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-white/[0.06] text-sm md:hidden">
                      <span className="text-base">🔔</span>
                      <span>Notifications {notifUnread > 0 && `(${notifUnread})`}</span>
                    </button>
                    <button onClick={() => { navigate("/profile"); setProfileOpen(false); }} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-[#C4B5FD]/[0.06] text-sm transition-colors">
                      <span className="text-base">👤</span>
                      <span>Mon Profil</span>
                    </button>
                    <button onClick={() => { navigate("/profile?tab=parametres"); setProfileOpen(false); }} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-[#C4B5FD]/[0.06] text-sm transition-colors">
                      <span className="text-base">⚙️</span>
                      <span>Paramètres</span>
                    </button>
                    {isAdmin && (
                      <>
                        <div className="mx-3 my-1 h-px bg-white/[0.07]" />
                        <button onClick={() => { navigate("/admin/dashboard"); setProfileOpen(false); }} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-[#C4B5FD]/[0.08] text-sm transition-colors" style={{ color: "#8B5CF6" }}>
                          <span className="text-base">🛡️</span>
                          <span>Admin Dashboard</span>
                        </button>
                      </>
                    )}
                    <div className="mx-3 my-1 h-px bg-white/[0.07]" />
                    <button onClick={logout} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-red-500/[0.08] text-red-400 text-sm transition-colors">
                      <span className="text-base">🚪</span>
                      <span>Déconnexion</span>
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

      {/* MENU MOBILE */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 shadow-2xl z-[200] flex flex-col md:hidden animate-slide-in-left" style={{ background: "#0A031E" }}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="text-xl font-bold text-white">Menu</div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/50 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10">✕</button>
            </div>
            <div className="flex-1 py-4">
              {NAV_ITEMS.map((item, idx) => (
                <button key={idx} onClick={() => { item.action === "search" ? setSearchOpen(true) : navigate(item.path); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-6 py-4 text-base transition-colors ${
                    (item.path === location.pathname) ||
                    (item.path === "/annonces" && location.pathname.startsWith("/annonces")) ||
                    (item.path === "/forum" && location.pathname.startsWith("/forum")) ||
                    (item.path === "/map" && location.pathname.startsWith("/map"))
                      ? "text-[#C4B5FD] bg-[#C4B5FD]/[0.07] border-l-4 border-[#C4B5FD]/60"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-white/10">
              <div className="text-xs text-white/30 text-center">sellekni © 2025</div>
            </div>
          </div>
        </>
      )}

      {/* NOTIFS MOBILE */}
      {notifOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setNotifOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0A031E] shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0A031E] border-b border-white/10 p-4 flex justify-between items-center">
              <span className="text-sm font-bold text-white">🔔 Notifications</span>
              <button onClick={() => setNotifOpen(false)} className="text-white/50 text-xl">✕</button>
            </div>
            <div className="p-2">
              {notifLoading ? (
                <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-white/20 border-t-[#8B5CF6] rounded-full animate-spin" /></div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2 opacity-30">🔔</div>
                  <p className="text-white/30 text-sm">Aucune notification</p>
                </div>
              ) : (
                <>
                  {notifUnread > 0 && (
                    <div className="px-4 py-2 text-right">
                      <button onClick={markAllRead} className="text-xs text-[#8B5CF6]">Tout marquer comme lu</button>
                    </div>
                  )}
                  {notifications.map(notif => {
                    const meta = getNotificationMeta(notif.type);
                    return (
                    <div key={notif._id}
                      onClick={() => { markNotificationAsRead(notif._id); getNotificationAction(notif)(); setNotifOpen(false); }}
                      className={`flex gap-3 px-3 py-3 cursor-pointer transition-all border-b border-white/[0.04] hover:bg-white/[0.04] relative ${!notif.lu ? "bg-[#C4B5FD]/[0.03]" : ""}`}
                    >
                      {!notif.lu && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[#8B5CF6]/60 rounded-full" />}
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white flex-shrink-0 ${meta.glow}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.lu ? "text-white" : "text-white/60"}`}>{notif.message}</p>
                        <p className="text-[10px] text-white/25 mt-1">{formatNotifTime(notif.createdAt)}</p>
                      </div>
                      {!notif.lu && <div className="w-2 h-2 rounded-full bg-[#8B5CF6] flex-shrink-0 mt-1.5" />}
                    </div>
                  );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECHERCHE */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4 bg-black/70 backdrop-blur-md" onClick={e => { if (e.target === e.currentTarget) closeSearch(); }}>
          <div className="w-full max-w-lg bg-[#0A031E] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <div className="flex-1 flex items-center gap-2 rounded-lg h-10 px-3" style={{ border: "1px solid rgba(196,181,253,0.15)", background: "rgba(196,181,253,0.04)" }}>
                <svg className="w-4 h-4 text-[#8B5CF6]/70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input autoFocus type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Rechercher un profil..." className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
                {searchLoading && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-[#8B5CF6] rounded-full animate-spin flex-shrink-0" />}
              </div>
              <button onClick={closeSearch} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/30 flex-shrink-0">✕</button>
            </div>
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <SearchableDropdown
                value={searchWilaya}
                onChange={setSearchWilaya}
                options={WILAYAS}
                placeholder="📍 Toutes les wilayas"
                allLabel="📍 Toutes les wilayas"
                numbered
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              {/* HISTORIQUE (quand pas de recherche) */}
              {!searchQ.trim() && searchWilaya === "all" && (
                <>
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-[#8B5CF6] rounded-full animate-spin" />
                    </div>
                  ) : searchHistory.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between px-4 pt-3 pb-1">
                        <p className="text-[10px] text-white/30">🕐 Récemment consultés</p>
                        <button onClick={clearAllHistory} className="text-[10px] text-red-400/60 hover:text-red-400">
                          Tout effacer
                        </button>
                      </div>
                      {searchHistory.map((item) => (
                        <div key={item.username} 
                          onClick={() => navigate(`/profil/${item.username}`)} 
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.04] border-b border-white/[0.04] group">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black overflow-hidden ${item.role === "technicien" ? "bg-gradient-to-br from-violet-600 to-violet-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                            {item.photo ? <img src={item.photo} alt={item.username} className="w-full h-full object-cover" /> : item.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.username}</p>
                            <p className="text-xs text-white/35 truncate">
                              {item.role === "technicien" ? "🔧" : "👤"} {item.role === "technicien" ? (item.specialite || "Technicien") : "Client"}
                              {item.wilaya ? ` · 📍 ${item.wilaya}` : ""}
                            </p>
                          </div>
                          <button onClick={(e) => removeFromHistory(item.username, e)} 
                            className="text-white/20 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity px-2">
                            ✕
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-10 gap-2">
                      <span className="text-3xl opacity-30">🕐</span>
                      <p className="text-white/25 text-sm">Aucun historique</p>
                      <p className="text-white/15 text-xs">Les profils visités apparaîtront ici</p>
                    </div>
                  )}
                </>
              )}

              {/* RÉSULTATS DE RECHERCHE */}
              {(searchQ.trim() || searchWilaya !== "all") ? (
                !searchLoading && searchResults.length === 0 ? (
                  <p className="text-center text-white/30 text-sm py-8">Aucun profil trouvé</p>
                ) : (
                  <>
                    {searchResults.length > 0 && (
                      <p className="text-[10px] text-white/20 px-4 pt-2 pb-1">
                        {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""} · triés par note
                      </p>
                    )}
                    {searchResults.map((u, i) => (
                      <div key={u.username} onClick={() => { 
                        addToSearchHistory({
                          username: u.username,
                          photo: u.photo,
                          role: u.role,
                          specialite: u.specialite,
                          wilaya: u.wilaya,
                          moyenne: u.moyenne
                        });
                        navigate(`/profil/${u.username}`); 
                        closeSearch(); 
                      }} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.04] border-b border-white/[0.04]">
                        <div className="relative flex-shrink-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black overflow-hidden ${u.role === "technicien" ? "bg-gradient-to-br from-violet-600 to-violet-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                            {u.photo ? <img src={u.photo} alt={u.username} className="w-full h-full object-cover" /> : u.username?.slice(0, 2).toUpperCase()}
                          </div>
                          {i < 3 && u.moyenne > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full text-[8px] font-black text-black flex items-center justify-center">{i + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{u.username}</p>
                          <p className="text-xs text-white/35 truncate">
                            {u.role === "technicien" ? "🔧" : "👤"} {u.role === "technicien" ? (u.specialite || "Technicien") : "Client"}
                            {u.wilaya ? ` · 📍 ${u.wilaya}` : ""}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {u.moyenne > 0 ? (
                            <><p className="text-xs text-yellow-400 font-semibold">⭐ {u.moyenne}</p><p className="text-[10px] text-white/25">{u.totalNotes} avis</p></>
                          ) : (
                            <p className="text-[10px] text-white/20">Pas de note</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* CHAT PANEL DESKTOP */}
      {chatOpen && (
        <div ref={chatRef} className="fixed top-0 right-0 w-full sm:w-[420px] h-full z-[100] flex flex-col"
          style={{ background: "linear-gradient(180deg,#07021A 0%,#0E0520 100%)", borderLeft: "1px solid rgba(196,181,253,0.12)", boxShadow: "-8px 0 40px rgba(0,0,0,0.5)" }}>

         {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]"
          style={{ background: "linear-gradient(135deg,rgba(45,16,105,0.2) 0%,rgba(14,5,32,0) 100%)", backdropFilter: "blur(12px)" }}>
          {selectedConv ? (
            <>
              <button onClick={() => { setSelectedConv(null); setSelectedFiles([]); }}
                className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all flex-shrink-0 text-base">
                ←
              </button>
              <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                {selectedConv.otherUserPhoto ? (
                  <img 
                    src={selectedConv.otherUserPhoto} 
                    alt={getOther(selectedConv)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = getInitials(getOther(selectedConv));
                      e.target.parentElement.classList.add("bg-gradient-to-br", "from-violet-600", "to-violet-700", "flex", "items-center", "justify-center", "text-sm", "font-black", "text-white");
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center text-sm font-black text-white">
                    {getInitials(getOther(selectedConv))}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">{getOther(selectedConv)}</p>
                {selectedConv.annonceTitre && (
                  <p className="text-[10px] text-[#8B5CF6]/60 truncate leading-tight mt-0.5">📦 {selectedConv.annonceTitre}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: "linear-gradient(135deg,rgba(196,181,253,0.25),rgba(219,39,119,0.15))", border: "1px solid rgba(196,181,253,0.25)" }}>
                💬
              </div>
              <div className="flex-1">
                <span className="font-bold text-white text-sm block">Messages</span>
                {conversations.length > 0 && (
                  <span className="text-[10px] text-white/30">{conversations.length} conversation{conversations.length > 1 ? "s" : ""}</span>
                )}
              </div>
            </>
          )}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => { setChatOpen(false); navigate("/messages"); }}
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/25 hover:text-white transition-all text-sm" title="Plein écran">⛶</button>
            <button onClick={() => { setChatOpen(false); setSelectedConv(null); setSelectedFiles([]); }}
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/25 hover:text-white transition-all text-lg">✕</button>
          </div>
        </div>

          {/* Contenu */}
          {!selectedConv ? (
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(196,181,253,0.2) transparent" }}>
              {loading && conversations.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-6 h-6 border-2 border-white/15 border-t-[#8B5CF6] rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 gap-3 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-3xl opacity-25">💬</div>
                  <p className="text-white/30 text-sm">Aucune discussion</p>
                  <p className="text-white/15 text-xs">Contactez un vendeur depuis une annonce</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other    = getOther(conv);
                  const isUnread = !conv.lu && conv.a === user?.username;
                  const lastMsg  = conv.reponses?.length > 0
                    ? conv.reponses[conv.reponses.length - 1]
                    : { de: conv.de, message: conv.message, media: conv.media };
                  const lastText = lastMsg.message
                    || (lastMsg.media?.[0]?.type === "audio" ? "🎤 Message vocal"
                    :   lastMsg.media?.[0]?.type === "video" ? "🎬 Vidéo"
                    :   lastMsg.media?.length               ? "📷 Photo" : "");
                  return (
                    <div key={conv._id} onClick={() => openConversation(conv)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-white/[0.04] hover:bg-white/[0.04] ${isUnread ? "bg-violet-600/[0.07]" : ""}`}>
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                          {conv.otherUserPhoto ? (
                            <img 
                              src={conv.otherUserPhoto} 
                              alt={other}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = getInitials(other);
                                e.target.parentElement.classList.add("bg-gradient-to-br", "from-violet-600", "to-pink-600", "flex", "items-center", "justify-center", "text-sm", "font-black", "text-white");
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-sm font-black text-white">
                              {getInitials(other)}
                            </div>
                          )}
                        </div>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#8B5CF6] border-2 border-[#08031D]" style={{ boxShadow: "0 0 8px rgba(196,181,253,0.9)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-sm font-semibold truncate ${isUnread ? "text-white" : "text-white/70"}`}>{other}</p>
                          <span className="text-[10px] text-white/20 flex-shrink-0 ml-2">{formatDate(conv.createdAt)}</span>
                        </div>
                        {conv.annonceTitre && (
                          <p className="text-[10px] text-violet-400/50 truncate mb-0.5">📦 {conv.annonceTitre}</p>
                        )}
                        <p className={`text-xs truncate ${isUnread ? "text-white/55 font-medium" : "text-white/28"}`}>
                          {lastMsg.de === user?.username ? <span className="text-white/35">Vous · </span> : ""}
                          {lastText || <span className="italic">...</span>}
                        </p>
                      </div>
                      {isUnread && <div className="w-2 h-2 rounded-full bg-[#8B5CF6] flex-shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(196,181,253,0.15) transparent" }}>
                {buildThread(selectedConv).map((msg, idx) => {
                  const isMe      = msg.de === user?.username;
                  const hasText   = msg.message?.trim().length > 0;
                  const hasMedia  = msg.media?.length > 0;
                  const hasAudio  = msg.media?.some(m => m.type === "audio");
                  const photoOnly = hasMedia && !hasText && !hasAudio;
                  if (!hasText && !hasMedia) return null;
                  return (
                    <div key={idx} className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className="max-w-[82%]">
                        {/* Photo-only: no bubble background */}
                        {photoOnly ? (
                          <div className={`flex flex-col gap-1 overflow-hidden rounded-2xl ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
                            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                            {msg.media.map((m, mi) => {
                              if (m.type === "image") return (
                                <img key={mi} src={m.url} alt=""
                                  className="block w-full max-w-[240px] cursor-pointer hover:brightness-90 transition-all"
                                  onError={e => { e.currentTarget.style.display = "none"; }}
                                 onClick={() => setZoomedImage(m.url)}
                                />
                              );
                              if (m.type === "video") return (
                                <video key={mi} src={m.url} controls
                                  className="block w-full max-w-[240px]" />
                              );
                              return null;
                            })}
                          </div>
                        ) : (
                          /* Normal bubble */
                          <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${
                            isMe
                              ? "bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-br-sm shadow-[0_4px_14px_rgba(196,181,253,0.3)]"
                              : "bg-white/[0.08] border border-white/[0.09] text-white/85 rounded-bl-sm"
                          }`}>
                            {hasMedia && (
                              <div className="flex flex-col gap-0.5">
                                {msg.media.map((m, mi) => {
                                  if (m.type === "image") return (
                                    <img key={mi} src={m.url} alt=""
                                      className="block w-full max-w-[240px] cursor-pointer hover:brightness-90 transition-all"
                                      style={{ borderRadius: hasText ? "0" : "inherit" }}
                                      onError={e => { e.currentTarget.style.display = "none"; }}
                                      onClick={() => setZoomedImage(m.url)}
                                    />
                                  );
                                  if (m.type === "video") return (
                                    <video key={mi} src={m.url} controls
                                      className="block w-full max-w-[240px]"
                                      style={{ borderRadius: hasText ? "0" : "inherit" }} />
                                  );
                                  if (m.type === "audio") return (
                                    <div key={mi} className="px-2 py-2">
                                      <AudioPlayer src={m.url} isMe={isMe} />
                                    </div>
                                  );
                                  return null;
                                })}
                              </div>
                            )}
                            {hasText && (
                              <p className="px-3.5 py-2.5 break-words">{msg.message}</p>
                            )}
                          </div>
                        )}

                        {/* Meta row */}
                        <div className={`flex items-center gap-2 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-[9px] text-white/20">{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            <>
                              <span className={`text-[9px] font-medium ${msg.vu ? "text-violet-400" : "text-white/25"}`}>
                                {msg.vu ? "✓✓ Vu" : "✓"}
                              </span>
                              <button onClick={() => deleteMessage(msg.replyIndex, msg.isMain === true)}
                                className="text-[9px] text-red-400/50 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex-shrink-0 flex gap-2 px-4 py-2.5 border-t border-white/[0.06] overflow-x-auto"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative flex-shrink-0 group/f">
                      {file.type.startsWith("image") ? (
                        <img src={URL.createObjectURL(file)} alt=""
                          className="w-16 h-16 object-cover rounded-xl border border-white/10 shadow" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/[0.06] flex flex-col items-center justify-center gap-1">
                          <span className="text-2xl">{file.type.startsWith("video") ? "🎬" : "🎙️"}</span>
                          <span className="text-[9px] text-white/35">{file.type.startsWith("video") ? "Vidéo" : "Audio"}</span>
                        </div>
                      )}
                      <button onClick={() => setSelectedFiles(p => p.filter((_, j) => j !== i))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow opacity-0 group-hover/f:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-shrink-0 px-3 py-3 border-t border-white/[0.06]"
                style={{ background: "linear-gradient(0deg,rgba(14,5,32,0.97) 0%,rgba(14,5,32,0.85) 100%)", backdropFilter: "blur(12px)" }}>
                <div className={`flex items-end gap-2 px-3 py-2 rounded-2xl border transition-all duration-200 ${
                  replyText || selectedFiles.length > 0
                    ? "border-violet-600/40 bg-violet-600/[0.05] shadow-[0_0_0_3px_rgba(196,181,253,0.07)]"
                    : "border-white/[0.07] bg-white/[0.03]"
                }`}>
                  <input type="file" multiple ref={fileInputRef} hidden
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = "";
                      if (files.length === 0) return;
                      setPendingFiles(files); // show confirmation
                    }}
                  />
                  <MediaUploadButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                  />

                  <div className="flex-shrink-0 mb-0.5">
                    <VoiceRecorder onRecordingComplete={(f) => sendReply(f)} disabled={sending} />
                  </div>

                  <MessageTextInput
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder="Message…"
                    disabled={sending}
                  />

                  <button onClick={() => sendReply()}
                    disabled={(!replyText.trim() && selectedFiles.length === 0) || sending}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 transition-all duration-200 ${
                      (replyText.trim() || selectedFiles.length > 0) && !sending
                        ? "bg-violet-600 hover:bg-violet-600 shadow-[0_2px_14px_rgba(196,181,253,0.5)]"
                        : "bg-white/[0.05] cursor-not-allowed"
                    }`}>
                    {sending
                      ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className={(replyText.trim() || selectedFiles.length > 0) ? "text-white" : "text-white/20"}>
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    }
                  </button>
                </div>

                {selectedFiles.length > 0 && (
                  <p className="text-[10px] text-[#8B5CF6]/60 text-center mt-1.5">
                    {selectedFiles.length} fichier{selectedFiles.length > 1 ? "s" : ""} prêt{selectedFiles.length > 1 ? "s" : ""} à envoyer
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── Photo send confirmation modal ── */}
      {pendingFiles.length > 0 && (
        <div 
          id="pending-modal"
          ref={modalRef}
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm bg-[#08031D] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
              <p className="text-sm font-bold text-white">
                Envoyer {pendingFiles.length} fichier{pendingFiles.length > 1 ? "s" : ""} ?
              </p>
              <button onClick={() => setPendingFiles([])}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-sm">
                ✕
              </button>
            </div>
            
            {/* Preview grid */}
            <div className="p-3 grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
              {pendingFiles.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.05] border border-white/[0.07]">
                  {f.type.startsWith("image") ? (
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <span className="text-2xl">{f.type.startsWith("video") ? "🎬" : "📎"}</span>
                      <span className="text-[9px] text-white/40 text-center px-1 truncate w-full text-center">{f.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 px-4 py-3 border-t border-white/[0.07]">
              <button
                onClick={() => setPendingFiles([])}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-white/50 text-sm hover:bg-white/[0.05] transition-all">
                Annuler
              </button>
              <button
                onClick={() => {
                  const files = pendingFiles;
                  setPendingFiles([]);
                  sendReply(null, files);
                }}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-600 text-white text-sm font-semibold transition-all shadow-[0_4px_14px_rgba(196,181,253,0.4)]">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .animate-slide-in-left { animation: slideInLeft 0.3s ease-out; }
      `}</style>
      <AIChat />
            {/* Modal d'agrandissement d'image */}
      {zoomedImage && (
        <div 
        id="zoom-modal" 
          className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={closeZoomModal}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img 
              src={zoomedImage} 
              alt="Agrandissement"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
             
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}