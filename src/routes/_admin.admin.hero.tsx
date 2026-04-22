import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { PageKeySelector, usePageKey } from "@/components/admin/PageKeySelector";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/hero")({ component: AdminHero });

function AdminHero() {
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
        page_key: pageKey,
      };
      if (data?.id) {
        const { error } = await (supabase as any).from("hero_content").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("hero_content").insert({ ...payload, headline: form.headline || "Headline" });
        if (error) throw error;
      }
      toast.success(`Hero saved (Page ${pageKey})`);
      qc.invalidateQueries({ queryKey: ["hero"] });
      qc.invalidateQueries({ queryKey: ["admin-hero"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <AdminPage
      title="Hero"
      description="The main banner section at the top of your homepage."
      actions={
        <div className="flex items-center gap-3 flex-wrap">
          <PageKeySelector value={pageKey} onChange={setPageKey} />
          <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1.5" />{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      }
    >
      <AdminCard title="Headline">
        <div className="grid gap-4">
          <FormRow label="Eyebrow"><Input value={form.eyebrow || ""} onChange={(e) => set("eyebrow", e.target.value)} /></FormRow>
          <FormRow label="Headline"><Textarea rows={2} value={form.headline || ""} onChange={(e) => set("headline", e.target.value)} /></FormRow>
          <FormRow label="Subheadline"><Textarea rows={3} value={form.subheadline || ""} onChange={(e) => set("subheadline", e.target.value)} /></FormRow>
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
    </AdminPage>
  );
}
