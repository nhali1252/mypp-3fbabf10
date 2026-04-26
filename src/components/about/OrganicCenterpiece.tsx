import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Cinematic centerpiece — floating portrait bust surrounded by curved
 * fiber-optic strands with glowing ember tips. Pure CSS + SVG, no WebGL.
 *
 * Visual reference: emergent-style hero — soft cream backdrop, photoreal
 * face floating in space, organic light tendrils trailing behind, warm
 * bloom and depth. Mouse parallax on the head; strands drift independently.
 */
export function OrganicCenterpiece({
  size = 560,
  portraitUrl,
  className = "",
}: {
  size?: number;
  portraitUrl?: string | null;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mouse parallax (springy, gentle)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [6, -6]), { stiffness: 70, damping: 18 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-9, 9]), { stiffness: 70, damping: 18 });
  const tx = useSpring(useTransform(mx, [-1, 1], [-10, 10]), { stiffness: 60, damping: 22 });
  const ty = useSpring(useTransform(my, [-1, 1], [-8, 8]), { stiffness: 60, damping: 22 });

  // Strands lag slightly behind the head — different spring → parallax depth
  const sx = useSpring(useTransform(mx, [-1, 1], [-22, 22]), { stiffness: 35, damping: 24 });
  const sy = useSpring(useTransform(my, [-1, 1], [-16, 16]), { stiffness: 35, damping: 24 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = (e.clientX - cx) / Math.max(1, r.width / 2);
      const ny = (e.clientY - cy) / Math.max(1, r.height / 2);
      mx.set(Math.max(-1.2, Math.min(1.2, nx)));
      my.set(Math.max(-1.2, Math.min(1.2, ny)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduce]);

  // Procedural curved strands — bezier tendrils with ember tips
  const strands = useMemo(() => {
    const N = 26;
    const r = size / 2;
    const cx = r;
    const cy = r;
    return Array.from({ length: N }, (_, i) => {
      // Pseudo-random but deterministic
      const seed = (i * 9301 + 49297) % 233280;
      const rnd = seed / 233280;

      // Strands favor sides (avoid covering the face center)
      // Angle range: skew towards horizontal/back
      const sideBias = i % 2 === 0 ? 1 : -1;
      const baseAngle = sideBias * (Math.PI * 0.18 + rnd * Math.PI * 0.55);
      const a0 = baseAngle - Math.PI / 2; // start above/behind head
      const len = r * (0.78 + rnd * 0.45);

      // Origin: just behind the head silhouette
      const ox = cx + Math.cos(a0) * r * 0.14;
      const oy = cy + Math.sin(a0) * r * 0.14 + r * 0.05;

      // End point: trails outward + downward
      const ex = cx + Math.cos(baseAngle) * len + sideBias * r * 0.05;
      const ey = cy + Math.sin(baseAngle) * len + r * (0.15 + rnd * 0.25);

      // Two control points for an S-curve
      const c1x = ox + (ex - ox) * 0.25 + sideBias * r * 0.1;
      const c1y = oy + (ey - oy) * 0.15 - r * 0.12;
      const c2x = ox + (ex - ox) * 0.7 - sideBias * r * 0.08;
      const c2y = oy + (ey - oy) * 0.65 + r * 0.05;

      const path = `M ${ox.toFixed(1)} ${oy.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      const ember = rnd > 0.35; // most tips are lit
      const width = 0.6 + rnd * 0.8;
      const opacity = 0.45 + rnd * 0.45;
      const drift = 2 + rnd * 4; // seconds
      const delay = rnd * 3;

      return { path, ex, ey, ember, width, opacity, drift, delay, key: i };
    });
  }, [size]);

  return (
    <div
      ref={wrapRef}
      className={`relative grid place-items-center ${className}`}
      style={{ width: size, height: size, perspective: 1400 }}
      aria-hidden
    >
      {/* === Atmospheric bloom — warm, soft === */}
      <div
        className="absolute inset-0 rounded-full blur-[80px]"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, oklch(0.88 0.12 70 / 0.45) 0%, oklch(0.78 0.14 55 / 0.18) 35%, transparent 70%)",
          transform: "scale(1.35)",
        }}
      />

      {/* === Strand layer — drifts behind head with own parallax === */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          x: reduce ? 0 : sx,
          y: reduce ? 0 : sy,
        }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="absolute inset-0"
        >
          <defs>
            <linearGradient id="strandStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.96 0.02 80)" stopOpacity="0.0" />
              <stop offset="35%" stopColor="oklch(0.95 0.04 75)" stopOpacity="0.7" />
              <stop offset="85%" stopColor="oklch(0.85 0.14 60)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="oklch(0.75 0.22 50)" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="emberGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.97 0.18 75)" stopOpacity="1" />
              <stop offset="40%" stopColor="oklch(0.78 0.22 55)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="oklch(0.55 0.2 35)" stopOpacity="0" />
            </radialGradient>
            <filter id="emberBlur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <filter id="strandSoft" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0.4" />
            </filter>
          </defs>

          {/* Curved strands */}
          <g filter="url(#strandSoft)">
            {strands.map((s) => (
              <motion.path
                key={`p-${s.key}`}
                d={s.path}
                fill="none"
                stroke="url(#strandStroke)"
                strokeWidth={s.width}
                strokeLinecap="round"
                style={{ opacity: s.opacity }}
                animate={
                  reduce
                    ? undefined
                    : {
                        opacity: [s.opacity * 0.7, s.opacity, s.opacity * 0.7],
                      }
                }
                transition={
                  reduce
                    ? undefined
                    : {
                        duration: s.drift,
                        delay: s.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
            ))}
          </g>

          {/* Ember halos (soft) */}
          <g filter="url(#emberBlur)">
            {strands
              .filter((s) => s.ember)
              .map((s) => (
                <motion.circle
                  key={`hg-${s.key}`}
                  cx={s.ex}
                  cy={s.ey}
                  r={6}
                  fill="url(#emberGlow)"
                  animate={reduce ? undefined : { r: [5, 8, 5], opacity: [0.7, 1, 0.7] }}
                  transition={
                    reduce
                      ? undefined
                      : { duration: s.drift, delay: s.delay, repeat: Infinity, ease: "easeInOut" }
                  }
                />
              ))}
          </g>

          {/* Ember cores (sharp hot dot) */}
          <g>
            {strands
              .filter((s) => s.ember)
              .map((s) => (
                <circle
                  key={`hc-${s.key}`}
                  cx={s.ex}
                  cy={s.ey}
                  r={1.4}
                  fill="oklch(0.98 0.05 80)"
                />
              ))}
          </g>
        </svg>
      </motion.div>

      {/* === Floating portrait — center stage === */}
      <motion.div
        style={{
          width: size * 0.62,
          height: size * 0.62,
          rotateX: reduce ? 0 : rx,
          rotateY: reduce ? 0 : ry,
          x: reduce ? 0 : tx,
          y: reduce ? 0 : ty,
          transformStyle: "preserve-3d",
        }}
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={reduce ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10"
      >
        {/* Soft contact shadow under head */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full blur-2xl"
          style={{
            bottom: -size * 0.04,
            width: size * 0.5,
            height: size * 0.12,
            background: "radial-gradient(ellipse, rgba(20,15,10,0.55), transparent 70%)",
            opacity: 0.7,
          }}
        />

        {/* The portrait itself — masked into a soft vignette */}
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 70% at 50% 45%, #000 55%, transparent 88%)",
            maskImage:
              "radial-gradient(ellipse 60% 70% at 50% 45%, #000 55%, transparent 88%)",
            filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.35)) contrast(1.05) saturate(1.05)",
          }}
        >
          {portraitUrl ? (
            <img
              src={portraitUrl}
              alt=""
              className="w-full h-full object-cover object-center"
              draggable={false}
            />
          ) : (
            // Fallback: glowing orb if no portrait yet
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 40% 35%, oklch(0.92 0.08 70), oklch(0.55 0.12 45) 70%)",
              }}
            />
          )}
        </div>

        {/* Specular rim light — top-left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(255,240,210,0.32) 0%, transparent 38%)",
            mixBlendMode: "screen",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 70% at 50% 45%, #000 55%, transparent 88%)",
            maskImage:
              "radial-gradient(ellipse 60% 70% at 50% 45%, #000 55%, transparent 88%)",
          }}
        />
      </motion.div>

      {/* Foreground front-left ember (depth cue) */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute rounded-full blur-md pointer-events-none"
          style={{
            left: "18%",
            bottom: "22%",
            width: 10,
            height: 10,
            background:
              "radial-gradient(circle, oklch(0.96 0.18 70), oklch(0.7 0.22 50) 60%, transparent 80%)",
          }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.25, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
