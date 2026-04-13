import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VerificationModal from "./VerificationModal";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          setVerificationData({ userId: data.userId, email });
        } else {
          setError(data.message);
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {verificationData && (
      <VerificationModal
        userId={verificationData.userId}
        email={verificationData.email}
        onSuccess={() => { setVerificationData(null); navigate("/login"); }}
        onClose={() => setVerificationData(null)}
      />
    )}
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden relative">

      <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[80px] animate-pulse" />
      <div className="absolute bottom-[-60px] right-[-60px] w-[350px] h-[350px] rounded-full bg-pink-500/15 blur-[80px] animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full bg-blue-500/10 blur-[60px] animate-pulse delay-500" />

      <div
        className="absolute inset-0 opacity-30 pointer-events-none [background-image:linear-gradient(rgba(139,92,246,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.07)_1px,transparent_1px)] [background-size:60px_60px]"
      />

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

      <div
        className={`
          relative z-10 w-[400px] px-10 py-11
          bg-white/[0.03] backdrop-blur-2xl
          border border-white/[0.08] rounded-3xl
          shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_40px_80px_rgba(0,0,0,0.55)]
          ${mounted ? "fade-up" : "opacity-0"}
          ${shake ? "do-shake" : ""}
        `}
      >
        <div className="absolute top-0 left-[20%] right-[20%] h-[2px] rounded-b bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <div className="relative w-14 h-14 flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-500/20 border border-purple-500/30 rounded-2xl mb-5">
            <div className="ping-slow absolute inset-0 rounded-2xl border border-purple-500/30" />
            <span className="text-2xl">🛠️</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight">sellekni</h1>
          <p className="text-white/40 text-sm mt-1 font-light">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">

          {/* Message d'erreur */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors text-sm pointer-events-none">
              ✉️
            </span>
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:bg-purple-500/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300"
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors text-sm pointer-events-none">
              🔒
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:bg-purple-500/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors text-xs"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Forgot */}
          <div className="text-right -mt-1">
            <span className="text-xs text-purple-400/70 hover:text-purple-400 cursor-pointer transition-colors">
              Mot de passe oublié ?
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3.5 mt-1 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                Connexion en cours...
              </span>
            ) : (
              "Se connecter →"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-xs text-white/25 font-light">ou continuer avec</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <p className="text-center mt-7 text-sm text-white/30">
          Pas encore de compte ?{" "}
          <span
            onClick={() => navigate("/signin")}
            className="text-purple-400 hover:text-purple-300 cursor-pointer font-medium transition-colors"
          >
            Créer un compte
          </span>
        </p>
      </div>
    </div>
    </>
  );
}