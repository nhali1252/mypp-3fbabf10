import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

interface Hero3DTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;
  /** Reveal each character separately. Default reveals each word. */
  byLetter?: boolean;
}

/**
 * Cinematic 3D reveal for headlines. Each unit (word or letter) starts
 * tilted, blurred and offset, then settles into place. Honors
 * prefers-reduced-motion. On small viewports the blur step is dropped
 * (GPU-expensive on mobile) without losing the choreography.
 */
export function Hero3DText({
  text,
  as: Tag = "h1",
  className = "",
  style,
  delay = 0,
  stagger,
  byLetter = false,
}: Hero3DTextProps) {
  const reduced = useReducedMotion();
  // Initialize from the matchMedia synchronously on the client so the very
  // first render on mobile already skips the blur+3D animation. Without
  // this, the hidden variant (blur(8px), rotateX -55) flashes on first
  // paint and on some mobile browsers the filter can get "stuck" mid-
  // animation, leaving the headline permanently blurry.
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return true; // assume mobile on SSR — safer
    return window.matchMedia("(max-width: 640px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Split into reveal units. Word mode keeps whitespace as inert spans so
  // wrapping behaves naturally; letter mode preserves spaces too.
  const units = useMemo(() => {
    if (byLetter) return Array.from(text);
    return text.split(/(\s+)/);
  }, [text, byLetter]);

  const MotionTag = motion[Tag] as typeof motion.h1;

  if (reduced) {
    return <Tag className={className} style={style}>{text}</Tag>;
  }

  // Sensible default stagger per mode
  const childStagger = stagger ?? (byLetter ? 0.04 : 0.11);
  const useBlur = !isMobile;

  return (
    <MotionTag
      className={className}
      style={{ perspective: 800, ...style }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: delay, staggerChildren: childStagger } },
      }}
    >
      {units.map((w, i) => {
        const isSpace = /^\s+$/.test(w);
        if (isSpace) return <span key={i}>{w}</span>;
        return (
          <motion.span
            key={i}
            className="inline-block will-change-[transform,opacity,filter]"
            style={{ transformStyle: "preserve-3d" }}
            variants={{
              hidden: {
                opacity: 0,
                y: "0.45em",
                rotateX: -55,
                ...(useBlur ? { filter: "blur(8px)" } : {}),
              },
              visible: {
                opacity: 1,
                y: 0,
                rotateX: 0,
                ...(useBlur ? { filter: "blur(0px)" } : {}),
                transition: {
                  duration: byLetter ? 0.85 : 1.15,
                  ease: [0.16, 1, 0.3, 1],
                  opacity: { duration: byLetter ? 0.6 : 0.9, ease: "easeOut" },
                  ...(useBlur
                    ? { filter: { duration: byLetter ? 0.5 : 0.7, ease: "easeOut" } }
                    : {}),
                },
              },
            }}
          >
            {w === " " ? "\u00A0" : w}
          </motion.span>
        );
      })}
    </MotionTag>
  );
}
