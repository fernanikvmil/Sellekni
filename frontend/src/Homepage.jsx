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
  const [flipState, setFlipState] = useState("idle");
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
  const [stats, setStats] = useState({ techniciens: null, annonces: null, wilayas: null, satisfaction: null });

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "https://sellekni-backend.onrender.com";
    fetch(`${API}/api/stats`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  const services = [
    { id: 1, name: "Plomberie", description: "Réparation et installation de vos équipements", icon: "🚰", color: "from-purple-500 to-violet-600" },
    { id: 2, name: "Électricité", description: "Installation et dépannage électrique", icon: "⚡", color: "from-purple-500 to-violet-600" },
    { id: 3, name: "Peinture", description: "Travaux de peinture intérieure et extérieure", icon: "🎨", color: "from-purple-500 to-violet-600" },
    { id: 4, name: "Climatisation", description: "Installation et entretien climatisation", icon: "❄️", color: "from-purple-500 to-violet-600" },
    { id: 5, name: "Électroménager", description: "Réparation de vos appareils électroménagers", icon: "🔌", color: "from-purple-500 to-violet-600" },
    { id: 6, name: "Autres services", description: "Découvrez tous nos autres services", icon: "🔧", color: "from-purple-500 to-violet-600" }
  ];

  const steps = [
    { number: 1, title: "Décrivez votre besoin", description: "Expliquez-nous votre problème en quelques clics", icon: "📝" },
    { number: 2, title: "Recevez des devis", description: "Des professionnels vous proposent leurs services", icon: "📊" },
    { number: 3, title: "Choisissez votre pro", description: "Sélectionnez le meilleur prestataire", icon: "✅" },
    { number: 4, title: "Service réalisé", description: "Le professionnel intervient à votre domicile", icon: "🏠" }
  ];

  const features = [
    { title: "Disponibilité 7j/7", description: "Nos équipes sont disponibles tous les jours", icon: "🕒" },
    { title: "Professionnels qualifiés", description: "Des experts certifiés et expérimentés", icon: "👨‍🔧" },
    { title: "Tarifs transparents", description: "Des prix clairs et sans surprise", icon: "💰" },
    { title: "Rapidité", description: "Gagnez du temps avec une mise en relation instantanée", icon: "⏱️" }
  ];

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
    const syncUser = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "null");
      setUser(updatedUser);
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("userUpdated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("userUpdated", syncUser);
    };
  }, []);

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
    <div className="min-h-screen bg-transparent text-white overflow-x-hidden">

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
        .service-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.3);
        }
        .step-card {
          transition: all 0.3s ease;
        }
        .step-card:hover {
          transform: scale(1.02);
          background: rgba(139, 92, 246, 0.08);
        }
      `}</style>

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(196,181,253,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(196,181,253,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Orbs */}
      <div className="fixed top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[100px] animate-pulse pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[450px] h-[450px] rounded-full bg-pink-500/10 blur-[90px] animate-pulse pointer-events-none z-0" style={{ animationDelay: "1s" }} />

      <Navbar />

      
      {/* ── MODAL RECHERCHE PROFIL ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) { setSearchOpen(false); setSearchQ(""); setSearchResults([]); }}}
        >
          {/* ... contenu de la modal ... */}
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <section className={`relative z-10 min-h-[85vh] flex items-center px-5 sm:px-8 md:px-16 ${mounted ? "fade-up" : "opacity-0"}`} style={{ animationDelay: "0.1s" }}>
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          
          {/* Partie gauche - Texte */}
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold tracking-[0.2em] text-violet-400 uppercase mb-4 sm:mb-6">
              Maintenance · Réparation · Proximité
            </span>
            <h1 className="text-[2.2rem] sm:text-5xl md:text-[4.5rem] font-black tracking-tight leading-[1.05] mb-5 sm:mb-6">
              {user?.role === "technicien" ? (
                <>
                  Proposez vos services aux{" "}
                  <span className="bg-gradient-to-r from-[#C4B5FD] via-sky-300 to-violet-400 bg-clip-text text-transparent">
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
                        background: "linear-gradient(to right, #A78BFA, #A78BFA, #A78BFA)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        backgroundClip: "text" }}
                    >
                      {FLIP_WORDS[wordIdx]}.
                    </span>
                  </span>
                </>
              )}
            </h1>
            <p className="text-white/40 text-sm sm:text-base md:text-lg font-light max-w-sm mb-7 sm:mb-10 leading-relaxed">
              {user?.role === "technicien" 
                ? "Partagez votre expertise et trouvez des clients facilement pour tous vos services de maintenance & réparation."
                : "Clients et professionnels se connectent en quelques secondes pour tous vos besoins en maintenance & réparation."}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <AuthBtn onClick={() => navigate("/annonces")} variant="violet">
                {user?.role === "technicien" ? "Publier un service →" : "Publier une annonce →"}
              </AuthBtn>
              <button 
                onClick={() => navigate("/annonces")}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white border border-white/[0.1] hover:border-violet-600/50 transition-all">
                Voir les services/annonces
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <span className="text-xs text-white/50">Professionnels vérifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                  <span className="text-sm">⚡</span>
                </div>
                <span className="text-xs text-white/50">Intervention rapide</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                  <span className="text-sm">⭐</span>
                </div>
                <span className="text-xs text-white/50">Satisfaction garantie</span>
              </div>
            </div>
          </div>

          {/* Partie droite - Stats */}
          <div className="relative flex items-center justify-center">

            {/* Halos - desktop seulement */}
            <div className="hidden md:block">
              <div className="rotate-slow absolute w-[460px] h-[460px] rounded-full border border-violet-500/10" />
              <div className="rotate-slow absolute w-[360px] h-[360px] rounded-full border border-pink-500/10" style={{ animationDirection: "reverse", animationDuration: "30s" }} />
              <div className="absolute w-72 h-72 rounded-full bg-violet-600/10 blur-[100px]" />
            </div>

            {/* Grille de stats */}
            <div className="relative z-10 grid grid-cols-2 gap-3 md:gap-5 w-full max-w-sm md:max-w-md">
              {[
                { icon: "👨‍🔧", label: "Techniciens", value: stats.techniciens !== null ? `${stats.techniciens}` : "…", accent: "rgba(139,92,246,0.35)" },
                { icon: "📋",  label: "Annonces",     value: stats.annonces     !== null ? `${stats.annonces}`     : "…", accent: "rgba(196,181,253,0.25)" },
                { icon: "🏙️", label: "Wilayas",       value: stats.wilayas      !== null ? `${stats.wilayas}`      : "…", accent: "rgba(99,102,241,0.3)"  },
                { icon: "⭐",  label: "Satisfaction",  value: stats.satisfaction !== null ? `${stats.satisfaction}%`: "Nouveau", accent: "rgba(167,139,250,0.3)" },
              ].map((stat, i) => (
                <div key={i} style={{
                  position: "relative",
                  borderRadius: "20px",
                  overflow: "hidden",
                  background: "linear-gradient(145deg, #0f0628 0%, #0a031e 100%)",
                  boxShadow: `0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(196,181,253,0.07) inset, 0 8px 32px ${stat.accent}`,
                  isolation: "isolate",
                  animation: `fadeUp 0.6s cubic-bezier(.22,1,.36,1) ${0.2 + i * 0.1}s both`,
                }}>
                  {/* Shimmer diagonal */}
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.08) 100%)",
                    mixBlendMode: "overlay",
                  }} />
                  {/* Bordure dégradée */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "20px", padding: "1px",
                    background: "linear-gradient(135deg, rgba(196,181,253,0.55) 0%, rgba(196,181,253,0.08) 50%, rgba(139,92,246,0.4) 100%)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    zIndex: 3, pointerEvents: "none",
                  }} />
                  {/* Contenu */}
                  <div style={{ position: "relative", zIndex: 10, padding: "1.2rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <span style={{ fontSize: "clamp(1.6rem, 4vw, 2rem)" }}>{stat.icon}</span>
                    <p style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 900, color: "white", lineHeight: 1, margin: 0 }}>{stat.value}</p>
                    <p style={{ fontSize: "clamp(0.7rem, 2vw, 0.85rem)", color: "rgba(196,181,253,0.55)", fontWeight: 500, margin: 0 }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
         </div>
      </section>

           {/* ── SERVICES SECTION ── */}
      <section id="services" className="relative z-10 py-12 px-5 sm:px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-white via-violet-300 to-white bg-clip-text text-transparent">
              Nos services
            </h2>
            <p className="text-white/40 text-xs">Découvrez nos catégories de services les plus demandées</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="service-card bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 cursor-pointer hover:bg-white/[0.06] transition-all duration-300">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center mb-2 text-xl mx-auto`}>
                  {service.icon}
                </div>
                <h3 className="text-xs font-semibold text-white text-center mb-1">{service.name}</h3>
                <p className="text-white/40 text-[10px] text-center leading-tight">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ── */}
      <section className="relative z-10 py-20 px-5 sm:px-8 md:px-16 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-violet-300 to-white bg-clip-text text-transparent">
              Comment ça marche ?
            </h2>
            <p className="text-white/40 text-sm">Un service simple et rapide en quelques étapes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="step-card bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-2xl mx-auto">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/35 text-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="relative z-10 py-20 px-5 sm:px-8 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 text-center">
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-white/30 text-xs">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative z-10 py-16 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-violet-600/10 via-transparent to-violet-600/10 rounded-3xl p-8 border border-violet-600/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Prêt à {user?.role === "technicien" ? "proposer vos services" : "trouver un professionnel"} ?
            </h2>
            <p className="text-white/40 text-sm mb-6">
              {user?.role === "technicien" 
                ? "Rejoignez notre communauté de professionnels et développez votre activité"
                : "Des milliers de professionnels qualifiés sont disponibles près de chez vous"}
            </p>
            <AuthBtn onClick={() => navigate("/annonces")} variant="violet">
              {user?.role === "technicien" ? "Commencer maintenant →" : "Trouver un professionnel →"}
            </AuthBtn>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-5 sm:px-8 py-8 mt-10">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-5">
          
          {/* Liens et réseaux sociaux */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
            {/* Liens */}
            {["Mentions légales", "Confidentialité", "Contact", "Aide"].map((link) => (
              <span key={link} className="text-xs text-white/30 hover:text-white/60 cursor-pointer transition-colors">{link}</span>
            ))}
            
            {/* Séparateur */}
            <span className="hidden sm:block text-white/20 text-xs">|</span>
            
            {/* Réseaux sociaux */}
            <div className="flex gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-violet-600/20 transition-all group">
                <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-violet-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-violet-600/20 transition-all group">
                <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-violet-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-violet-600/20 transition-all group">
                <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-violet-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.297-11.5c0-.214-.005-.428-.015-.642a9.938 9.938 0 002.451-2.543z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-violet-600/20 transition-all group">
                <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-violet-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.98 0 1.771-.773 1.771-1.729V1.729C24 .774 23.203 0 22.225 0z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <span>🛠️</span>
            <span className="font-bold text-white/60">sellekni</span>
            <span>— © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}