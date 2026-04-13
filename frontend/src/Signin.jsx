import { useState, useEffect, useRef } from "react";
import DatePicker from "./DatePicker";
import { useNavigate } from "react-router-dom";
import VerificationModal from "./VerificationModal";

import { User, Mail, Lock, KeyRound, Pickaxe, Phone, Calendar1, Eye, EyeOff, MapPin } from 'lucide-react';

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

const SPECIALITES = [
  "Plomberie","Électricité","Menuiserie","Peinture","Carrelage",
  "Climatisation","Électronique","Informatique","Mécanique auto",
  "Maçonnerie","Serrurerie","Jardinage","Déménagement","Nettoyage",
  "Soudure","Toiture","Vitrage","Réparation électroménager",
  "Installation sanitaire","Chauffage","Cuisines équipées","Ascenseurs",
];

function SearchableDropdown({ value, onChange, options, placeholder, icon }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (val) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange("");
    setOpen(true);
  };

  return (
    <div ref={ref} className="relative group">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors text-sm pointer-events-none">
        {icon}
      </span>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full pl-10 pr-8 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:bg-purple-500/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300"
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(""); onChange(""); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 text-xs transition-colors"
        >✕</button>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0c0c18] border border-white/[0.08] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-y-auto z-50 max-h-44">
          {filtered.map(opt => (
            <div
              key={opt}
              onMouseDown={() => select(opt)}
              className="px-4 py-2.5 text-sm text-white/80 hover:bg-violet-500/10 hover:text-white cursor-pointer transition-colors"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Signin() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [verificationData, setVerificationData] = useState(null); // { userId, email }

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    telephone: "",
    dateNaissance: "",
    wilaya: "",
    specialite: "",
  });

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.email || !form.password || !form.confirm || !form.dateNaissance) {
      triggerShake("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      triggerShake("Adresse email invalide.");
      return;
    }
    const pwdRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!pwdRegex.test(form.password)) {
      triggerShake("Le mot de passe doit contenir au moins 6 caractères, une majuscule et un caractère spécial.");
      return;
    }
    if (form.password !== form.confirm) {
      triggerShake("Les mots de passe ne correspondent pas.");
      return;
    }
    if (role === "technicien" && !form.specialite) {
      triggerShake("Veuillez choisir votre spécialité.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          role,
          telephone: form.telephone,
          dateNaissance: form.dateNaissance,
          wilaya: form.wilaya,
          specialite: form.specialite,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        triggerShake(data.message);
      } else {
        setVerificationData({ userId: data.userId, email: form.email });
      }
    } catch {
      triggerShake("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: "client",     emoji: "👤",  label: "Client",     desc: "Publier des annonces" },
    { key: "technicien", emoji: "🔧", label: "Technicien", desc: "Proposer des services" },
  ];

  return (
    <>
    {verificationData && (
      <VerificationModal
        userId={verificationData.userId}
        email={verificationData.email}
        onSuccess={() => navigate("/login")}
        onClose={() => setVerificationData(null)}
      />
    )}
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden relative py-10">

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        @keyframes ping-slow {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .do-shake  { animation: shake 0.5s ease; }
        .ping-slow { animation: ping-slow 2.5s ease-out infinite; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 [linear-gradient(rgba(139,92,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.06)_1px,transparent_1px)] bg-size-[60px_60px]" />
      <div className="fixed top-30 left-20 w-100 h-100 rounded-full bg-purple-600/20 blur-[100px] animate-pulse pointer-events-none z-0" />
      <div className="fixed -bottom-20 -right-20 w-87.5 h-87.5 rounded-full bg-pink-500/15 blur-[90px] animate-pulse pointer-events-none z-0 [animation-delay:1s]" />
      <div className="fixed top-1/2 right-1/4 w-62.5 h-62.5 rounded-full bg-blue-500/10 blur-[70px] animate-pulse pointer-events-none z-0 [animation-delay:0.5s]" />

      <div
        className={`
          relative z-10 lg:w-110 w-90 px-10 py-11
          bg-white/3 backdrop-blur-2xl
          border border-white/8 rounded-3xl
          shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_40px_80px_rgba(0,0,0,0.55)]
          transition-opacity duration-500
          ${mounted ? "fade-up" : "opacity-0"}
          ${shake ? "do-shake" : ""}
        `}
      >
        <div className="absolute top-0 left-[20%] right-[20%] h-0.5 rounded-b bg-linear-to-r from-transparent via-purple-500 to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <div
            className="relative w-20 h-20 flex items-center justify-center bg-linear-to-br from-purple-600/30 to-pink-500/20 border border-purple-500/30 rounded-2xl mb-5 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="ping-slow absolute inset-0 rounded-2xl border border-purple-500/30" />
            <span className="text-4xl">🛠️</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight">Créer un compte</h1>
          <p className="text-white/40 text-sm mt-1 font-light">Rejoignez la communauté sellekni</p>
        </div>

        {/* Role selector */}
        <p className="text-white/40 text-[11px] text-center uppercase tracking-widest mb-3">Je suis un</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {roles.map(({ key, emoji, label, desc }) => {
            const active = role === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setRole(key); setForm(f => ({ ...f, specialite: key })); }}
                className={`flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  active
                    ? "border-violet-500/70 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
                    : "border-white/8 bg-white/3 hover:bg-white/6"
                }`}
              >
                <span className="text-3xl">{emoji}</span>
                <span className={`text-sm font-semibold transition-colors duration-200 ${active ? "text-violet-300" : "text-white/60"}`}>{label}</span>
                <span className="text-[11px] text-white/30">{desc}</span>
                <div className={`mt-1 w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all duration-200 ${active ? "bg-violet-600" : "bg-white/10"}`}>
                  <span className={`text-[10px] font-bold ${active ? "text-white" : "text-white/20"}`}>✓</span>
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSignin} className="flex flex-col gap-3">

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors text-sm pointer-events-none" />
            <input
              type="text"
              name="username"
              placeholder="Nom d'utilisateur *"
              value={form.username}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-purple-500/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300"
            />
          </div>

          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-3.5 pr-2 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors text-sm pointer-events-none" />
            <input
              type="email"
              name="email"
              placeholder="Adresse email *"
              value={form.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-purple-500/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300"
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock className="absolute left-3.5 pr-2 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors text-sm pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mot de passe *"
              value={form.password}
              onChange={handleChange}
              className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-purple-500/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors border-l pl-2 h-full border-white/8">
              {showPassword ? (<Eye size={19} color="#FFFFFF4D" className="hover:cursor-pointer"/>) : (<EyeOff size={19} color="#FFFFFF4D" className="hover:cursor-pointer"/>)}
            </button>
          </div>

          {/* Confirm password */}
          <div className="relative group">
            <KeyRound className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors text-sm pointer-events-none" />
            <input
              type={showConfirm ? "text" : "password"}
              name="confirm"
              placeholder="Confirmer le mot de passe *"
              value={form.confirm}
              onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border focus:outline-none focus:bg-purple-500/10 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300 ${
                form.confirm && form.password !== form.confirm
                  ? "border-red-500/50 focus:border-red-500/60"
                  : form.confirm && form.password === form.confirm
                  ? "border-green-500/50 focus:border-green-500/60"
                  : "border-white/8 focus:border-purple-500/60"
              }`}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors border-l pl-2 h-full border-white/8">
              {showConfirm ? (<EyeOff size={19} color="#FFFFFF4D" className="hover:cursor-pointer"/>) : (<Eye size={19} color="#FFFFFF4D" className="hover:cursor-pointer"/>)}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[10px] text-white/25 uppercase tracking-widest">Informations supplémentaires</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Wilaya */}
          <SearchableDropdown
            value={form.wilaya}
            onChange={(v) => setForm(f => ({ ...f, wilaya: v }))}
            options={WILAYAS}
            placeholder="Wilaya (optionnel)"
            icon={<MapPin className="pr-2"/>}
          />

          {/* Spécialité */}
          {role === "technicien" && (
            <SearchableDropdown
              value={form.specialite}
              onChange={(v) => setForm(f => ({ ...f, specialite: v }))}
              options={SPECIALITES}
              placeholder="Spécialité *"
              icon={<Pickaxe className="pr-2"/>}
            />
          )}

          {/* Téléphone */}
          <div className="relative group">
            <Phone className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors text-sm pointer-events-none" />
            <input
              type="tel"
              name="telephone"
              placeholder="Téléphone (optionnel)"
              value={form.telephone}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-purple-500/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300"
            />
          </div>

          {/* Date de naissance */}
          <DatePicker
            label="Date de naissance"
            icon={<Calendar1 className="pr-2"/>}
            value={form.dateNaissance}
            onChange={(v) => setForm(f => ({ ...f, dateNaissance: v }))}
            maxYear={new Date().getFullYear() - 16}
            minYear={new Date().getFullYear() - 100}
          />

          <p className="text-xs text-white/25 text-center px-2 mt-1">
            En créant un compte, vous acceptez nos{" "}
            <span className="text-purple-400/70 hover:text-purple-400 cursor-pointer transition-colors">conditions d'utilisation</span>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3.5 mt-1 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                Création en cours...
              </span>
            ) : (
              `Créer mon compte en tant que ${role} →`
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-white/30">
          Déjà un compte ?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-purple-400 hover:text-purple-300 cursor-pointer font-medium transition-colors"
          >
            Se connecter
          </span>
        </p>
      </div>
    </div>
    </>
  );
}
