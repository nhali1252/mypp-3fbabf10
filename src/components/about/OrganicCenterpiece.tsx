import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * A 3D-feeling organic centerpiece — pure CSS + SVG, no WebGL.
 * Renders an anemone/fiber-strand orb with warm bloom, depth shadows,
 * subtle float, and mouse-parallax tilt. Falls back gracefully under
 * reduced motion.
 */
export function OrganicCenterpiece({
  size = 520,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mouse parallax (springy)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 80, damping: 18 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-12, 12]), { stiffness: 80, damping: 18 });
  const tx = useSpring(useTransform(mx, [-1, 1], [-14, 14]), { stiffness: 60, damping: 20 });
  const ty = useSpring(useTransform(my, [-1, 1], [-14, 14]), { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = (e.clientX - cx) / (r.width / 2);
      const ny = (e.clientY - cy) / (r.height / 2);
      mx.set(Math.max(-1, Math.min(1, nx)));
      my.set(Math.max(-1, Math.min(1, ny)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduce]);

  // Procedural strands radiating from center
  const STRANDS = 96;
  const strands = Array.from({ length: STRANDS }, (_, i) => {
    const a = (i / STRANDS) * Math.PI * 2;
    const len = 0.42 + ((i * 37) % 13) / 60; // 0.42 - 0.63
    const r = size / 2;
    const x1 = r + Math.cos(a) * (r * 0.18);
    const y1 = r + Math.sin(a) * (r * 0.18);
    const x2 = r + Math.cos(a) * (r * len);
    const y2 = r + Math.sin(a) * (r * len);
    // hot tip if even-spaced index falls in a "lit" cluster
    const lit = (i + Math.floor(i / 7)) % 8 === 0;
    return { x1, y1, x2, y2, lit, w: 0.7 + ((i * 11) % 5) / 10 };
  });

  return (
    <div
      ref={wrapRef}
      className={`relative grid place-items-center ${className}`}
      style={{ width: size, height: size, perspective: 1200 }}
      aria-hidden
    >
      {/* Soft bloom backdrop */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--primary) 65%, transparent) 0%, transparent 65%)",
          opacity: 0.55,
          transform: "scale(1.25)",
        }}
      />
      {/* Warm core */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: size * 0.55,
          height: size * 0.55,
          background:
            "radial-gradient(circle, oklch(0.86 0.18 70) 0%, oklch(0.72 0.2 55) 35%, transparent 70%)",
          opacity: 0.45,
        }}
      />

      <motion.div
        style={{
          width: size,
          height: size,
          rotateX: reduce ? 0 : rx,
          rotateY: reduce ? 0 : ry,
          x: reduce ? 0 : tx,
          y: reduce ? 0 : ty,
          transformStyle: "preserve-3d",
        }}
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Strand SVG */}
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="relative drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
        >
          <defs>
            <radialGradient id="strandGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.95 0.04 70)" stopOpacity="0.95" />
              <stop offset="55%" stopColor="oklch(0.82 0.06 60)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="oklch(0.55 0.02 50)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.95 0.18 75)" stopOpacity="1" />
              <stop offset="40%" stopColor="oklch(0.78 0.2 55)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="oklch(0.55 0.18 40)" stopOpacity="0" />
            </radialGradient>
            <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
          </defs>

          {/* Core */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.13}
            fill="url(#coreGlow)"
          />

          {/* Strands */}
          <g filter="url(#softBlur)">
            {strands.map((s, i) => (
              <line
                key={i}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="url(#strandGrad)"
                strokeWidth={s.w}
                strokeLinecap="round"
                opacity={0.85}
              />
            ))}
          </g>

          {/* Lit tips (warm dots) */}
          <g>
            {strands
              .filter((s) => s.lit)
              .map((s, i) => (
                <circle
                  key={i}
                  cx={s.x2}
                  cy={s.y2}
                  r={1.8}
                  fill="oklch(0.92 0.2 70)"
                  style={{ filter: "drop-shadow(0 0 6px oklch(0.85 0.2 65))" }}
                />
              ))}
          </g>

          {/* Subtle inner ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.42}
            fill="none"
            stroke="color-mix(in oklab, var(--primary) 35%, transparent)"
            strokeWidth={0.6}
            strokeDasharray="2 6"
            opacity={0.4}
          />
        </svg>
      </motion.div>

      {/* Top specular highlight — sells the 3D feel */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background:
            "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.18) 0%, transparent 45%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
