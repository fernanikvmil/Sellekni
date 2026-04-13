import { useState, useEffect, useRef } from "react";

export default function VerificationModal({ userId, email, onSuccess, onClose }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleCodeChange = (index, value) => {
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setMessage("Veuillez entrer le code complet à 6 chiffres");
      return;
    }

    setStatus("verifying");
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: fullCode })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
        setTimeout(() => onSuccess(), 2000);
      } else {
        setStatus("error");
        setMessage(data.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Erreur de connexion au serveur");
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setCountdown(60);
    try {
      const response = await fetch("/api/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Nouveau code envoyé ! Vérifiez votre email.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Erreur lors du renvoi du code");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-[450px] max-w-[calc(100vw-2rem)] bg-[#0a0a0f] rounded-2xl p-8">
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 -z-10 pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-500/20 border border-purple-500/30 rounded-2xl">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Vérification par code
          </h2>
          <p className="text-white/50 text-sm mt-2">
            Entrez le code à 6 chiffres envoyé à<br/>
            <span className="text-purple-400 font-medium">{email}</span>
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold bg-[#1a1a2e] border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          ))}
        </div>

        {message && (
          <div className={`text-center text-sm mb-4 p-3 rounded-lg ${
            status === "success" ? "bg-green-500/10 text-green-400" :
            status === "error"   ? "bg-red-500/10 text-red-400" :
            "bg-purple-500/10 text-purple-400"
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={status === "verifying"}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "verifying" ? "Vérification..." : "Vérifier"}
        </button>

        <div className="text-center mt-4">
          <button
            onClick={handleResendCode}
            disabled={countdown > 0}
            className="text-white/40 text-sm hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `Renvoyer dans ${countdown}s` : "Renvoyer le code"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
