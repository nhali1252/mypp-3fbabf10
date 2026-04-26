/**
 * R2 coverage validation. Compares the auto-resync TABLE_TO_DOCS map against:
 *   1. The canonical "expected R2 docs" set (from r2-keys).
 *   2. The live database schema (every table in the public schema).
 *
 * Surfaces gaps in the admin UI so a new table never silently misses R2 sync.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { R2_KEYS, type R2ContentKey } from "./r2-keys";
import {
  TABLE_TO_DOCS,
  R2_EXCLUDED_TABLES,
  ALL_WATCHED_TABLES,
} from "./r2-coverage";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error("Role check failed");
  if (!data?.length) throw new Error("Forbidden — admin only");
}

export type CoverageReport = {
  ok: boolean;
  watchedCount: number;
  dbTableCount: number;
  /** Tables that exist in the DB but are neither watched nor explicitly excluded. */
  missingFromMap: string[];
  /** Tables in the watch map that no longer exist in the DB. */
  staleInMap: string[];
  /** Docs declared in r2-keys that have no table feeding them. */
  docsWithoutSource: R2ContentKey[];
  /** docKey → tables currently feeding it. */
  docToTables: Record<R2ContentKey, string[]>;
  /** Excluded tables actually present in the DB (for transparency). */
  excludedPresent: string[];
};

export const validateR2Coverage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CoverageReport> => {
    await assertAdmin(context.userId);

    const { data, error } = await supabaseAdmin.rpc("list_public_tables");
    if (error) throw new Error(`Schema introspection failed: ${error.message}`);

    const dbTables = new Set<string>(
      (data ?? []).map((r: any) => r.table_name as string),
    );

    const watched = new Set(ALL_WATCHED_TABLES);
    const excluded = R2_EXCLUDED_TABLES;

    const missingFromMap: string[] = [];
    const excludedPresent: string[] = [];
    for (const t of dbTables) {
      if (watched.has(t)) continue;
      if (excluded.has(t)) {
        excludedPresent.push(t);
        continue;
      }
      missingFromMap.push(t);
    }

    const staleInMap: string[] = [];
    for (const t of watched) {
      if (!dbTables.has(t)) staleInMap.push(t);
    }

    // Build doc → tables index.
    const docToTables = Object.fromEntries(
      (Object.keys(R2_KEYS) as R2ContentKey[]).map((k) => [k, [] as string[]]),
    ) as Record<R2ContentKey, string[]>;
    for (const [table, docs] of Object.entries(TABLE_TO_DOCS)) {
      for (const d of docs) docToTables[d].push(table);
    }
    const docsWithoutSource = (Object.keys(docToTables) as R2ContentKey[])
      .filter((k) => docToTables[k].length === 0);

    return {
      ok:
        missingFromMap.length === 0 &&
        staleInMap.length === 0 &&
        docsWithoutSource.length === 0,
      watchedCount: watched.size,
      dbTableCount: dbTables.size,
      missingFromMap: missingFromMap.sort(),
      staleInMap: staleInMap.sort(),
      docsWithoutSource,
      docToTables,
      excludedPresent: excludedPresent.sort(),
    };
  });
