import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { PageKeySelector, usePageKey } from "@/components/admin/PageKeySelector";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/contact")({ component: AdminContact });

function AdminContact() {
  const qc = useQueryClient();
  const [pageKey, setPageKey] = usePageKey();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact", pageKey],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("contact_settings")
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

  const social = (form.social_links || {}) as Record<string, string>;
  function setSocial(key: string, val: string) {
    setForm((f: any) => ({ ...f, social_links: { ...(f.social_links || {}), [key]: val } }));
  }
  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const payload: any = {
        email: form.email, phone: form.phone, whatsapp: form.whatsapp,
        address: form.address, map_link: form.map_link,
        form_receiver_email: form.form_receiver_email,
        social_links: form.social_links || {},
        page_key: pageKey,
      };
      if (data?.id) {
        const { error } = await (supabase as any).from("contact_settings").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("contact_settings").insert(payload);
        if (error) throw error;
      }
      toast.success(`Contact info saved (Page ${pageKey})`);
      qc.invalidateQueries({ queryKey: ["contact_settings"] });
      qc.invalidateQueries({ queryKey: ["admin-contact"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <AdminPage
      title="Contact info"
      description="Contact details shown across the site and used by the contact form."
      actions={
        <div className="flex items-center gap-3 flex-wrap">
          <PageKeySelector value={pageKey} onChange={setPageKey} />
          <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1.5" />{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      }
    >
      <AdminCard title="Direct contact">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormRow label="Public email"><Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></FormRow>
          <FormRow label="Form receiver email" hint="Where contact form replies should go"><Input type="email" value={form.form_receiver_email || ""} onChange={(e) => set("form_receiver_email", e.target.value)} /></FormRow>
          <FormRow label="Phone"><Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></FormRow>
          <FormRow label="WhatsApp"><Input value={form.whatsapp || ""} onChange={(e) => set("whatsapp", e.target.value)} /></FormRow>
          <FormRow label="Address"><Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></FormRow>
          <FormRow label="Map link"><Input value={form.map_link || ""} onChange={(e) => set("map_link", e.target.value)} /></FormRow>
        </div>
      </AdminCard>
      <AdminCard title="Social links">
        <div className="grid sm:grid-cols-2 gap-4">
          {["linkedin", "facebook", "telegram", "whatsapp", "instagram", "github", "twitter"].map((k) => (
            <FormRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
              <Input value={social[k] || ""} onChange={(e) => setSocial(k, e.target.value)} placeholder={`https://${k}.com/...`} />
            </FormRow>
          ))}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
