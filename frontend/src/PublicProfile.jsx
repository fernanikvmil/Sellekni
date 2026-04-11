import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authHeaders, getStatus } from "./api";
import Navbar from "./Navbar";

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [profil, setProfil] = useState(null);
  const [annonces, setAnnonces] = useState([]);
  const [moyenne, setMoyenne] = useState(null);
  const [totalNotes, setTotalNotes] = useState(0);
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [maNote, setMaNote] = useState(0);
  const [hoverNote, setHoverNote] = useState(0);
  const [noteEnvoyee, setNoteEnvoyee] = useState(false);

  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    fetchProfil();
  }, [username]);

  const fetchProfil = async () => {
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      setProfil(data.user);
      setAnnonces(data.annonces);
      setMoyenne(data.moyenne);
      setTotalNotes(data.totalNotes);
      setBadge(data.badge || null);
      if (user && data.user.notations) {
        const existing = data.user.notations.find(n => n.auteur === user.username);
        if (existing) setMaNote(existing.note);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoter = async (note) => {
    if (!user || user.username === username) return;
    setMaNote(note);
    try {
      const res = await fetch(`/api/users/${username}/noter`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ auteur: user.username, note }),
      });
      const data = await res.json();
      setMoyenne(data.moyenne);
      setTotalNotes(data.totalNotes);
      setNoteEnvoyee(true);
      setTimeout(() => setNoteEnvoyee(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMessage = async () => {
    if (!message.trim() || !user) return;
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          annonceId: "profil",
          annonceTitre: "Message direct",
          de: user.username,
          a: username,
          message,
        }),
      });
      setSent(true);
      setMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spinner{animation:spin 0.75s linear infinite}`}</style>
      <span className="spinner w-8 h-8 border-2 border-white/20 border-t-violet-500 rounded-full inline-block" />
    </div>
  );

  if (!profil) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/40">
      Utilisateur introuvable
    </div>
  );

  const istech = profil.role === "technicien";
  const isSelf = user?.username === username;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) forwards; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(139,92,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.06)_1px,transparent_1px)] [background-size:60px_60px]" />
      <div className="fixed top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse pointer-events-none z-0" />
      <div className="fixed bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-pink-500/15 blur-[90px] animate-pulse pointer-events-none z-0" />

      <Navbar />

      {/* Bannière */}
      <div className={`relative z-10 w-full h-36 ${istech ? "bg-gradient-to-r from-blue-900/40 via-violet-900/40 to-purple-900/40" : "bg-gradient-to-r from-violet-900/40 via-pink-900/30 to-purple-900/40"} border-b border-white/[0.06]`} />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className={`flex flex-col gap-6 ${mounted ? "fade-up" : "opacity-0"}`}>

          {/* ── Carte profil ── */}
          <div className="relative -mt-12 p-6 rounded-2xl bg-[#0e0e1a] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">

            {/* Badge membre actif */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-white/30 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Membre actif
            </div>

            <div className="flex items-end gap-5 mb-5">
              {/* Avatar */}
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0 overflow-hidden border-4 border-[#0e0e1a] shadow-xl ${istech ? "bg-gradient-to-br from-blue-600 to-violet-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                {profil.photo
                  ? <img src={`${profil.photo}`} alt="avatar" className="w-full h-full object-cover" />
                  : profil.username?.slice(0, 2).toUpperCase()
                }
              </div>

              {/* Nom + role */}
              <div className="pb-1">
                {(() => { const s = getStatus(profil.lastSeen); return (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-2 h-2 rounded-full ${s.online ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
                    <span className={`text-xs ${s.online ? "text-green-400" : "text-white/30"}`}>{s.label}</span>
                  </div>
                ); })()}
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black">{profil.username}</h1>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${istech ? "bg-blue-500/15 text-blue-300 border border-blue-500/20" : "bg-violet-500/15 text-violet-300 border border-violet-500/20"}`}>
                    {profil.role}
                  </span>
                </div>
                {badge && (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border
                    ${badge.color === "yellow" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                      badge.color === "green" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </div>
                )}
                {profil.bio && <p className="text-white/40 text-sm">{profil.bio}</p>}
              </div>
            </div>

            <div className="h-px bg-white/[0.06] mb-5" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Étoiles */}
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(star => (
                    <span
                      key={star}
                      onClick={() => handleNoter(star)}
                      onMouseEnter={() => !isSelf && setHoverNote(star)}
                      onMouseLeave={() => setHoverNote(0)}
                      className={`text-2xl transition-all duration-150 ${!isSelf && user ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
                    >
                      {star <= (hoverNote || maNote)
                        ? <span className="text-yellow-400">★</span>
                        : <span className="text-white/15">★</span>
                      }
                    </span>
                  ))}
                </div>
                <div>
                  {moyenne
                    ? <p className="text-sm font-bold text-yellow-400">{moyenne}<span className="text-white/30 font-normal text-xs"> / 5</span></p>
                    : <p className="text-xs text-white/25">Aucune notation</p>
                  }
                  {totalNotes > 0 && <p className="text-[10px] text-white/25">{totalNotes} avis</p>}
                </div>
                {noteEnvoyee && <span className="text-xs text-green-400 font-medium">✓ Noté !</span>}
              </div>

              {/* Contacts */}
              <div className="flex flex-wrap gap-2">
                {profil.ville && (
                  <span className="flex items-center gap-1.5 text-xs text-white/40 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    📍 {profil.ville}
                  </span>
                )}
                {profil.telephone && (
                  <span className="flex items-center gap-1.5 text-xs text-white/40 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    📞 {profil.telephone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-white/30 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  📅 Depuis {new Date(profil.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Annonces du vendeur */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xs text-white/30 uppercase tracking-widest">Annonces ({annonces.length})</h2>
              {annonces.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center text-white/25">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">Aucune annonce publiée</p>
                </div>
              ) : (
                annonces.map(a => (
                  <div
                    key={a._id}
                    onClick={() => navigate(`/annonces/${a._id}`)}
                    className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 hover:bg-white/[0.05] cursor-pointer transition-all duration-200"
                  >
                    {a.photo
                      ? <img src={`${a.photo}`} alt={a.titre} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      : <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-900/30 to-pink-900/20 flex items-center justify-center flex-shrink-0"><span className="text-2xl opacity-30">🖼️</span></div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300">{a.categorie}</span>
                      </div>
                      <p className="text-sm font-semibold text-white/90 truncate">{a.titre}</p>
                      <p className="text-xs text-white/40 line-clamp-1 mt-0.5">{a.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-violet-400 font-black text-sm">{Number(a.prix).toLocaleString()}</p>
                      <p className="text-[10px] text-white/25">DZD</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Envoyer un message */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xs text-white/30 uppercase tracking-widest">Message</h2>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                {isSelf ? (
                  <p className="text-xs text-white/30 text-center py-3">C'est votre profil</p>
                ) : !user ? (
                  <div className="text-center py-3">
                    <p className="text-xs text-white/30 mb-3">Connectez-vous pour envoyer un message</p>
                    <button onClick={() => navigate("/login")} className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors">
                      Se connecter
                    </button>
                  </div>
                ) : sent ? (
                  <div className="text-center py-4">
                    <p className="text-2xl mb-2">✅</p>
                    <p className="text-sm text-green-400 font-medium">Message envoyé !</p>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Écrire à ${username}...`}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all resize-none mb-3"
                    />
                    <button
                      onClick={handleMessage}
                      disabled={!message.trim()}
                      className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Envoyer →
                    </button>
                  </>
                )}
              </div>

              {!isSelf && user && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <h2 className="text-xs text-white/30 uppercase tracking-widest mb-3">Votre note</h2>
                  <div className="flex gap-1 justify-center">
                    {[1,2,3,4,5].map(star => (
                      <span
                        key={star}
                        onClick={() => handleNoter(star)}
                        onMouseEnter={() => setHoverNote(star)}
                        onMouseLeave={() => setHoverNote(0)}
                        className="text-2xl cursor-pointer transition-all duration-150"
                      >
                        {star <= (hoverNote || maNote)
                          ? <span className="text-yellow-400">★</span>
                          : <span className="text-white/20">★</span>
                        }
                      </span>
                    ))}
                  </div>
                  {noteEnvoyee && <p className="text-xs text-green-400 text-center mt-2">✓ Note enregistrée</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
