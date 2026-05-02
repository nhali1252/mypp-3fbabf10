/**
 * Inline Hero editor — shared by:
 *   - the new page-block shell (`basic:hero` section)
 *   - the legacy /admin/hero route
 *
 * Edits `hero_content` for the currently-selected page key (defaults to "B").
 * The `embedded` flag drops the page-shell chrome (title, page-key selector
 * in the header) so it slots cleanly into an accordion.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminCard, FormRow } from "@/components/admin/AdminPage";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { PageKeySelector, usePageKey } from "@/components/admin/PageKeySelector";
import { Save } from "lucide-react";

export type HeroEditorProps = {
  /** When true, omit outer title/description and show a compact page-key row. */
  embedded?: boolean;
};

export default function HeroEditor({ embedded = false }: HeroEditorProps) {
  const qc = useQueryClient();
  const [pageKey, setPageKey] = usePageKey();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-hero", pageKey],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("hero_content")
        .select("*")
        .eq("page_key", pageKey)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(data || {}); }, [data]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const payload: any = {
        eyebrow: form.eyebrow, headline: form.headline, subheadline: form.subheadline,
        primary_cta_label: form.primary_cta_label, primary_cta_url: form.primary_cta_url,
        secondary_cta_label: form.secondary_cta_label, secondary_cta_url: form.secondary_cta_url,
        portrait_url: form.portrait_url, background_style: form.background_style,
        backdrop_name: form.backdrop_name,
        page_key: pageKey,
      };
      if (data?.id) {
        const { error } = await (supabase as any).from("hero_content").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("hero_content")
          .insert({ ...payload, headline: form.headline || "Headline" });
        if (error) throw error;
      }
      toast.success(`Hero saved (Page ${pageKey})`);
      qc.invalidateQueries({ queryKey: ["hero"] });
      qc.invalidateQueries({ queryKey: ["admin-hero"] });
      // Hero portrait + headline are read on the public site via the cached
      // basicInfo content doc — refresh it so edits appear immediately.
      qc.invalidateQueries({ queryKey: ["content", "basicInfo"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading hero…</div>;

  return (
    <div className="space-y-4">
      {embedded && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-4 py-2.5 border border-border">
          <PageKeySelector value={pageKey} onChange={setPageKey} />
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? "Saving…" : "Save hero"}
          </Button>
        </div>
      )}

      <AdminCard title="Headline">
        <div className="grid gap-4">
          <FormRow label="Eyebrow"><Input value={form.eyebrow || ""} onChange={(e) => set("eyebrow", e.target.value)} /></FormRow>
          <FormRow label="Headline"><Textarea rows={2} value={form.headline || ""} onChange={(e) => set("headline", e.target.value)} /></FormRow>
          <FormRow label="Subheadline"><Textarea rows={3} value={form.subheadline || ""} onChange={(e) => set("subheadline", e.target.value)} /></FormRow>
          <FormRow label="Backdrop name" hint="Large faded text behind the portrait. Leave empty to hide.">
            <Input value={form.backdrop_name ?? ""} onChange={(e) => set("backdrop_name", e.target.value)} placeholder="ALI NUR HASAN" />
          </FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Call-to-action buttons">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormRow label="Primary button label"><Input value={form.primary_cta_label || ""} onChange={(e) => set("primary_cta_label", e.target.value)} /></FormRow>
          <FormRow label="Primary button link"><Input value={form.primary_cta_url || ""} onChange={(e) => set("primary_cta_url", e.target.value)} /></FormRow>
          <FormRow label="Secondary button label"><Input value={form.secondary_cta_label || ""} onChange={(e) => set("secondary_cta_label", e.target.value)} /></FormRow>
          <FormRow label="Secondary button link"><Input value={form.secondary_cta_url || ""} onChange={(e) => set("secondary_cta_url", e.target.value)} /></FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Portrait & style">
        <div className="grid gap-4">
          <FormRow label="Portrait image">
            <MediaPicker value={form.portrait_url} onChange={(url) => set("portrait_url", url)} />
          </FormRow>
          <FormRow label="Background style" hint="e.g. dark, light">
            <Input value={form.background_style || ""} onChange={(e) => set("background_style", e.target.value)} />
          </FormRow>
        </div>
      </AdminCard>

      {!embedded && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
