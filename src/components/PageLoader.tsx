import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useContent";

/**
 * Full-screen brand loader inspired by the tajtas.alii.uk intro:
 * soft glow + wordmark + tagline + sliding gold loader bar.
 * Wordmark adapts per-route so each page gets its own intro.
 */
export function PageLoader({ minDurationMs = 3000 }: { minDurationMs?: number }) {
  const [show, setShow] = useState(true);
  const [hiding, setHiding] = useState(false);
  const { data: settings } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const start = performance.now();
    let done = false;
    let hideTimer: number | undefined;
    let removeTimer: number | undefined;

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = performance.now() - start;
      const wait = Math.max(0, minDurationMs - elapsed);
      hideTimer = window.setTimeout(() => {
        setHiding(true);
        removeTimer = window.setTimeout(() => setShow(false), 180);
      }, wait);
    };

    if (document.readyState === "interactive" || document.readyState === "complete") {
      finish();
    } else {
      document.addEventListener("DOMContentLoaded", finish, { once: true });
    }

    const safety = window.setTimeout(finish, minDurationMs + 400);
    return () => {
      document.removeEventListener("DOMContentLoaded", finish);
      window.clearTimeout(safety);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, [minDurationMs]);

  if (!show) return null;

  // Don't render the loader text until we have real branding from the DB,
  // so users never see a generic fallback flash.
  const siteName = settings?.site_name?.trim();
  if (!siteName) return null;

  // Resolve a per-page wordmark so each route's intro matches the page name.
  const routeMap: Record<string, { label: string; tagline: string }> = {
    "/": { label: "Launcher", tagline: "Pick a page to explore" },
    "/B": { label: "Basic info", tagline: "About · Education · Activities" },
    "/F": { label: "Skills & About", tagline: "Design · Tools · Workflow" },
    "/P": { label: "Projects", tagline: "Selected work & case studies" },
  };
  const match = routeMap[pathname] ?? { label: siteName, tagline: "" };

  // Display "<SiteName> — <PageLabel>" with the page label highlighted in gold.
  const head = siteName;
  const tail = match.label ? ` ${match.label}` : "";

  const tagline =
    match.tagline ||
    settings?.hero_subtitle?.trim() ||
    "Crafting timeless digital stories";

  return (
    <div
      aria-hidden={hiding}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-200 ${
        hiding ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[360px] w-[360px] rounded-full blur-[100px]"
          style={{ background: "oklch(0.72 0.07 78 / 0.14)" }}
        />
      </div>

      <div className="relative flex flex-col items-center text-center px-6">
        {settings?.logo_url ? (
          <img
            src={settings.logo_url}
            alt=""
            className="mb-4 h-12 w-12 md:h-14 md:w-14 rounded-2xl object-cover border border-white/10 shadow-glow"
          />
        ) : null}

        <div className="font-serif-display italic text-4xl sm:text-5xl tracking-tight select-none">
          <span className="text-foreground">{head}</span>
          {tail && (
            <span className="bg-gradient-to-r from-[oklch(0.82_0.09_82)] to-[oklch(0.66_0.07_70)] bg-clip-text text-transparent">
              {tail}
            </span>
          )}
        </div>

        <p className="mt-2 text-[9px] uppercase tracking-[0.34em] text-foreground/55">
          {tagline}
        </p>

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
          animation: pageLoaderSlide 0.5s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .page-loader-bar { animation: none; }
        }
      `}</style>
    </div>
  );
}
