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
 */
export function MotionPrefProvider({ children }: { children: React.ReactNode }) {
  const { pref } = useMotionPref();
  const reducedMotion =
    pref === "off" ? "always" : pref === "on" ? "never" : "user";
  return <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>;
}
