/**
 * Hybrid R2 auto-resync.
 *
 * Admin pages keep writing to Supabase tables (unchanged). This hook listens to
 * Supabase Realtime postgres_changes on every table that contributes to an R2
 * content document, debounces them by document, and asks the server to rebuild
 * just the affected JSON files. After a successful resync, the matching
 * React Query cache entries are invalidated so any open public tabs refetch.
 *
 * Failure handling:
 *  - The scope of a failed flush is preserved (re-added to `pendingDocs`) so the
 *    next sync attempt — automatic or via `retry()` — covers the same docs.
 *  - `consecutiveFailures` counts back-to-back errors; admin UI uses this to
 *    decide when to show a persistent alert (>= 2).
 *  - `failureHistory` keeps the last 5 errors with timestamp + scope for debug.
 *
 * Mounted once inside AdminLayout — does nothing for non-admin visitors.
 */
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { seedR2FromDatabase } from "@/server/seed-r2.functions";
import type { R2ContentKey } from "@/server/r2-keys";
import { TABLE_TO_DOCS, ALL_WATCHED_TABLES } from "@/server/r2-coverage";

const ALL_TABLES = ALL_WATCHED_TABLES;

const DEBOUNCE_MS = 1500;
const FAILURE_HISTORY_CAP = 5;
/** After this many back-to-back failures, the admin UI shows a persistent alert. */
export const FAILURE_ALERT_THRESHOLD = 2;
/** Minimum gap between successive manual `retry()` calls. */
export const RETRY_COOLDOWN_MS = 30_000;

export type R2SyncStatus = "idle" | "pending" | "syncing" | "ok" | "error";

export type R2SyncFailure = {
  at: Date;
  message: string;
  scope: R2ContentKey[];
};

export function useR2AutoResync() {
  const qc = useQueryClient();
  const seed = useServerFn(seedR2FromDatabase);

  const pendingDocs = useRef<Set<R2ContentKey>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  /** Tracks failure-state across renders so toasts only fire on transitions. */
  const wasFailing = useRef(false);

  const [status, setStatus] = useState<R2SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [failureHistory, setFailureHistory] = useState<R2SyncFailure[]>([]);
  const [lastFailedScope, setLastFailedScope] = useState<R2ContentKey[]>([]);
  /** Timestamp (ms) of the last manual retry attempt; gates the cooldown. */
  const [lastRetryAt, setLastRetryAt] = useState<number | null>(null);
  /** Seconds remaining before another retry is allowed; 0 when ready. */
  const [retryCooldownRemaining, setRetryCooldownRemaining] = useState(0);

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
      setLastFailedScope([]);
      // Reset failure counter on success and surface a recovery toast if we
      // were previously in a sustained failure state.
      if (wasFailing.current) {
        toast.success("R2 auto-resync recovered");
        wasFailing.current = false;
      }
      setConsecutiveFailures(0);
      // Invalidate matching public-side caches so open tabs refresh.
      scope.forEach((k) => qc.invalidateQueries({ queryKey: ["r2-content", k] }));
    } catch (e: any) {
      const message = e?.message ?? "Resync failed";
      setStatus("error");
      setError(message);
      setLastFailedScope(scope);
      // Re-queue the failed scope so subsequent flushes (auto or manual) cover it.
      scope.forEach((d) => pendingDocs.current.add(d));
      setConsecutiveFailures((n) => {
        const next = n + 1;
        if (next >= FAILURE_ALERT_THRESHOLD && !wasFailing.current) {
          wasFailing.current = true;
          toast.error(`R2 auto-resync failing (${next}× in a row)`, {
            description: message,
          });
        }
        return next;
      });
      setFailureHistory((prev) => {
        const entry: R2SyncFailure = { at: new Date(), message, scope };
        return [entry, ...prev].slice(0, FAILURE_HISTORY_CAP);
      });
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

  /** Retry the most recent failed scope (or full resync if unknown). */
  const retry = async () => {
    if (timer.current) clearTimeout(timer.current);
    if (lastFailedScope.length > 0) {
      lastFailedScope.forEach((d) => pendingDocs.current.add(d));
    } else if (pendingDocs.current.size === 0) {
      (Object.keys(TABLE_TO_DOCS) as string[])
        .flatMap((t) => TABLE_TO_DOCS[t])
        .forEach((d) => pendingDocs.current.add(d));
    }
    await flush();
  };

  /** Dismiss the persistent failure alert without retrying. */
  const dismissFailures = () => {
    setConsecutiveFailures(0);
    wasFailing.current = false;
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

  return {
    status,
    lastSyncedAt,
    error,
    syncNow,
    retry,
    dismissFailures,
    consecutiveFailures,
    failureHistory,
    lastFailedScope,
  };
}
