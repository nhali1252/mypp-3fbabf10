import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, RotateCcw, Sparkles, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useHeadingShimmer, HEADING_SHIMMER_DEFAULTS } from "@/hooks/useHeadingShimmer";

export const Route = createFileRoute("/_admin/admin/heading-shimmer")({
  component: HeadingShimmerAdmin,
});

// All public top-level pages that ship with the site. Used to render the
// per-page toggle list. Custom paths can still be added via the input below.
const KNOWN_PAGES: Array<{ path: string; label: string }> = [
  { path: "/", label: "Home (launcher)" },
  { path: "/basic", label: "Basic info" },
  { path: "/about-and-skills", label: "About & Skills" },
  { path: "/portfolio", label: "Portfolio" },
  { path: "/projects", label: "Projects" },
  { path: "/services", label: "Services" },
  { path: "/contact", label: "Contact" },
  { path: "/reviews", label: "Reviews" },
  { path: "/feed", label: "Feed" },
];

function HeadingShimmerAdmin() {
  const { data, isLoading } = useHeadingShimmer();
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(true);
  const [intensity, setIntensity] = useState(70);
  const [sweepSize, setSweepSize] = useState(200);
  const [speedMs, setSpeedMs] = useState(4500);
  const [disabledPaths, setDisabledPaths] = useState<string[]>([]);
  const [customPath, setCustomPath] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setIntensity(data.intensity);
    setSweepSize(data.sweep_size);
    setSpeedMs(data.speed_ms);
    setDisabledPaths(data.disabled_paths);
  }, [data]);

  // Live preview: write the values straight to :root so the user sees
  // the effect on this page (and the preview <h2> below) before saving.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--shimmer-sweep-size", `${sweepSize}%`);
    root.style.setProperty("--shimmer-speed", `${speedMs}ms`);
    root.style.setProperty("--shimmer-intensity", `${intensity}%`);
    if (enabled) root.removeAttribute("data-shimmer");
    else root.setAttribute("data-shimmer", "off");
  }, [enabled, intensity, sweepSize, speedMs]);

  const customPaths = useMemo(
    () => disabledPaths.filter((p) => !KNOWN_PAGES.some((k) => k.path === p)),
    [disabledPaths],
  );

  function togglePath(path: string, off: boolean) {
    setDisabledPaths((prev) => {
      const set = new Set(prev);
      if (off) set.add(path);
      else set.delete(path);
      return Array.from(set);
    });
  }

  function addCustomPath() {
    const p = customPath.trim();
    if (!p.startsWith("/")) {
      toast.error("Path must start with /");
      return;
    }
    if (disabledPaths.includes(p)) return;
    setDisabledPaths((prev) => [...prev, p]);
    setCustomPath("");
  }

  async function save() {
    const payload = {
      enabled,
      intensity: clamp(intensity, 0, 100),
      sweep_size: clamp(sweepSize, 100, 400),
      speed_ms: clamp(speedMs, 1000, 15000),
      disabled_paths: disabledPaths,
    };
    setSaving(true);
    const q: any = data?.id
      ? (supabase as any).from("heading_shimmer_settings").update(payload).eq("id", data.id)
      : (supabase as any).from("heading_shimmer_settings").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Heading shimmer saved");
    qc.invalidateQueries({ queryKey: ["content", "chrome"] });
  }

  function resetDefaults() {
    setEnabled(HEADING_SHIMMER_DEFAULTS.enabled);
    setIntensity(HEADING_SHIMMER_DEFAULTS.intensity);
    setSweepSize(HEADING_SHIMMER_DEFAULTS.sweep_size);
    setSpeedMs(HEADING_SHIMMER_DEFAULTS.speed_ms);
    setDisabledPaths([]);
  }

  return (
    <AdminPage
      title="Heading shimmer"
      description="Tune the gold animated effect applied to all section headings (h1/h2/h3) and pick which pages should use a plain style instead."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      }
    >
      <AdminCard title="Master switch">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">Enable heading shimmer</div>
            <div className="text-xs text-muted-foreground">
              When off, headings render as plain foreground text on every page.
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </AdminCard>

      <AdminCard title="Per-page style">
        <p className="text-xs text-muted-foreground mb-4">
          For each page, choose <strong>Gold shimmer</strong> (default animated
          treatment) or <strong>Plain</strong> (solid foreground text). Pages
          set to Plain still respect the master switch above.
        </p>
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {KNOWN_PAGES.map((page) => {
            const off = disabledPaths.includes(page.path);
            return (
              <div key={page.path} className="flex items-center justify-between gap-4 px-4 py-3 bg-card">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{page.label}</div>
                  <code className="text-xs text-muted-foreground">{page.path}</code>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold ${off ? "text-muted-foreground" : "text-primary"}`}>
                    {off ? "Plain" : "Gold shimmer"}
                  </span>
                  <Switch checked={!off} onCheckedChange={(on) => togglePath(page.path, !on)} />
                </div>
              </div>
            );
          })}
        </div>

        {customPaths.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Custom paths (forced to Plain)
            </div>
            <div className="flex flex-wrap gap-2">
              {customPaths.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePath(p, false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs hover:bg-muted"
                  title="Remove"
                >
                  <code>{p}</code>
                  <Trash2 size={12} className="text-destructive" />
                </button>
              ))}
            </div>
          </div>
        )}

        <FormRow
          label="Add a custom page path"
          hint="Use this for routes not listed above (e.g. /portfolio/some-folder). Matches the path and any sub-routes."
        >
          <div className="flex gap-2">
            <Input
              placeholder="/some/path"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomPath()}
            />
            <button
              onClick={addCustomPath}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </FormRow>
      </AdminCard>

      <AdminCard title="Look & feel">
        <div className="grid gap-6">
          <FormRow
            label={`Intensity — ${intensity}%`}
            hint="0% = body color (no gold). 100% = full primary gold at the mid-stop. Higher = more golden."
          >
            <input
              type="range"
              min={0}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </FormRow>

          <FormRow
            label={`Sweep size — ${sweepSize}%`}
            hint="Width of the gold band. 100% = tight band, 400% = very wide soft sweep. Sweet spot 180–240%."
          >
            <input
              type="range"
              min={100}
              max={400}
              step={10}
              value={sweepSize}
              onChange={(e) => setSweepSize(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </FormRow>

          <FormRow
            label={`Speed — ${(speedMs / 1000).toFixed(1)}s per cycle`}
            hint="Time for one full shimmer pass. Lower = faster. Disabled by the user's reduced-motion setting."
          >
            <input
              type="range"
              min={1000}
              max={15000}
              step={250}
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Live preview">
        <p className="text-xs text-muted-foreground mb-4 inline-flex items-center gap-1.5">
          <Sparkles size={12} /> Sliders update the preview immediately. Click
          "Save changes" to apply site-wide.
        </p>
        <div className="rounded-2xl border border-border p-8 bg-background">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Section heading example
          </h2>
          <h3 className="mt-4 text-2xl font-bold">A smaller subheading.</h3>
        </div>
      </AdminCard>
    </AdminPage>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
