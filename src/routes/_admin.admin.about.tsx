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
import { TagListEditor } from "@/components/admin/TagListEditor";
import { Save, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/about")({ component: AdminAbout });

function AdminAbout() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-about"],
    queryFn: async () => {
      const { data } = await supabase.from("about_content").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);

  const skills: string[] = Array.isArray(form.skills) ? form.skills : [];
  const stats: { label: string; value: string }[] = Array.isArray(form.stats) ? form.stats : [];
  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        title: form.title || "About",
        intro: form.intro, bio: form.bio, image_url: form.image_url,
        experience_summary: form.experience_summary, skills, stats,
      };
      if (data?.id) {
        const { error } = await supabase.from("about_content").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("about_content").insert(payload);
        if (error) throw error;
      }
      toast.success("About saved");
      qc.invalidateQueries({ queryKey: ["about"] });
      qc.invalidateQueries({ queryKey: ["admin-about"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <AdminPage title="About" description="Personal bio, skills, and key stats."
      actions={<Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1.5" />{saving ? "Saving…" : "Save changes"}</Button>}>
      <AdminCard title="Section content">
        <div className="grid gap-4">
          <FormRow label="Section title"><Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></FormRow>
          <FormRow label="Intro (short tagline)"><Textarea rows={2} value={form.intro || ""} onChange={(e) => set("intro", e.target.value)} /></FormRow>
          <FormRow label="Bio (full paragraph)"><Textarea rows={6} value={form.bio || ""} onChange={(e) => set("bio", e.target.value)} /></FormRow>
          <FormRow label="Experience summary"><Input value={form.experience_summary || ""} onChange={(e) => set("experience_summary", e.target.value)} /></FormRow>
          <FormRow label="Image"><MediaPicker value={form.image_url} onChange={(url) => set("image_url", url)} /></FormRow>
        </div>
      </AdminCard>
      <AdminCard title="Skills">
        <TagListEditor value={skills} onChange={(v) => set("skills", v)} placeholder="Add a skill and press Enter" />
      </AdminCard>
      <AdminCard title="Stats">
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Label" value={s.label} onChange={(e) => { const next = [...stats]; next[i] = { ...next[i], label: e.target.value }; set("stats", next); }} />
              <Input placeholder="Value" value={s.value} onChange={(e) => { const next = [...stats]; next[i] = { ...next[i], value: e.target.value }; set("stats", next); }} />
              <Button type="button" variant="outline" size="icon" onClick={() => set("stats", stats.filter((_, j) => j !== i))}><X className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => set("stats", [...stats, { label: "", value: "" }])}>
            <Plus className="w-4 h-4 mr-1.5" /> Add stat
          </Button>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
