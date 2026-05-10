import { motion, useReducedMotion } from "framer-motion";
import { useMemo, type CSSProperties } from "react";

interface Hero3DTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;
}

/**
 * Cinematic word-by-word 3D reveal.
 * Each word starts blurred, tilted on X (perspective rotateX) and offset,
 * then settles into place. Respects prefers-reduced-motion.
 */
export function Hero3DText({
  text,
  as: Tag = "h1",
  className = "",
  style,
  delay = 0,
  stagger = 0.11,
}: Hero3DTextProps) {
  const reduced = useReducedMotion();
  const words = useMemo(() => text.split(/(\s+)/), [text]);

  const MotionTag = motion[Tag] as typeof motion.h1;

  if (reduced) {
    return <Tag className={className} style={style}>{text}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      style={{ perspective: 800, ...style }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: delay, staggerChildren: stagger } },
      }}
    >
      {words.map((w, i) =>
        /\s+/.test(w) ? (
          <span key={i}>{w}</span>
        ) : (
          <motion.span
            key={i}
            className="inline-block will-change-[transform,opacity,filter]"
            style={{ transformStyle: "preserve-3d" }}
            variants={{
              hidden: {
                opacity: 0,
                y: "0.45em",
                rotateX: -55,
                filter: "blur(8px)",
              },
              visible: {
                opacity: 1,
                y: 0,
                rotateX: 0,
                filter: "blur(0px)",
                transition: {
                  duration: 1.15,
                  ease: [0.16, 1, 0.3, 1],
                  opacity: { duration: 0.9, ease: "easeOut" },
                  filter: { duration: 0.7, ease: "easeOut" },
                },
              },
            }}
          >
            {w}
          </motion.span>
        )
      )}
    </MotionTag>
  );
}
