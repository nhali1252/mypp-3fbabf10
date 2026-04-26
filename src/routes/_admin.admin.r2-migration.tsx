import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { seedR2FromDatabase } from "@/server/seed-r2.functions";
import { getContent } from "@/server/r2.functions";
import { migrateMediaToR2 } from "@/server/migrate-media.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CloudUpload, CheckCircle2, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/r2-migration")({
  component: R2MigrationPage,
});

function R2MigrationPage() {
  const seed = useServerFn(seedR2FromDatabase);
  const fetchKey = useServerFn(getContent);
  const migrateMedia = useServerFn(migrateMediaToR2);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mediaResult, setMediaResult] = useState<any>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [previews, setPreviews] = useState<Record<string, any>>({});

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
