import { useCallback, useEffect, useState } from "react";

const KEY = "shimmer-pref"; // "on" | "off"  (absent = "on")
type Pref = "on" | "off";

function read(): Pref {
  if (typeof window === "undefined") return "on";
  return window.localStorage.getItem(KEY) === "off" ? "off" : "on";
}

/**
 * Per-user, per-device shimmer preference. When "off", a `data-shimmer-user="off"`
 * attribute is mirrored onto <html>; src/styles.css turns this into a hard
 * opt-out for h1/h2/h3 (and Hero3DText per-letter spans) — independent of the
 * site-wide admin setting handled by HeadingShimmerVars.
 *
 * The boot script in __root.tsx applies the saved value before hydration so
 * the first paint never flashes the shimmer for users who disabled it.
 */
export function useShimmerPref() {
  const [pref, setPref] = useState<Pref>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPref(read());
    };
    const onCustom = () => setPref(read());
    window.addEventListener("storage", onStorage);
    window.addEventListener("shimmer-pref-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("shimmer-pref-change", onCustom);
    };
  }, []);

  // Mirror to <html data-shimmer-user="off"> so plain CSS can opt out.
  useEffect(() => {
    const root = document.documentElement;
    if (pref === "off") root.setAttribute("data-shimmer-user", "off");
    else root.removeAttribute("data-shimmer-user");
  }, [pref]);

  const setShimmerPref = useCallback((next: Pref) => {
    if (typeof window === "undefined") return;
    if (next === "on") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event("shimmer-pref-change"));
    setPref(next);
  }, []);

  const toggle = useCallback(() => {
    setShimmerPref(pref === "on" ? "off" : "on");
  }, [pref, setShimmerPref]);

  return { pref, setShimmerPref, toggle };
}
