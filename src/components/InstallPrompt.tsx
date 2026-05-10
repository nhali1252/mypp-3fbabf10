import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

/**
 * Lightweight A2HS (Add to Home Screen) prompt.
 * - Chrome / Edge / Android: captures `beforeinstallprompt` and shows an Install button.
 * - iOS Safari: shows a one-time hint with the Share → Add to Home Screen instructions
 *   (iOS doesn't fire beforeinstallprompt).
 * - Hidden inside iframes (Lovable preview) and when already installed.
 * - Dismissals are remembered in localStorage.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "install-prompt:dismissed";
const IOS_HINT_KEY = "install-prompt:ios-hint-dismissed";

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari exposes navigator.standalone
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(mq || iosStandalone);
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPad = /iPad|Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  return /iPhone|iPod/.test(ua) || iPad;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInIframe() || isStandalone()) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    setHidden(false);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installed = () => {
      setDeferred(null);
      setShowIosHint(false);
      localStorage.setItem(DISMISS_KEY, "1");
    };
    window.addEventListener("appinstalled", installed);

    // iOS hint after a short delay if not yet dismissed
    let iosTimer: number | undefined;
    if (isIOS() && !localStorage.getItem(IOS_HINT_KEY)) {
      iosTimer = window.setTimeout(() => setShowIosHint(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
    setShowIosHint(false);
  };

  const dismissIos = () => {
    localStorage.setItem(IOS_HINT_KEY, "1");
    setShowIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferred(null);
  };

  if (deferred) {
    return (
      <div className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/85 px-4 py-3 shadow-glow backdrop-blur-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.82_0.09_82)] to-[oklch(0.66_0.07_70)] text-background">
            <Download className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Install this portfolio</p>
            <p className="text-[11px] text-foreground/60">Quick access from your home screen.</p>
          </div>
          <div className="ml-2 flex items-center gap-1">
            <button
              onClick={install}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:opacity-90"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="rounded-lg p-1.5 text-foreground/60 transition hover:bg-white/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div className="fixed bottom-4 left-1/2 z-[80] w-[min(92vw,360px)] -translate-x-1/2 px-2">
        <div className="rounded-2xl border border-white/10 bg-background/85 p-4 shadow-glow backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.82_0.09_82)] to-[oklch(0.66_0.07_70)] text-background">
              <Share className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Add to Home Screen</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/70">
                Tap <Share className="mx-1 inline h-3 w-3 align-[-2px]" /> Share, then choose{" "}
                <span className="font-medium text-foreground">Add to Home Screen</span>.
              </p>
            </div>
            <button
              onClick={dismissIos}
              aria-label="Dismiss"
              className="rounded-lg p-1.5 text-foreground/60 transition hover:bg-white/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
