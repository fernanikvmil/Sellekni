import {
  DatePicker,
  Label,
  Group,
  DateInput,
  DateSegment,
  Button,
  Popover,
  Dialog,
  Calendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  CalendarCell,
  Heading,
} from "react-aria-components";
import { CalendarDate, parseDate } from "@internationalized/date";

function toCalendarDate(str) {
  if (!str) return null;
  try { return parseDate(str); } catch { return null; }
}

function toDateString(d) {
  if (!d) return "";
  const m = String(d.month).padStart(2, "0");
  const dy = String(d.day).padStart(2, "0");
  return `${d.year}-${m}-${dy}`;
}

export default function AppDatePicker({
  value,
  onChange,
  minYear,
  maxYear,
  label,
  icon = "📅",
}) {
  const currentYear = new Date().getFullYear();
  const minVal = minYear ? new CalendarDate(minYear, 1, 1)   : new CalendarDate(1920,        1,  1);
  const maxVal = maxYear ? new CalendarDate(maxYear, 12, 31) : new CalendarDate(currentYear, 12, 31);
  const calValue = toCalendarDate(value);

  return (
    <DatePicker
      value={calValue}
      onChange={(d) => onChange?.(toDateString(d))}
      minValue={minVal}
      maxValue={maxVal}
      className="w-full"
    >
      {label && (
        <Label className="text-xs text-white/40 mb-1.5 block">
          {icon} {label}
        </Label>
      )}

      <style>{`
        /* ── Segments ────────────────────────────── */
        .dp-seg {
          display: inline-block;
          padding: 2px 4px;
          border-radius: 5px;
          outline: none;
          caret-color: transparent;
          color: rgba(255,255,255,.75);
          font-variant-numeric: tabular-nums;
          font-size: 13px;
          transition: background .15s, color .15s;
        }
        .dp-seg[data-placeholder] { color: rgba(255,255,255,.25); }
        .dp-seg[data-focused]     { background: rgba(139,92,246,.4); color: #fff; }
        .dp-seg[data-invalid]     { color: #f87171; }

        /* ── Popover card ────────────────────────── */
        .dp-popup {
          background: #0d0d1a;
          border: 1px solid rgba(139,92,246,.18);
          border-radius: 18px;
          padding: 18px 16px 16px;
          box-shadow: 0 8px 16px rgba(0,0,0,.4), 0 32px 80px rgba(0,0,0,.75),
                      inset 0 1px 0 rgba(255,255,255,.04);
          outline: none;
          z-index: 200;
          min-width: 280px;
        }

        /* ── Table resets (Tailwind v4 preflight fix) */
        .dp-table          { display: table !important;       width: 100%; border-collapse: separate; border-spacing: 3px; }
        .dp-table thead    { display: table-header-group !important; }
        .dp-table tbody    { display: table-row-group !important; }
        .dp-table tr       { display: table-row !important; }
        .dp-table th,
        .dp-table td       { display: table-cell !important; }

        /* ── Header cells (Mon Tue …) ────────────── */
        .dp-hdr {
          width: 36px;
          height: 30px;
          text-align: center;
          vertical-align: middle;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .06em;
          color: rgba(139,92,246,.6);
          text-transform: uppercase;
          padding: 0;
        }

        /* ── Day cells ───────────────────────────── */
        .dp-cell {
          width: 36px;
          height: 36px;
          text-align: center;
          vertical-align: middle;
          padding: 0;
          border-radius: 9px;
          font-size: 13px;
          color: rgba(255,255,255,.75);
          cursor: pointer;
          outline: none;
          transition: background .15s, color .15s, box-shadow .15s;
        }
        .dp-cell[data-outside-month] { color: rgba(255,255,255,.15); pointer-events: none; }
        .dp-cell[data-hovered]:not([data-selected]):not([data-disabled]) {
          background: rgba(139,92,246,.2); color: #fff;
        }
        .dp-cell[data-selected] {
          background: linear-gradient(135deg,#6d28d9,#a855f7);
          color: #fff;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(139,92,246,.45);
        }
        .dp-cell[data-focused]:not([data-selected]) {
          background: rgba(139,92,246,.2); color: #fff;
          box-shadow: 0 0 0 2px rgba(139,92,246,.5);
        }
        .dp-cell[data-disabled] { color: rgba(255,255,255,.12); pointer-events: none; }
        .dp-cell[data-today]:not([data-selected]) {
          background: rgba(139,92,246,.1);
          box-shadow: inset 0 0 0 1px rgba(139,92,246,.4);
          color: #c4b5fd;
        }

        /* ── Nav buttons ─────────────────────────── */
        .dp-nav {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px;
          color: rgba(255,255,255,.45);
          font-size: 18px; line-height: 1;
          outline: none;
          transition: background .15s, color .15s;
        }
        .dp-nav:hover { background: rgba(139,92,246,.18); color: #c4b5fd; }
        .dp-nav:active { background: rgba(139,92,246,.3); }

        /* ── Fade-in animation ───────────────────── */
        @keyframes dp-fade { from { opacity:0; transform:translateY(-6px) scale(.97); } to { opacity:1; transform:none; } }
        .dp-enter { animation: dp-fade .18s cubic-bezier(.22,1,.36,1) forwards; }
      `}</style>

      {/* ── Input trigger ── */}
      <Group className="flex items-center gap-2 w-full px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/15 focus-within:bg-violet-500/[0.07] transition-all duration-300 cursor-text">
        <span className="text-white/30 text-sm pointer-events-none select-none">{icon}</span>

        <DateInput className="flex items-center flex-1 min-w-0">
          {(segment) => <DateSegment segment={segment} className="dp-seg" />}
        </DateInput>

        <Button className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-all outline-none text-sm">
          ▾
        </Button>
      </Group>

      {/* ── Calendar popup ── */}
      <Popover
        placement="bottom start"
        offset={8}
        className="dp-popup dp-enter"
      >
        <Dialog className="outline-none">
          <Calendar className="outline-none">

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <Button slot="previous" className="dp-nav">‹</Button>
              <Heading className="text-sm font-semibold text-white/85 tracking-wide capitalize" />
              <Button slot="next" className="dp-nav">›</Button>
            </div>

            {/* Top gradient line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent mb-3" />

            <CalendarGrid className="dp-table">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="dp-hdr">{day}</CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => <CalendarCell date={date} className="dp-cell" />}
              </CalendarGridBody>
            </CalendarGrid>

          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  );
}
