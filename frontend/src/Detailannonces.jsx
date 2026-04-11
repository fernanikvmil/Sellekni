import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authHeaders } from "./api";
import Navbar from "./Navbar";

export default function AnnonceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [annonce, setAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [commentaires, setCommentaires] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isService, setIsService] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ titre: "", description: "", prix: "" });
  const [saving, setSaving] = useState(false);
  const [sendingMsg, setSendingMsg] = useState("idle"); // idle | pending | success

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      let res = await fetch(`/api/annonces/${id}`);
      if (!res.ok) {
        res = await fetch(`/api/services/${id}`);
        if (res.ok) setIsService(true);
      }
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setAnnonce(data);
      setCommentaires(data.commentaires || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentaire = async () => {
    if (!commentaire.trim() || !user) return;
    try {
      const endpoint = isService ? `/api/services/${id}/commentaires` : `/api/annonces/${id}/commentaires`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contenu: commentaire, auteur: user.username, role: user.role }),
      });
      const data = await res.json();
      setCommentaires([...commentaires, data.commentaire]);
      setCommentaire("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleContact = async () => {
    if (!message.trim() || !user || sendingMsg !== "idle") return;
    setSendingMsg("pending");
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          [isService ? "serviceId" : "annonceId"]: id,
          [isService ? "serviceTitre" : "annonceTitre"]: annonce.titre,
          de: user.username,
          a: annonce.auteur,
          message,
        }),
      });
      setSendingMsg("success");
      setTimeout(() => { setSent(true); setMessage(""); }, 1200);
    } catch (err) {
      console.error(err);
      setSendingMsg("idle");
    }
  };

  const openEdit = () => {
    setEditForm({ titre: annonce.titre, description: annonce.description, prix: annonce.prix });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      const endpoint = isService ? `/api/services/${id}` : `/api/annonces/${id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ titre: editForm.titre, description: editForm.description, prix: Number(editForm.prix) }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnnonce(data.annonce || data.service);
        setShowEditModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const endpoint = isService ? `/api/services/${id}` : `/api/annonces/${id}`;
      await fetch(endpoint, { method: "DELETE", headers: authHeaders() });
      navigate("/annonces");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spinner { animation: spin 0.75s linear infinite; }`}</style>
      <span className="spinner w-8 h-8 border-2 border-white/20 border-t-violet-500 rounded-full inline-block" />
    </div>
  );

  if (!annonce) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/40">
      {isService ? "Service introuvable" : "Annonce introuvable"}
    </div>
  );

  const istech = annonce.role === "technicien";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) forwards; }
        .spinner { animation: spin 0.75s linear infinite; }

        .stateful-btn { position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; width:100%; padding:12px 20px; border-radius:12px; font-weight:600; font-size:14px; cursor:pointer; border:none; transition:all 0.4s cubic-bezier(.22,1,.36,1); background: linear-gradient(135deg,#6d28d9,#7c3aed); color:#fff; box-shadow:0 4px 20px rgba(109,40,217,0.35); }
        .stateful-btn:hover:not(:disabled) { background:linear-gradient(135deg,#5b21b6,#6d28d9); box-shadow:0 8px_30px rgba(109,40,217,0.5); transform:translateY(-1px); }
        .stateful-btn:disabled { cursor:not-allowed; }
        .stateful-btn .sb-content { display:flex; align-items:center; gap:8px; transition:all 0.3s ease; }
        .stateful-btn.pending .sb-content { opacity:0; transform:scale(0.8); }
        .stateful-btn.success .sb-content { opacity:0; transform:scale(0.8); }
        .stateful-btn .sb-loader { position:absolute; width:20px; height:20px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; opacity:0; transition:opacity 0.3s ease; }
        .stateful-btn.pending .sb-loader { opacity:1; }
        .stateful-btn .sb-check { position:absolute; opacity:0; transform:scale(0); transition:all 0.4s cubic-bezier(.34,1.56,.64,1); }
        .stateful-btn.success { background:linear-gradient(135deg,#059669,#10b981); box-shadow:0 4px 20px rgba(16,185,129,0.4); }
        .stateful-btn.success .sb-check { opacity:1; transform:scale(1); }
        .edit-btn { position:relative; display:flex; align-items:center; gap:4px; padding:10px 28px; border:2px solid transparent; font-size:13px; background-color:transparent; border-radius:100px; font-weight:600; color:#a78bfa; box-shadow:0 0 0 2px #7c3aed; cursor:pointer; overflow:hidden; transition:all 0.6s cubic-bezier(0.23,1,0.32,1); }
        .edit-btn svg { position:absolute; width:18px; fill:#a78bfa; z-index:9; transition:all 0.8s cubic-bezier(0.23,1,0.32,1); }
        .edit-btn .e-arr1 { right:12px; }
        .edit-btn .e-arr2 { left:-25%; }
        .edit-btn .e-circle { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:14px; height:14px; background-color:#6d28d9; border-radius:50%; opacity:0; transition:all 0.8s cubic-bezier(0.23,1,0.32,1); }
        .edit-btn .e-text { position:relative; z-index:1; transform:translateX(-10px); transition:all 0.8s cubic-bezier(0.23,1,0.32,1); }
        .edit-btn:hover { box-shadow:0 0 0 12px transparent; color:#fff; border-radius:12px; }
        .edit-btn:hover .e-arr1 { right:-25%; }
        .edit-btn:hover .e-arr2 { left:12px; }
        .edit-btn:hover .e-text { transform:translateX(10px); }
        .edit-btn:hover svg { fill:#fff; }
        .edit-btn:active { scale:0.95; box-shadow:0 0 0 4px #7c3aed; }
        .edit-btn:hover .e-circle { width:180px; height:180px; opacity:1; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(139,92,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.06)_1px,transparent_1px)] [background-size:60px_60px]" />
      <div className="fixed top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse pointer-events-none z-0" />
      <div className="fixed bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-pink-500/15 blur-[90px] animate-pulse pointer-events-none z-0" />

      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${mounted ? "fade-up" : "opacity-0"}`}>

          {/* Colonne principale */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Photo */}
            {annonce.photo && annonce.photo.startsWith("http") ? (
              <img src={annonce.photo} alt={annonce.titre} className="w-full max-h-80 object-cover rounded-2xl border border-white/[0.08]" />
            ) : (
              <div className="w-full h-60 rounded-2xl bg-gradient-to-br from-violet-900/30 to-pink-900/20 border border-white/[0.08] flex items-center justify-center">
                <span className="text-6xl opacity-20">{isService ? "🔧" : "🖼️"}</span>
              </div>
            )}

            {/* Infos */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-medium">{annonce.categorie}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${istech ? "bg-blue-500/15 text-blue-300" : "bg-pink-500/15 text-pink-300"}`}>{annonce.role}</span>
                {isService && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 font-medium">Service</span>
                )}
              </div>
              <h1 className="text-2xl font-black mb-2">{annonce.titre}</h1>
              <p className="text-3xl font-black text-violet-400 mb-4">
                {Number(annonce.prix).toLocaleString()} <span className="text-sm font-normal text-white/30">DZD</span>
              </p>
              <div className="h-px bg-white/[0.06] mb-4" />
              <h2 className="text-xs text-white/30 uppercase tracking-widest mb-2">Description</h2>
              <p className="text-white/70 text-sm leading-relaxed">{annonce.description}</p>
            </div>

            {/* Détails */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <h2 className="text-xs text-white/30 uppercase tracking-widest mb-4">Détails</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "📦", label: "Catégorie", value: annonce.categorie },
                  { icon: "💰", label: "Prix",      value: `${Number(annonce.prix).toLocaleString()} DZD` },
                  { icon: "👤", label: "Vendeur",   value: annonce.auteur },
                  { icon: "🏷️", label: "Type",     value: isService ? "Service" : annonce.role },
                  { icon: "📅", label: "Publié le", value: new Date(annonce.createdAt).toLocaleDateString("fr-FR") },
                  ...(annonce.wilaya ? [{ icon: "📍", label: "Wilaya", value: annonce.wilaya }] : []),
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span>{icon}</span>
                    <div>
                      <p className="text-[10px] text-white/30">{label}</p>
                      <p className="text-sm font-medium text-white/80">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Vendeur */}
            <div
              onClick={() => navigate(`/profil/${annonce.auteur}`)}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-200"
            >
              <h2 className="text-xs text-white/30 uppercase tracking-widest mb-4">Vendeur</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${istech ? "bg-gradient-to-br from-blue-600 to-violet-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                  {annonce.auteur?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{annonce.auteur}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${istech ? "bg-blue-500/15 text-blue-300" : "bg-violet-500/15 text-violet-300"}`}>{annonce.role}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Membre actif
                </div>
                <span className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors">Voir le profil →</span>
              </div>
            </div>

            {/* Modifier + Supprimer */}
            {user?.username === annonce.auteur && (
              <div className="flex items-center justify-center gap-3">
                {/* Bouton Modifier animé */}
                <button className="edit-btn" onClick={openEdit}>
                  <svg viewBox="0 0 24 24" className="e-arr2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"/>
                  </svg>
                  <span className="e-text">Modifier</span>
                  <span className="e-circle" />
                  <svg viewBox="0 0 24 24" className="e-arr1" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"/>
                  </svg>
                </button>

                {/* Bouton Supprimer */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="group relative w-[50px] h-[50px] hover:w-[140px] rounded-full hover:rounded-[50px] bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:border-red-500 flex items-center justify-center overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                >
                  <span className="absolute top-0 text-white text-[2px] group-hover:text-[14px] group-hover:translate-y-[9px] transition-all duration-300 font-semibold select-none">Supprimer</span>
                  <svg viewBox="0 0 448 512" className="w-2.5 group-hover:w-[14px] group-hover:translate-y-[70%] transition-all duration-300 fill-white flex-shrink-0">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Contacter */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <h2 className="text-xs text-white/30 uppercase tracking-widest mb-4">Contacter</h2>
              {user ? (
                user.username === annonce.auteur ? (
                  <p className="text-xs text-white/30 text-center py-3">C'est votre {isService ? "service" : "annonce"}</p>
                ) : sent ? (
                  <div className="text-center py-4">
                    <p className="text-2xl mb-2">✅</p>
                    <p className="text-sm text-green-400 font-medium">Message envoyé !</p>
                    <p className="text-xs text-white/30 mt-1">Le vendeur vous répondra bientôt</p>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Bonjour, je suis intéressé par "${annonce.titre}"...`}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all resize-none mb-3"
                    />
                    <button
                      onClick={handleContact}
                      disabled={!message.trim() || sendingMsg !== "idle"}
                      className={`stateful-btn ${sendingMsg}`}
                    >
                      <span className="sb-content">Envoyer le message →</span>
                      <span className="sb-loader" />
                      <svg className="sb-check" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                  </>
                )
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-white/30 mb-3">Connectez-vous pour contacter le vendeur</p>
                  <button onClick={() => navigate("/login")} className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors">
                    Se connecter
                  </button>
                </div>
              )}
            </div>

            {/* Commentaires */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <h2 className="text-xs text-white/30 uppercase tracking-widest mb-4">Commentaires ({commentaires.length})</h2>
              <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {commentaires.length === 0 ? (
                  <p className="text-white/25 text-sm text-center py-4">Aucun commentaire pour l'instant</p>
                ) : (
                  commentaires.map((c, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${c.role === "technicien" ? "bg-gradient-to-br from-blue-600 to-violet-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                        {c.auteur?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white/80">{c.auteur}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.role === "technicien" ? "bg-blue-500/15 text-blue-300" : "bg-violet-500/15 text-violet-300"}`}>{c.role}</span>
                        </div>
                        <p className="text-white/60 text-sm">{c.contenu}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {user ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCommentaire()}
                    placeholder="Écrire un commentaire..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all"
                  />
                  <button onClick={handleCommentaire} disabled={!commentaire.trim()} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    →
                  </button>
                </div>
              ) : (
                <p className="text-xs text-white/30 text-center">
                  <span onClick={() => navigate("/login")} className="text-purple-400 cursor-pointer hover:text-purple-300">Connectez-vous</span> pour commenter
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Modifier */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0f0f1a] border border-white/[0.08] shadow-[0_0_60px_rgba(139,92,246,0.2)] fade-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white">Modifier {isService ? "le service" : "l'annonce"}</h3>
              <button onClick={() => setShowEditModal(false)} className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white text-xs transition-colors">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Titre</label>
                <input type="text" value={editForm.titre} onChange={e => setEditForm(f => ({ ...f, titre: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all resize-none" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Prix (DZD)</label>
                <input type="number" min="0" value={editForm.prix} onChange={e => setEditForm(f => ({ ...f, prix: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/60 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition-all">
                Annuler
              </button>
              <button onClick={handleEdit} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 disabled:opacity-60 transition-all">
                {saving ? "Enregistrement..." : "Enregistrer →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-sm p-6 rounded-2xl bg-[#0f0f1a] border border-white/[0.08] shadow-[0_0_60px_rgba(239,68,68,0.15)] fade-up">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-lg font-black text-center text-white mb-1">Supprimer {isService ? "le service" : "l'annonce"} ?</h3>
            <p className="text-white/40 text-sm text-center mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/60 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-60 transition-all"
              >
                {deleting ? "Suppression..." : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
