import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function CustomDropdown({ value, onChange, children }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  const options = React.Children.toArray(children).map((child) => ({
    value: child.props.value,
    label: child.props.children,
  }));

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
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium capitalize cursor-pointer transition-all duration-150"
        style={{
          background: "rgba(196,181,253,0.06)",
          border: open ? "1px solid rgba(196,181,253,0.35)" : "1px solid rgba(196,181,253,0.12)",
          color: "rgba(255,255,255,0.9)",
        }}
      >
        <span>{selected?.label}</span>
        <ChevronDown
          className="w-3 h-3 transition-transform duration-150"
          style={{
            color: "rgba(196,181,253,0.5)",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 z-[500] rounded-xl overflow-y-auto"
          style={{
            background: "#0A031E",
            border: "1px solid rgba(196,181,253,0.15)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.85)",
            maxHeight: 200,
            minWidth: 110,
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
                className="w-full text-left px-3 py-1.5 text-xs capitalize transition-all duration-100"
                style={{
                  background: isActive ? "rgba(196,181,253,0.15)" : "transparent",
                  color: isActive ? "#C4B5FD" : "rgba(255,255,255,0.65)",
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                {opt.label}
              </button>
            );
          })}
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
        month_caption: "flex justify-center items-center h-10 relative mb-1",
        caption_label: "text-sm font-bold tracking-tight text-white/90 capitalize hidden",
        nav: "absolute inset-x-0 top-0 h-10 flex items-center justify-between pointer-events-none",
        button_previous: "pointer-events-auto w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white border border-[#C4B5FD]/10 hover:border-[#C4B5FD]/20 hover:bg-[#C4B5FD]/[0.07] transition-all active:scale-90",
        button_next: "pointer-events-auto w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white border border-[#C4B5FD]/10 hover:border-[#C4B5FD]/20 hover:bg-[#C4B5FD]/[0.07] transition-all active:scale-90",
        dropdowns: "flex items-center gap-2",
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
