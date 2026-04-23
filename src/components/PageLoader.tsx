import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useContent";

/**
 * Buttery, professional full-screen brand loader.
 *
 * - Shows on first load until the document is ready.
 * - Re-shows briefly on every route change so each page has its own intro.
 * - Wordmark + tagline adapt per-route (Launcher / Basic / Skills / Projects).
 */
const EXPECTED_LOADER_MS = 250;

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
  initialMs = 250,
  routeMs = 250,
}: {
  initialMs?: number;
  routeMs?: number;
}) {
  // Dev-only sanity check: warn loudly if defaults drift from the configured value.
  if (import.meta.env?.DEV) {
    console.assert(
      initialMs === EXPECTED_LOADER_MS && routeMs === EXPECTED_LOADER_MS,
      `[PageLoader] Expected ${EXPECTED_LOADER_MS}ms timings, got initialMs=${initialMs}, routeMs=${routeMs}`,
    );
  }
  const [show, setShow] = useState(true);
  const [hiding, setHiding] = useState(false);
  const { data: settings } = useSiteSettings();
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
    const routeStart = performance.now();
    const t1 = window.setTimeout(() => {
      setHiding(true);
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
    "/basic": { label: "Basic info", tagline: "About · Education · Activities" },
    "/about-and-skills": { label: "Skills & About", tagline: "Design · Tools · Workflow" },
    "/portfolio": { label: "Portfolio", tagline: "Client & design work" },
    "/projects": { label: "Projects", tagline: "Personal & code projects" },
    "/services": { label: "Services", tagline: "What I offer" },
    "/services-design": { label: "Design Services", tagline: "Branding · Identity · Print" },
    "/contact": { label: "Contact", tagline: "Start a project" },
    "/auth": { label: "Sign in", tagline: "Admin access" },
    "/reset-password": { label: "Reset password", tagline: "Account recovery" },
    // Legacy short-key routes still supported
    "/B": { label: "Basic info", tagline: "About · Education · Activities" },
    "/F": { label: "Skills & About", tagline: "Design · Tools · Workflow" },
    "/P": { label: "Projects", tagline: "Selected work & case studies" },
  };
  // Admin routes share one label
  const isAdmin = pathname.startsWith("/admin");
  const siteName = settings?.site_name?.trim() || "Portfolio";
  const match = isAdmin
    ? { label: "Admin", tagline: "Content management" }
    : (routeMap[pathname] ?? { label: "", tagline: "" });
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
