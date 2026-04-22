import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useContent";
import { useLoaderTimings } from "@/hooks/useLoaderTimings";

/**
 * Buttery, professional full-screen brand loader.
 *
 * - Shows on first load until the document is ready.
 * - Re-shows briefly on every route change so each page has its own intro.
 * - Wordmark + tagline adapt per-route (Launcher / Basic / Skills / Projects).
 */
const EXPECTED_LOADER_MS = 4000;

/**
 * Lightweight analytics hook for PageLoader visibility.
 * Dispatches a window CustomEvent ("pageloader:visible") AND, when available,
 * forwards to common analytics shims (window.gtag, window.plausible, window.dataLayer).
 * Consumers can `window.addEventListener("pageloader:visible", ...)` to record.
 */
type LoaderVisibleDetail = {
  kind: "initial" | "route";
  path: string;
  fromPath?: string;
  configuredMs: number;
  actualMs: number;
};

function trackLoaderVisible(detail: LoaderVisibleDetail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("pageloader:visible", { detail }));
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
      dataLayer?: unknown[];
    };
    w.gtag?.("event", "page_loader_visible", {
      kind: detail.kind,
      path: detail.path,
      configured_ms: detail.configuredMs,
      actual_ms: Math.round(detail.actualMs),
    });
    w.plausible?.("PageLoader Visible", {
      props: {
        kind: detail.kind,
        path: detail.path,
        actualMs: Math.round(detail.actualMs),
      },
    });
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({
        event: "page_loader_visible",
        ...detail,
        actualMs: Math.round(detail.actualMs),
      });
    }
    if (import.meta.env?.DEV) {
      console.log(
        `[PageLoader][analytics] ${detail.kind} ${detail.fromPath ? detail.fromPath + " → " : ""}${detail.path} actual=${Math.round(detail.actualMs)}ms (configured=${detail.configuredMs}ms)`,
      );
    }
  } catch {
    // never let analytics break rendering
  }
}

