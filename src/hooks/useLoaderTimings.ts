import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "pageLoader.timings.v1";
const EVENT = "pageloader:timings-changed";

export type LoaderTimings = {
  initialMs: number;
  routeMs: number;
};

export const DEFAULT_LOADER_TIMINGS: LoaderTimings = {
  initialMs: 4000,
  routeMs: 4000,
};

function readStored(): LoaderTimings {
  if (typeof window === "undefined") return DEFAULT_LOADER_TIMINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOADER_TIMINGS;
    const parsed = JSON.parse(raw) as Partial<LoaderTimings>;
    return {
      initialMs: clamp(parsed.initialMs ?? DEFAULT_LOADER_TIMINGS.initialMs),
      routeMs: clamp(parsed.routeMs ?? DEFAULT_LOADER_TIMINGS.routeMs),
    };
  } catch {
    return DEFAULT_LOADER_TIMINGS;
  }
}

// Hard bounds: the page loader animation must always stay within 3–5 seconds.
export const LOADER_MIN_MS = 3000;
export const LOADER_MAX_MS = 5000;

function clamp(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_LOADER_TIMINGS.initialMs;
  return Math.max(LOADER_MIN_MS, Math.min(LOADER_MAX_MS, Math.round(n)));
}

/**
 * Reads PageLoader timings, persisted to localStorage, with cross-component
 * sync via a window event. Safe in SSR (returns defaults on the server).
 */
export function useLoaderTimings() {
  const [timings, setTimings] = useState<LoaderTimings>(() => readStored());

  useEffect(() => {
    const sync = () => setTimings(readStored());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((next: Partial<LoaderTimings>) => {
    const merged: LoaderTimings = {
      initialMs: clamp(next.initialMs ?? readStored().initialMs),
      routeMs: clamp(next.routeMs ?? readStored().routeMs),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* ignore quota errors */
    }
    window.dispatchEvent(new CustomEvent(EVENT));
    setTimings(merged);
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(EVENT));
    setTimings(DEFAULT_LOADER_TIMINGS);
  }, []);

  return { timings, update, reset };
}
