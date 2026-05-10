import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, FormRow } from "@/components/admin/AdminPage";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useHeadingShimmer, HEADING_SHIMMER_DEFAULTS, type HeadingShimmerOverride } from "@/hooks/useHeadingShimmer";

/**
 * Manages per-route shimmer overrides. Each row can override any subset of
 * the global settings (enabled/intensity/sweep_size/speed_ms). Empty fields
 * inherit the site-wide defaults — set them only when a single page needs
 * to differ. Useful for e.g. dimming the shimmer on heavy gallery pages or
 * speeding it up on a launcher.
 */
export function HeadingShimmerOverridesCard() {
  const { overrides, data: defaults } = useHeadingShimmer();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<HeadingShimmerOverride[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newPath, setNewPath] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setDrafts(overrides);
  }, [overrides]);

  function patch(id: string, fields: Partial<HeadingShimmerOverride>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...fields } : d)));
  }

  async function saveRow(row: HeadingShimmerOverride) {
    setSavingId(row.id);
    const { error } = await (supabase as any)
      .from("heading_shimmer_overrides")
      .update({
        enabled: row.enabled,
        intensity: row.intensity,
        sweep_size: row.sweep_size,
        speed_ms: row.speed_ms,
        notes: row.notes,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success(`Override saved for ${row.path}`);
    qc.invalidateQueries({ queryKey: ["content", "chrome"] });
  }

  async function removeRow(row: HeadingShimmerOverride) {
    if (!confirm(`Remove shimmer override for ${row.path}?`)) return;
    const { error } = await (supabase as any)
      .from("heading_shimmer_overrides")
      .delete()
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Override removed");
    qc.invalidateQueries({ queryKey: ["content", "chrome"] });
  }

  async function createRow() {
    const p = newPath.trim();
    if (!p.startsWith("/")) {
      toast.error("Path must start with /");
      return;
    }
    if (drafts.some((d) => d.path === p)) {
      toast.error("An override for that path already exists");
      return;
    }
    setCreating(true);
    const { error } = await (supabase as any).from("heading_shimmer_overrides").insert({
      path: p,
      enabled: null,
      intensity: null,
      sweep_size: null,
      speed_ms: null,
      notes: null,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    setNewPath("");
    toast.success(`Override added for ${p}`);
    qc.invalidateQueries({ queryKey: ["content", "chrome"] });
  }

  return (
    <AdminCard title="Per-route overrides">
      <p className="text-xs text-muted-foreground mb-4">
        Override the global shimmer settings for specific routes. Leave a
        field <strong>empty</strong> to inherit the site-wide value
        (currently intensity {defaults.intensity}%, sweep {defaults.sweep_size}vw,
        speed {(defaults.speed_ms / 1000).toFixed(1)}s, {defaults.enabled ? "on" : "off"}).
        Longer paths beat shorter ones, so <code>/portfolio/sub</code> wins
        over <code>/portfolio</code>.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        <Input
          placeholder="/some/route"
          value={newPath}
          onChange={(e) => setNewPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createRow()}
          className="max-w-xs"
        />
        <button
          onClick={createRow}
          disabled={creating || !newPath.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm disabled:opacity-50"
        >
          <Plus size={14} /> Add override
        </button>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
          No per-route overrides. Add one above to tune a single page.
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((row) => (
            <OverrideRow
              key={row.id}
              row={row}
              defaults={HEADING_SHIMMER_DEFAULTS}
              saving={savingId === row.id}
              onChange={(f) => patch(row.id, f)}
              onSave={() => saveRow(row)}
              onRemove={() => removeRow(row)}
            />
          ))}
        </div>
      )}
    </AdminCard>
  );
}

function OverrideRow({
  row,
  defaults,
  saving,
  onChange,
  onSave,
  onRemove,
}: {
  row: HeadingShimmerOverride;
  defaults: typeof HEADING_SHIMMER_DEFAULTS;
  saving: boolean;
  onChange: (f: Partial<HeadingShimmerOverride>) => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <code className="text-sm font-semibold">{row.path}</code>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
          >
            <Save size={12} /> {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:border-destructive hover:text-destructive"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormRow
          label="Enabled"
          hint="Override the on/off state for this route. 'Inherit' uses the site default."
        >
          <div className="flex items-center gap-2">
            <select
              value={row.enabled === null ? "" : row.enabled ? "on" : "off"}
              onChange={(e) => {
                const v = e.target.value;
                onChange({ enabled: v === "" ? null : v === "on" });
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
            >
              <option value="">Inherit ({defaults.enabled ? "on" : "off"})</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
            <Switch
              checked={row.enabled ?? defaults.enabled}
              onCheckedChange={(v) => onChange({ enabled: v })}
            />
          </div>
        </FormRow>

        <NumberOverride
          label="Intensity (%)"
          value={row.intensity}
          placeholder={`${defaults.intensity}`}
          min={0}
          max={100}
          onChange={(v) => onChange({ intensity: v })}
        />
        <NumberOverride
          label="Sweep size (vw)"
          value={row.sweep_size}
          placeholder={`${defaults.sweep_size}`}
          min={50}
          max={600}
          onChange={(v) => onChange({ sweep_size: v })}
        />
        <NumberOverride
          label="Speed (ms)"
          value={row.speed_ms}
          placeholder={`${defaults.speed_ms}`}
          min={500}
          max={30000}
          onChange={(v) => onChange({ speed_ms: v })}
        />
      </div>

      <FormRow label="Notes" hint="Optional. Why this route differs.">
        <Input
          value={row.notes ?? ""}
          placeholder="e.g. dimmed on the gallery so artwork stands out"
          onChange={(e) => onChange({ notes: e.target.value || null })}
        />
      </FormRow>
    </div>
  );
}

function NumberOverride({
  label,
  value,
  placeholder,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | null;
  placeholder: string;
  min: number;
  max: number;
  onChange: (v: number | null) => void;
}) {
  return (
    <FormRow label={label} hint={`Inherit: ${placeholder}. Range ${min}–${max}.`}>
      <Input
        type="number"
        min={min}
        max={max}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          const n = Number(raw);
          if (!Number.isFinite(n)) return;
          onChange(Math.max(min, Math.min(max, Math.round(n))));
        }}
      />
    </FormRow>
  );
}
