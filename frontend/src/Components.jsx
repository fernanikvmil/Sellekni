// ── Composants réutilisables ──
import { useState, useEffect, useRef } from "react";

export function SearchableDropdown({ value, onChange, options, placeholder, allLabel, numbered }) {
  const [query, setQuery] = useState(value === "all" ? "" : value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (val) => { setQuery(val); onChange(val); setOpen(false); };
  const clear  = () => { setQuery(""); onChange("all"); setOpen(false); };
  const handleInput = (e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange("all"); };

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-200 cursor-text ${
          open
            ? "bg-violet-600/10 border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            : "bg-white/[0.04] border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.06]"
        }`}
      >
        <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${open ? "text-violet-400" : "text-white/25"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-white/25 text-sm focus:outline-none min-w-0"
        />
        {query ? (
          <button type="button" onClick={e => { e.stopPropagation(); clear(); }}
            className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/40 hover:text-white text-[9px] transition-all flex-shrink-0">✕</button>
        ) : (
          <svg className={`w-3 h-3 flex-shrink-0 transition-all duration-200 ${open ? "rotate-180 text-violet-400" : "text-white/20"}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-[500]"
          style={{
            background: "linear-gradient(180deg, #0E0530 0%, #07021A 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 28px 80px rgba(0,0,0,0.95), 0 0 0 1px rgba(196,181,253,0.04), inset 0 1px 0 rgba(196,181,253,0.06)",
          }}>

          <div onMouseDown={clear}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-violet-600/[0.12] group"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600/20 group-hover:border-violet-600/30 transition-all">
              <svg className="w-3 h-3 text-white/30 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <span className="text-sm text-white/50 group-hover:text-violet-300 transition-colors font-medium">{allLabel}</span>
          </div>

          <div className="overflow-y-auto max-h-52" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.3) transparent" }}>
            {filtered.length > 0 ? filtered.map(opt => {
              const idx = options.indexOf(opt);
              const isSelected = opt === value;
              return (
                <div key={opt} onMouseDown={() => select(opt)}
                  className={`relative flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150 ${
                    isSelected ? "bg-violet-600/[0.18] text-violet-200" : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                  }`}>
                  {isSelected && <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-violet-500" />}
                  {numbered && (
                    <span className={`text-[10px] w-5 text-center flex-shrink-0 font-mono tabular-nums ${isSelected ? "text-violet-400/70" : "text-white/20"}`}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  )}
                  <span className={`flex-1 text-sm truncate ${isSelected ? "font-semibold" : ""}`}>{opt}</span>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </div>
              );
            }) : (
              <div className="flex flex-col items-center py-8 gap-2">
                <span className="text-2xl opacity-20">🔍</span>
                <p className="text-sm text-white/25">Aucun résultat</p>
              </div>
            )}
          </div>

          {filtered.length > 0 && (
            <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[10px] text-white/20">{filtered.length} option{filtered.length > 1 ? "s" : ""}</span>
              {value !== "all" && (
                <button onMouseDown={clear} className="text-[10px] text-violet-400/50 hover:text-violet-400 transition-colors">Effacer ✕</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AuthBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="auth-btn">
      {children}
    </button>
  );
}

export function AlerteModeration({ violations, onClose }) {
  const [visible, setVisible] = useState(true);

  if (!visible || !violations || violations.length === 0) return null;

  const getIcon = (violation) => {
    if (violation.includes('nudité')) return '🔞';
    if (violation.includes('suggestif')) return '🔥';
    if (violation.includes('drogue')) return '💊';
    if (violation.includes('arme')) return '🔫';
    if (violation.includes('violence')) return '⚔️';
    if (violation.includes('sexy')) return '😈';
    return '⚠️';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setVisible(false); onClose?.(); }} />
      <div className="relative bg-gradient-to-br from-red-900/95 to-red-950/95 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-bold text-white mb-2">Image Refusée</h3>
          <p className="text-red-300 text-sm mb-4">
            Votre image a été détectée comme contenant du contenu inapproprié :
          </p>
          <div className="space-y-2 mb-6">
            {violations.map((v, i) => (
              <div key={i} className="flex items-center gap-3 bg-red-500/20 rounded-lg px-4 py-2 text-left">
                <span className="text-xl">{getIcon(v)}</span>
                <span className="text-white text-sm">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-white/50 text-xs mb-4">
            Les images contenant de la nudité, du contenu suggestif, des armes,
            de la drogue ou de la violence ne sont pas autorisées.
          </p>
          <button
            onClick={() => { setVisible(false); onClose?.(); }}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}
