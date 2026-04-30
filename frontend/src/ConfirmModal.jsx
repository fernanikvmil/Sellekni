import { useEffect, useRef, useState } from "react";

/**
 * ConfirmModal – panneau de confirmation stylisé
 *
 * Props:
 *   open         {boolean}   – afficher ou non
 *   title        {string}    – titre du panneau
 *   message      {string}    – message descriptif
 *   confirmLabel {string}    – texte du bouton de confirmation (défaut : "Confirmer")
 *   cancelLabel  {string}    – texte du bouton annuler       (défaut : "Annuler")
 *   danger       {boolean}   – bouton confirm en rouge (défaut true)
 *   requirePassword {boolean} – affiche un champ mot de passe et le passe à onConfirm
 *   onConfirm    {function}  – appelé avec (password?) à la confirmation
 *   onCancel     {function}  – appelé à l'annulation / clic backdrop
 */
export default function ConfirmModal({
  open,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr ?",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = true,
  requirePassword = false,
  onConfirm,
  onCancel,
}) {
  const [password, setPassword] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (requirePassword && !password.trim()) return;
    onConfirm(requirePassword ? password : undefined);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  const handleKey = (e) => {
    if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={handleBackdropClick}
      onKeyDown={handleKey}
      tabIndex={-1}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(13,3,30,0.92)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,181,253,0.18) inset, 0 0 60px rgba(139,92,246,0.12)",
          animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Shimmer overlay */}
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.05) 100%)",
          }}
        />
        {/* Gradient border */}
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "1rem", padding: "1px",
            zIndex: 2, pointerEvents: "none",
            background:
              "linear-gradient(135deg, rgba(196,181,253,0.5) 0%, rgba(196,181,253,0.06) 50%, rgba(139,92,246,0.35) 100%)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-7">
          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0"
              style={{
                background: danger
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(196,181,253,0.12)",
                border: `1px solid ${danger ? "rgba(239,68,68,0.35)" : "rgba(196,181,253,0.3)"}`,
              }}
            >
              <span className="text-xl">{danger ? "🗑️" : "⚠️"}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>

          {/* Message */}
          <p className="text-sm text-white/60 leading-relaxed mb-5 pl-14">
            {message}
          </p>

          {/* Optional password input */}
          {requirePassword && (
            <div className="mb-5">
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe…"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                style={{
                  background: "rgba(196,181,253,0.06)",
                  border: "1px solid rgba(196,181,253,0.2)",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(196,181,253,0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(196,181,253,0.2)")
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm(e);
                }}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "rgba(196,181,253,0.06)",
                border: "1px solid rgba(196,181,253,0.18)",
                color: "rgba(196,181,253,0.75)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(196,181,253,0.12)";
                e.currentTarget.style.color = "#C4B5FD";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(196,181,253,0.06)";
                e.currentTarget.style.color = "rgba(196,181,253,0.75)";
              }}
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={requirePassword && !password.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: danger
                  ? "rgba(239,68,68,0.18)"
                  : "rgba(139,92,246,0.25)",
                border: `1px solid ${danger ? "rgba(239,68,68,0.4)" : "rgba(139,92,246,0.5)"}`,
                color: danger ? "#fca5a5" : "#C4B5FD",
              }}
              onMouseEnter={(e) => {
                if (requirePassword && !password.trim()) return;
                e.currentTarget.style.background = danger
                  ? "rgba(239,68,68,0.32)"
                  : "rgba(139,92,246,0.4)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = danger
                  ? "rgba(239,68,68,0.18)"
                  : "rgba(139,92,246,0.25)";
                e.currentTarget.style.color = danger ? "#fca5a5" : "#C4B5FD";
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframe */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
