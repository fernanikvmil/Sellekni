import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Check, KeyRound, Lock } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const pwdRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!pwdRegex.test(password)) {
      setError("Le mot de passe doit contenir au moins 6 caractères, une majuscule et un caractère spécial.");
      setShake(true); setTimeout(() => setShake(false), 500);
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      setShake(true); setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        setShake(true); setTimeout(() => setShake(false), 500);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Erreur de connexion au serveur");
      setShake(true); setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center relative">
        <div className="absolute -top-20 -left-20 w-100 h-100 rounded-full bg-violet-600/20 blur-[80px] animate-pulse" />
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.65s cubic-bezier(.22,1,.36,1) forwards}`}</style>
        <div className="relative z-10 w-100 px-10 py-11 bg-white/3 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-[0_0_0_1px_rgba(196,181,253,0.12),0_40px_80px_rgba(0,0,0,0.55)] fade-up flex flex-col items-center text-center">
          <div className="absolute top-0 left-[20%] right-[20%] h-0.5 rounded-b bg-linear-to-r from-transparent via-violet-600 to-transparent" />
          <div className="w-16 h-16 flex items-center justify-center bg-linear-to-br from-green-600/30 to-emerald-500/20 border border-green-500/30 rounded-2xl mb-6">
            <Check size={35} className="text-green-400" />
          </div>
          <h2 className="text-white text-2xl font-black tracking-tight mb-2">Mot de passe mis à jour !</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Votre mot de passe a été réinitialisé avec succès.<br />
            Vous pouvez maintenant vous connecter.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 transition-all duration-300 hover:cursor-pointer"
          >
            Se connecter →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center overflow-hidden relative">
      <div className="absolute -top-20 -left-20 w-100 h-100 rounded-full bg-violet-600/20 blur-[80px] animate-pulse" />
      <div className="absolute -bottom-15 -right-15 w-87.5 h-87.5 rounded-full bg-pink-500/15 blur-[80px] animate-pulse" />

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
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .fade-up   { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) forwards; }
        .do-shake  { animation: shake 0.5s ease; }
        .ping-slow { animation: ping-slow 2s ease-out infinite; }
      `}</style>

      <div className={`
        relative z-10 lg:w-100 w-90 px-10 py-11
        bg-white/3 backdrop-blur-2xl
        border border-white/8 rounded-3xl
        shadow-[0_0_0_1px_rgba(196,181,253,0.12),0_40px_80px_rgba(0,0,0,0.55)]
        ${mounted ? "fade-up" : "opacity-0"}
        ${shake ? "do-shake" : ""}
      `}>
        <div className="absolute top-0 left-[20%] right-[20%] h-0.5 rounded-b bg-linear-to-r from-transparent via-violet-600 to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <div className="relative w-14 h-14 flex items-center justify-center bg-linear-to-br from-violet-600/30 to-pink-500/20 border border-violet-600/30 rounded-2xl mb-5">
            <div className="ping-slow absolute inset-0 rounded-2xl border border-violet-600/30" />
            <Lock color="#FFFFFFAD" />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">Nouveau mot de passe</h1>
          <p className="text-white/40 text-sm mt-1 font-light">Choisissez un mot de passe sécurisé</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l pl-2 h-full border-white/8">
              {showPassword ? <EyeOff size={19} color="#FFFFFF4D" className="cursor-pointer" /> : <Eye size={19} color="#FFFFFF4D" className="cursor-pointer" />}
            </button>
          </div>

          <div className="relative group">
            <KeyRound className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border focus:outline-none focus:bg-violet-600/10 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300 ${
                confirm && password !== confirm
                  ? "border-red-500/50 focus:border-red-500/60"
                  : confirm && password === confirm
                  ? "border-green-500/50 focus:border-green-500/60"
                  : "border-white/8 focus:border-violet-600/60"
              }`}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 border-l pl-2 h-full border-white/8">
              {showConfirm ? <EyeOff size={19} color="#FFFFFF4D" className="cursor-pointer" /> : <Eye size={19} color="#FFFFFF4D" className="cursor-pointer" />}
            </button>
          </div>

          <p className="text-xs text-white/25 text-center px-2">
            Au moins 6 caractères, une majuscule et un caractère spécial
          </p>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3.5 mt-1 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,181,253,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                Mise à jour...
              </span>
            ) : "Réinitialiser le mot de passe →"}
          </button>
        </form>
      </div>
    </div>
  );
}
