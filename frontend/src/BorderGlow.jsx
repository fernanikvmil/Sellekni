import { useRef, useState, useCallback, useEffect } from "react";

export default function BorderGlow({
  children,
  edgeSensitivity = 30,
  glowColor = "139 92 246",
  backgroundColor = "#060010",
  borderRadius = 16,
  glowRadius = 80,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
}) {
  const ref = useRef(null);
  const [mouse, setMouse] = useState(null);
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMouse({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        w: rect.width,
        h: rect.height,
      });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setMouse(null);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Gradient border (static)
  const gradientAngle = animated ? undefined : "135deg";
  const borderBg = `linear-gradient(${gradientAngle ?? "135deg"}, ${colors.join(", ")})`;

  // Dynamic glow spotlight on border
  const glowOverlay = mouse
    ? `radial-gradient(${glowRadius * 2}px circle at ${mouse.x}px ${mouse.y}px,
        rgba(${glowColor} / ${(glowIntensity * 0.85).toFixed(2)}),
        rgba(${glowColor} / ${(glowIntensity * 0.3).toFixed(2)}) 40%,
        transparent 70%)`
    : "none";

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        borderRadius,
        padding: "1px",
        background: mouse
          ? `radial-gradient(${glowRadius * 2}px circle at ${mouse.x}px ${mouse.y}px,
              ${colors[0]}, ${colors[1] ?? colors[0]}, ${colors[2] ?? colors[0]})`
          : borderBg,
        transition: "background 0.05s ease",
        ...(animated ? { animation: "borderRotate 4s linear infinite" } : {}),
      }}
    >
      {/* Glow halo behind the card */}
      {mouse && (
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius,
            pointerEvents: "none",
            zIndex: 0,
            background: `radial-gradient(${glowRadius * 1.5}px circle at ${mouse.x}px ${mouse.y}px,
              rgba(${glowColor} / ${(glowIntensity * 0.25).toFixed(2)}),
              transparent 70%)`,
            filter: "blur(8px)",
          }}
        />
      )}

      {/* Inner content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          borderRadius: Math.max(0, borderRadius - 1),
          background: backgroundColor,
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      {animated && (
        <style>{`
          @keyframes borderRotate {
            from { filter: hue-rotate(0deg); }
            to   { filter: hue-rotate(360deg); }
          }
        `}</style>
      )}
    </div>
  );
}
