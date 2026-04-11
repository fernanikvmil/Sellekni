import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant.");
      return;
    }
    fetch(`/api/verify-email?token=${token}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Lien invalide ou déjà utilisé.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Erreur de connexion au serveur.");
      });
  }, []);

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes floatUp { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        .fade-up { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) forwards; }
        .spinner { animation: spin 0.75s linear infinite; }
        .float { animation: floatUp 3s ease-in-out infinite; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none [background-image:linear-gradient(rgba(139,92,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.06)_1px,transparent_1px)] [background-size:60px_60px]" />
      <div className="fixed top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      <div className="fade-up relative z-10 flex flex-col items-center gap-8">

        {isLoading && (
          <div className="welcome-card items-center justify-center text-center">
            <span className="spinner w-10 h-10 border-2 border-violet-400/30 border-t-violet-400 rounded-full inline-block mb-4" />
            <p className="text-white text-xl font-black">Vérification…</p>
            <p className="text-white/40 text-sm">Veuillez patienter</p>
          </div>
        )}

        {isSuccess && (
          <div className="group relative w-[300px] h-[420px] p-[5px] rounded-2xl float"
            style={{ background: "linear-gradient(to left, #4ade80, #059669)", zIndex: 1 }}>
            {/* Glow — disparaît au hover */}
            <div className="absolute top-[30px] left-0 right-0 w-full h-full -z-10 scale-[0.8] blur-[25px] transition-opacity duration-500 group-hover:opacity-0 rounded-2xl"
              style={{ background: "linear-gradient(to left, #4ade80, #059669)" }} />
            {/* Inner card */}
            <div className="w-full h-full bg-[#0f0f0f] rounded-xl flex flex-col items-center justify-center gap-5 p-7">
              {/* Checkmark */}
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(74,222,128,0.3)]">
                <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              {/* Titre */}
              <div className="text-center">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Email vérifié ✓</p>
                <p className="text-white group-hover:text-green-400 transition-colors duration-1000 text-4xl font-black leading-tight tracking-tight">
                  Bienvenue<br/>dans<br/>sellekni
                </p>
              </div>
              {/* Séparateur */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
              {/* Sous-titre */}
              <p className="text-white/40 text-xs text-center leading-relaxed">
                Votre compte est maintenant actif.<br/>Connectez-vous pour commencer.
              </p>
              {/* Bouton */}
              <button onClick={() => navigate("/login")} className="auth-btn !block w-full text-center">
                Se connecter →
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="relative w-[320px] min-h-[380px] bg-[#0a0a0f] rounded-2xl flex flex-col justify-end p-7 gap-3">
            <div className="absolute -inset-[3px] rounded-[18px] bg-gradient-to-br from-red-500 via-rose-400 to-orange-400 -z-10 pointer-events-none" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 -z-10 scale-95 blur-xl opacity-70" />
            <div className="absolute top-5 right-6 text-red-400/40 text-xl">✦</div>
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
            <p className="text-white/50 text-xs font-medium tracking-widest uppercase">Bienvenue sur</p>
            <p className="text-white text-2xl font-black bg-gradient-to-r from-red-300 to-rose-400 bg-clip-text text-transparent">sellekni 🛠️</p>
            <div className="h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent my-1" />
            <p className="text-white/50 text-sm leading-relaxed">Ce lien a déjà été utilisé ou a expiré. Inscrivez-vous à nouveau pour en recevoir un nouveau.</p>
            <div className="mt-2">
              <button onClick={() => navigate("/signin")} className="auth-btn w-full !block text-center">
                Retour à l'inscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
