import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { authHeaders, authFormHeaders, getStatus } from "./api";
import Navbar from "./Navbar";
import { AlerteModeration } from "./Components";

/* ─── Image lightbox ─────────────────────────────────────── */
function ImageModal({ src, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={onClose}>
      <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">✕</button>
      <img src={src} alt="post" className="max-w-[92vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
    </div>,
    document.body
  );
}

/* ─── Post card ──────────────────────────────────────────── */
function PostCard({ post, user, liked, commentsOpen, commentInput, onLike, onToggleComments, onCommentChange, onCommentSubmit, onDelete, onLogin, onSignal, signaled, timeAgo, avatarBg, onViewProfile }) {
  const [lightbox, setLightbox] = useState(null);
  const likesCount    = post.likes?.length || 0;
  const commentsCount = post.commentaires?.length || 0;

  return (
    <div className="group rounded-2xl border border-[rgba(196,181,253,0.18)] bg-[#0A031E] hover:border-[rgba(196,181,253,0.32)] hover:bg-[#0E0520] transition-all duration-200 overflow-hidden">

      {/* ── Author row ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 cursor-pointer" onClick={onViewProfile}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-black overflow-hidden ${!post.auteurPhoto ? avatarBg(post.role) : ""}`}>
          {post.auteurPhoto
            ? <img src={post.auteurPhoto} alt={post.auteur} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display="none"; }} />
            : post.auteur?.slice(0, 2).toUpperCase()
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#C4B5FD]/90 leading-tight">{post.auteur}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
              post.role === "technicien"
                ? "text-violet-400/90 bg-violet-500/10 border-violet-500/20"
                : "text-violet-400/90 bg-violet-600/10 border-violet-600/20"
            }`}>
              {post.role}
            </span>
          </div>
          <p className="text-[10px] text-white/30 mt-0.5">{timeAgo(post.createdAt)}</p>
        </div>

        {user?.username === post.auteur && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-3">
        <p className="text-sm text-[#C4B5FD]/85 leading-relaxed whitespace-pre-line">{post.contenu}</p>
      </div>

      {/* ── Attached image ── */}
      {post.photo && (
        <div
          className="mx-4 mb-3 rounded-xl overflow-hidden border border-white/[0.07] cursor-zoom-in"
          onClick={e => { e.stopPropagation(); setLightbox(post.photo); }}
        >
          <img
            src={post.photo}
            alt="post"
            className="w-full max-h-[320px] object-cover hover:brightness-95 transition-all duration-200"
          />
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex items-center gap-0.5 px-3 pb-3 pt-1 border-t border-white/[0.05] mt-1">
        {/* Like */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); if (!user) { onLogin(); return; } onLike(); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
            liked
              ? "text-pink-400 bg-pink-500/10"
              : "text-white/35 hover:text-pink-400 hover:bg-pink-500/10"
          }`}
        >
          <svg className="w-4 h-4" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"}>
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
          <span>{likesCount > 0 ? likesCount : "J'aime"}</span>
        </button>

        {/* Comment */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleComments(e); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            commentsOpen
              ? "text-[#C4B5FD] bg-[rgba(196,181,253,0.08)]"
              : "text-white/35 hover:text-[#C4B5FD] hover:bg-[rgba(196,181,253,0.06)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M8 9h8M8 13h6M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3h-2a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12z" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
          <span>{commentsCount > 0 ? commentsCount : "Commenter"}</span>
        </button>

        {/* Signal — only for other users' posts */}
        {user?.username !== post.auteur && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); if (!user) { onLogin(); return; } if (!signaled) onSignal(); }}
            title={signaled ? "Déjà signalé" : "Signaler ce contenu"}
            className={`ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              signaled
                ? "text-red-400/60 cursor-default"
                : "text-white/20 hover:text-red-400 hover:bg-red-500/10"
            }`}
          >
            🚩 {signaled ? "Signalé" : "Signaler"}
          </button>
        )}
      </div>

      {/* ── Comments panel ── */}
      {commentsOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.05]" onClick={e => e.stopPropagation()}>
          {post.commentaires?.length > 0 && (
            <div className="space-y-2 mb-3">
              {post.commentaires.map((c, ci) => (
                <div key={ci} className="flex gap-2.5 items-start">
                  <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[8px] font-black overflow-hidden ${!c.auteurPhoto ? avatarBg(c.role) : ""}`}>
                    {c.auteurPhoto
                      ? <img src={c.auteurPhoto} alt={c.auteur} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display="none"; }} />
                      : c.auteur?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 px-3 py-1.5 rounded-xl bg-[#07021A] border border-[rgba(196,181,253,0.08)]">
                    <span className="text-[10px] font-bold text-white/65">{c.auteur} </span>
                    <span className="text-[10px] text-white/50">{c.contenu}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <div className="flex gap-2 items-center">
              <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-[9px] font-black overflow-hidden ${!user.photo ? avatarBg(user.role) : ""}`}>
                {user.photo
                  ? <img src={user.photo} alt="" className="w-full h-full object-cover" />
                  : user.username?.slice(0, 2).toUpperCase()
                }
              </div>
              <input
                type="text"
                placeholder="Répondre..."
                value={commentInput}
                onChange={e => onCommentChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onCommentSubmit()}
                className="flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.07] focus:outline-none focus:border-violet-600/40 transition-all"
              />
              <button type="button" onClick={onCommentSubmit}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0" style={{ background: "linear-gradient(135deg,rgba(196,181,253,0.25),rgba(139,92,246,0.35))", border: "1px solid rgba(196,181,253,0.2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/30 text-center">
              <span onClick={onLogin} className="text-violet-400 cursor-pointer hover:underline">Connectez-vous</span> pour répondre
            </p>
          )}
        </div>
      )}

      {lightbox && <ImageModal src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/* ─── Profile modal ──────────────────────────────────────── */
function ProfileModal({ profile, onClose, navigate }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  if (!profile) return null;

  const avatarBg = (role) =>
    role === "technicien"
      ? "bg-gradient-to-br from-violet-600 to-violet-600"
      : "bg-gradient-to-br from-violet-600 to-pink-600";

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="relative bg-[#07021A] rounded-2xl max-w-sm w-full mx-4 shadow-2xl border border-white/[0.08] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Gradient top bar */}
        <div className="h-1 bg-gradient-to-r from-violet-600 via-pink-500 to-violet-600" />

        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">✕</button>

        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black overflow-hidden shadow-lg ${!profile.user?.photo ? avatarBg(profile.user?.role) : ""}`}>
              {profile.user?.photo
                ? <img src={profile.user.photo} alt="" className="w-full h-full object-cover" />
                : profile.user?.username?.slice(0, 2).toUpperCase()
              }
            </div>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white">{profile.user?.username}</h3>
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
              profile.user?.role === "technicien"
                ? "text-violet-400 bg-violet-500/10 border-violet-500/20"
                : "text-violet-400 bg-violet-600/10 border-violet-600/20"
            }`}>
              {profile.user?.role}
            </span>
            {profile.badge && (
              <span className={`ml-2 inline-block text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                profile.badge.color === "yellow"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  : "bg-violet-500/10 text-violet-400 border-violet-500/20"
              }`}>
                {profile.badge.icon} {profile.badge.label}
              </span>
            )}
          </div>

          {profile.user?.bio && (
            <p className="text-sm text-white/40 mb-4 leading-relaxed text-center">{profile.user.bio}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { val: profile.annonces?.length || 0, label: "Annonces", color: "text-violet-400" },
              { val: profile.moyenne ? `★ ${profile.moyenne}` : "—", label: "Note", color: profile.moyenne ? "text-yellow-400" : "text-white/20" },
              { val: profile.totalNotes || 0, label: "Avis", color: profile.totalNotes ? "text-pink-400" : "text-white/20" },
            ].map(({ val, label, color }) => (
              <div key={label} className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className={`text-xl font-bold ${color}`}>{val}</p>
                <p className="text-[10px] text-white/30">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => { navigate(`/profil/${profile.user?.username}`); onClose(); }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 transition-all"
          >
            Voir le profil complet →
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Main Forum component ───────────────────────────────── */
export default function Forum() {
  const navigate = useNavigate();
  const [mounted, setMounted]         = useState(false);
  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [contenu, setContenu]         = useState("");
  const [photo, setPhoto]             = useState(null);
  const [preview, setPreview]         = useState(null);
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loadingProfile, setLoadingProfile]   = useState(false);
  const [postError, setPostError]         = useState("");
  const [photoError, setPhotoError]       = useState("");
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValid, setImageValid]       = useState(false);
  const [moderationAlert, setModerationAlert] = useState(null);
  const [signalModal, setSignalModal] = useState(null);
  const [signaling, setSignaling]     = useState(false);
  const [signalReason, setSignalReason] = useState("");
  const [signaledIds, setSignaledIds] = useState(new Set());
  const [signalSuccess, setSignalSuccess] = useState(false);
  const fileRef = useRef();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => { setTimeout(() => setMounted(true), 50); fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res  = await fetch("/api/posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) { console.error(err); }
    finally { setLoadingPosts(false); }
  };

  const validateImage = async (file) => {
    setIsValidatingImage(true);
    setModerationAlert(null);
    setImageValid(false);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await fetch("/api/posts/check-image", { method: "POST", body: formData });
      const result = await response.json();
      if (!result.safe && result.details) {
        const violations = [];
        if (result.details.nudity)     violations.push("nudité explicite");
        if (result.details.suggestive) violations.push("contenu suggestif");
        if (result.details.weapon)     violations.push("arme à feu/couteau");
        if (result.details.drugs)      violations.push("drogue/stupéfiants");
        if (result.details.offensive)  violations.push("contenu offensant");
        if (result.details.gore)       violations.push("violence/gore");
        if (result.details.sexy)       violations.push("contenu sexy inapproprié");
        setModerationAlert(violations);
        setIsValidatingImage(false);
        return false;
      }
      setImageValid(true);
      setIsValidatingImage(false);
      return true;
    } catch {
      setIsValidatingImage(false);
      return true;
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoError("");
    setModerationAlert(null);
    setImageValid(false);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError("Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("L'image ne doit pas dépasser 5MB.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    const isValid = await validateImage(file);
    if (isValid) {
      setPhoto(file);
    } else {
      URL.revokeObjectURL(previewUrl);
      setPreview(null);
      e.target.value = "";
    }
  };

  const handlePost = async () => {
    if (!contenu.trim()) return;
    if (photo && !imageValid) {
      setPostError("L'image n'est pas valide. Veuillez en choisir une autre.");
      return;
    }
    setLoading(true);
    setPostError("");
    try {
      const formData = new FormData();
      formData.append("contenu", contenu);
      formData.append("auteur",  user?.username || "Anonyme");
      formData.append("role",    user?.role || "client");
      if (user?.photo)  formData.append("auteurPhoto", user.photo);
      if (photo)        formData.append("photo", photo);
      const res  = await fetch("/api/posts", { method: "POST", headers: authFormHeaders(), body: formData });
      const data = await res.json();
      if (res.ok) {
        setContenu(""); setPhoto(null); setPreview(null); setImageValid(false);
        setPosts(prev => [data.post, ...prev]);
      } else if (res.status === 401) {
        setPostError("Session expirée. Reconnectez-vous.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setPostError(data.message || "Erreur lors de la publication.");
      }
    } catch { setPostError("Erreur de connexion au serveur."); }
    finally { setLoading(false); }
  };

  const handleLike = async (id) => {
    if (!user) return navigate("/login");
    try {
      const res  = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });
      const data = await res.json();
      setPosts(prev => prev.map(p => p._id === id ? { ...p, likes: data.likes } : p));
    } catch (err) { console.error(err); }
  };

  const handleComment = async (id) => {
    const txt = commentInputs[id]?.trim();
    if (!txt || !user) return;
    try {
      const res  = await fetch(`/api/posts/${id}/commentaires`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contenu: txt, auteur: user.username, role: user.role }),
      });
      const data = await res.json();
      setPosts(prev => prev.map(p => p._id === id ? { ...p, commentaires: [...p.commentaires, data.commentaire] } : p));
      setCommentInputs(prev => ({ ...prev, [id]: "" }));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE", headers: authHeaders() });
    setPosts(prev => prev.filter(p => p._id !== id));
  };

  const handleSignal = async () => {
    if (!signalModal) return;
    setSignaling(true);
    try {
      const res = await fetch(`/api/posts/${signalModal}/signaler`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ raison: signalReason }),
      });
      if (res.ok) {
        setSignaledIds(prev => new Set([...prev, signalModal]));
        setSignalModal(null);
        setSignalReason("");
        setSignalSuccess(true);
        setTimeout(() => setSignalSuccess(false), 3000);
      } else {
        const d = await res.json();
        alert(d.message || "Erreur");
        setSignalModal(null);
      }
    } catch { alert("Erreur réseau"); }
    finally { setSignaling(false); }
  };

  const toggleComments = (e, id) => {
    e.stopPropagation();
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60)    return "à l'instant";
    if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
  };

  const avatarBg = (role) =>
    role === "technicien"
      ? "bg-gradient-to-br from-violet-600 to-violet-600 text-white"
      : "bg-gradient-to-br from-violet-600 to-pink-600 text-white";

  const handleViewProfile = async (auteur) => {
    setLoadingProfile(true);
    setSelectedProfile(null);
    try {
      const res  = await fetch(`/api/users/${auteur}`);
      const data = await res.json();
      if (data?.user) setSelectedProfile(data);
    } catch (err) { console.error(err); }
    finally { setLoadingProfile(false); }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">

      {moderationAlert && (
        <AlerteModeration violations={moderationAlert} onClose={() => setModerationAlert(null)} />
      )}

      {/* ── Modal Signalement ── */}
      {signalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[500] p-4" onClick={() => { setSignalModal(null); setSignalReason(""); }}>
          <div className="bg-[#0A031E] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-xl flex-shrink-0">🚩</div>
              <div>
                <p className="text-white font-semibold">Signaler ce contenu</p>
                <p className="text-white/40 text-xs">L'équipe de modération examinera votre signalement</p>
              </div>
            </div>
            <p className="text-white/50 text-sm mb-2">Raison du signalement :</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Contenu inapproprié","Arnaque / Spam","Violence / Haine","Contenu illégal","Fausse information","Autre"].map(r => (
                <button key={r} onClick={() => setSignalReason(r)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border ${
                    signalReason === r
                      ? "bg-red-500/20 border-red-500/40 text-red-300"
                      : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={signalReason && !["Contenu inapproprié","Arnaque / Spam","Violence / Haine","Contenu illégal","Fausse information"].includes(signalReason) ? signalReason : ""}
              onChange={e => setSignalReason(e.target.value)}
              placeholder="Décrivez le problème (optionnel)..."
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setSignalModal(null); setSignalReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <button onClick={handleSignal} disabled={signaling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {signaling
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi...</>
                  : "🚩 Signaler"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast signalement ── */}
      {signalSuccess && (
        <div className="fixed bottom-6 right-6 z-[600] px-4 py-3 rounded-xl bg-green-500/15 border border-green-500/25 text-green-300 text-sm font-medium shadow-xl pointer-events-none">
          ✅ Signalement envoyé à la modération
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(.22,1,.36,1) forwards; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(196,181,253,0.3); border-radius: 4px; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundImage: "linear-gradient(rgba(196,181,253,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(196,181,253,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="fixed top-[-120px] right-[-80px] w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none z-0" style={{ background: "rgba(196,181,253,0.06)" }} />
      <div className="fixed bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none z-0" style={{ background: "rgba(139,92,246,0.05)" }} />

      <Navbar />

      <div className="relative z-10 pt-6 pb-16">
        <div className="max-w-2xl mx-auto px-4">

          {/* ── Header ── */}
          <div className={`flex items-center gap-3 mb-6 ${mounted ? "fade-up" : "opacity-0"}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-pink-600/20 border border-violet-600/20 flex items-center justify-center text-xl">
              💬
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#C4B5FD]">Forum communautaire</h1>
              <p className="text-xs text-white/30">Partagez, posez des questions, discutez</p>
            </div>
          </div>

          {/* ── Composer ── */}
          {user ? (
            <div className={`rounded-2xl border border-[rgba(196,181,253,0.18)] bg-[#0A031E] overflow-hidden mb-5 ${mounted ? "fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.05s" }}>
              <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                {/* User avatar */}
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-black overflow-hidden ${!user.photo ? avatarBg(user.role) : ""}`}>
                  {user.photo
                    ? <img src={user.photo} alt="" className="w-full h-full object-cover" />
                    : user.username.slice(0, 2).toUpperCase()
                  }
                </div>
                <textarea
                  value={contenu}
                  onChange={e => setContenu(e.target.value)}
                  placeholder={`Quoi de neuf, ${user.username} ?`}
                  rows={2}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.07] focus:outline-none focus:border-violet-600/40 focus:bg-violet-600/[0.03] focus:ring-2 focus:ring-violet-600/10 transition-all resize-none"
                />
              </div>

              {preview && (
                <div className="relative mx-4 mb-3 rounded-xl overflow-hidden border border-white/[0.07]">
                  <img src={preview} alt="preview" className="w-full max-h-48 object-cover" />
                  <button type="button" onClick={() => { setPhoto(null); setPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white text-xs hover:bg-black/90 transition-colors">
                    ✕
                  </button>
                </div>
              )}

              <div className="mx-4 h-px bg-white/[0.06]" />
              <div className="flex items-center justify-between px-4 py-2.5">
                <button type="button" onClick={() => fileRef.current.click()}
                  className="flex items-center gap-1.5 text-xs text-white/35 hover:text-violet-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-violet-600/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />

                <button type="button" onClick={handlePost} disabled={loading || !contenu.trim() || isValidatingImage}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#1F48B5,#8B5CF6)", boxShadow: contenu.trim() ? "0 4px 14px rgba(109,40,217,0.35)" : "none" }}>
                  {loading
                    ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Publier</span> <span className="opacity-60">→</span></>
                  }
                </button>
              </div>

              {isValidatingImage && (
                <div className="px-4 pb-2 flex items-center gap-2 text-yellow-400 text-xs">
                  <span className="w-3 h-3 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin inline-block" />
                  Vérification de l'image en cours...
                </div>
              )}
              {imageValid && !isValidatingImage && preview && (
                <div className="px-4 pb-2 text-green-400 text-xs">✅ Image valide</div>
              )}
              {(photoError || postError) && (
                <div className="px-4 pb-3">
                  {photoError && <p className="text-xs text-red-400">⚠️ {photoError}</p>}
                  {postError  && <p className="text-xs text-red-400">{postError}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className={`rounded-2xl border border-[rgba(196,181,253,0.18)] bg-[#0A031E] p-5 text-center mb-5 ${mounted ? "fade-up" : "opacity-0"}`}>
              <div className="text-3xl mb-2 opacity-30">💬</div>
              <p className="text-white/40 text-sm mb-3">Connectez-vous pour publier dans le forum</p>
              <button type="button" onClick={() => navigate("/login")}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-600 transition-colors text-sm font-medium">
                Se connecter
              </button>
            </div>
          )}

          {/* ── Posts feed ── */}
          <div className="flex flex-col gap-3">
            {loadingPosts ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-2 border-white/10 border-t-violet-600 rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-24 opacity-0 animate-[fadeUp_0.5s_0.15s_forwards]">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-white/30 text-base font-medium">Aucune publication pour le moment</p>
                <p className="text-white/15 text-sm mt-1">Soyez le premier à partager quelque chose</p>
              </div>
            ) : posts.map((post, i) => (
              <div key={post._id} className={mounted ? "fade-up" : "opacity-0"} style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}>
                <PostCard
                  post={post}
                  user={user}
                  liked={!!(user && post.likes.includes(user.username))}
                  commentsOpen={!!openComments[post._id]}
                  commentInput={commentInputs[post._id] || ""}
                  onViewProfile={() => handleViewProfile(post.auteur)}
                  onLike={() => handleLike(post._id)}
                  onToggleComments={e => toggleComments(e, post._id)}
                  onCommentChange={v => setCommentInputs(prev => ({ ...prev, [post._id]: v }))}
                  onCommentSubmit={() => handleComment(post._id)}
                  onDelete={() => handleDelete(post._id)}
                  onSignal={() => setSignalModal(post._id)}
                  signaled={signaledIds.has(post._id)}
                  onLogin={() => navigate("/login")}
                  timeAgo={timeAgo}
                  avatarBg={avatarBg}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedProfile && (
        <ProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} navigate={navigate} />
      )}

      {loadingProfile && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#07021A] rounded-2xl p-6 border border-white/[0.08]">
            <div className="w-8 h-8 border-2 border-white/10 border-t-violet-600 rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
