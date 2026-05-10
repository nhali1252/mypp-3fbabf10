import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, RotateCcw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { Switch } from "@/components/ui/switch";
import { useHeadingShimmer, HEADING_SHIMMER_DEFAULTS } from "@/hooks/useHeadingShimmer";

export const Route = createFileRoute("/_admin/admin/heading-shimmer")({
  component: HeadingShimmerAdmin,
});

function HeadingShimmerAdmin() {
  const { data, isLoading } = useHeadingShimmer();
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(true);
  const [intensity, setIntensity] = useState(70);
  const [sweepSize, setSweepSize] = useState(200);
  const [speedMs, setSpeedMs] = useState(4500);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setIntensity(data.intensity);
    setSweepSize(data.sweep_size);
    setSpeedMs(data.speed_ms);
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

  async function save() {
    if (!data?.id) {
      // Insert if missing (defensive — migration seeds one row)
      setSaving(true);
      const { error } = await (supabase as any)
        .from("heading_shimmer_settings")
        .insert({ enabled, intensity, sweep_size: sweepSize, speed_ms: speedMs });
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Heading shimmer saved");
      qc.invalidateQueries({ queryKey: ["content", "chrome"] });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("heading_shimmer_settings")
      .update({
        enabled,
        intensity: clamp(intensity, 0, 100),
        sweep_size: clamp(sweepSize, 100, 400),
        speed_ms: clamp(speedMs, 1000, 15000),
      })
      .eq("id", data.id);
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
  }

  return (
    <AdminPage
      title="Heading shimmer"
      description="Tune the gold animated effect applied to all section headings (h2/h3) across the site."
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
              When off, headings render as plain foreground text everywhere.
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
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
