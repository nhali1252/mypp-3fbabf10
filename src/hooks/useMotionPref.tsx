import { useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";

const KEY = "motion-pref"; // "on" | "off" | "auto"
type Pref = "on" | "off" | "auto";

function read(): Pref {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(KEY);
  return v === "on" || v === "off" ? v : "auto";
}

/**
 * Returns whether motion should be reduced, combining the user's in-app
 * preference with the OS-level `prefers-reduced-motion` setting.
 *
 * - "auto"  → follow the system setting
 * - "on"    → force motion on
 * - "off"   → force motion off
 */
export function useMotionPref() {
  const systemReduce = useReducedMotion();
  const [pref, setPref] = useState<Pref>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPref(read());
    };
    const onCustom = () => setPref(read());
    window.addEventListener("storage", onStorage);
    window.addEventListener("motion-pref-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("motion-pref-change", onCustom);
    };
  }, []);

  const setMotionPref = useCallback((next: Pref) => {
    if (typeof window === "undefined") return;
    if (next === "auto") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event("motion-pref-change"));
    setPref(next);
  }, []);

  const reduceMotion = pref === "off" ? true : pref === "on" ? false : !!systemReduce;

  return { pref, setMotionPref, reduceMotion, systemReduce: !!systemReduce };
}
