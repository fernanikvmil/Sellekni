import { useState, useEffect, useRef } from "react";
import DatePicker from "./DatePicker";
import { useNavigate } from "react-router-dom";
import { authHeaders, authFormHeaders } from "./api";
import Navbar from "./Navbar";
import { AuthBtn } from "./Components";

function CustomSelect({ value, onChange, options, placeholder = "Sélectionner..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm text-left flex items-center justify-between gap-2 border transition-all duration-200 ${
          open ? "bg-violet-500/10 border-violet-500/50 text-white" : "bg-white/[0.04] border-white/[0.08] text-white/80 hover:border-white/20"
        }`}
      >
        <span className={`truncate ${value ? "text-white" : "text-white/30"}`}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-violet-400" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full bottom-full mb-2 rounded-xl bg-[#0e0e1c] border border-white/[0.08] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          {options.length > 8 && (
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full bg-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none border border-white/[0.08] focus:border-violet-500/40"
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto custom-scroll py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">Aucun résultat</p>
            ) : filtered.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 flex items-center gap-2 ${
                  value === opt
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-white/70 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {value === opt && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                <span className="truncate">{opt}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  "tous", "💧 Plomberie", "⚡ Électricité", "❄️ Chauffage & Clim", "🔐 Sécurité",
  "🌳 Jardin & extérieur", "🧱 Maçonnerie", "🎨 Peinture & décoration", "🪟 Aluminium",
  "📡 Réseaux & Internet", "🧹 Nettoyage", "🏗️ Rénovation", "🧯 Sécurité incendie",
  "🚚 Déménagement", "autres"
];

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar",
  "Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger",
  "Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma",
  "Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh",
  "Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued",
  "Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane"
];

export default function Annonces() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [activeTab, setActiveTab]       = useState("annonces");
  const [annonces, setAnnonces]         = useState([]);
  const [services, setServices]         = useState([]);
  const [categorie, setCategorie]       = useState("tous");
  const [showForm, setShowForm]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [preview, setPreview]           = useState(null);
  const [mounted, setMounted]           = useState(false);
  const [search, setSearch]             = useState("");
  const [showFilters, setShowFilters]   = useState(false);

  const [filters, setFilters] = useState({
    prixMin: "", prixMax: "", wilaya: "", date: "", tri: "recent", categorie: ""
  });

  const [form, setForm] = useState({
    titre: "", description: "", prix: "", categorie: "💧 Plomberie", photo: null, wilaya: ""
  });

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);
  useEffect(() => { fetchItems(); }, [categorie, activeTab]);

  // Charger les counts des deux onglets au montage
  useEffect(() => {
    fetch("/api/annonces?categorie=tous").then(r => r.json()).then(d => setAnnonces(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/services?categorie=tous").then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const endpoint = activeTab === "annonces" ? "/api/annonces" : "/api/services";
      const res = await fetch(`${endpoint}?categorie=${categorie}`, { method: "GET" });
      const data = await res.json();
      if (activeTab === "annonces") setAnnonces(data);
      else setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const resetTab = (tab) => {
    setActiveTab(tab);
    setCategorie("tous");
    setShowForm(false);
    setSearch("");
    setFilters({ prixMin: "", prixMax: "", wilaya: "", date: "", tri: "recent", categorie: "" });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, photo: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.titre || !form.description || !form.prix) {
      alert("Remplissez tous les champs obligatoires !");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("titre", form.titre);
      formData.append("description", form.description);
      formData.append("prix", form.prix);
      formData.append("categorie", form.categorie);
      formData.append("auteur", user?.username || "Anonyme");
      formData.append("role", user?.role || "client");
      formData.append("wilaya", form.wilaya);
      if (form.photo) formData.append("photo", form.photo);

      const endpoint = activeTab === "annonces" ? "/api/annonces" : "/api/services";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: authFormHeaders(),
        body: formData,
      });

      if (res.ok) {
        setForm({ titre: "", description: "", prix: "", categorie: "💧 Plomberie", photo: null, wilaya: "" });
        setPreview(null);
        setShowForm(false);
        fetchItems();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer définitivement ?")) return;
    const endpoint = activeTab === "annonces" ? `/api/annonces/${id}` : `/api/services/${id}`;
    await fetch(endpoint, { method: "DELETE", headers: authHeaders() });
    fetchItems();
  };

  const getFilteredItems = () => {
    let items = activeTab === "annonces" ? annonces : services;
    if (search) items = items.filter(i =>
      i.titre?.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase())
    );
    if (filters.categorie) items = items.filter(i => i.categorie === filters.categorie);
    if (filters.prixMin)   items = items.filter(i => i.prix >= Number(filters.prixMin));
    if (filters.prixMax)   items = items.filter(i => i.prix <= Number(filters.prixMax));
    if (filters.wilaya)    items = items.filter(i => i.wilaya === filters.wilaya);
    if (filters.date) {
      const fd = new Date(filters.date).toDateString();
      items = items.filter(i => new Date(i.createdAt).toDateString() === fd);
    }
    if (filters.tri === "prix_asc")  items = [...items].sort((a, b) => a.prix - b.prix);
    if (filters.tri === "prix_desc") items = [...items].sort((a, b) => b.prix - a.prix);
    if (filters.tri === "recent")    items = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return items;
  };

  const currentItems = getFilteredItems();
  const hasActiveFilter = filters.prixMin || filters.prixMax || filters.wilaya || filters.date || filters.categorie;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) forwards; }
        .spinner { animation: spin 0.75s linear infinite; }
        .tab-active { position:relative; }
        .tab-active::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:2px; background:linear-gradient(90deg,#8b5cf6,#a855f7); border-radius:2px; }
        .custom-scroll::-webkit-scrollbar { width:4px; }
        .custom-scroll::-webkit-scrollbar-track { background:transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.3); border-radius:99px; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(139,92,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.06)_1px,transparent_1px)] [background-size:60px_60px]" />
      <div className="fixed top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-pink-500/15 blur-[90px] pointer-events-none z-0" />

      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Onglets + bouton publier */}
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 ${mounted ? "fade-up" : "opacity-0"}`}>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {[
              { key: "annonces", label: "Annonces", icon: "📦", count: annonces.length },
              { key: "services", label: "Services",  icon: "🛠️", count: services.length },
            ].map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => resetTab(tab.key)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 hover:-translate-y-1 active:translate-y-0 active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-r from-violet-700 to-purple-500 text-white shadow-[0_8px_30px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_35px_rgba(139,92,246,0.45)]"
                      : "bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"
                  }`}
                >
                  <span className="text-sm sm:text-base">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                  <span className={`text-xs ${isActive ? "text-white/60" : "text-white/25"}`}>({tab.count})</span>
                </button>
              );
            })}
          </div>
          {user ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 hover:-translate-y-1 active:translate-y-0 active:scale-95 ${
                showForm
                  ? "bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"
                  : "bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 text-white shadow-[0_8px_30px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_35px_rgba(139,92,246,0.45)]"
              }`}
            >
              {showForm ? "✕ Annuler" : `+ Publier un${activeTab === "services" ? " service" : "e annonce"}`}
            </button>
          ) : (
            <AuthBtn onClick={() => navigate("/login")} className="w-full sm:w-auto justify-center">🔒 Connectez-vous pour publier</AuthBtn>
          )}
        </div>

        {/* Recherche + filtres */}
        <div className={`mb-4 ${mounted ? "fade-up" : "opacity-0"}`}>
          <div className="relative">
            <input
              type="text"
              placeholder={`🔍 Rechercher ${activeTab === "annonces" ? "une annonce" : "un service"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all pr-28"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1 transition-all ${showFilters ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "bg-white/[0.05] hover:bg-white/[0.1] text-white/60 border border-transparent"}`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <span className="hidden xs:inline">Filtres</span>
              <span className="xs:hidden">Filtre</span>
              {hasActiveFilter && <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />}
            </button>
          </div>
        </div>

        {/* Panneau filtres */}
        {showFilters && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Prix min (DZD)</label>
                <input type="number" placeholder="0" value={filters.prixMin}
                  onChange={(e) => setFilters({...filters, prixMin: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Prix max (DZD)</label>
                <input type="number" placeholder="Illimité" value={filters.prixMax}
                  onChange={(e) => setFilters({...filters, prixMax: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Wilaya</label>
                <CustomSelect
                  value={filters.wilaya}
                  onChange={(val) => setFilters({...filters, wilaya: val})}
                  options={["", ...WILAYAS]}
                  placeholder="Toutes les wilayas"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Date de publication</label>
                <DatePicker
                  value={filters.date}
                  onChange={(v) => setFilters({ ...filters, date: v })}
                  maxYear={new Date().getFullYear()}
                  minYear={2020}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="text-xs text-white/40 mb-1.5 block">Catégorie</label>
                <CustomSelect
                  value={filters.categorie}
                  onChange={(val) => setFilters({...filters, categorie: val})}
                  options={["", ...CATEGORIES.filter(c => c !== "tous")]}
                  placeholder="Toutes les catégories"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="text-xs text-white/40 mb-1.5 block">Trier par</label>
                <div className="flex gap-2 flex-wrap items-center">
                  {[
                    { value: "recent", label: "📅 Plus récent" },
                    { value: "prix_asc", label: "💰 Prix croissant" },
                    { value: "prix_desc", label: "💰 Prix décroissant" }
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setFilters({...filters, tri: opt.value})}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.tri === opt.value ? "bg-violet-600 text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08]"}`}>
                      {opt.label}
                    </button>
                  ))}
                  <button onClick={() => setFilters({ prixMin: "", prixMax: "", wilaya: "", date: "", tri: "recent", categorie: "" })}
                    className="ml-auto px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tags filtres actifs */}
        {hasActiveFilter && (
          <div className="flex gap-2 flex-wrap mb-4 text-xs">
            {filters.categorie && <span className="px-2 py-1 rounded-full bg-violet-500/15 text-violet-300">📂 {filters.categorie}</span>}
            {filters.prixMin   && <span className="px-2 py-1 rounded-full bg-violet-500/15 text-violet-300">💰 ≥ {Number(filters.prixMin).toLocaleString()} DZD</span>}
            {filters.prixMax   && <span className="px-2 py-1 rounded-full bg-violet-500/15 text-violet-300">💰 ≤ {Number(filters.prixMax).toLocaleString()} DZD</span>}
            {filters.wilaya    && <span className="px-2 py-1 rounded-full bg-violet-500/15 text-violet-300">📍 {filters.wilaya}</span>}
            {filters.date      && <span className="px-2 py-1 rounded-full bg-violet-500/15 text-violet-300">📅 {new Date(filters.date).toLocaleDateString()}</span>}
          </div>
        )}

        {/* Formulaire publication */}
        {showForm && (
          <div className="mb-8 p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-[0_0_0_1px_rgba(139,92,246,0.1)] fade-up">
            <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-5">{activeTab === "annonces" ? "Nouvelle annonce" : "Nouveau service"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1.5 block">Titre</label>
                <input type="text" name="titre" placeholder={activeTab === "annonces" ? "Titre de l'annonce" : "Nom du service"}
                  value={form.titre} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1.5 block">Description</label>
                <textarea name="description" placeholder={activeTab === "annonces" ? "Décrivez votre annonce..." : "Détaillez votre service..."}
                  value={form.description} onChange={handleChange} rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all resize-none" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">{activeTab === "annonces" ? "Prix (DZD)" : "Tarif (DZD)"}</label>
                <input
                  type="number" name="prix" placeholder="0" value={form.prix} min="0"
                  onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) >= 0) setForm({ ...form, prix: v }); }}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Catégorie</label>
                <CustomSelect
                  value={form.categorie}
                  onChange={(val) => setForm({ ...form, categorie: val })}
                  options={CATEGORIES.filter(c => c !== "tous")}
                  placeholder="Choisir une catégorie"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Wilaya</label>
                <CustomSelect
                  value={form.wilaya}
                  onChange={(val) => setForm({ ...form, wilaya: val })}
                  options={WILAYAS}
                  placeholder="Sélectionnez votre wilaya"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 mb-1.5 block">Photo</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] border-dashed cursor-pointer hover:border-violet-500/40 transition-all">
                  <span className="text-white/40 text-sm truncate">📷 {form.photo ? form.photo.name : "Choisir une photo"}</span>
                  <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </label>
                {preview && <img src={preview} alt="preview" className="mt-3 h-32 w-full object-cover rounded-xl opacity-80" />}
              </div>
              <div className="sm:col-span-2">
                <button type="button" onClick={handleSubmit} disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 disabled:opacity-60 transition-all duration-300">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                      Publication...
                    </span>
                  ) : `Publier ${activeTab === "annonces" ? "l'annonce" : "le service"} →`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grille des cartes */}
        {loadingItems ? (
          <div className="flex justify-center py-20">
            <span className="spinner w-8 h-8 border-2 border-white/20 border-t-violet-500 rounded-full inline-block" />
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <p className="text-4xl mb-3">{activeTab === "annonces" ? "📭" : "🔧"}</p>
            <p className="text-base sm:text-lg font-medium">{activeTab === "annonces" ? "Aucune annonce" : "Aucun service"} pour le moment</p>
            <p className="text-xs sm:text-sm mt-1">{user ? "Soyez le premier à publier !" : "Connectez-vous pour publier"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {currentItems.map((item, i) => (
              <div
                key={item._id}
                onClick={() => navigate(`/${activeTab}/${item._id}`)}
                className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(139,92,246,0.15)] cursor-pointer"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {item.photo && item.photo.startsWith("http") ? (
                  <img src={item.photo} alt={item.titre} className="w-full h-36 sm:h-44 object-cover" />
                ) : (
                  <div className="w-full h-36 sm:h-44 bg-gradient-to-br from-violet-900/30 to-pink-900/20 flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl opacity-30">{activeTab === "annonces" ? "🖼️" : "🛠️"}</span>
                  </div>
                )}

                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-medium truncate max-w-[120px]">{item.categorie}</span>
                    <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-medium ${item.role === "technicien" ? "bg-blue-500/15 text-blue-300" : "bg-pink-500/15 text-pink-300"}`}>
                      {item.role === "technicien" ? "👨‍🔧 Pro" : "👤 Particulier"}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-white mb-1 line-clamp-1">{item.titre}</h3>
                  <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-violet-400 font-black text-base sm:text-lg">
                      {Number(item.prix).toLocaleString()} <span className="text-xs font-normal text-white/30">DZD</span>
                    </span>
                    <span className="text-xs text-white/25 truncate max-w-[80px]">👤 {item.auteur}</span>
                  </div>
                  {item.wilaya && <p className="text-xs text-white/30 mt-2 truncate">📍 {item.wilaya}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
