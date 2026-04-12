import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authHeaders } from "./api";
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
  const [postsCount, setPostsCount] = useState(0);
  const [activeTab, setActiveTab] = useState("annonces");
  const [selectedImage, setSelectedImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [maNote, setMaNote] = useState(0);
  const [hoverNote, setHoverNote] = useState(0);
  const [noteEnvoyee, setNoteEnvoyee] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [sending, setSending] = useState(false);

  const getConversationId = (user1, user2) => {
    return [user1, user2].sort().join('_');
  };

  useEffect(() => {
    if (username) {
      fetchProfil();
    }
  }, [username]);

  const fetchProfil = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error("Utilisateur introuvable");

      const data = await res.json();

      setProfil(data.user);
      setAnnonces(data.annonces || []);
      setMoyenne(data.moyenne ? parseFloat(data.moyenne) : null);
      setTotalNotes(data.totalNotes || 0);
      setBadge(data.badge || null);
      setPostsCount(data.postsCount || 0);

      if (user && data.user?.notations) {
        const existing = data.user.notations.find(
          (n) => n.auteur === user.username
        );
        if (existing) setMaNote(existing.note);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  const handleNoter = async (note) => {
    if (!user || user.username === username) return;

    setMaNote(note);
    setNoteError(null);

    try {
      const res = await fetch(`/api/users/${username}/noter`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          auteur: user.username,
          note,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la notation");
      }

      const data = await res.json();
      setMoyenne(parseFloat(data.moyenne));
      setTotalNotes(data.totalNotes);

      setNoteEnvoyee(true);
      setTimeout(() => setNoteEnvoyee(false), 3000);
    } catch (err) {
      console.error(err);
      setNoteError(err.message || "Impossible d'enregistrer la note");
      setTimeout(() => setNoteError(null), 3000);
      const oldNote = maNote;
      setMaNote(oldNote);
    }
  };

  const handleMessage = async () => {
    if (!message.trim() || !user || sending) return;

    setMessageError(null);
    setSending(true);

    const conversationId = getConversationId(user.username, username);

    try {
      const response = await fetch("/api/messages/message-post", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          annonceId: conversationId,
          annonceTitre: `Message direct`,
          de: user.username,
          a: username,
          message: message.trim(),
          type: "direct_message",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'envoi");
      }

      setSent(true);
      setMessage("");

      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("Erreur d'envoi:", err);
      setMessageError(err.message || "Impossible d'envoyer le message");
      setTimeout(() => setMessageError(null), 4000);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMessage();
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || "??";

  const getCategoryIcon = (categorie) => {
    const icons = {
      "électronique": "📱",
      "informatique": "💻",
      "maison": "🏠",
      "mode": "👕",
      "beauté": "💄",
      "sport": "⚽",
      "automobile": "🚗",
      "services": "🔧",
      "emploi": "💼",
      "immobilier": "🏢",
      "autre": "📦"
    };
    return icons[categorie?.toLowerCase()] || "📦";
  };

  const getCategoryColor = (categorie) => {
    const colors = {
      "électronique": "from-cyan-500 to-blue-500",
      "informatique": "from-blue-500 to-indigo-500",
      "maison": "from-emerald-500 to-teal-500",
      "mode": "from-pink-500 to-rose-500",
      "beauté": "from-purple-500 to-pink-500",
      "sport": "from-green-500 to-emerald-500",
      "automobile": "from-orange-500 to-red-500",
      "services": "from-violet-500 to-purple-500",
      "emploi": "from-indigo-500 to-blue-500",
      "immobilier": "from-amber-500 to-orange-500",
      "autre": "from-gray-500 to-slate-500"
    };
    return colors[categorie?.toLowerCase()] || "from-gray-500 to-slate-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] to-[#0f0f1a] text-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-white/60 mt-4">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] to-[#0f0f1a] text-white/40">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-5xl">😕</span>
          </div>
          <p className="text-white/60 mb-4">{error || "Utilisateur introuvable"}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl text-white hover:from-violet-500 hover:to-violet-600 transition-all duration-200 shadow-lg hover:shadow-violet-500/25"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const isSelf = user?.username === username;
  const isTech = profil.role === "technicien";
  const totalPublications = annonces.length + postsCount;
  const ratingStars = Math.round(moyenne || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#0f0f1a] text-white">
      <Navbar />

      {/* Modal d'image agrandie */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Agrandie" className="w-full h-full object-contain rounded-2xl" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition-all">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative">
        <div className={`h-56 w-full ${isTech ? "bg-gradient-to-r from-blue-900/50 via-blue-800/30 to-blue-900/50" : "bg-gradient-to-r from-violet-900/50 via-violet-800/30 to-violet-900/50"}`}>
          <div className="absolute inset-0 bg-black/40"></div>
          {/* Pattern decoratif */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-violet-500/20 blur-3xl"></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-20 pb-12 relative z-10">

          {/* Carte principale */}
          <div className="bg-[#0e0e1a]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

            {/* En-tête */}
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-3xl font-black overflow-hidden shadow-2xl ring-4 ring-violet-500/30">
                    {profil.photo ? (
                      <img src={profil.photo} className="w-full h-full object-cover" alt={profil.username} />
                    ) : (
                      <span>{getInitials(profil.username)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#0e0e1a]"></div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                        {profil.username}
                      </h1>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          isTech ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        }`}>
                          {isTech ? "🔧 Technicien" : "👤 Client"}
                        </span>
                        {badge && (
                          <span className={`text-sm px-3 py-1 rounded-full border ${
                            badge.color === "yellow" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                            badge.color === "green" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                            "bg-blue-500/20 text-blue-300 border-blue-500/30"
                          }`}>
                            {badge.icon} {badge.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {!user && (
                      <button
                        onClick={() => navigate("/login")}
                        className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl text-white hover:from-violet-500 hover:to-violet-600 transition-all duration-200 shadow-lg"
                      >
                        Se connecter
                      </button>
                    )}
                  </div>

                  {/* Stats et notes */}
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-lg ${s <= ratingStars ? "text-yellow-400" : "text-white/20"}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <div>
                        <span className="font-semibold text-lg">{moyenne ? moyenne.toFixed(1) : "0.0"}</span>
                        <span className="text-white/40 text-sm ml-1">/ 5</span>
                      </div>
                      <div className="text-white/40 text-sm">
                        ({totalNotes} {totalNotes === 1 ? "avis" : "avis"})
                      </div>
                    </div>

                    <div className="h-6 w-px bg-white/10"></div>

                    <div className="flex gap-5">
                      <div className="text-center">
                        <div className="text-xl font-bold text-violet-400">{annonces.length}</div>
                        <div className="text-xs text-white/40">Annonces</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-violet-400">{postsCount}</div>
                        <div className="text-xs text-white/40">Posts forum</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-violet-400">{totalPublications}</div>
                        <div className="text-xs text-white/40">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Localisation */}
                  {profil.wilaya && (
                    <div className="mt-3 flex items-center gap-1 text-sm text-white/50">
                      <span>📍</span>
                      <span>{profil.wilaya}</span>
                      {profil.ville && <span>· {profil.ville}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profil.bio && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white/70 text-sm leading-relaxed">{profil.bio}</p>
                </div>
              )}

              {/* Spécialité technicien */}
              {isTech && profil.specialite && (
                <div className="mt-4 flex items-center gap-2 text-sm p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <span className="text-blue-400 text-lg">🔧</span>
                  <span className="text-white/70">Spécialité :</span>
                  <span className="text-white font-medium">{profil.specialite}</span>
                </div>
              )}
            </div>

            {/* Section notation */}
            {!isSelf && user && (
              <div className="px-6 md:px-8 py-4 bg-white/5 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/60 mb-1">
                      {maNote > 0 ? "⭐ Votre note" : "💫 Noter ce profil"}
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleNoter(s)}
                          onMouseEnter={() => setHoverNote(s)}
                          onMouseLeave={() => setHoverNote(0)}
                          className="text-3xl focus:outline-none transition-all hover:scale-110"
                        >
                          <span className={s <= (hoverNote || maNote) ? "text-yellow-400" : "text-white/30"}>
                            {s <= (hoverNote || maNote) ? "★" : "☆"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {noteEnvoyee && (
                    <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 px-3 py-1.5 rounded-lg">
                      <span>✓</span> Note enregistrée !
                    </div>
                  )}
                  {noteError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-1.5 rounded-lg">
                      <span>⚠️</span> {noteError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Onglets */}
          <div className="mt-8">
            <div className="flex gap-2 border-b border-white/10">
              <button
                onClick={() => setActiveTab("annonces")}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === "annonces"
                    ? "text-violet-400"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                📢 Annonces ({annonces.length})
                {activeTab === "annonces" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("infos")}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === "infos"
                    ? "text-violet-400"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                ℹ️ Informations
                {activeTab === "infos" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"></div>
                )}
              </button>
            </div>

            {/* Contenu Annonces */}
            {activeTab === "annonces" && (
              <>
                {annonces.length === 0 ? (
                  <div className="bg-white/5 rounded-xl p-16 text-center">
                    <div className="text-6xl mb-4 opacity-30">📭</div>
                    <p className="text-white/40 text-lg">
                      {isSelf ? "Vous n'avez pas encore publié d'annonces" : "Aucune annonce publiée"}
                    </p>
                    {isSelf && (
                      <button
                        onClick={() => navigate("/annonces")}
                        className="mt-6 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl text-white hover:from-violet-500 hover:to-violet-600 transition-all"
                      >
                        + Publier une annonce
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                    {annonces.map((a) => (
                      <div
                        key={a._id}
                        onClick={() => navigate(`/annonces/${a._id}`)}
                        className="group bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10"
                      >
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                          {a.photo ? (
                            <>
                              <img
                                src={a.photo}
                                alt={a.titre}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-5xl opacity-30">' + getCategoryIcon(a.categorie) + '</div>';
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(a.photo);
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                              >
                                🔍
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
                              {getCategoryIcon(a.categorie)}
                            </div>
                          )}

                          {/* Badge catégorie */}
                          <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${getCategoryColor(a.categorie)} text-white shadow-lg`}>
                            {getCategoryIcon(a.categorie)} {a.categorie}
                          </div>

                          {/* Badge prix */}
                          {a.prix && (
                            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-green-400 font-bold text-sm shadow-lg">
                              {a.prix.toLocaleString()} DA
                            </div>
                          )}
                        </div>

                        {/* Contenu */}
                        <div className="p-4">
                          <h3 className="font-semibold text-white text-base mb-1 line-clamp-1 group-hover:text-violet-300 transition-colors">
                            {a.titre}
                          </h3>
                          <p className="text-white/50 text-xs line-clamp-2 mb-3">
                            {a.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-white/30">
                            <div className="flex items-center gap-2">
                              {a.wilaya && (
                                <span className="flex items-center gap-1">
                                  📍 {a.wilaya}
                                </span>
                              )}
                            </div>
                            <span className="flex items-center gap-1">
                              📅 {formatDate(a.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Contenu Informations */}
            {activeTab === "infos" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span>👤</span> Informations personnelles
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/40">Nom d'utilisateur</span>
                      <span className="text-white/80">{profil.username}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/40">Rôle</span>
                      <span className="text-white/80">{isTech ? "Technicien" : "Client"}</span>
                    </div>
                    {profil.wilaya && (
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/40">Wilaya</span>
                        <span className="text-white/80">{profil.wilaya}</span>
                      </div>
                    )}
                    {profil.ville && (
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/40">Ville</span>
                        <span className="text-white/80">{profil.ville}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/40">Membre depuis</span>
                      <span className="text-white/80">
                        {new Date(profil.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span>📊</span> Statistiques
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/40">Note moyenne</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-sm ${s <= ratingStars ? "text-yellow-400" : "text-white/20"}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-white/80">{moyenne ? moyenne.toFixed(1) : "0.0"} / 5</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/40">Nombre d'avis</span>
                      <span className="text-white/80">{totalNotes}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/40">Annonces publiées</span>
                      <span className="text-white/80">{annonces.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/40">Posts sur le forum</span>
                      <span className="text-white/80">{postsCount}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white/40">Total publications</span>
                      <span className="text-violet-400 font-bold text-lg">{totalPublications}</span>
                    </div>
                  </div>
                </div>

                {isTech && profil.specialite && (
                  <div className="md:col-span-2 bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-xl p-6 border border-blue-500/20">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <span>🔧</span> Compétences techniques
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profil.specialite.split(',').map((spec, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-blue-500/20 rounded-lg text-blue-300 text-sm">
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section message */}
          {!isSelf && user && (
            <div className="mt-8">
              <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-xl border border-violet-500/20 p-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span>💬</span> Envoyer un message privé
                </h3>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full p-3 bg-white/10 rounded-xl border border-white/10 focus:border-violet-500 focus:outline-none transition-colors resize-none"
                  placeholder={`Écrire un message à ${username}...`}
                  rows="3"
                  disabled={sending}
                />
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-3">
                  <p className="text-white/40 text-xs">
                    💡 Appuyez sur <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">Entrée</kbd> pour envoyer
                  </p>
                  <button
                    onClick={handleMessage}
                    disabled={!message.trim() || sending}
                    className="px-6 py-2 bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl hover:from-violet-500 hover:to-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                  >
                    {sending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Envoi...
                      </div>
                    ) : (
                      'Envoyer le message ✉️'
                    )}
                  </button>
                </div>
                {sent && (
                  <div className="mt-3 p-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-400 text-sm text-center">✓ Message envoyé avec succès !</p>
                  </div>
                )}
                {messageError && (
                  <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm text-center">⚠️ {messageError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message profil perso */}
          {isSelf && (
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-xl border border-blue-500/20 text-center">
              <p className="text-white/70 mb-4">👋 C'est votre profil personnel</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => navigate("/profile")}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white hover:from-blue-500 hover:to-blue-600 transition-all"
                >
                  Modifier mon profil
                </button>
                <button
                  onClick={() => navigate("/messages")}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl text-white hover:from-violet-500 hover:to-violet-600 transition-all"
                >
                  Voir mes messages
                </button>
                <button
                  onClick={() => navigate("/Annonces")}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl text-white hover:from-emerald-500 hover:to-emerald-600 transition-all"
                >
                  + Publier une annonce
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
