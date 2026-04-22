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
import { Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        site_title: form.site_title || "Portfolio",
        logo_url: form.logo_url, favicon_url: form.favicon_url,
        theme_primary: form.theme_primary, footer_text: form.footer_text,
        site_name: form.site_name, primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        hero_title: form.hero_title, hero_subtitle: form.hero_subtitle,
      };
      if (data?.id) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert(payload);
        if (error) throw error;
      }
      toast.success("Site settings saved");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["public-site-settings"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <AdminPage title="Site settings" description="Global identity used across the site."
      actions={<Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1.5" />{saving ? "Saving…" : "Save changes"}</Button>}>
      <AdminCard title="Identity">
        <div className="grid gap-4">
          <FormRow label="Site title (browser tab + meta)"><Input value={form.site_title || ""} onChange={(e) => set("site_title", e.target.value)} /></FormRow>
          <FormRow label="Site name (display brand name)"><Input value={form.site_name || ""} onChange={(e) => set("site_name", e.target.value)} placeholder="e.g. City Cabs" /></FormRow>
          <FormRow label="Logo"><MediaPicker value={form.logo_url} onChange={(u: string | null) => set("logo_url", u)} /></FormRow>
          <FormRow label="Favicon URL"><Input value={form.favicon_url || ""} onChange={(e) => set("favicon_url", e.target.value)} /></FormRow>
          <FormRow label="Footer text"><Textarea rows={2} value={form.footer_text || ""} onChange={(e) => set("footer_text", e.target.value)} /></FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Branding colors">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormRow label="Brand primary color (hex)"><Input value={form.theme_primary || ""} onChange={(e) => set("theme_primary", e.target.value)} placeholder="#D9FF3D" /></FormRow>
          <FormRow label="Primary color (taxi CMS)"><Input value={form.primary_color || ""} onChange={(e) => set("primary_color", e.target.value)} placeholder="#B89B6F" /></FormRow>
          <FormRow label="Secondary color (taxi CMS)"><Input value={form.secondary_color || ""} onChange={(e) => set("secondary_color", e.target.value)} placeholder="#1B1C1F" /></FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Services hero (used on /services page)">
        <div className="grid gap-4">
          <FormRow label="Hero title"><Input value={form.hero_title || ""} onChange={(e) => set("hero_title", e.target.value)} placeholder="Premium Taxi & Service Bookings" /></FormRow>
          <FormRow label="Hero subtitle"><Textarea rows={2} value={form.hero_subtitle || ""} onChange={(e) => set("hero_subtitle", e.target.value)} placeholder="Reliable rides, on-demand services, transparent pricing." /></FormRow>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
