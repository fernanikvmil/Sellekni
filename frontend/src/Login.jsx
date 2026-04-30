
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setUnverifiedEmail("");

  if (!email || !password) {
    setShake(true);
    setTimeout(() => setShake(false), 500);
    return;
  }

  setLoading(true);
  try {
    const res = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 403) {
        setUnverifiedEmail(email);
      } else {
        setError(data.message);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } else {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.adminToken) {
        localStorage.setItem("adminToken", data.adminToken);
        localStorage.setItem("isSuperAdmin", data.isSuperAdmin ? "true" : "false");
      }
      navigate("/");
    }
  } catch {
    setError("Erreur de connexion au serveur");
    setShake(true);
    setTimeout(() => setShake(false), 500);
  } finally {
    setLoading(false);
  }
};

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const res = await fetch(`/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      if (res.ok) setResendSuccess(true);
    } catch {
      setError("Erreur lors du renvoi.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden relative">

      <div className="absolute -top-20 -left-20 w-100 h-100 rounded-full bg-violet-600/20 blur-[80px] animate-pulse" />
      <div className="absolute -bottom-15 -right-15 w-87.5 h-87.5 rounded-full bg-pink-500/15 blur-[80px] animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/3 w-62.5 h-62.5 rounded-full bg-violet-500/10 blur-[60px] animate-pulse delay-500" />

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
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping-slow {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .fade-up   { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) forwards; }
        .do-shake  { animation: shake 0.5s ease; }
        .spinner   { animation: spin 0.75s linear infinite; }
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
          <img src="/logo.png" alt="Sellekni" className="w-28 h-28 object-contain mb-3" />
          <h1 className="text-white text-3xl font-black tracking-tight mb-1">Se connecter</h1>
          <p className="text-white/40 text-sm font-light">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {unverifiedEmail && (
            <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm text-center space-y-2">
              <p>📭 Votre email n'est pas encore vérifié.</p>
              {resendSuccess ? (
                <p className="text-green-400 text-xs">✅ Email envoyé ! Vérifiez votre boîte.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-xs underline text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                >
                  {resendLoading ? "Envoi en cours..." : "Renvoyer le lien de vérification"}
                </button>
              )}
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 pr-2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors text-sm pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/4 border border-white/8 focus:outline-none focus:bg-violet-600/10 focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/15 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
            >
              {showPassword
                ? <Eye size={19} color="#FFFFFF4D" className="hover:cursor-pointer" />
                : <EyeOff size={19} color="#FFFFFF4D" className="hover:cursor-pointer" />}
            </button>
          </div>

          <div className="text-right -mt-1">
            <span
              className="text-xs text-violet-400/70 hover:text-violet-400 cursor-pointer transition-colors"
              onClick={() => navigate('/forgot-password')}
            >
              Mot de passe oublié ?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3.5 mt-1 rounded-xl font-semibold text-sm text-white bg-linear-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,181,253,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                Connexion en cours...
              </span>
            ) : "Se connecter →"}
          </button>
        </form>

        <p className="text-center mt-7 text-sm text-white/30">
          Pas encore de compte ?{" "}
          <span
            onClick={() => navigate("/signin")}
            className="text-violet-400 hover:text-violet-300 cursor-pointer font-medium transition-colors"
          >
            Créer un compte
          </span>
        </p>
      </div>
    </div>
  );
}