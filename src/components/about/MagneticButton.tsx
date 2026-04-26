import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * Premium magnetic hover button — pulls toward the cursor when hovered,
 * springs back on leave. Respects prefers-reduced-motion.
 */
export function MagneticButton({
  children,
  onClick,
  className = "",
  strength = 22,
  as = "button",
  href,
  type = "button",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  strength?: number;
  as?: "button" | "a";
  href?: string;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      x.set(dx * strength);
      y.set(dy * strength);
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y, strength, reduce]);

  const Comp: any = as === "a" ? motion.a : motion.button;
  return (
    <Comp
      ref={ref as any}
      onClick={onClick}
      href={href}
      type={as === "button" ? type : undefined}
      aria-label={ariaLabel}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </Comp>
  );
}
