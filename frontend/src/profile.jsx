import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authHeaders, authFormHeaders } from "./api";
import Navbar from "./Navbar";

const GOOGLE_MAPS_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

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
  "Électronique","Informatique","Faux plafond","Maçonnerie","Serrurerie","Jardinage",
  "Déménagement","Nettoyage","Soudure","Toiture","Vitrage","Réparation électroménager",
  "Installation sanitaire","Chauffage","Cuisines équipées","Ascenseurs",
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function Stars({ note }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-sm ${i <= Math.round(note || 0) ? "text-yellow-400" : "text-white/15"}`}>★</span>
      ))}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef(null);

  const [mounted, setMounted]         = useState(false);
  const [user, setUser]               = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [tab, setTab]                 = useState(searchParams.get("tab") || "profil");

  // Settings
  const [settingsSection, setSettingsSection] = useState("photo");
  const [saving, setSaving]           = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [form, setForm]               = useState({ username: "", Firstname: "", Lastname: "", bio: "", telephone: "", wilaya: "", specialite: "", dateNaissance: "" });

  // Password change
  const [pwdStep, setPwdStep]         = useState("idle"); // idle | sending | code | done
  const [pwdCode, setPwdCode]         = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [pwdError, setPwdError]       = useState("");
  const [pwdSuccess, setPwdSuccess]   = useState("");

  // History
  const [history, setHistory]         = useState(null);

  // Deleted
  const [deleted, setDeleted]         = useState(null);
  const [restoring, setRestoring]     = useState(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/login"); return; }
    setUser(stored);
    fetchProfile(stored.username);

    // Sync quand GPS met à jour la wilaya/position (depuis MapTechniciens)
    const syncUser = () => {
      const fresh = JSON.parse(localStorage.getItem("user") || "null");
      if (fresh) {
        setUser(fresh);
        if (fresh.wilaya !== undefined) {
          setForm(f => ({ ...f, wilaya: fresh.wilaya }));
        }
        // Re-fetch le profil pour avoir les coords exactes du backend aussi
        fetchProfile(fresh.username);
      }
    };
    window.addEventListener("userUpdated", syncUser);
    return () => window.removeEventListener("userUpdated", syncUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (tab === "historique" && !history)  fetchHistory();
    if (tab === "supprimes"  && !deleted)  fetchDeleted();
  }, [tab, user]);

  const fetchProfile = async (username) => {
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      setProfileData(data);
      setForm({
        username:      data.user?.username      || "",
        Firstname:     data.user?.Firstname     || "",
        Lastname:      data.user?.Lastname      || "",
        bio:           data.user?.bio           || "",
        telephone:     data.user?.telephone     || "",
        wilaya:        data.user?.wilaya        || "",
        specialite:    data.user?.specialite    || "",
        dateNaissance: data.user?.dateNaissance || "",
      });
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/users/${user.username}/history`, { headers: authHeaders() });
      const data = await res.json();
      setHistory(data);
    } catch (err) { console.error(err); }
  };

  const fetchDeleted = async () => {
    try {
      const res = await fetch(`/api/users/${user.username}/deleted`, { headers: authHeaders() });
      const data = await res.json();
      setDeleted(data);
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
      if (res.ok) {
        const updatedUser = { ...user, username: form.username };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSaved(true);
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
        window.dispatchEvent(new Event("userUpdated"));
        fetchProfile(user.username);
      }
    } catch (err) { console.error(err); }
    finally { setUploadingPhoto(false); }
  };

  const handleSendPwdCode = async () => {
    setPwdStep("sending");
    setPwdError("");
    try {
      const res = await fetch(`/api/users/${user.username}/send-password-code`, {
        method: "POST", headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) setPwdStep("code");
      else { setPwdError(data.message || "Erreur"); setPwdStep("idle"); }
    } catch { setPwdError("Erreur réseau"); setPwdStep("idle"); }
  };

  const handleChangePwd = async () => {
    setPwdError("");
    if (newPwd !== confirmPwd) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    try {
      const res = await fetch(`/api/users/${user.username}/change-password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: pwdCode, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdSuccess("Mot de passe modifié avec succès !");
        setPwdStep("done");
        setPwdCode(""); setNewPwd(""); setConfirmPwd("");
        setTimeout(() => { setPwdStep("idle"); setPwdSuccess(""); }, 3000);
      } else {
        setPwdError(data.message || "Erreur");
      }
    } catch { setPwdError("Erreur réseau"); }
  };

  const handleRestore = async (type, id) => {
    setRestoring(id);
    try {
      const base = type === "annonce" ? "/api/annonces" : "/api/forum";
      await fetch(`${base}/${id}/restore`, { method: "PATCH", headers: authHeaders() });
      fetchDeleted();
    } catch (err) { console.error(err); }
    finally { setRestoring(null); }
  };

  if (!user) return null;

  const istech = user.role === "technicien";
  const initiales = user.username?.slice(0, 2).toUpperCase();
  const moyenne = profileData?.moyenne;
  const annoncesCount = profileData?.annonces?.length || 0;
  const wilaya = profileData?.user?.wilaya;
  // Utilise les coords exactes GPS si disponibles (depuis localStorage ou profil DB)
  const userLoc = user?.location || profileData?.user?.location;
  const mapSrc = (userLoc?.lat && userLoc?.lng)
    ? `https://www.google.com/maps/embed/v1/view?center=${userLoc.lat},${userLoc.lng}&zoom=15&key=${GOOGLE_MAPS_KEY}`
    : wilaya
      ? `https://www.google.com/maps/embed/v1/search?q=${encodeURIComponent(wilaya + ", Algeria")}&key=${GOOGLE_MAPS_KEY}`
      : `https://www.google.com/maps/embed/v1/view?center=28.0339,1.6596&zoom=5&key=${GOOGLE_MAPS_KEY}`;

  const TABS = [
    { key: "profil",      label: "👤 Profil" },
    { key: "parametres",  label: "⚙️ Paramètres" },
    { key: "historique",  label: "📋 Historique" },
    { key: "supprimes",   label: "🗑️ Supprimés récemment" },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) forwards; }
        .spinner { animation: spin 0.75s linear infinite; }
        .custom-scroll::-webkit-scrollbar{width:4px}
        .custom-scroll::-webkit-scrollbar-track{background:transparent}
        .custom-scroll::-webkit-scrollbar-thumb{background:rgba(196,181,253,0.3);border-radius:99px}
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(196,181,253,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(196,181,253,0.05)_1px,transparent_1px)] [background-size:60px_60px]" />
      <div className="fixed top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[100px] pointer-events-none z-0" />

      <Navbar />

      <div className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-10 ${mounted ? "fade-up" : "opacity-0"}`}>

        {saved && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
            ✓ Profil mis à jour avec succès
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                tab === t.key
                  ? "bg-violet-600 text-white shadow-[0_2px_12px_rgba(196,181,253,0.4)]"
                  : "text-white/40 hover:text-white/70"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════ TAB: PROFIL (lecture seule) ══════════════ */}
        {tab === "profil" && (
          <div className="flex gap-5 items-start flex-col lg:flex-row">

            {/* ── Left: Profile card (read-only) ── */}
            <div className="flex-1 min-w-0 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
              <div className={`h-24 w-full ${istech ? "bg-gradient-to-r from-violet-900/40 to-blue-900/40" : "bg-gradient-to-r from-blue-900/40 to-pink-900/30"}`} />

              <div className="px-6 pb-6 -mt-12">
                {/* Avatar — display only */}
                <div className="mb-4">
                  <div className={`w-20 h-20 rounded-2xl border-4 border-[#0E0520] flex items-center justify-center text-xl font-black overflow-hidden ${istech ? "bg-gradient-to-br from-violet-600 to-indigo-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                    {user.photo
                      ? <img src={user.photo} alt="avatar" className="w-full h-full object-cover" />
                      : initiales}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-black">{profileData?.user?.username || user.username}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.email === "sidhou999@gmail.com"
                      ? "bg-red-500/15 text-red-300"
                      : istech ? "bg-violet-500/15 text-violet-300" : "bg-violet-600/15 text-violet-300"
                  }`}>
                    {user.email === "sidhou999@gmail.com" ? "👑 Admin" : istech ? "🔧 Technicien" : "🛒 Client"}
                  </span>
                </div>

                {profileData?.user?.specialite && (
                  <p className="text-sm text-violet-400/80 mb-2">✦ {profileData.user.specialite}</p>
                )}
                {(profileData?.user?.Firstname || profileData?.user?.Lastname) && (
                  <p className="text-white/60 text-sm mb-1">
                    {[profileData.user.Firstname, profileData.user.Lastname].filter(Boolean).join(" ")}
                  </p>
                )}
                {profileData?.user?.bio && (
                  <p className="text-white/50 text-sm leading-relaxed mb-3">{profileData.user.bio}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { label: "Annonces", value: annoncesCount,                      color: "text-violet-400" },
                    { label: "Note",     value: moyenne ? `★ ${moyenne}` : "—",     color: "text-yellow-400" },
                    { label: "Avis",     value: profileData?.totalNotes || 0,        color: "text-pink-400" },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col items-center py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                      <span className="text-[10px] text-white/30 mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Info chips */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: "👤", label: "Prénom",            value: profileData?.user?.Firstname },
                    { icon: "👤", label: "Nom",               value: profileData?.user?.Lastname },
                    { icon: "📞", label: "Téléphone",         value: profileData?.user?.telephone },
                    { icon: "📍", label: "Wilaya",            value: profileData?.user?.wilaya },
                    { icon: "🎂", label: "Date de naissance", value: profileData?.user?.dateNaissance },
                  ].filter(i => i.value).map(i => (
                    <div key={i.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-sm">{i.icon}</span>
                      <div>
                        <p className="text-[10px] text-white/30">{i.label}</p>
                        <p className="text-xs text-white/80">{i.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => navigate(`/profil/${user.username}`)}
                    className="flex-1 py-2.5 rounded-xl text-xs text-white/40 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:text-white/70 transition-all">
                    Voir mon profil public →
                  </button>
                  <button onClick={() => setTab("parametres")}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-violet-300 bg-violet-600/10 border border-violet-600/20 hover:bg-violet-600/20 transition-all">
                    ⚙️ Modifier le profil
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right: Map ── */}
            <div className="lg:w-[420px] w-full flex-shrink-0">
              <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl" style={{ height: 380 }}>
                <iframe
                  width="100%" height="100%"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapSrc}
                  title="Ma zone"
                />
              </div>
              {wilaya && (
                <p className="text-xs text-white/30 text-center mt-2">📍 Zone : {wilaya}</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: PARAMÈTRES ══════════════ */}
        {tab === "parametres" && (
          <div className="flex gap-6 items-start flex-col lg:flex-row">

            {/* ── Left: settings nav ── */}
            <aside className="lg:w-60 w-full flex-shrink-0">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-2 flex lg:flex-col flex-row gap-1 overflow-x-auto">
                {[
                  { key: "photo",    icon: "📸", label: "Photo de profil" },
                  { key: "infos",    icon: "✏️", label: "Informations" },
                  { key: "securite", icon: "🔐", label: "Sécurité" },
                  { key: "danger",   icon: "⚠️", label: "Suppression" },
                ].map(s => (
                  <button key={s.key} onClick={() => setSettingsSection(s.key)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap text-left w-full transition-all duration-150 ${
                      settingsSection === s.key
                        ? s.key === "danger"
                          ? "bg-red-500/10 text-red-300 border border-red-500/20"
                          : "bg-violet-600/15 text-violet-200 border border-violet-600/20"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"
                    }`}>
                    <span className="text-base">{s.icon}</span>
                    <span className="hidden lg:block">{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Mini profile summary (desktop only) */}
              <div className="hidden lg:flex items-center gap-3 mt-4 px-3 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black overflow-hidden flex-shrink-0 ${istech ? "bg-gradient-to-br from-violet-600 to-indigo-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                  {user.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : initiales}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profileData?.user?.username || user.username}</p>
                  <p className="text-[11px] text-white/30 truncate">{user.email}</p>
                </div>
              </div>
            </aside>

            {/* ── Right: content panel ── */}
            <div className="flex-1 min-w-0">

              {/* ── PHOTO ── */}
              {settingsSection === "photo" && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="px-6 py-5 border-b border-white/[0.06]">
                    <h2 className="text-base font-bold text-white">Photo de profil</h2>
                    <p className="text-xs text-white/35 mt-0.5">Formats acceptés : JPG, PNG, WebP · Taille max 5 Mo</p>
                  </div>
                  <div className="px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileRef.current?.click()}>
                      <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-black overflow-hidden ring-2 ring-white/10 ${istech ? "bg-gradient-to-br from-violet-600 to-indigo-600" : "bg-gradient-to-br from-violet-600 to-pink-600"}`}>
                        {user.photo ? <img src={user.photo} alt="avatar" className="w-full h-full object-cover" /> : initiales}
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {uploadingPhoto
                          ? <span className="spinner w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                          : <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>}
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    </div>
                    <div>
                      <p className="text-sm text-white/55 mb-4 leading-relaxed">Cliquez sur l'avatar ou utilisez le bouton ci-dessous pour changer votre photo de profil.</p>
                      <button onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
                        style={{ background: "linear-gradient(135deg,#8B5CF6,#1F48B5)" }}>
                        {uploadingPhoto
                          ? <span className="flex items-center gap-2"><span className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />Envoi...</span>
                          : "📤 Choisir une photo"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── INFORMATIONS ── */}
              {settingsSection === "infos" && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="px-6 py-5 border-b border-white/[0.06]">
                    <h2 className="text-base font-bold text-white">Informations personnelles</h2>
                    <p className="text-xs text-white/35 mt-0.5">Modifiez vos informations de profil</p>
                  </div>
                  <div className="px-6 py-6 flex flex-col gap-5">
                    {/* 2-col grid on md+ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Nom d'utilisateur</label>
                        <input type="text" value={form.username}
                          onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Téléphone</label>
                        <input type="tel" value={form.telephone}
                          onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Prénom</label>
                        <input type="text" value={form.Firstname}
                          onChange={e => setForm(p => ({ ...p, Firstname: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Nom</label>
                        <input type="text" value={form.Lastname}
                          onChange={e => setForm(p => ({ ...p, Lastname: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Date de naissance</label>
                        <input type="date" value={form.dateNaissance}
                          onChange={e => setForm(p => ({ ...p, dateNaissance: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Wilaya</label>
                        <select value={form.wilaya}
                          onChange={e => setForm(p => ({ ...p, wilaya: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all [color-scheme:dark]">
                          <option value="">Sélectionner une wilaya</option>
                          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                      {istech && (
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-white/50 mb-1.5 block">Spécialité</label>
                          <select value={form.specialite}
                            onChange={e => setForm(p => ({ ...p, specialite: e.target.value }))}
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all [color-scheme:dark]">
                            <option value="">Sélectionner une spécialité</option>
                            {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Bio</label>
                        <textarea value={form.bio}
                          onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                          rows={3}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all resize-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <p className="text-xs text-white/25">Les modifications sont sauvegardées immédiatement</p>
                      <button onClick={handleSave} disabled={saving || !form.username.trim()}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(139,92,246,0.25)]"
                        style={{ background: "linear-gradient(135deg,#8B5CF6,#1F48B5)" }}>
                        {saving
                          ? <span className="flex items-center gap-2"><span className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />Enregistrement…</span>
                          : "Enregistrer les modifications"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SÉCURITÉ ── */}
              {settingsSection === "securite" && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="px-6 py-5 border-b border-white/[0.06]">
                    <h2 className="text-base font-bold text-white">Modifier le mot de passe</h2>
                    <p className="text-xs text-white/35 mt-0.5">Un code de confirmation sera envoyé à votre adresse email</p>
                  </div>
                  <div className="px-6 py-6">
                    {pwdSuccess && (
                      <div className="mb-5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400 text-sm flex items-center gap-2">
                        <span>✓</span>{pwdSuccess}
                      </div>
                    )}
                    {pwdError && (
                      <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{pwdError}</div>
                    )}

                    {pwdStep === "idle" && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-white/55 leading-relaxed">Cliquez sur le bouton pour recevoir un code de vérification par email. Vous pourrez ensuite définir un nouveau mot de passe.</p>
                        </div>
                        <button onClick={handleSendPwdCode}
                          className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all whitespace-nowrap shadow-[0_4px_20px_rgba(139,92,246,0.25)]"
                          style={{ background: "linear-gradient(135deg,#8B5CF6,#1F48B5)" }}>
                          Envoyer le code →
                        </button>
                      </div>
                    )}

                    {pwdStep === "sending" && (
                      <div className="flex items-center gap-2 py-3 text-white/50 text-sm">
                        <span className="spinner w-4 h-4 border-2 border-white/20 border-t-violet-400 rounded-full inline-block" />
                        Envoi en cours…
                      </div>
                    )}

                    {pwdStep === "code" && (
                      <div className="flex flex-col gap-4 max-w-md">
                        <div>
                          <label className="text-xs font-medium text-white/50 mb-1.5 block">Code reçu par email</label>
                          <input type="text" maxLength={6} value={pwdCode} onChange={e => setPwdCode(e.target.value)}
                            placeholder="000000"
                            className="w-full px-3.5 py-3 rounded-xl text-lg text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 transition-all text-center tracking-[0.4em] font-mono" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-white/50 mb-1.5 block">Nouveau mot de passe</label>
                            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                              placeholder="Min. 6 car., 1 majuscule, 1 spécial"
                              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 transition-all" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-white/50 mb-1.5 block">Confirmer le mot de passe</label>
                            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                              placeholder="Répéter le mot de passe"
                              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 transition-all" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <button onClick={() => { setPwdStep("idle"); setPwdError(""); }}
                            className="px-4 py-2.5 rounded-xl text-sm text-white/50 bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] transition-all">
                            Annuler
                          </button>
                          <button onClick={handleChangePwd} disabled={!pwdCode || !newPwd || !confirmPwd}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg,#8B5CF6,#1F48B5)" }}>
                            Confirmer le changement
                          </button>
                        </div>
                        <button onClick={handleSendPwdCode} className="text-xs text-violet-400/50 hover:text-violet-400 text-center transition-colors">
                          Renvoyer le code
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── DANGER ZONE ── */}
              {settingsSection === "danger" && (
                <div className="rounded-2xl border border-red-500/25" style={{ background: "rgba(239,68,68,0.03)" }}>
                  <div className="px-6 py-5 border-b border-red-500/15">
                    <h2 className="text-base font-bold text-red-400">Zone dangereuse</h2>
                    <p className="text-xs text-white/35 mt-0.5">Actions irréversibles — à utiliser avec précaution</p>
                  </div>
                  <div className="px-6 py-6">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white/80 mb-1">Supprimer mon compte</p>
                        <p className="text-xs text-white/40 leading-relaxed">
                          La suppression est <span className="text-white/60 font-medium">définitive et irréversible</span>. Toutes vos données, annonces et publications seront effacées.
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) return;
                          const confirmPassword = window.prompt("Entrez votre mot de passe pour confirmer :");
                          if (!confirmPassword) { alert("Suppression annulée."); return; }
                          try {
                            const res = await fetch(`/api/users/${user.username}/delete-account`, {
                              method: "DELETE",
                              headers: { ...authHeaders(), "Content-Type": "application/json" },
                              body: JSON.stringify({ password: confirmPassword }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              alert("Votre compte a été supprimé.");
                              localStorage.clear();
                              window.location.href = "/";
                            } else {
                              alert(data.message || "Erreur lors de la suppression.");
                            }
                          } catch { alert("Erreur de connexion."); }
                        }}
                        className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-200 transition-all whitespace-nowrap">
                        🗑️ Supprimer mon compte
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ══════════════ TAB: HISTORIQUE ══════════════ */}
        {tab === "historique" && (
          <div className="flex flex-col gap-4">
            {!history ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Annonces */}
                <div>
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3">
                    📢 Annonces ({history.annonces?.length || 0})
                  </h2>
                  {history.annonces?.length === 0 ? (
                    <p className="text-white/25 text-sm py-4 text-center">Aucune annonce publiée</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {history.annonces.map(a => (
                        <div key={a._id}
                          onClick={() => navigate(`/annonces/${a._id}`)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-600/30 cursor-pointer transition-all group">
                          {a.photo && (
                            <img src={a.photo} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">{a.titre}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-violet-400/60 bg-violet-600/10 px-2 py-0.5 rounded-full">{a.categorie}</span>
                              {a.wilaya && <span className="text-[10px] text-white/30">📍 {a.wilaya}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-emerald-400">{a.prix?.toLocaleString()} DA</p>
                            <p className="text-[10px] text-white/25">{formatDate(a.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Forum posts */}
                <div>
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3 mt-2">
                    💬 Publications Forum ({history.posts?.length || 0})
                  </h2>
                  {history.posts?.length === 0 ? (
                    <p className="text-white/25 text-sm py-4 text-center">Aucune publication forum</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {history.posts.map(p => (
                        <div key={p._id}
                          onClick={() => navigate("/forum")}
                          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-600/30 cursor-pointer transition-all group">
                          {p.photo && (
                            <img src={p.photo} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 line-clamp-2 group-hover:text-white transition-colors">{p.contenu}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-white/30">❤️ {p.likes?.length || 0}</span>
                              <span className="text-[10px] text-white/30">💬 {p.commentaires?.length || 0}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-white/25 flex-shrink-0 mt-0.5">{formatDate(p.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════ TAB: SUPPRIMÉS ══════════════ */}
        {tab === "supprimes" && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-white/30 text-center">Le contenu supprimé est conservé 30 jours, puis définitivement effacé.</p>

            {!deleted ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Annonces supprimées */}
                <div>
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3">
                    📢 Annonces supprimées ({deleted.annonces?.length || 0})
                  </h2>
                  {deleted.annonces?.length === 0 ? (
                    <p className="text-white/25 text-sm py-4 text-center">Aucune annonce supprimée récemment</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {deleted.annonces.map(a => (
                        <div key={a._id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/15">
                          {a.photo && <img src={a.photo} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 opacity-60" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/60 truncate">{a.titre}</p>
                            <p className="text-[10px] text-red-400/60">Supprimé le {formatDate(a.deletedAt)}</p>
                          </div>
                          <button
                            onClick={() => handleRestore("annonce", a._id)}
                            disabled={restoring === a._id}
                            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-600/30 transition-all disabled:opacity-50">
                            {restoring === a._id ? "..." : "↩ Restaurer"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Posts supprimés */}
                <div>
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3 mt-2">
                    💬 Publications supprimées ({deleted.posts?.length || 0})
                  </h2>
                  {deleted.posts?.length === 0 ? (
                    <p className="text-white/25 text-sm py-4 text-center">Aucune publication supprimée récemment</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {deleted.posts.map(p => (
                        <div key={p._id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/15">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/50 line-clamp-2">{p.contenu}</p>
                            <p className="text-[10px] text-red-400/60 mt-1">Supprimé le {formatDate(p.deletedAt)}</p>
                          </div>
                          <button
                            onClick={() => handleRestore("post", p._id)}
                            disabled={restoring === p._id}
                            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-600/30 transition-all disabled:opacity-50">
                            {restoring === p._id ? "..." : "↩ Restaurer"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
