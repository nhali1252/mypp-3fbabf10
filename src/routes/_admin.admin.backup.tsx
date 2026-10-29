import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exportBackup, importBackup } from "@/lib/fns/backup.functions";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/backup")({ component: AdminBackup });

function AdminBackup() {
  const exp = useServerFn(exportBackup);
  const imp = useServerFn(importBackup);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [results, setResults] = useState<any[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function downloadBackup() {
    setBusy("export");
    try {
      const data = await exp();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (e: any) {
      toast.error(e.message ?? "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleFile(file: File) {
    setBusy("import");
    setResults(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed?.tables) throw new Error("Not a valid backup file");
      const res = await imp({ data: { payload: parsed, mode } });
      setResults(res.results);
      const failed = res.results.filter((r: any) => r.error);
      if (failed.length) toast.warning(`Restored with ${failed.length} table error(s)`);
      else toast.success("Backup restored");
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <AdminPage
      title="Backup & restore"
      description="Download a complete JSON snapshot of all editable content, or restore from one. Auth users, messages, and email logs are excluded."
    >
      <AdminCard title="Export">
        <p className="text-sm text-muted-foreground mb-3">
          Saves a portable JSON file containing every content table (settings, hero, about, portfolio, projects, services, footer, etc.).
        </p>
        <Button onClick={downloadBackup} disabled={busy !== null}>
          <Download className="w-4 h-4 mr-1.5" />
          {busy === "export" ? "Exporting…" : "Download backup"}
        </Button>
      </AdminCard>

      <AdminCard title="Restore">
        <FormRow label="Restore mode" hint="Merge upserts rows by id. Replace wipes each table before inserting — only use to roll back to a known-good snapshot.">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="merge">Merge (safe — upsert by id)</option>
            <option value="replace">Replace (destructive — wipe and insert)</option>
          </select>
        </FormRow>
        {mode === "replace" && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>Replace mode deletes existing rows in every content table before importing. There is no undo.</span>
          </div>
        )}
        <div className="pt-3">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            {busy === "import" ? "Restoring…" : "Choose backup file…"}
          </Button>
        </div>
        {results && (
          <div className="mt-4 rounded-lg border border-border bg-card/40 p-3 text-xs">
            <div className="font-semibold mb-2">Restore results</div>
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.table} className="flex justify-between">
                  <span className="font-mono">{r.table}</span>
                  <span className={r.error ? "text-destructive" : "text-muted-foreground"}>
                    {r.error ? `error: ${r.error}` : `${r.inserted} rows`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
