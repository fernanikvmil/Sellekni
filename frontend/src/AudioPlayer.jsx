import { useState, useRef, useEffect } from "react";

// Fake waveform heights (fixed pattern so it looks like a voice waveform)
const WAVE = [3,5,8,12,18,22,28,32,26,20,15,25,35,30,22,16,28,36,30,20,14,24,32,26,18,12,8,5,3];

export default function AudioPlayer({ src, isMe = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [currentTime, setCurrent] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    setIsPlaying(false); setProgress(0); setCurrent(0); setDuration(0);
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener("loadedmetadata", onMeta);
    return () => audio.removeEventListener("loadedmetadata", onMeta);
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause(); else audio.play().catch(() => {});
    setIsPlaying(v => !v);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
    setCurrent(audio.currentTime);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
    setProgress(pct * 100);
  };

  const fmt = (t) => {
    if (!t || isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  };

  const filledBars = Math.round((progress / 100) * WAVE.length);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl min-w-[210px] max-w-[240px]"
      style={isMe
        ? { background: "rgba(196,181,253,0.12)", border: "1px solid rgba(196,181,253,0.15)" }
        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(196,181,253,0.08)" }
      }
    >
      {/* Play / Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90"
        style={isMe
          ? { background: "#C4B5FD", color: "#0E0520" }
          : { background: "rgba(196,181,253,0.12)", border: "1px solid rgba(196,181,253,0.2)", color: "#C4B5FD" }
        }
      >
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
            <path d="M5 3l14 9-14 9V3z"/>
          </svg>
        )}
      </button>

      {/* Waveform + time */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Waveform bars */}
        <div
          className="flex items-center gap-[2.5px] h-8 cursor-pointer"
          onClick={handleSeek}
          title="Cliquez pour changer la position"
        >
          {WAVE.map((h, i) => {
            const filled = i < filledBars;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors duration-150"
                style={{
                  height: `${h}%`,
                  minHeight: 2,
                  background: filled
                    ? (isMe ? "#C4B5FD" : "#8B5CF6")
                    : (isMe ? "rgba(196,181,253,0.25)" : "rgba(196,181,253,0.15)"),
                }}
              />
            );
          })}
        </div>

        {/* Times */}
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-medium tabular-nums" style={{ color: isMe ? "rgba(196,181,253,0.6)" : "rgba(196,181,253,0.35)" }}>
            {fmt(currentTime)}
          </span>
          <span className="text-[9px] tabular-nums" style={{ color: isMe ? "rgba(196,181,253,0.4)" : "rgba(196,181,253,0.25)" }}>
            {fmt(duration)}
          </span>
        </div>
      </div>

      {/* Mic icon */}
      <div className="flex-shrink-0" style={{ color: isMe ? "rgba(196,181,253,0.4)" : "rgba(196,181,253,0.2)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); setProgress(0); setCurrent(0); }}
      />
    </div>
  );
}
