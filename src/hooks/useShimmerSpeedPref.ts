import { useEffect, useState } from "react";

/**
 * Per-user preference for the gold heading shimmer animation speed.
 * Stored in localStorage so it follows the visitor across sessions and
 * overrides the site-wide admin setting on this device only.
 *
 * Range: 2000–8000 ms per cycle. Lower = faster sweep.
 * Special value `null` means "follow the site default (admin setting)".
 */
const STORAGE_KEY = "shimmerSpeedMs";
export const SHIMMER_SPEED_MIN = 2000;
export const SHIMMER_SPEED_MAX = 8000;
export const SHIMMER_SPEED_STEP = 250;

function read(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(SHIMMER_SPEED_MIN, Math.min(SHIMMER_SPEED_MAX, Math.round(n)));
}

export function useShimmerSpeedPref() {
  const [speedMs, setSpeedMsState] = useState<number | null>(() => read());

  // Sync across tabs and across components in the same tab via storage event.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSpeedMsState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function setSpeedMs(next: number | null) {
    if (typeof window === "undefined") return;
    if (next == null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      const clamped = Math.max(
        SHIMMER_SPEED_MIN,
        Math.min(SHIMMER_SPEED_MAX, Math.round(next)),
      );
      window.localStorage.setItem(STORAGE_KEY, String(clamped));
    }
    setSpeedMsState(next);
    // Cross-component notify (storage event only fires for OTHER tabs)
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }

  return { speedMs, setSpeedMs };
}
