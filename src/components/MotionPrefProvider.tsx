import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useMotionPref } from "@/hooks/useMotionPref";

/**
 * Globally honors the user's motion preference for every framer-motion
 * component beneath it. Combines with the OS `prefers-reduced-motion`
 * media query and the in-app override stored by useMotionPref.
 *
 * - pref "off"  → "always" (always reduce — skip animations)
 * - pref "on"   → "never"  (always animate)
 * - pref "auto" → "user"   (follow the OS setting)
 *
 * We also mirror the *effective* reduced-motion state onto
 * <html data-motion="reduce|full"> so plain-CSS effects (like the global
 * heading gold-shimmer) can opt out without their own media query — the
 * OS-level @media still applies, this just covers the in-app toggle.
 */
export function MotionPrefProvider({ children }: { children: React.ReactNode }) {
  const { pref, reduceMotion } = useMotionPref();
  const reducedMotion =
    pref === "off" ? "always" : pref === "on" ? "never" : "user";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-motion", reduceMotion ? "reduce" : "full");
  }, [reduceMotion]);

  return <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>;
}
