import { useEffect } from "react";

/**
 * Registers the minimal service worker that makes the site installable
 * from Chrome / Edge's 3-dot menu ("Install app" / "Add to Home screen").
 *
 * Guarded so it never runs inside the Lovable editor preview iframe — a
 * service worker registered there would intercept future preview loads
 * and serve stale builds.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }

    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host.endsWith("lovable.dev");

    if (inIframe || isPreviewHost) {
      // Defensive cleanup: if a SW was ever registered in a preview
      // context, unregister it so it stops shadowing fresh builds.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      return;
    }

    // Register on idle so we never block the first paint.
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* swallow — installability is best-effort */
        });
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(register, { timeout: 4000 });
    } else {
      window.setTimeout(register, 1500);
    }
  }, []);

  return null;
}
