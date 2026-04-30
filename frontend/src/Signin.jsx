import { useState, useEffect } from "react";
import DatePicker from "./DatePicker";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, KeyRound, Pickaxe, Phone, Calendar1, Eye, EyeOff } from 'lucide-react';
import VerificationModal from "./VerificationModal";
import { SearchableDropdown } from "./Components";

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
  "Climatisation","Électronique","Informatique","Faux plafond",
  "Maçonnerie","Serrurerie","Jardinage","Déménagement","Nettoyage",
  "Soudure","Toiture","Vitrage","Réparation électroménager",
  "Installation sanitaire","Chauffage","Cuisines équipées","Ascenseurs",
];


export default function Signin() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [verifyUserId, setVerifyUserId] = useState(null);

  const [form, setForm] = useState({
     Firstname:"",Lastname:"", username: "", email: "", password: "", confirm: "",
    telephone: "", dateNaissance: "", wilaya: "", specialite: "",
  });

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.Firstname || !form.Lastname || !form.username || !form.email || !form.password || !form.confirm || !form.dateNaissance) {
      triggerShake("Veuillez remplir tous les champs obligatoires."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      triggerShake("Adresse email invalide."); return;
    }
    if (!/^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/.test(form.password)) {
      triggerShake("Le mot de passe doit contenir au moins 6 caractères, une majuscule et un caractère spécial."); return;
    }
    if (form.password !== form.confirm) {
      triggerShake("Les mots de passe ne correspondent pas."); return;
    }
    if (role === "technicien" && !form.specialite) {
      triggerShake("Veuillez choisir votre spécialité."); return;
    }
    if (form.telephone && !/^(05|06|07)\d{8}$/.test(form.telephone)) {
      triggerShake("Le numéro de téléphone doit commencer par 05, 06 ou 07 et contenir 10 chiffres."); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Firstname: form.Firstname,
          Lastname: form.Lastname,
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
      if (!res.ok) triggerShake(data.message);
      else { setVerifyUserId(data.userId); setEmailSent(true); }
    } catch {
      triggerShake("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: "client",     emoji: "👤", label: "Client",     desc: "Publier des annonces" },
    { key: "technicien", emoji: "🔧", label: "Technicien", desc: "Proposer des services" },
  ];

  if (emailSent) {
    return (
      <div className="min-h-screen bg-transparent">
        <VerificationModal
          userId={verifyUserId}
          email={form.email}
          onSuccess={() => navigate("/login")}
          onClose={() => { setEmailSent(false); setVerifyUserId(null); }}
        />
      </div>
    );
  }

  return (
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
        .fade-up   { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) forwards; }
        .do-shake  { animation: shake 0.5s ease; }
        .ping-slow { animation: ping-slow 2.5s ease-out infinite; }
      `}</style>

      <div className="fixed top-30 left-20 w-100 h-100 rounded-full bg-violet-600/20 blur-[100px] animate-pulse pointer-events-none z-0" />
      <div className="fixed -bottom-20 -right-20 w-87.5 h-87.5 rounded-full bg-pink-500/15 blur-[90px] animate-pulse pointer-events-none z-0" />

      <div className={`
        relative z-10 lg:w-110 w-90 px-10 py-11
        bg-white/3 backdrop-blur-2xl
        border border-white/8 rounded-3xl
        shadow-[0_0_0_1px_rgba(196,181,253,0.12),0_40px_80px_rgba(0,0,0,0.55)]
        transition-opacity duration-500
        ${mounted ? "fade-up" : "opacity-0"}
        ${shake ? "do-shake" : ""}
      `}>
        <div className="absolute top-0 left-[20%] right-[20%] h-0.5 rounded-b bg-linear-to-r from-transparent via-violet-600 to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Sellekni" className="w-28 h-28 object-contain mb-3 cursor-pointer" onClick={() => navigate("/")} />
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
                onClick={() => { setRole(key); setForm(f => ({ ...f, specialite: "" })); }}
                className={`flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  active
                    ? "border-violet-600/70 bg-violet-600/10 shadow-[0_0_0_1px_rgba(196,181,253,0.2)]"
                    : "border-white/8 bg-white/3 hover:bg-white/6"
                }`}
              >
                <span className="text-3xl">{emoji}</span>
                <span className={`text-sm font-semibold transition-colors duration-200 ${active ? "text-violet-300" : "text-white/60"}`}>{label}</span>
                <span className="text-[11px] text-white/30">{desc}</span>
                <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${active ? "bg-violet-600" : "bg-white/10"}`}>
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
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input type="text" name="Firstname" placeholder="Prenom*" value={form.Firstname} onChange={handleChange}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300" />
          </div>

         <div className="relative group">
            <User className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input type="text" name="Lastname" placeholder="Nom de famille *" value={form.Lastname} onChange={handleChange}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300" />
          </div>

          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input type="text" name="username" placeholder="Nom d'utilisateur *" value={form.username} onChange={handleChange}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300" />
          </div>

          <div className="relative group">
            <Mail className="absolute left-3.5 pr-2 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input type="email" name="email" placeholder="Adresse email *" value={form.email} onChange={handleChange}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300" />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3.5 pr-2 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Mot de passe *" value={form.password} onChange={handleChange}
              className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l pl-2 h-full border-white/8">
              {showPassword ? <Eye size={19} color="#FFFFFF4D" className="hover:cursor-pointer" /> : <EyeOff size={19} color="#FFFFFF4D" className="hover:cursor-pointer" />}
            </button>
          </div>

          <div className="relative group">
            <KeyRound className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input type={showConfirm ? "text" : "password"} name="confirm" placeholder="Confirmer le mot de passe *" value={form.confirm} onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border focus:outline-none focus:bg-violet-600/10 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300 ${
                form.confirm && form.password !== form.confirm ? "border-red-500/50 focus:border-red-500/60"
                : form.confirm && form.password === form.confirm ? "border-green-500/50 focus:border-green-500/60"
                : "border-white/8 focus:border-violet-600/60"
              }`} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l pl-2 h-full border-white/8">
              {showConfirm ? <EyeOff size={19} color="#FFFFFF4D" className="hover:cursor-pointer" /> : <Eye size={19} color="#FFFFFF4D" className="hover:cursor-pointer" />}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[10px] text-white/25 uppercase tracking-widest">Informations supplémentaires</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          <SearchableDropdown
            value={form.wilaya || "all"}
            onChange={(v) => setForm(f => ({ ...f, wilaya: v === "all" ? "" : v }))}
            options={WILAYAS}
            placeholder="📍 Wilaya (optionnel)"
            allLabel="📍 Toutes les wilayas"
            numbered
          />

          {role === "technicien" && (
            <SearchableDropdown
              value={form.specialite || "all"}
              onChange={(v) => setForm(f => ({ ...f, specialite: v === "all" ? "" : v }))}
              options={SPECIALITES}
              placeholder="🔧 Spécialité *"
              allLabel="🔧 Toutes les spécialités"
            />
          )}

          <div className="relative group">
            <Phone className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input type="tel" name="telephone" placeholder="Téléphone (ex: 0612345678)" value={form.telephone} onChange={handleChange} maxLength={10}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300" />
          </div>

          <DatePicker
            label="Date de naissance"
            icon={<Calendar1 className="pr-2" />}
            value={form.dateNaissance}
            onChange={(v) => setForm(f => ({ ...f, dateNaissance: v }))}
            maxYear={new Date().getFullYear() - 16}
            minYear={new Date().getFullYear() - 100}
          />

          <p className="text-xs text-white/25 text-center px-2 mt-1">
            En créant un compte, vous acceptez nos{" "}
            <span className="text-violet-400/70 hover:text-violet-400 cursor-pointer transition-colors">conditions d'utilisation</span>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3.5 mt-1 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,181,253,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                Création en cours...
              </span>
            ) : `Créer mon compte en tant que ${role} →`}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-white/30">
          Déjà un compte ?{" "}
          <span onClick={() => navigate("/login")} className="text-violet-400 hover:text-violet-300 cursor-pointer font-medium transition-colors">
            Se connecter
          </span>
        </p>
      </div>
    </div>
  );
}
