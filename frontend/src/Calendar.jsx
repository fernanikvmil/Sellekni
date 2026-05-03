import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function CustomDropdown({ value, onChange, options = [] }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  React.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedRef = React.useRef(null);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  React.useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all duration-150"
        style={{
          background: open ? "rgba(196,181,253,0.12)" : "rgba(196,181,253,0.07)",
          border: open ? "1px solid rgba(196,181,253,0.4)" : "1px solid rgba(196,181,253,0.15)",
          color: open ? "#C4B5FD" : "rgba(255,255,255,0.85)",
          boxShadow: open ? "0 0 0 2px rgba(196,181,253,0.08)" : "none",
        }}
      >
        <span>{selected?.label}</span>
        <ChevronDown
          className="w-3 h-3 transition-transform duration-200"
          style={{
            color: open ? "#C4B5FD" : "rgba(196,181,253,0.4)",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-1.5 z-[500] rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #0d0425 0%, #0A031E 100%)",
            border: "1px solid rgba(196,181,253,0.18)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.9), inset 0 1px 0 rgba(196,181,253,0.06)",
            minWidth: 120,
          }}
        >
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: 180,
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(196,181,253,0.2) transparent",
            }}
          >
            {options.map((opt) => {
              const isActive = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  ref={isActive ? selectedRef : null}
                  type="button"
                  onClick={() => {
                    onChange({ target: { value: opt.value } });
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs capitalize transition-colors duration-100 flex items-center gap-2"
                  style={{
                    background: isActive ? "rgba(196,181,253,0.12)" : "transparent",
                    color: isActive ? "#C4B5FD" : "rgba(255,255,255,0.55)",
                    fontWeight: isActive ? 700 : 400,
                    borderLeft: isActive ? "2px solid rgba(196,181,253,0.6)" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(196,181,253,0.06)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                    }
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4 bg-[#0A031E] border border-[#C4B5FD]/[0.12] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(196,181,253,0.04)] select-none",
        className
      )}
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        month_caption: "flex items-center h-10 mb-1",
        caption_label: "hidden",
        nav: "contents",
        button_previous: "order-first w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white border border-[#C4B5FD]/10 hover:border-[#C4B5FD]/20 hover:bg-[#C4B5FD]/[0.07] transition-all active:scale-90",
        button_next: "order-last w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white border border-[#C4B5FD]/10 hover:border-[#C4B5FD]/20 hover:bg-[#C4B5FD]/[0.07] transition-all active:scale-90",
        dropdowns: "flex items-center gap-2 flex-1 justify-center",
        dropdown_root: "relative",
        dropdown: "flex items-center",
        dropdown_label: "hidden",
        months_dropdown: "hidden",
        years_dropdown: "hidden",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-[#C4B5FD]/30 w-9 h-8 font-semibold text-[0.6rem] uppercase tracking-widest text-center flex items-center justify-center",
        week: "flex w-full mt-0.5",
        day: "relative w-9 h-9 p-0 text-center text-sm",
        day_button: "w-9 h-9 rounded-full font-medium transition-all duration-150 text-white/65 hover:text-white hover:bg-[#C4B5FD]/[0.1] focus:outline-none active:scale-90",
        selected: "!bg-[#C4B5FD] !text-[#0E0520] rounded-full shadow-[0_4px_14px_rgba(196,181,253,0.25)] font-bold",
        today: "text-[#8B5CF6] font-bold",
        outside: "text-white/20 opacity-40",
        disabled: "text-white/15 opacity-20 cursor-not-allowed pointer-events-none",
        range_start: "!bg-[#C4B5FD] !text-[#0E0520] rounded-full font-bold",
        range_end: "!bg-[#C4B5FD] !text-[#0E0520] rounded-full font-bold",
        range_middle: "bg-[#C4B5FD]/[0.08] text-[#C4B5FD]/80 rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-3.5 w-3.5" />;
        },
        Dropdown: CustomDropdown,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";
export default Calendar;
