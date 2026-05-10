import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Records anonymous page views to `page_views`. One insert per pathname.
 * Skips admin/auth pages and respects DoNotTrack.
 */
export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (navigator.doNotTrack === "1") return;
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/api/")
    ) return;

    // Throttle: don't record same path twice within 30s in this tab.
    const key = `pv:${pathname}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 30_000) return;
    sessionStorage.setItem(key, String(Date.now()));

    supabase.from("page_views").insert({
      path: pathname.slice(0, 500),
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
      user_agent: navigator.userAgent.slice(0, 500),
    }).then(() => {});
  }, [pathname]);

  return null;
}
