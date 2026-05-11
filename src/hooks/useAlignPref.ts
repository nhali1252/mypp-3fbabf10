import { useCallback, useEffect, useState } from "react";

const KEY = "align-pref"; // "auto" | "justify" | "left"
export type AlignPref = "auto" | "justify" | "left";

function read(): AlignPref {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(KEY);
  return v === "justify" || v === "left" ? v : "auto";
}

function apply(pref: AlignPref) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // "auto" → remove the override and let styles.css decide (justify
  // on desktop AND mobile per the default token). "justify" / "left"
  // force the choice everywhere via a higher-specificity inline style
  // on the root element.
  if (pref === "auto") root.style.removeProperty("--text-align-body");
  else root.style.setProperty("--text-align-body", pref);
}

/**
 * Visitor preference for body-paragraph alignment. Persists in
 * localStorage and applies via the `--text-align-body` CSS variable
 * already consumed by p / dd / blockquote in styles.css.
 *
 * - "auto"     → use the site default (justify, with mobile fallback)
 * - "justify"  → force justified body copy everywhere
 * - "left"     → force left-aligned body copy (a11y / dyslexia-friendly)
 */
export function useAlignPref() {
  const [pref, setPref] = useState<AlignPref>(() => read());

  // Apply on mount + whenever pref changes.
  useEffect(() => {
    apply(pref);
  }, [pref]);

  // Cross-tab + same-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPref(read());
    };
    const onCustom = () => setPref(read());
    window.addEventListener("storage", onStorage);
    window.addEventListener("align-pref-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("align-pref-change", onCustom);
    };
  }, []);

  const setAlignPref = useCallback((next: AlignPref) => {
    if (typeof window === "undefined") return;
    if (next === "auto") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event("align-pref-change"));
    setPref(next);
  }, []);

  return { pref, setAlignPref };
}
