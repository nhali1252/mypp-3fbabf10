import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useContent";
import { usePageLoaderSettings, PAGE_LOADER_DEFAULTS } from "@/hooks/usePageLoaderSettings";

/**
 * Buttery, professional full-screen brand loader.
 *
 * - Shows on first load until the document is ready.
 * - Re-shows briefly on every route change so each page has its own intro.
 * - Wordmark + tagline adapt per-route (Launcher / Basic / Skills / Projects).
 */


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
  const [show, setShow] = useState(true);
  const [hiding, setHiding] = useState(false);
  const { data: settings } = useSiteSettings();
  const { data: loaderCfg } = usePageLoaderSettings();
  const initialMs = initialMsProp ?? loaderCfg?.initial_ms ?? PAGE_LOADER_DEFAULTS.initial_ms;
  const routeMs = routeMsProp ?? loaderCfg?.route_ms ?? PAGE_LOADER_DEFAULTS.route_ms;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isFirstRun = useRef(true);
  const lastPath = useRef(pathname);

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

  // Route-change loader: short brand cover between page navigations.
  // Skips the very first run (initial loader handles that) and any same-path
  // updates. Duration is `routeMs` (default ~520ms from PAGE_LOADER_DEFAULTS),
  // which is long enough to feel branded but short enough not to feel slow.
  // The overlay sits on z-[9999] above RouteTransition so the incoming page
  // mounts behind it — eliminating any per-page mount flicker.
  useEffect(() => {
    if (isFirstRun.current) return;
    if (lastPath.current === pathname) return;
    const fromPath = lastPath.current;
    lastPath.current = pathname;

    const start = performance.now();
    setShow(true);
    setHiding(false);

    const hideTimer = window.setTimeout(() => {
      setHiding(true);
      trackLoaderVisible({
        kind: "route",
        path: pathname,
        fromPath,
        configuredMs: routeMs,
        actualMs: performance.now() - start,
      });
    }, routeMs);

    const removeTimer = window.setTimeout(() => {
      setShow(false);
      setHiding(false);
    }, routeMs + 280);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [pathname, routeMs]);

  if (!show) return null;

  // Admin routes share one label
  const isAdmin = pathname.startsWith("/admin");
  const siteName = settings?.site_name?.trim() || "Portfolio";
  const dbRoutes = loaderCfg?.routes ?? PAGE_LOADER_DEFAULTS.routes;
  const fallbackRoutes = PAGE_LOADER_DEFAULTS.routes;
  const dbDefaultLabel = loaderCfg?.default_label?.trim() || "";
  const dbDefaultTagline = loaderCfg?.default_tagline?.trim() || "";
  const lookup = (path: string) => dbRoutes[path] ?? fallbackRoutes[path];
  const match = isAdmin
    ? (lookup("/admin") ?? { label: "Admin", tagline: "Content management" })
    : (lookup(pathname) ?? { label: dbDefaultLabel, tagline: dbDefaultTagline });
  const tail = match.label ? ` ${match.label}` : "";
  const tagline = match.tagline || dbDefaultTagline || settings?.hero_subtitle?.trim() || "";

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
            className="page-loader-logo mb-4 h-12 w-12 md:h-14 md:w-14 rounded-2xl object-cover border border-white/10 shadow-glow"
          />
        ) : null}

        <div className="page-loader-title font-serif-display italic text-4xl sm:text-5xl tracking-tight select-none">
          <span className="page-loader-shimmer bg-gradient-to-r from-[oklch(0.82_0.09_82)] via-[oklch(0.95_0.05_85)] to-[oklch(0.66_0.07_70)] bg-clip-text text-transparent">
            {match.label || siteName}
          </span>
        </div>

        {tagline && (
          <p className="page-loader-tagline mt-2 text-[9px] uppercase tracking-[0.34em] text-foreground/55">
            {tagline}
          </p>
        )}

        <div className="page-loader-track mt-6 h-[2px] w-32 overflow-hidden rounded-full bg-white/8">
          <div className="page-loader-bar h-full w-1/2 bg-gradient-to-r from-transparent via-[oklch(0.78_0.08_80)] to-transparent" />
        </div>

        <div className="page-loader-dots mt-5 flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-[oklch(0.78_0.08_80)]" style={{ animationDelay: "0ms" }} />
          <span className="h-1 w-1 rounded-full bg-[oklch(0.78_0.08_80)]" style={{ animationDelay: "160ms" }} />
          <span className="h-1 w-1 rounded-full bg-[oklch(0.78_0.08_80)]" style={{ animationDelay: "320ms" }} />
        </div>
      </div>

      <style>{`
        @keyframes pageLoaderSlide {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(260%); }
        }
        @keyframes pageLoaderRise {
          0% { opacity: 0; transform: translateY(14px) scale(0.96); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes pageLoaderFade {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pageLoaderShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pageLoaderGlowPulse {
          0%, 100% { box-shadow: 0 0 0 0 oklch(0.78 0.08 80 / 0.0), 0 8px 28px -8px oklch(0.78 0.08 80 / 0.35); }
          50% { box-shadow: 0 0 0 6px oklch(0.78 0.08 80 / 0.08), 0 12px 38px -8px oklch(0.78 0.08 80 / 0.55); }
        }
        @keyframes pageLoaderDot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0) scale(1); }
          40% { opacity: 1; transform: translateY(-3px) scale(1.3); }
        }
        @keyframes pageLoaderTrackGrow {
          0% { width: 0; opacity: 0; }
          100% { width: 8rem; opacity: 1; }
        }
        .page-loader-bar {
          animation: pageLoaderSlide 1.05s cubic-bezier(0.22,1,0.36,1) infinite;
        }
        .page-loader-logo {
          animation: pageLoaderRise 700ms cubic-bezier(0.22,1,0.36,1) both,
                     pageLoaderGlowPulse 2.4s ease-in-out 700ms infinite;
        }
        .page-loader-title {
          animation: pageLoaderRise 800ms cubic-bezier(0.22,1,0.36,1) 80ms both;
        }
        .page-loader-shimmer {
          background-size: 200% auto;
          animation: pageLoaderShimmer 3.2s linear infinite;
        }
        .page-loader-tagline {
          animation: pageLoaderFade 700ms cubic-bezier(0.22,1,0.36,1) 320ms both;
        }
        .page-loader-track {
          animation: pageLoaderTrackGrow 600ms cubic-bezier(0.22,1,0.36,1) 480ms both;
        }
        .page-loader-dots span {
          animation: pageLoaderDot 1.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .page-loader-bar,
          .page-loader-logo,
          .page-loader-title,
          .page-loader-shimmer,
          .page-loader-tagline,
          .page-loader-track,
          .page-loader-dots span { animation: none; }
        }
      `}</style>
    </div>
  );
}
