import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useContent";

/**
 * Full-screen brand loader inspired by the tajtas.alii.uk intro:
 * soft glow + wordmark + tagline + sliding gold loader bar.
 * Uses the site's own logo + site_name (no hardcoded "TasTaj").
 */
export function PageLoader({ minDurationMs = 220 }: { minDurationMs?: number }) {
  const [show, setShow] = useState(true);
  const [hiding, setHiding] = useState(false);
  const { data: settings } = useSiteSettings();

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

    const safety = window.setTimeout(finish, minDurationMs + 350);
    return () => {
      document.removeEventListener("DOMContentLoaded", finish);
      window.clearTimeout(safety);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, [minDurationMs]);

  if (!show) return null;

  const rawName =
    settings?.site_name?.trim() ||
    settings?.site_title?.split("—")[0]?.trim() ||
    "Portfolio";

  // Split "FirstWord RestOfName" so we can color the tail in gold (TasTaj style)
  const parts = rawName.split(" ");
  const head = parts.length > 1 ? parts.slice(0, -1).join(" ") : rawName;
  const tail = parts.length > 1 ? " " + parts[parts.length - 1] : "";

  const tagline =
    settings?.hero_subtitle?.trim() || "Crafting timeless digital stories";

  return (
    <div
      aria-hidden={hiding}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${
        hiding ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Soft top glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full blur-[120px]"
          style={{ background: "oklch(0.72 0.07 78 / 0.18)" }}
        />
      </div>

      <div className="relative flex flex-col items-center text-center px-6">
        {settings?.logo_url ? (
          <img
            src={settings.logo_url}
            alt=""
            className="mb-5 h-14 w-14 md:h-16 md:w-16 rounded-2xl object-cover border border-white/10 shadow-glow"
          />
        ) : null}

        <div className="font-serif-display italic text-5xl sm:text-6xl tracking-tight select-none">
          <span className="text-foreground">{head}</span>
          {tail && (
            <span className="bg-gradient-to-r from-[oklch(0.82_0.09_82)] to-[oklch(0.66_0.07_70)] bg-clip-text text-transparent">
              {tail}
            </span>
          )}
        </div>

        <p className="mt-3 text-[10px] uppercase tracking-[0.4em] text-foreground/60">
          {tagline}
        </p>

        <div className="mt-8 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
          <div className="page-loader-bar h-full w-1/3 bg-gradient-to-r from-transparent via-[oklch(0.78_0.08_80)] to-transparent" />
        </div>
      </div>

      <style>{`
        @keyframes pageLoaderSlide {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
        .page-loader-bar {
          animation: pageLoaderSlide 0.7s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .page-loader-bar { animation: none; }
        }
      `}</style>
    </div>
  );
}
