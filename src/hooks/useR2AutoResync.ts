/**
 * Hybrid R2 auto-resync.
 *
 * Admin pages keep writing to Supabase tables (unchanged). This hook listens to
 * Supabase Realtime postgres_changes on every table that contributes to an R2
 * content document, debounces them by document, and asks the server to rebuild
 * just the affected JSON files. After a successful resync, the matching
 * React Query cache entries are invalidated so any open public tabs refetch.
 *
 * Mounted once inside AdminLayout — does nothing for non-admin visitors.
 */
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { seedR2FromDatabase } from "@/server/seed-r2.functions";
import type { R2ContentKey } from "@/server/r2-keys";

/** Which R2 docs each watched table maps to. */
const TABLE_TO_DOCS: Record<string, R2ContentKey[]> = {
  hero_content: ["basicInfo"],
  about_content: ["about"],
  contact_settings: ["basicInfo", "contact"],
  site_settings: ["basicInfo"],
  activities: ["about"],
  education: ["about"],
  services: ["services"],
  testimonials: ["reviews"],
  projects: ["projects"],
  portfolio_folders: ["portfolio"],
  portfolio_items: ["portfolio"],
  nav_links: ["chrome"],
  footer_links: ["chrome"],
  footer_apps: ["chrome"],
  footer_cta: ["chrome"],
  ticker_items: ["chrome"],
  seo_settings: ["chrome"],
  page_loader_settings: ["chrome"],
  launcher_hero: ["launcher"],
  launcher_pages: ["launcher"],
  f_hero: ["fPage"],
  f_photocard: ["fPage"],
  f_skills: ["fPage"],
  f_projects: ["fPage"],
};

const ALL_TABLES = Object.keys(TABLE_TO_DOCS);

const DEBOUNCE_MS = 1500;

export type R2SyncStatus = "idle" | "pending" | "syncing" | "ok" | "error";

export function useR2AutoResync() {
  const qc = useQueryClient();
  const seed = useServerFn(seedR2FromDatabase);

  const pendingDocs = useRef<Set<R2ContentKey>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  const [status, setStatus] = useState<R2SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flush = async () => {
    if (inFlight.current) {
      // try again shortly so we don't drop the latest changes
      timer.current = setTimeout(flush, 600);
      return;
    }
    const scope = Array.from(pendingDocs.current);
    if (scope.length === 0) return;
    pendingDocs.current.clear();
    inFlight.current = true;
    setStatus("syncing");
    try {
      await seed({ data: { scope } });
      setStatus("ok");
      setError(null);
      setLastSyncedAt(new Date());
      // Invalidate matching public-side caches so open tabs refresh.
      scope.forEach((k) => qc.invalidateQueries({ queryKey: ["r2-content", k] }));
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Resync failed");
    } finally {
      inFlight.current = false;
      // If more changes accumulated while we were syncing, schedule another pass.
      if (pendingDocs.current.size > 0) {
        timer.current = setTimeout(flush, DEBOUNCE_MS);
      }
    }
  };

  const enqueue = (docs: R2ContentKey[]) => {
    docs.forEach((d) => pendingDocs.current.add(d));
    setStatus("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, DEBOUNCE_MS);
  };

  // Manual trigger ("Sync now" button)
  const syncNow = async () => {
    if (timer.current) clearTimeout(timer.current);
    if (pendingDocs.current.size === 0) {
      // Full resync
      (Object.keys(TABLE_TO_DOCS) as string[])
        .flatMap((t) => TABLE_TO_DOCS[t])
        .forEach((d) => pendingDocs.current.add(d));
    }
    await flush();
  };

  useEffect(() => {
    const channel = supabase.channel("r2-auto-resync");
    ALL_TABLES.forEach((table) => {
      (channel as any).on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: any) => {
          const docs = TABLE_TO_DOCS[payload.table as string];
          if (docs?.length) enqueue(docs);
        },
      );
    });
    channel.subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, lastSyncedAt, error, syncNow };
}