export function PageLoader({
  initialMs: initialMsProp,
  routeMs: routeMsProp,
}: {
  initialMs?: number;
  routeMs?: number;
} = {}) {
  // Stored overrides from the debug page; props (if provided) win.
  const { timings } = useLoaderTimings();
  const initialMs = initialMsProp ?? timings.initialMs;
  const routeMs = routeMsProp ?? timings.routeMs;

  // Dev-only sanity check: warn loudly if effective values drift from the configured default.
  if (import.meta.env?.DEV) {
    console.assert(
      initialMs === EXPECTED_LOADER_MS && routeMs === EXPECTED_LOADER_MS,
      `[PageLoader] Expected ${EXPECTED_LOADER_MS}ms timings, got initialMs=${initialMs}, routeMs=${routeMs}`,
    );
  }
  const [show, setShow] = useState(true);
  const [hiding, setHiding] = useState(false);
  const [announcement, setAnnouncement] = useState("Loading page");
  const { data: settings } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isFirstRun = useRef(true);
  const lastPath = useRef(pathname);

  // Human-friendly label for the current route, used in announcements + UI.
  const ROUTE_LABELS: Record<string, string> = {
    "/": "Welcome",
    "/B": "Basic info",
    "/F": "Skills & About",
    "/P": "Projects",
  };
  const routeLabel = ROUTE_LABELS[pathname] ?? "page";

  // Initial mount loader: wait for document ready, then min duration.
  useEffect(() => {
    if (import.meta.env?.DEV) {
      // [DEBUG][PageLoader] temporary: confirms initial timing per session.
      console.log(
        `[PageLoader][initial] path=${pathname} initialMs=${initialMs} routeMs=${routeMs}`,
      );
    }
    const start = performance.now();
    let done = false;
    let hideTimer: number | undefined;
    let removeTimer: number | undefined;

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = performance.now() - start;
      const wait = Math.max(0, initialMs - elapsed);
      hideTimer = window.setTimeout(() => {
        setHiding(true);
        setAnnouncement(`${routeLabel} ready`);
        trackLoaderVisible({
          kind: "initial",
          path: pathname,
          configuredMs: initialMs,
          actualMs: performance.now() - start,
        });
        removeTimer = window.setTimeout(() => {
          setShow(false);
          setHiding(false);
          isFirstRun.current = false;
        }, 260);
      }, wait);
    };

    if (typeof document !== "undefined" && (document.readyState === "interactive" || document.readyState === "complete")) {
      finish();
    } else if (typeof document !== "undefined") {
      document.addEventListener("DOMContentLoaded", finish, { once: true });
    } else {
      finish();
    }

    const safety = window.setTimeout(finish, initialMs + 2000);
    return () => {
      if (typeof document !== "undefined") document.removeEventListener("DOMContentLoaded", finish);
      window.clearTimeout(safety);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On subsequent route changes, flash a quick branded intro.
  useEffect(() => {
    if (isFirstRun.current) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current === pathname) return;
    const fromPath = lastPath.current;
    lastPath.current = pathname;

    if (import.meta.env?.DEV) {
      // [DEBUG][PageLoader] temporary: confirms per-route timing on every navigation.
      console.log(
        `[PageLoader][route] ${fromPath} → ${pathname} routeMs=${routeMs} (initialMs=${initialMs})`,
      );
    }

    setShow(true);
    setHiding(false);
    setAnnouncement(`Loading ${routeLabel}`);
    const routeStart = performance.now();
    const t1 = window.setTimeout(() => {
      setHiding(true);
      setAnnouncement(`${routeLabel} ready`);
      trackLoaderVisible({
        kind: "route",
        path: pathname,
        fromPath,
        configuredMs: routeMs,
        actualMs: performance.now() - routeStart,
      });
    }, routeMs);
    const t2 = window.setTimeout(() => {
      setShow(false);
      setHiding(false);
    }, routeMs + 260);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname, routeMs, initialMs]);

  if (!show) return null;

  const routeMap: Record<string, { label: string; tagline: string }> = {
    "/": { label: "Welcome", tagline: "Pick a page to explore" },
    "/B": { label: "Basic info", tagline: "About · Education · Activities" },
    "/F": { label: "Skills & About", tagline: "Design · Tools · Workflow" },
    "/P": { label: "Projects", tagline: "Selected work & case studies" },
  };
  const siteName = settings?.site_name?.trim() || "Portfolio";
  const match = routeMap[pathname] ?? { label: "", tagline: "" };
  const tail = match.label ? ` ${match.label}` : "";
  const tagline = match.tagline || settings?.hero_subtitle?.trim() || "";

  return (
    <div
      aria-hidden={hiding}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        hiding ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[360px] w-[360px] rounded-full blur-[100px]"
          style={{ background: "oklch(0.72 0.07 78 / 0.14)" }}
        />
      </div>

      <div
        className={`relative flex flex-col items-center text-center px-6 transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hiding ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
        }`}
      >
        {settings?.logo_url ? (
          <img
            src={settings.logo_url}
            alt=""
            className="mb-4 h-12 w-12 md:h-14 md:w-14 rounded-2xl object-cover border border-white/10 shadow-glow"
          />
        ) : null}

        <div className="font-serif-display italic text-4xl sm:text-5xl tracking-tight select-none">
          <span className="text-foreground">{siteName}</span>
          {tail && (
            <span className="bg-gradient-to-r from-[oklch(0.82_0.09_82)] to-[oklch(0.66_0.07_70)] bg-clip-text text-transparent">
              {tail}
            </span>
          )}
        </div>

        {tagline && (
          <p className="mt-2 text-[9px] uppercase tracking-[0.34em] text-foreground/55">
            {tagline}
          </p>
        )}

        <div className="mt-6 h-[2px] w-32 overflow-hidden rounded-full bg-white/8">
          <div className="page-loader-bar h-full w-1/2 bg-gradient-to-r from-transparent via-[oklch(0.78_0.08_80)] to-transparent" />
        </div>
      </div>

      <style>{`
        @keyframes pageLoaderSlide {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(260%); }
        }
        .page-loader-bar {
          animation: pageLoaderSlide 1.05s cubic-bezier(0.22,1,0.36,1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .page-loader-bar { animation: none; }
        }
      `}</style>
    </div>
  );
}
