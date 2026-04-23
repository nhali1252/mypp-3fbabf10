import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import {
  usePageLoaderSettings,
  PAGE_LOADER_DEFAULTS,
  type PageLoaderRoutesMap,
} from "@/hooks/usePageLoaderSettings";

export const Route = createFileRoute("/_admin/admin/page-loader")({
  component: PageLoaderAdmin,
});

type RouteRow = { path: string; label: string; tagline: string };

function toRows(map: PageLoaderRoutesMap): RouteRow[] {
  return Object.entries(map).map(([path, v]) => ({
    path,
    label: v.label ?? "",
    tagline: v.tagline ?? "",
  }));
}

function fromRows(rows: RouteRow[]): PageLoaderRoutesMap {
  const out: PageLoaderRoutesMap = {};
  for (const r of rows) {
    const p = r.path.trim();
    if (!p) continue;
    out[p] = { label: r.label, tagline: r.tagline };
  }
  return out;
}

function PageLoaderAdmin() {
  const { data, isLoading } = usePageLoaderSettings();
  const qc = useQueryClient();
  const [initialMs, setInitialMs] = useState(250);
  const [routeMs, setRouteMs] = useState(250);
  const [defaultLabel, setDefaultLabel] = useState("");
  const [defaultTagline, setDefaultTagline] = useState("");
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setInitialMs(data.initial_ms);
    setRouteMs(data.route_ms);
    setDefaultLabel(data.default_label);
    setDefaultTagline(data.default_tagline);
    setRows(toRows(data.routes));
  }, [data]);

  const knownPaths = useMemo(
    () => Object.keys(PAGE_LOADER_DEFAULTS.routes),
    [],
  );
  const missingPaths = knownPaths.filter((p) => !rows.some((r) => r.path === p));

  async function save() {
    if (!data?.id) {
      toast.error("Settings row missing");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("page_loader_settings")
      .update({
        initial_ms: Math.max(0, Math.min(10000, Math.round(initialMs))),
        route_ms: Math.max(0, Math.min(10000, Math.round(routeMs))),
        default_label: defaultLabel,
        default_tagline: defaultTagline,
        routes: fromRows(rows),
      })
      .eq("id", data.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Page loader updated");
    qc.invalidateQueries({ queryKey: ["page_loader_settings"] });
  }

  function addRow(path = "") {
    setRows((r) => [...r, { path, label: "", tagline: "" }]);
  }

  function updateRow(idx: number, patch: Partial<RouteRow>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  function resetDefaults() {
    setInitialMs(PAGE_LOADER_DEFAULTS.initial_ms);
    setRouteMs(PAGE_LOADER_DEFAULTS.route_ms);
    setDefaultLabel("");
    setDefaultTagline("");
    setRows(toRows(PAGE_LOADER_DEFAULTS.routes));
  }

  return (
    <AdminPage
      title="Page loading animation"
      description="Control how long the page loader stays on screen and the label/tagline shown for each page."
      actions={
        <>
          <button
            onClick={resetDefaults}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm"
          >
            <RotateCcw size={14} /> Reset to defaults
          </button>
          <button
            onClick={save}
            disabled={saving || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <AdminCard title="Timings">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormRow label="First-load duration (ms)" hint="Shown on initial site load. 250ms is snappy; 1000ms feels cinematic.">
            <input
              type="number"
              min={0}
              max={10000}
              value={initialMs}
              onChange={(e) => setInitialMs(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            />
          </FormRow>
          <FormRow label="Per-route duration (ms)" hint="Shown when navigating between pages.">
            <input
              type="number"
              min={0}
              max={10000}
              value={routeMs}
              onChange={(e) => setRouteMs(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            />
          </FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Default fallback text">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormRow label="Default label" hint="Shown when a route has no entry below.">
            <input
              type="text"
              value={defaultLabel}
              onChange={(e) => setDefaultLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
              placeholder="(empty)"
            />
          </FormRow>
          <FormRow label="Default tagline">
            <input
              type="text"
              value={defaultTagline}
              onChange={(e) => setDefaultTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
              placeholder="(empty)"
            />
          </FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Per-page text">
        <p className="text-xs text-muted-foreground mb-4">
          Path must match the route exactly (e.g. <code>/portfolio</code>). Admin routes
          all share the <code>/admin</code> entry.
        </p>

        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-[180px_1fr_1fr_auto] gap-2 items-center"
            >
              <input
                type="text"
                value={row.path}
                onChange={(e) => updateRow(idx, { path: e.target.value })}
                placeholder="/path"
                className="px-3 py-2 rounded-xl border border-border bg-background font-mono text-sm"
              />
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateRow(idx, { label: e.target.value })}
                placeholder="Label (e.g. Portfolio)"
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
              />
              <input
                type="text"
                value={row.tagline}
                onChange={(e) => updateRow(idx, { tagline: e.target.value })}
                placeholder="Tagline (e.g. Client work)"
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
              />
              <button
                onClick={() => removeRow(idx)}
                className="p-2 rounded-xl text-destructive hover:bg-destructive/10"
                aria-label="Remove row"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => addRow()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm"
          >
            <Plus size={14} /> Add page
          </button>
          {missingPaths.map((p) => (
            <button
              key={p}
              onClick={() => addRow(p)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:bg-muted"
            >
              <Plus size={12} /> {p}
            </button>
          ))}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
