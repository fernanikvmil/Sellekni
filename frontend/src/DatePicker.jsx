import { useState, useRef, useEffect } from "react";
import { Calendar } from "./Calendar";

function formatDisplay(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return dateStr; }
}

function toDateObj(str) {
  if (!str) return undefined;
  try { return new Date(str + "T00:00:00"); } catch { return undefined; }
}

function toDateString(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dy}`;
}

export default function AppDatePicker({
  value,
  onChange,
  minYear,
  maxYear,
  label,
  icon = "📅",
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const fromYear = minYear || 1920;
  const toYear = maxYear || currentYear;

  const selectedDate = toDateObj(value);
  const displayText = formatDisplay(value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 360);
    }
    setOpen(!open);
  };

  const handleSelect = (date) => {
    if (date) {
      onChange?.(toDateString(date));
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(196,181,253,0.4)" }}>
          <span className="text-sm">{typeof icon === "string" ? icon : ""}</span>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center gap-2.5 px-3.5 py-3.5 rounded-xl border transition-all duration-200 text-sm text-left`}
        style={open
          ? { background: "rgba(196,181,253,0.06)", border: "1px solid rgba(196,181,253,0.3)", boxShadow: "0 0 0 2px rgba(196,181,253,0.08)" }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(196,181,253,0.08)" }
        }
      >
        {typeof icon !== "string" && (
          <span className="text-white/30 flex-shrink-0">{icon}</span>
        )}
        <span className="flex-1" style={{ color: displayText ? "#C4B5FD" : "rgba(196,181,253,0.25)" }}>
          {displayText || "Sélectionner une date"}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200`}
          style={{ color: open ? "#C4B5FD" : "rgba(196,181,253,0.25)", transform: open ? "rotate(180deg)" : "none" }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Calendar popover */}
      {open && (
        <div
          className={`absolute z-[300] left-0 ${openUp ? "bottom-full mb-2" : "top-full mt-2"}`}
          style={{ minWidth: 300 }}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate || new Date(Math.min(toYear - 2, 1990), 0, 1)}
            fromYear={fromYear}
            toYear={toYear}
            captionLayout="dropdown"
            classNames={{
              caption_label: "hidden",
            }}
          />
        </div>
      )}
    </div>
  );
}
