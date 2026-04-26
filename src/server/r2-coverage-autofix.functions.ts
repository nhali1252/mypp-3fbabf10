/**
 * Auto-fix suggestions for the R2 coverage report.
 *
 * Given a list of tables that exist in the database but aren't in the
 * auto-resync map, this returns a heuristic guess of the most likely
 * R2 doc each table should feed, plus an editable code snippet.
 *
 * `applySuggestions` will additionally try to rewrite `src/server/r2-coverage.ts`
 * in place. This works in dev (mutable filesystem) but is a no-op in the
 * production Worker bundle — the response always includes the snippet so the
 * admin can paste it manually if the write fails.
 */
import { createServerFn } from "@tanstack/react-start";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { R2_KEYS, type R2ContentKey } from "./r2-keys";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error("Role check failed");
  if (!data?.length) throw new Error("Forbidden — admin only");
}

/**
 * Heuristic: pick the most likely R2 doc(s) for a table name.
 * Returns an empty array when the table doesn't fit any known bucket —
 * the admin must decide manually (or add it to R2_EXCLUDED_TABLES).
 */
export function suggestDocsForTable(table: string): R2ContentKey[] {
  const t = table.toLowerCase();

  // Most-specific prefixes first.
  if (t.startsWith("f_")) return ["fPage"];
  if (t.startsWith("launcher_") || t === "launcher") return ["launcher"];
  if (t.startsWith("portfolio_")) return ["portfolio"];

  // Site-chrome family.
  if (
    t.startsWith("footer_") ||
    t.startsWith("nav_") ||
    t.startsWith("ticker") ||
    t.startsWith("seo_") ||
    t.startsWith("page_loader") ||
    t === "chrome"
  ) {
    return ["chrome"];
  }

  // Substring matches.
  if (t.includes("hero") || t.includes("site_settings")) return ["basicInfo"];
  if (t.includes("about") || t.includes("activit") || t.includes("educat")) {
    return ["about"];
  }
  if (t.includes("service")) return ["services"];
  if (t.includes("testimon") || t.includes("review")) return ["reviews"];
  if (t.includes("project")) return ["projects"];
  if (t.includes("contact")) return ["contact"];

  return [];
}

export type AutoFixSuggestion = {
  table: string;
  docs: R2ContentKey[];
  /** True when the heuristic is confident; false when admin should review. */
  confident: boolean;
  reason: string;
};

export type AutoFixResult = {
  suggestions: AutoFixSuggestion[];
  /** Code snippet ready to paste into TABLE_TO_DOCS. */
  snippet: string;
  /** True if every suggestion is confident — safe to auto-apply. */
  allConfident: boolean;
  /** Result of the file-write attempt, if `apply: true`. */
  applied?:
    | { ok: true; path: string; tablesAdded: string[] }
    | { ok: false; reason: string };
};

function buildSnippet(suggestions: AutoFixSuggestion[]): string {
  const lines = suggestions
    .filter((s) => s.docs.length > 0)
    .map((s) => {
      const docs = s.docs.map((d) => `"${d}"`).join(", ");
      const note = s.confident ? "" : " // review — low confidence";
      return `  ${s.table}: [${docs}],${note}`;
    });
  if (lines.length === 0) return "// No confident suggestions — review manually.";
  return lines.join("\n");
}

/** Insert each entry into TABLE_TO_DOCS just before the closing `};`. */
function rewriteCoverageSource(source: string, toAdd: AutoFixSuggestion[]): string {
  const marker = "export const TABLE_TO_DOCS";
  const start = source.indexOf(marker);
  if (start === -1) throw new Error("Could not locate TABLE_TO_DOCS in source");
  // Find the closing `};` that belongs to this object literal.
  const closeIdx = source.indexOf("\n};", start);
  if (closeIdx === -1) throw new Error("Could not locate end of TABLE_TO_DOCS");

  // Skip tables already present in source to keep the operation idempotent.
  const existing = source.slice(start, closeIdx);
  const insertions = toAdd.filter((s) => {
    if (s.docs.length === 0) return false;
    const re = new RegExp(`^\\s*${s.table}\\s*:`, "m");
    return !re.test(existing);
  });
  if (insertions.length === 0) return source;

  const block =
    insertions
      .map((s) => `  ${s.table}: [${s.docs.map((d) => `"${d}"`).join(", ")}],`)
      .join("\n") + "\n";

  return source.slice(0, closeIdx) + "\n" + block + source.slice(closeIdx);
}

export const suggestR2CoverageFix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        missingTables: z.array(z.string().min(1).max(100)).max(200),
        apply: z.boolean().optional(),
      })
      .parse,
  )
  .handler(async ({ data, context }): Promise<AutoFixResult> => {
    await assertAdmin(context.userId);

    const validDocs = new Set(Object.keys(R2_KEYS));
    const suggestions: AutoFixSuggestion[] = data.missingTables.map((table) => {
      const docs = suggestDocsForTable(table).filter((d) => validDocs.has(d));
      const confident = docs.length > 0;
      return {
        table,
        docs,
        confident,
        reason: confident
          ? `Matched naming pattern → ${docs.join(", ")}`
          : "No matching pattern — choose a doc manually or exclude the table.",
      };
    });

    const snippet = buildSnippet(suggestions);
    const allConfident =
      suggestions.length > 0 && suggestions.every((s) => s.confident);

    const result: AutoFixResult = { suggestions, snippet, allConfident };

    if (!data.apply) return result;
    if (!allConfident) {
      result.applied = {
        ok: false,
        reason: "Some suggestions are low-confidence — review and apply manually.",
      };
      return result;
    }

    // Try to rewrite the source file. Will fail in production Worker (read-only fs).
    const filePath = path.resolve(process.cwd(), "src/server/r2-coverage.ts");
    try {
      const source = await fs.readFile(filePath, "utf8");
      const updated = rewriteCoverageSource(source, suggestions);
      if (updated === source) {
        result.applied = {
          ok: true,
          path: filePath,
          tablesAdded: [],
        };
        return result;
      }
      await fs.writeFile(filePath, updated, "utf8");
      result.applied = {
        ok: true,
        path: filePath,
        tablesAdded: suggestions.filter((s) => s.docs.length > 0).map((s) => s.table),
      };
    } catch (e: any) {
      result.applied = {
        ok: false,
        reason:
          e?.code === "EROFS" || e?.code === "EACCES" || e?.code === "ENOENT"
            ? "Source filesystem is read-only in this environment — copy the snippet manually."
            : `Write failed: ${e?.message ?? String(e)}`,
      };
    }
    return result;
  });
