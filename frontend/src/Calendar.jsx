import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
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
        months_dropdown: "bg-[#0A031E] border border-[#C4B5FD]/10 rounded-lg px-2 py-1 text-xs text-white/90 font-medium capitalize cursor-pointer focus:outline-none focus:border-[#C4B5FD]/30 appearance-none",
        years_dropdown: "bg-[#0A031E] border border-[#C4B5FD]/10 rounded-lg px-2 py-1 text-xs text-white/90 font-medium cursor-pointer focus:outline-none focus:border-[#C4B5FD]/30 appearance-none",
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
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";
export default Calendar;
