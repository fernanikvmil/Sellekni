import { Lock, Mail, Eye, EyeOff, KeyRound, Check, SquareCheckBig } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const STYLES = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
  @keyframes ping-slow { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.5);opacity:0} }
  .fade-up   { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) forwards; }
  .do-shake  { animation: shake 0.5s ease; }
  .ping-slow { animation: ping-slow 2s ease-out infinite; }
`;

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Étape courante : 1 = email, 2 = code, 3 = nouveau mdp, 4 = succès
  const [step, setStep]       = useState(1);
  const [email, setEmail]     = useState("");
  const [code, setCode]       = useState(["", "", "", "", "", ""]);
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [shake, setShake]       = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  // Focus sur le 1er champ du code à l'arrivée à l'étape 2
  useEffect(() => {
    if (step === 2) setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [step]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // ── ÉTAPE 1 : envoyer l'email ──────────────────────────────────────────────
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) { triggerShake(); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); triggerShake(); }
      else { setStep(2); startCountdown(); }
    } catch {
      setError("Erreur de connexion au serveur");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── ÉTAPE 2 : vérifier le code ────────────────────────────────────────────
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // chiffres uniquement
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Entrez les 6 chiffres du code.");
      triggerShake();
      return;
    }
    // On ne valide pas le code côté serveur séparément :
    // il sera validé à l'étape 3 avec le nouveau mot de passe
    setStep(3);
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError("");
    try {
      const res = await fetch("/api/auth/resend-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        startCountdown();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Erreur lors du renvoi du code.");
    }
  };

  // ── ÉTAPE 3 : nouveau mot de passe ────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    const pwdRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!pwdRegex.test(password)) {
      setError("6 caractères min, une majuscule et un caractère spécial.");
      triggerShake();
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.join(""), newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        triggerShake();
        // Si le code est invalide ou expiré → retour à l'étape 2
        if (data.message?.includes("Code")) setStep(2);
      } else {
        setStep(4);
      }
    } catch {
      setError("Erreur de connexion au serveur");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Indicateur de progression ─────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step > s
              ? "bg-violet-600 text-white"
              : step === s
              ? "bg-violet-600/30 border border-violet-500 text-violet-300"
              : "bg-white/5 border border-white/10 text-white/20"
          }`}>
            {step > s ? <Check size={13} /> : s}
          </div>
          {s < 3 && (
            <div className={`w-10 h-0.5 rounded transition-all duration-500 ${step > s ? "bg-violet-600" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );

  const cardClass = `relative z-10 lg:w-100 w-90 px-10 py-10 bg-white/3 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-[0_0_0_1px_rgba(196,181,253,0.12),0_40px_80px_rgba(0,0,0,0.55)] ${mounted ? "fade-up" : "opacity-0"} ${shake ? "do-shake" : ""}`;
  const topLine  = <div className="absolute top-0 left-[20%] right-[20%] h-0.5 rounded-b bg-linear-to-r from-transparent via-violet-600 to-transparent" />;

  // ── SUCCÈS ────────────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center relative">
        <style>{STYLES}</style>
        <div className="absolute -top-20 -left-20 w-100 h-100 rounded-full bg-violet-600/20 blur-[80px] animate-pulse" />
        <div className="relative z-10 lg:w-100 w-90 px-10 py-11 bg-white/3 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-[0_0_0_1px_rgba(196,181,253,0.12),0_40px_80px_rgba(0,0,0,0.55)] fade-up flex flex-col items-center text-center">
          {topLine}
          <div className="w-16 h-16 flex items-center justify-center bg-linear-to-br from-green-600/30 to-emerald-500/20 border border-green-500/30 rounded-2xl mb-6">
            <Check size={35} className="text-green-400" />
          </div>
          <h2 className="text-white text-2xl font-black tracking-tight mb-2">Mot de passe mis à jour !</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Votre mot de passe a été réinitialisé avec succès.<br />
            Vous pouvez maintenant vous connecter.
          </p>
          <button onClick={() => navigate("/login")}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 transition-all duration-300 cursor-pointer">
            Se connecter →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center overflow-hidden relative">
      <style>{STYLES}</style>
      <div className="absolute -top-20 -left-20 w-100 h-100 rounded-full bg-violet-600/20 blur-[80px] animate-pulse" />
      <div className="absolute -bottom-15 -right-15 w-87.5 h-87.5 rounded-full bg-pink-500/15 blur-[80px] animate-pulse" />

      <div className={cardClass}>
        {topLine}

        {/* Icône + titre */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-14 h-14 flex items-center justify-center bg-linear-to-br from-violet-600/30 to-pink-500/20 border border-violet-600/30 rounded-2xl mb-4">
            <div className="ping-slow absolute inset-0 rounded-2xl border border-violet-600/30" />
            {step === 1 && <Mail color="#FFFFFFAD" />}
            {step === 2 && <span className="text-2xl">📧</span>}
            {step === 3 && <Lock color="#FFFFFFAD" />}
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">
            {step === 1 && "Mot de passe oublié"}
            {step === 2 && "Vérification"}
            {step === 3 && "Nouveau mot de passe"}
          </h1>
          <p className="text-white/40 text-sm mt-1 font-light text-center">
            {step === 1 && "Entrez votre email pour recevoir un code"}
            {step === 2 && <>Code envoyé à <span className="text-violet-400">{email}</span></>}
            {step === 3 && "Choisissez un mot de passe sécurisé"}
          </p>
        </div>

        {/* Indicateur de progression */}
        <StepIndicator />

        {/* Message d'erreur */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center mb-3">
            {error}
          </div>
        )}

        {/* ── ÉTAPE 1 : Email ── */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-3">
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors pointer-events-none" />
              <input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 mt-1 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,181,253,0.4)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer">
              {loading
                ? <span className="flex items-center justify-center gap-2.5"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />Envoi...</span>
                : "Envoyer le code →"}
            </button>
          </form>
        )}

        {/* ── ÉTAPE 2 : Code 6 chiffres ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
            <div className="flex justify-center gap-2">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-13 text-center text-xl font-bold bg-white/4 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-600/20 transition-all"
                />
              ))}
            </div>
            <button type="submit"
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,181,253,0.4)] transition-all duration-300 cursor-pointer">
              Vérifier le code →
            </button>
            <div className="text-center">
              <button type="button" onClick={handleResend} disabled={countdown > 0}
                className="text-white/40 text-sm hover:text-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {countdown > 0 ? `Renvoyer dans ${countdown}s` : "Renvoyer le code"}
              </button>
            </div>
            <button type="button" onClick={() => { setStep(1); setCode(["","","","","",""]); setError(""); }}
              className="text-center text-xs text-white/25 hover:text-white/50 transition-colors">
              ← Changer d'email
            </button>
          </form>
        )}

        {/* ── ÉTAPE 3 : Nouveau mot de passe ── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l pl-2 h-full border-white/8">
                {showPassword ? <EyeOff size={19} color="#FFFFFF4D" /> : <Eye size={19} color="#FFFFFF4D" />}
              </button>
            </div>
            <div className="relative group">
              <KeyRound className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors pointer-events-none" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border focus:outline-none focus:ring-2 transition-all duration-300 ${
                  confirm && password !== confirm
                    ? "border-red-500/50 focus:border-red-500/60 focus:ring-red-600/15"
                    : confirm && password === confirm
                    ? "border-green-500/50 focus:border-green-500/60 focus:ring-green-600/15"
                    : "border-white/8 focus:border-violet-600/60 focus:ring-violet-600/15"
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l pl-2 h-full border-white/8">
                {showConfirm ? <EyeOff size={19} color="#FFFFFF4D" /> : <Eye size={19} color="#FFFFFF4D" />}
              </button>
            </div>
            <p className="text-xs text-white/25 text-center px-2">
              Au moins 6 caractères, une majuscule et un caractère spécial
            </p>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 mt-1 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,181,253,0.4)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer">
              {loading
                ? <span className="flex items-center justify-center gap-2.5"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />Mise à jour...</span>
                : "Réinitialiser le mot de passe →"}
            </button>
          </form>
        )}

        {/* Lien retour connexion */}
        {step !== 4 && (
          <p className="text-center mt-6 text-sm text-white/30">
            Vous vous souvenez ?{" "}
            <span onClick={() => navigate("/login")}
              className="text-violet-400 hover:text-violet-300 cursor-pointer font-medium transition-colors">
              Se connecter
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
