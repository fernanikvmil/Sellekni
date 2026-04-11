import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders, authFormHeaders } from "./api";
import Navbar from "./Navbar";

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar",
  "Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger",
  "Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma",
  "Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh",
  "Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued",
  "Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane",
];

const SPECIALITES = [
  "Plomberie","Électricité","Menuiserie","Peinture","Carrelage","Climatisation",
  "Électronique","Informatique","Mécanique auto","Maçonnerie","Serrurerie","Jardinage",
  "Déménagement","Nettoyage","Soudure","Toiture","Vitrage","Réparation électroménager",
  "Installation sanitaire","Chauffage","Cuisines équipées","Ascenseurs",
];

export default function Profile() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [mounted, setMounted]           = useState(false);
  const [user, setUser]                 = useState(null);
  const [profileData, setProfileData]   = useState(null);
  const [editing, setEditing]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saved, setSaved]               = useState(false);
  const [form, setForm]                 = useState({
    username: "", bio: "", telephone: "", wilaya: "", specialite: "",
  });

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/login"); return; }
    setUser(stored);
    fetchProfile(stored.username);
  }, []);

  const fetchProfile = async (username) => {
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      setProfileData(data);
      setForm({
        username:   data.user?.username   || "",
        bio:        data.user?.bio        || "",
        telephone:  data.user?.telephone  || "",
        wilaya:     data.user?.wilaya     || "",
        specialite: data.user?.specialite || "",
      });
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.username}/modifier`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, username: form.username };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSaved(true);
        setEditing(false);
        fetchProfile(form.username);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/profile/photo", {
        method: "POST",
        headers: authFormHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, photo: data.photo };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        fetchProfile(user.username);
      }
    } catch (err) { console.error(err); }
    finally { setUploadingPhoto(false); }
  };

  if (!user) return null;

  const istech = user.role === "technicien";
  const initiales = user.username?.slice(0, 2).toUpperCase();
  const moyenne = profileData?.moyenne;
  const annoncesCount = profileData?.annonces?.length || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) forwards; }
        .spinner { animation: spin 0.75s linear infinite; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(139,92,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.06)_1px,transparent_1px)] [background-size:60px_60px]" />
      <div className="fixed top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse pointer-events-none z-0" />
      <div className="fixed bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-pink-500/15 blur-[90px] animate-pulse pointer-events-none z-0" />

      <Navbar />

      <div className={`relative z-10 max-w-2xl mx-auto px-6 py-12 ${mounted ? "fade-up" : "opacity-0"}`}>

        {/* Bannière success */}
        {saved && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
            ✓ Profil mis à jour avec succès
          </div>
        )}

        {/* Carte profil */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">

          {/* Bandeau top */}
          <div className={`h-24 w-full ${istech ? "bg-gradient-to-r from-blue-900/40 to-violet-900/40" : "bg-gradient-to-r from-violet-900/40 to-pink-900/30"}`} />

          {/* Avatar + infos */}
          <div className="px-7 pb-7 -mt-12">
            <div className="flex items-end justify-between mb-5">
              {/* Avatar cliquable */}
              <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <div className={`w-20 h-20 rounded-2xl border-4 border-[#0a0a0f] flex items-center justify-center text-xl font-black overflow-hidden ${istech ? "bg-gradient-to-br from-blue-600 to-violet-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                  {user.photo
                    ? <img src={user.photo} alt="avatar" className="w-full h-full object-cover" />
                    : initiales}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingPhoto
                    ? <span className="spinner w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                    : <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </div>

              {/* Bouton Modifier / Annuler */}
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/[0.05] border border-white/[0.08] hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 transition-all duration-200">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Modifier le profil
                </button>
              ) : (
                <button onClick={() => { setEditing(false); fetchProfile(user.username); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white/50 bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] transition-all">
                  Annuler
                </button>
              )}
            </div>

            {/* Nom + badge */}
            {!editing ? (
              <>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl font-black">{profileData?.user?.username || user.username}</h1>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${istech ? "bg-blue-500/15 text-blue-300" : "bg-violet-500/15 text-violet-300"}`}>
                    {istech ? "🔧 Technicien" : "🛒 Client"}
                  </span>
                </div>
                {profileData?.user?.specialite && (
                  <p className="text-sm text-violet-400/80 mb-2">✦ {profileData.user.specialite}</p>
                )}
                {profileData?.user?.bio && (
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{profileData.user.bio}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    { label: "Annonces",  value: annoncesCount, color: "text-violet-400" },
                    { label: "Note",      value: moyenne ? `★ ${moyenne}` : "—", color: "text-yellow-400" },
                    { label: "Avis",      value: profileData?.totalNotes || 0, color: "text-pink-400" },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col items-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                      <span className="text-[11px] text-white/30 mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Infos */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {profileData?.user?.telephone && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-sm">📞</span>
                      <div>
                        <p className="text-[10px] text-white/30">Téléphone</p>
                        <p className="text-sm text-white/80">{profileData.user.telephone}</p>
                      </div>
                    </div>
                  )}
                  {profileData?.user?.wilaya && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-sm">📍</span>
                      <div>
                        <p className="text-[10px] text-white/30">Wilaya</p>
                        <p className="text-sm text-white/80">{profileData.user.wilaya}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Formulaire d'édition */
              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Nom d'utilisateur</label>
                  <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                    placeholder="Décrivez-vous en quelques mots..."
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all resize-none" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Téléphone</label>
                  <input type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="0555 00 00 00"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Wilaya</label>
                  <select value={form.wilaya} onChange={e => setForm(f => ({ ...f, wilaya: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 transition-all [color-scheme:dark]">
                    <option value="">Sélectionner une wilaya</option>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                {istech && (
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Spécialité</label>
                    <select value={form.specialite} onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 transition-all [color-scheme:dark]">
                      <option value="">Sélectionner une spécialité</option>
                      {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <button onClick={handleSave} disabled={saving || !form.username.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                      Enregistrement...
                    </span>
                  ) : "Enregistrer les modifications →"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Voir profil public */}
        <button onClick={() => navigate(`/profil/${user.username}`)}
          className="mt-4 w-full py-3 rounded-xl text-sm text-white/40 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:text-white/70 transition-all">
          Voir mon profil public →
        </button>
      </div>
    </div>
  );
}
