import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { authHeaders, authFormHeaders, getStatus } from "./api";
import Navbar from "./Navbar";
import BorderGlow from "./BorderGlow";

const CATEGORIES = ["Tous", "Techniciens", "Clients", "Questions", "Conseils", "Annonces"];

function ImageModal({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-lg transition-all">✕</button>
      <img
        src={src}
        alt="post"
        className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}

function PostCard({ post, user, isSelected, liked, commentsOpen, commentInput, onSelect, onLike, onToggleComments, onCommentChange, onCommentSubmit, onDelete, onLogin, timeAgo, avatarBg }) {
  const [lightbox, setLightbox] = useState(null);
  return (
    <BorderGlow
      edgeSensitivity={50}
      glowColor="139 92 246"
      backgroundColor="#060010"
      borderRadius={16}
      glowRadius={80}
      glowIntensity={1}
      colors={["#c084fc", "#1e1e2e", "#f472b6", "#1e1e2e", "#38bdf8"]}
    >
      <div
        onClick={onSelect}
        className={`grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1 px-5 py-4 cursor-pointer transition-colors duration-150
          ${isSelected ? "bg-violet-500/5" : "hover:bg-white/[0.02]"}`}
      >
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 row-span-2 self-center ${avatarBg(post.role)}`}>
          {post.auteur?.slice(0, 2).toUpperCase()}
        </div>

        {/* Nom + rôle */}
        <div>
          <div className="text-sm font-bold text-white">{post.auteur}</div>
          <div className={`text-[10px] uppercase font-semibold tracking-widest ${post.role === "technicien" ? "text-blue-400/70" : "text-violet-400/70"}`}>
            {post.role} · {timeAgo(post.createdAt)}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-1 row-span-2 self-center" onClick={e => e.stopPropagation()}>
          <button onClick={onToggleComments}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button onClick={onLike}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${liked ? "text-pink-400 bg-pink-500/10" : "text-white/30 hover:text-pink-400 hover:bg-pink-500/10"}`}>
            <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {user?.username === post.auteur && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">✕</button>
          )}
        </div>

        {/* Contenu + image */}
        <div className="col-start-2">
          <p className="text-xs text-white/55 leading-relaxed mt-1">{post.contenu}</p>
          {post.photo && (
            <img
              src={post.photo}
              alt="post"
              onClick={e => { e.stopPropagation(); setLightbox(post.photo); }}
              className="mt-2 w-full max-h-48 object-cover rounded-xl border border-white/[0.08] cursor-zoom-in hover:opacity-90 transition-opacity"
            />
          )}
        </div>
      </div>

      {/* Commentaires (expand sous la row) */}
      {commentsOpen && (
        <div className="px-5 pb-4 border-t border-white/[0.06]" onClick={e => e.stopPropagation()}>
          <div className="mt-3 space-y-2">
            {post.commentaires.map((c, ci) => (
              <div key={ci} className="flex gap-2 items-start">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0 ${avatarBg(c.role)}`}>
                  {c.auteur?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[11px] font-bold text-white/70">{c.auteur} </span>
                  <span className="text-[11px] text-white/45">{c.contenu}</span>
                </div>
              </div>
            ))}
          </div>
          {user ? (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Répondre..."
                value={commentInput}
                onChange={e => onCommentChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onCommentSubmit()}
                className="flex-1 px-3 py-1.5 rounded-xl text-xs text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/50 transition-all"
              />
              <button onClick={onCommentSubmit}
                className="px-4 py-1.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 transition-colors text-xs font-semibold">→</button>
            </div>
          ) : (
            <p className="text-xs text-white/30 mt-2 text-center">
              <span onClick={onLogin} className="text-violet-400 cursor-pointer hover:underline">Connectez-vous</span> pour répondre
            </p>
          )}
        </div>
      )}

      {lightbox && <ImageModal src={lightbox} onClose={() => setLightbox(null)} />}
    </BorderGlow>
  );
}

export default function Forum() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [contenu, setContenu] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [selectedPost, setSelectedPost] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [postError, setPostError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!selectedPost) return;
    setLoadingProfile(true);
    setAuthorProfile(null);
    fetch(`/api/users/${selectedPost.auteur}`)
      .then(r => r.json())
      .then(data => setAuthorProfile(data))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [selectedPost]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoError("");

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const minW = 800, maxW = 1920, minH = 400, maxH = 1080;
      if (img.width < minW || img.width > maxW || img.height < minH || img.height > maxH) {
        setPhotoError(`Taille invalide (${img.width}×${img.height}px). Accepté : largeur ${minW}–${maxW}px, hauteur ${minH}–${maxH}px.`);
        URL.revokeObjectURL(url);
        fileRef.current.value = "";
        return;
      }
      setPhoto(file);
      setPreview(url);
    };
    img.src = url;
  };

  const handlePost = async () => {
    if (!contenu.trim()) return;
    setLoading(true);
    setPostError("");
    try {
      const formData = new FormData();
      formData.append("contenu", contenu);
      formData.append("auteur", user?.username || "Anonyme");
      formData.append("role", user?.role || "client");
      if (photo) formData.append("photo", photo);
      const res = await fetch("/api/posts", { method: "POST", headers: authFormHeaders(), body: formData });
      const data = await res.json();
      if (res.ok) {
        setContenu("");
        setPhoto(null);
        setPreview(null);
        fetchPosts();
      } else if (res.status === 401) {
        setPostError("Session expirée. Reconnectez-vous.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setPostError(data.message || "Erreur lors de la publication.");
      }
    } catch (err) {
      setPostError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id) => {
    if (!user) return navigate("/login");
    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });
      const data = await res.json();
      setPosts(prev => prev.map(p => p._id === id ? { ...p, likes: data.likes } : p));
      if (selectedPost?._id === id) setSelectedPost(p => ({ ...p, likes: data.likes }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (id) => {
    const contenuComment = commentInputs[id]?.trim();
    if (!contenuComment || !user) return;
    try {
      const res = await fetch(`/api/posts/${id}/commentaires`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contenu: contenuComment, auteur: user.username, role: user.role }),
      });
      const data = await res.json();
      const updated = prev => prev.map(p =>
        p._id === id ? { ...p, commentaires: [...p.commentaires, data.commentaire] } : p
      );
      setPosts(updated);
      if (selectedPost?._id === id)
        setSelectedPost(p => ({ ...p, commentaires: [...p.commentaires, data.commentaire] }));
      setCommentInputs(prev => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE", headers: authHeaders() });
    setPosts(prev => prev.filter(p => p._id !== id));
    if (selectedPost?._id === id) setSelectedPost(null);
  };

  const toggleComments = (e, id) => {
    e.stopPropagation();
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
  };

  const filteredPosts = posts.filter(p => {
    if (activeCategory === "Tous") return true;
    if (activeCategory === "Techniciens") return p.role === "technicien";
    if (activeCategory === "Clients") return p.role === "client";
    return true;
  });

  const avatarBg = (role) =>
    role === "technicien"
      ? "bg-gradient-to-br from-blue-600 to-violet-600"
      : "bg-gradient-to-br from-violet-600 to-pink-600";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes scroll-ltr { from { transform: translateX(100vw); } to { transform: translateX(-100%); } }
        @keyframes scroll-rtl { from { transform: translateX(-100%); } to { transform: translateX(100vw); } }
        .fade-up { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) forwards; }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .spinner { animation: spin 0.75s linear infinite; }
        .scroll-ltr { animation: scroll-ltr linear infinite; display:flex; gap:1rem; width:max-content; }
        .scroll-rtl { animation: scroll-rtl linear infinite; display:flex; gap:1rem; width:max-content; }
        .marquee-wrap:hover .scroll-ltr,
        .marquee-wrap:hover .scroll-rtl { animation-play-state: paused; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] [background-size:60px_60px]" />
      <div className="fixed top-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-purple-600/15 blur-[100px] pointer-events-none z-0" />

      <Navbar />

      {/* ── BODY 3 colonnes ── */}
      <div className="relative z-10 flex flex-1 max-w-7xl mx-auto w-full px-4 gap-6 py-8">

        {/* ── CENTRE : posts ── */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Composer */}
          {user ? (
            <div className={`p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] ${mounted ? "fade-up" : "opacity-0"}`}>
              <div className="flex gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${avatarBg(user.role)}`}>
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  placeholder="Quoi de neuf ?"
                  rows={2}
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all resize-none"
                />
              </div>
              {preview && (
                <div className="relative mb-3">
                  <img src={preview} alt="preview" className="w-full max-h-48 object-cover rounded-xl opacity-80" />
                  <button onClick={() => { setPhoto(null); setPreview(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white text-xs">✕</button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <button onClick={() => fileRef.current.click()} className="flex items-center gap-2 text-sm text-white/40 hover:text-violet-400 transition-colors">
                  📷 <span>Photo</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                <button
                  onClick={handlePost}
                  disabled={loading || !contenu.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                >
                  {loading ? <span className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" /> : "Publier →"}
                </button>
              </div>
              {photoError && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  ⚠️ {photoError}
                </p>
              )}
              {postError && (
                <p className="text-xs text-red-400 mt-2 text-right">{postError}</p>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center">
              <p className="text-white/40 text-sm mb-3">Connectez-vous pour publier</p>
              <button onClick={() => navigate("/login")} className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-sm font-medium">Se connecter</button>
            </div>
          )}

          {/* Feed liste style DaisyUI */}
          <div className="flex flex-col gap-2">
            {loadingPosts ? (
              <div className="flex justify-center py-20">
                <span className="spinner w-8 h-8 border-2 border-white/20 border-t-violet-500 rounded-full inline-block" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 text-white/30">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-lg font-medium">Aucune publication dans cette catégorie</p>
              </div>
            ) : filteredPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                user={user}
                isSelected={selectedPost?._id === post._id}
                liked={user && post.likes.includes(user.username)}
                commentsOpen={openComments[post._id]}
                commentInput={commentInputs[post._id] || ""}
                onSelect={() => setSelectedPost(selectedPost?._id === post._id ? null : post)}
                onLike={() => handleLike(post._id)}
                onToggleComments={(e) => toggleComments(e, post._id)}
                onCommentChange={(v) => setCommentInputs(prev => ({ ...prev, [post._id]: v }))}
                onCommentSubmit={() => handleComment(post._id)}
                onDelete={() => handleDelete(post._id)}
                onLogin={() => navigate("/login")}
                timeAgo={timeAgo}
                avatarBg={avatarBg}
              />
            ))}
          </div>
        </main>

        {/* ── SIDEBAR DROITE : profil auteur ── */}
        <aside className={`w-64 flex-shrink-0 ${mounted ? "fade-in" : "opacity-0"}`}>
          {selectedPost ? (
            <div className="sticky top-24 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
              {loadingProfile ? (
                <div className="flex justify-center py-12">
                  <span className="spinner w-6 h-6 border-2 border-white/20 border-t-violet-500 rounded-full inline-block" />
                </div>
              ) : authorProfile ? (
                <>
                  <div className="px-5 pt-5 pb-5">
                    {/* Avatar + close */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black overflow-hidden ${avatarBg(authorProfile.user?.role)}`}>
                        {authorProfile.user?.photo
                          ? <img src={`${authorProfile.user.photo}`} alt="" className="w-full h-full object-cover" />
                          : authorProfile.user?.username?.slice(0, 2).toUpperCase()
                        }
                      </div>
                      <button
                        onClick={() => setSelectedPost(null)}
                        className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 text-xs transition-colors"
                      >✕</button>
                    </div>

                    {(() => { const s = getStatus(authorProfile.user?.lastSeen); return (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`w-2 h-2 rounded-full ${s.online ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
                        <span className={`text-[10px] ${s.online ? "text-green-400" : "text-white/30"}`}>{s.label}</span>
                      </div>
                    ); })()}
                    <p className="font-black text-base mb-1">{authorProfile.user?.username}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${authorProfile.user?.role === "technicien" ? "bg-blue-500/15 text-blue-300" : "bg-violet-500/15 text-violet-300"}`}>
                        {authorProfile.user?.role}
                      </span>
                      {authorProfile.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border
                          ${authorProfile.badge.color === "yellow" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                            authorProfile.badge.color === "green" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                          {authorProfile.badge.icon} {authorProfile.badge.label}
                        </span>
                      )}
                    </div>

                    {authorProfile.user?.bio && (
                      <p className="text-xs text-white/40 mt-2 leading-relaxed">{authorProfile.user.bio}</p>
                    )}

                    <div className="h-px bg-white/[0.06] my-3" />

                    {/* Stats */}
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1 text-center">
                        <p className="text-lg font-black text-violet-400">{authorProfile.annonces?.length || 0}</p>
                        <p className="text-[10px] text-white/30">Annonces</p>
                      </div>
                      <div className="w-px bg-white/[0.06]" />
                      <div className="flex-1 text-center">
                        <p className={`text-lg font-black ${authorProfile.moyenne ? "text-yellow-400" : "text-white/20"}`}>
                          {authorProfile.moyenne ? `★ ${authorProfile.moyenne}` : "—"}
                        </p>
                        <p className="text-[10px] text-white/30">Note</p>
                      </div>
                      <div className="w-px bg-white/[0.06]" />
                      <div className="flex-1 text-center">
                        <p className={`text-lg font-black ${authorProfile.totalNotes ? "text-pink-400" : "text-white/20"}`}>
                          {authorProfile.totalNotes || 0}
                        </p>
                        <p className="text-[10px] text-white/30">Avis</p>
                      </div>
                    </div>

                    {authorProfile.user?.ville && (
                      <p className="text-xs text-white/30 mb-3">📍 {authorProfile.user.ville}</p>
                    )}

                    <button
                      onClick={() => navigate(`/profil/${authorProfile.user?.username}`)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      Voir le profil →
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="sticky top-24 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 text-center">
              <p className="text-3xl mb-2">👆</p>
              <p className="text-sm text-white/30">Cliquez sur une publication pour voir le profil de son auteur</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
