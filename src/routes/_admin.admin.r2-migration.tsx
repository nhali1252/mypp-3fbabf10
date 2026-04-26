import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { seedR2FromDatabase } from "@/server/seed-r2.functions";
import { getContent } from "@/server/r2.functions";
import { migrateMediaToR2 } from "@/server/migrate-media.functions";
import { validateR2Coverage, type CoverageReport } from "@/server/r2-coverage.functions";
import {
  suggestR2CoverageFix,
  type AutoFixResult,
} from "@/server/r2-coverage-autofix.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2, CloudUpload, CheckCircle2, Image as ImageIcon, ShieldCheck,
  AlertTriangle, Wand2, Copy,
} from "lucide-react";

export const Route = createFileRoute("/_admin/admin/r2-migration")({
  component: R2MigrationPage,
});

function R2MigrationPage() {
  const seed = useServerFn(seedR2FromDatabase);
  const fetchKey = useServerFn(getContent);
  const migrateMedia = useServerFn(migrateMediaToR2);
  const checkCoverage = useServerFn(validateR2Coverage);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mediaResult, setMediaResult] = useState<any>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [previews, setPreviews] = useState<Record<string, any>>({});
  const [coverage, setCoverage] = useState<CoverageReport | null>(null);
  const [coverageBusy, setCoverageBusy] = useState(false);
  const suggestFix = useServerFn(suggestR2CoverageFix);
  const [autoFix, setAutoFix] = useState<AutoFixResult | null>(null);
  const [autoFixBusy, setAutoFixBusy] = useState<"none" | "suggest" | "apply">("none");

  const runSuggestFix = async (apply: boolean) => {
    if (!coverage || coverage.missingFromMap.length === 0) return;
    setAutoFixBusy(apply ? "apply" : "suggest");
    try {
      const res = await suggestFix({
        data: { missingTables: coverage.missingFromMap, apply },
      });
      setAutoFix(res);
      if (apply) {
        if (res.applied?.ok && res.applied.tablesAdded.length > 0) {
          toast.success(`Applied ${res.applied.tablesAdded.length} entries to r2-coverage.ts`);
          // Re-run coverage to confirm the gap closed (in dev where the file write succeeded).
          await runCoverage();
        } else if (res.applied?.ok) {
          toast.info("All suggested entries already present");
        } else {
          toast.warning(res.applied?.reason ?? "Could not auto-apply");
        }
      } else if (res.suggestions.every((s) => !s.confident)) {
        toast.warning("No confident suggestions — review manually");
      } else {
        toast.success(`Suggested ${res.suggestions.filter((s) => s.confident).length} mapping(s)`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Auto-fix failed");
    } finally {
      setAutoFixBusy("none");
    }
  };

  const copySnippet = async () => {
    if (!autoFix?.snippet) return;
    try {
      await navigator.clipboard.writeText(autoFix.snippet);
      toast.success("Snippet copied");
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  const runCoverage = async () => {
    setCoverageBusy(true);
    try {
      const res = await checkCoverage();
      setCoverage(res);
      if (res.ok) toast.success("Coverage OK — every table is mapped");
      else toast.warning(
        `Coverage issues: ${res.missingFromMap.length} unmapped, ${res.staleInMap.length} stale`,
      );
    } catch (e: any) {
      toast.error(e.message ?? "Coverage check failed");
    } finally {
      setCoverageBusy(false);
    }
  };

  const runSeed = async () => {
    setBusy(true);
    try {
      const res = await seed({ data: {} });
      setResult(res);
      toast.success(`Seeded R2 — ${res.counts.projects} projects, ${res.counts.portfolio} folders`);
    } catch (e: any) {
      toast.error(e.message ?? "Seed failed");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (key: any) => {
    try {
      const res = await fetchKey({ data: { key } });
      setPreviews((p) => ({ ...p, [key]: res.data }));
      toast.success(`Loaded ${key}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const runMediaMigration = async () => {
    setMediaBusy(true);
    try {
      const res = await migrateMedia();
      setMediaResult(res);
      if (res.errors.length) {
        toast.warning(`Migrated ${res.filesCopied} file(s) with ${res.errors.length} error(s)`);
      } else {
        toast.success(`Migrated ${res.filesCopied} file(s), rewrote ${res.rowsRewritten} row(s)`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Media migration failed");
    } finally {
      setMediaBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">R2 Migration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          One-time export of current database content into Cloudflare R2 JSON files.
          Safe to re-run — overwrites the JSON files in R2 from the live database.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/15 text-primary">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold">Migrate legacy media files to R2</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Finds every image URL still pointing at the old Supabase <code>media</code> bucket,
              copies the file into R2, and rewrites the DB row to use the new R2 URL.
              Run this <strong>before</strong> dropping the legacy bucket.
            </p>
            <Button onClick={runMediaMigration} disabled={mediaBusy} className="mt-4">
              {mediaBusy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Migrating…</> : "Migrate media"}
            </Button>
            {mediaResult && (
              <div className="mt-4 p-3 rounded-lg bg-primary/10 text-sm space-y-1">
                <div>Files copied: <strong>{mediaResult.filesCopied}</strong></div>
                <div>Rows rewritten: <strong>{mediaResult.rowsRewritten}</strong></div>
                <div>Unique URLs: <strong>{mediaResult.uniqueUrls}</strong></div>
                {mediaResult.errors.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-destructive">{mediaResult.errors.length} error(s)</summary>
                    <pre className="mt-2 text-[11px] whitespace-pre-wrap">{mediaResult.errors.join("\n")}</pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/15 text-primary">
            <CloudUpload className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold">Seed R2 from current database</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Writes <code>content/basic-info.json</code>, <code>about.json</code>,
              <code>portfolio.json</code>, <code>projects.json</code>, <code>services.json</code>,
              <code>contact.json</code>, and <code>reviews.json</code> to your R2 bucket.
            </p>
            <Button onClick={runSeed} disabled={busy} className="mt-4">
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Seeding…</> : "Run seed"}
            </Button>
            {result && (
              <div className="mt-4 p-3 rounded-lg bg-primary/10 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Seeded — projects: {result.counts.projects}, portfolio folders: {result.counts.portfolio},
                services: {result.counts.services}, reviews: {result.counts.reviews}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className={`grid place-items-center w-12 h-12 rounded-xl ${
            coverage && !coverage.ok
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/15 text-primary"
          }`}>
            {coverage && !coverage.ok
              ? <AlertTriangle className="w-6 h-6" />
              : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <h2 className="font-bold">Auto-resync coverage check</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Validates that every public table in the database is either watched by the
              auto-resync map or explicitly excluded. Run after creating new tables to
              avoid silent gaps in R2 JSON.
            </p>
            <Button onClick={runCoverage} disabled={coverageBusy} className="mt-4" variant="outline">
              {coverageBusy
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking…</>
                : "Run coverage check"}
            </Button>

            {coverage && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>DB tables: <strong className="text-foreground">{coverage.dbTableCount}</strong></span>
                  <span>Watched: <strong className="text-foreground">{coverage.watchedCount}</strong></span>
                  <span>Excluded: <strong className="text-foreground">{coverage.excludedPresent.length}</strong></span>
                </div>

                {coverage.ok ? (
                  <div className="p-3 rounded-lg bg-primary/10 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    All tables are mapped — no gaps detected.
                  </div>
                ) : (
                  <>
                    {coverage.missingFromMap.length > 0 && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <div className="font-semibold text-destructive mb-1">
                          {coverage.missingFromMap.length} table(s) missing from auto-resync map
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5">
                          {coverage.missingFromMap.map((t) => (
                            <li key={t}><code className="text-xs">{t}</code></li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                          Add these to <code>TABLE_TO_DOCS</code> in
                          {" "}<code>src/server/r2-coverage.ts</code> (and to the seed function),
                          or list them in <code>R2_EXCLUDED_TABLES</code> if they should not feed R2.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runSuggestFix(false)}
                            disabled={autoFixBusy !== "none"}
                          >
                            {autoFixBusy === "suggest"
                              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Suggesting…</>
                              : <><Wand2 className="w-3.5 h-3.5 mr-1.5" /> Suggest mappings</>}
                          </Button>
                          {autoFix && autoFix.allConfident && (
                            <Button
                              size="sm"
                              onClick={() => runSuggestFix(true)}
                              disabled={autoFixBusy !== "none"}
                            >
                              {autoFixBusy === "apply"
                                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Applying…</>
                                : <>Apply auto-fix</>}
                            </Button>
                          )}
                        </div>

                        {autoFix && (
                          <div className="mt-3 space-y-2">
                            <div className="rounded-lg bg-background/60 border border-border p-2 space-y-1">
                              {autoFix.suggestions.map((s) => (
                                <div key={s.table} className="flex items-start gap-2 text-xs">
                                  <code className="font-mono">{s.table}</code>
                                  <span className="text-muted-foreground">→</span>
                                  {s.docs.length > 0 ? (
                                    <code className={s.confident ? "text-primary" : "text-amber-500"}>
                                      [{s.docs.join(", ")}]
                                    </code>
                                  ) : (
                                    <span className="text-amber-500 italic">no guess — review</span>
                                  )}
                                </div>
                              ))}
                            </div>

                            <details>
                              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                Snippet to paste into <code>TABLE_TO_DOCS</code>
                                <button
                                  onClick={(e) => { e.preventDefault(); copySnippet(); }}
                                  className="inline-flex items-center gap-1 text-xs underline"
                                >
                                  <Copy className="w-3 h-3" /> copy
                                </button>
                              </summary>
                              <pre className="mt-2 p-3 rounded-lg bg-muted text-[11px] overflow-auto">
{autoFix.snippet}
                              </pre>
                            </details>

                            {autoFix.applied && (
                              <div
                                className={`text-xs p-2 rounded-md ${
                                  autoFix.applied.ok
                                    ? "bg-primary/10 text-foreground"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {autoFix.applied.ok ? (
                                  <>
                                    ✓ Wrote{" "}
                                    {autoFix.applied.tablesAdded.length > 0
                                      ? <><strong>{autoFix.applied.tablesAdded.length}</strong> entry/entries to <code>r2-coverage.ts</code></>
                                      : <>no changes — entries already present</>}
                                  </>
                                ) : (
                                  <>⚠ {autoFix.applied.reason}</>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {coverage.staleInMap.length > 0 && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <div className="font-semibold text-destructive mb-1">
                          {coverage.staleInMap.length} stale entry/entries in map (table no longer exists)
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5">
                          {coverage.staleInMap.map((t) => (
                            <li key={t}><code className="text-xs">{t}</code></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {coverage.docsWithoutSource.length > 0 && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="font-semibold mb-1">
                          {coverage.docsWithoutSource.length} R2 doc(s) with no source table
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5">
                          {coverage.docsWithoutSource.map((d) => (
                            <li key={d}><code className="text-xs">{d}</code></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                <details>
                  <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                    View doc → tables map
                  </summary>
                  <div className="mt-2 space-y-1 text-xs">
                    {Object.entries(coverage.docToTables).map(([doc, tables]) => (
                      <div key={doc} className="flex gap-2">
                        <code className="text-primary min-w-[100px]">{doc}</code>
                        <span className="text-muted-foreground">{tables.join(", ") || "—"}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold mb-3">Verify R2 reads</h2>
        <div className="flex flex-wrap gap-2">
          {(["basicInfo", "about", "portfolio", "projects", "services", "contact", "reviews"] as const).map((k) => (
            <Button key={k} variant="outline" size="sm" onClick={() => verify(k)}>{k}</Button>
          ))}
        </div>
        {Object.entries(previews).map(([k, v]) => (
          <details key={k} className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold">{k}</summary>
            <pre className="mt-2 p-3 rounded-lg bg-muted text-[11px] overflow-auto max-h-60">
              {JSON.stringify(v, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </div>
  );
}
