import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useHeadingShimmer,
  HEADING_SHIMMER_DEFAULTS,
  type HeadingShimmer,
  type HeadingShimmerOverride,
} from "@/hooks/useHeadingShimmer";

/**
 * Shape of the JSON file produced by Export and consumed by Import. Kept
 * intentionally small and stable — bump `version` on breaking changes.
 */
type ShimmerExport = {
  version: 1;
  exportedAt: string;
  settings: {
    enabled: boolean;
    intensity: number;
    sweep_size: number;
    speed_ms: number;
    disabled_paths: string[];
  };
  overrides: Array<{
    path: string;
    enabled: boolean | null;
    intensity: number | null;
    sweep_size: number | null;
    speed_ms: number | null;
    notes: string | null;
  }>;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function coerceSettings(raw: any): ShimmerExport["settings"] {
  const d = HEADING_SHIMMER_DEFAULTS;
  return {
    enabled: typeof raw?.enabled === "boolean" ? raw.enabled : d.enabled,
    intensity: clamp(Number(raw?.intensity ?? d.intensity), 0, 100),
    sweep_size: clamp(Number(raw?.sweep_size ?? d.sweep_size), 100, 400),
    speed_ms: clamp(Number(raw?.speed_ms ?? d.speed_ms), 1000, 15000),
    disabled_paths: Array.isArray(raw?.disabled_paths)
      ? raw.disabled_paths.filter((p: unknown): p is string => typeof p === "string" && p.startsWith("/"))
      : [],
  };
}

function coerceOverride(raw: any): ShimmerExport["overrides"][number] | null {
  if (!raw || typeof raw.path !== "string" || !raw.path.startsWith("/")) return null;
  const numOrNull = (v: unknown, lo: number, hi: number) =>
    v == null || v === "" ? null : clamp(Number(v), lo, hi);
  return {
    path: raw.path,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : null,
    intensity: numOrNull(raw.intensity, 0, 100),
    sweep_size: numOrNull(raw.sweep_size, 100, 400),
    speed_ms: numOrNull(raw.speed_ms, 1000, 15000),
    notes: typeof raw.notes === "string" ? raw.notes : null,
  };
}

export function HeadingShimmerImportExport({
  currentSettings,
}: {
  /** Optional unsaved draft from the admin form. Falls back to the loaded data. */
  currentSettings?: Partial<HeadingShimmer>;
}) {
  const { data, overrides } = useHeadingShimmer();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  function downloadExport() {
    setBusy("export");
    try {
      const merged: HeadingShimmer = { ...data, ...(currentSettings ?? {}) };
      const payload: ShimmerExport = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {
          enabled: merged.enabled,
          intensity: merged.intensity,
          sweep_size: merged.sweep_size,
          speed_ms: merged.speed_ms,
          disabled_paths: merged.disabled_paths ?? [],
        },
        overrides: overrides.map((o) => ({
          path: o.path,
          enabled: o.enabled,
          intensity: o.intensity,
          sweep_size: o.sweep_size,
          speed_ms: o.speed_ms,
          notes: o.notes,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `heading-shimmer-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Configuration exported");
    } catch (e: any) {
      toast.error(`Export failed: ${e?.message ?? e}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleFile(file: File) {
    setBusy("import");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || (parsed.version && parsed.version !== 1)) {
        throw new Error(`Unsupported export version: ${parsed?.version}`);
      }
      const settings = coerceSettings(parsed.settings ?? parsed);
      const rawOverrides: any[] = Array.isArray(parsed.overrides) ? parsed.overrides : [];
      const importedOverrides = rawOverrides
        .map(coerceOverride)
        .filter((o): o is NonNullable<ReturnType<typeof coerceOverride>> => o !== null);

      const summary =
        `Replace global shimmer settings and ${importedOverrides.length} per-route override(s)?\n\n` +
        `Existing overrides not present in the file will be removed.`;
      if (!confirm(summary)) {
        setBusy(null);
        return;
      }

      // 1. Upsert global settings (single-row table; update if exists, insert otherwise).
      const settingsTable = (supabase as any).from("heading_shimmer_settings");
      const settingsRes = data?.id
        ? await settingsTable.update(settings).eq("id", data.id)
        : await settingsTable.insert(settings);
      if (settingsRes.error) throw settingsRes.error;

      // 2. Replace overrides: delete existing rows then insert imported rows.
      // Using delete-then-insert keeps the file as the source of truth.
      const overridesTable = (supabase as any).from("heading_shimmer_overrides");
      const delRes = await overridesTable.delete().not("id", "is", null);
      if (delRes.error) throw delRes.error;
      if (importedOverrides.length > 0) {
        const insRes = await overridesTable.insert(importedOverrides);
        if (insRes.error) throw insRes.error;
      }

      qc.invalidateQueries({ queryKey: ["content", "chrome"] });
      toast.success(
        `Imported settings + ${importedOverrides.length} override(s)`,
      );
    } catch (e: any) {
      toast.error(`Import failed: ${e?.message ?? e}`);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        onClick={downloadExport}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm disabled:opacity-50"
        title="Download current shimmer settings + overrides as JSON"
      >
        <Download size={14} /> Export
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm disabled:opacity-50"
        title="Replace settings + overrides from a JSON file"
      >
        <Upload size={14} /> {busy === "import" ? "Importing…" : "Import"}
      </button>
    </div>
  );
}

// Re-export type for tests / external use.
export type { ShimmerExport };
export type { HeadingShimmerOverride };
