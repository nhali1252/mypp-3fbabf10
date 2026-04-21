import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Save, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/seo")({ component: AdminSEO });

function AdminSEO() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-seo"],
    queryFn: async () => {
      const { data } = await supabase.from("seo_settings").select("*").order("page_key");
      return data ?? [];
    },
  });

  const [editing, setEditing] = useState<Record<string, any>>({});
  const [creating, setCreating] = useState(false);
  const [newRow, setNewRow] = useState({ page_key: "", meta_title: "", meta_description: "", keywords: "", og_image: "" });

  function getRow(r: any) { return editing[r.id] ?? r; }
  function set(id: string, k: string, v: any) {
    setEditing((e) => ({ ...e, [id]: { ...(e[id] ?? rows.find((r: any) => r.id === id)), [k]: v } }));
  }

  async function save(id: string) {
    const row = editing[id]; if (!row) return;
    const { error } = await supabase.from("seo_settings").update({
      meta_title: row.meta_title, meta_description: row.meta_description,
      keywords: row.keywords, og_image: row.og_image,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["admin-seo"] });
    setEditing((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("seo_settings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-seo"] });
  }

  async function create() {
    if (!newRow.page_key.trim()) return toast.error("Page key required");
    const { error } = await supabase.from("seo_settings").insert(newRow);
    if (error) return toast.error(error.message);
    toast.success("Added");
    qc.invalidateQueries({ queryKey: ["admin-seo"] });
    setCreating(false);
    setNewRow({ page_key: "", meta_title: "", meta_description: "", keywords: "", og_image: "" });
  }

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <AdminPage title="SEO settings" description="Per-page meta titles, descriptions, and Open Graph images."
      actions={<Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add page</Button>}>
      {creating && (
        <AdminCard title="New SEO entry">
          <div className="grid gap-3">
            <FormRow label="Page key" hint="e.g. home, about, projects">
              <Input value={newRow.page_key} onChange={(e) => setNewRow({ ...newRow, page_key: e.target.value })} />
            </FormRow>
            <FormRow label="Meta title"><Input value={newRow.meta_title} onChange={(e) => setNewRow({ ...newRow, meta_title: e.target.value })} /></FormRow>
            <FormRow label="Meta description"><Textarea value={newRow.meta_description} onChange={(e) => setNewRow({ ...newRow, meta_description: e.target.value })} /></FormRow>
            <FormRow label="Keywords"><Input value={newRow.keywords} onChange={(e) => setNewRow({ ...newRow, keywords: e.target.value })} /></FormRow>
            <FormRow label="OG image"><MediaPicker value={newRow.og_image} onChange={(u: string | null) => setNewRow({ ...newRow, og_image: u || "" })} /></FormRow>
            <div className="flex gap-2"><Button onClick={create}>Create</Button><Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button></div>
          </div>
        </AdminCard>
      )}
      {rows.length === 0 && !creating ? (
        <EmptyState message="No SEO entries yet. Click 'Add page' to start." />
      ) : (
        rows.map((r: any) => {
          const row = getRow(r); const dirty = !!editing[r.id];
          return (
            <AdminCard key={r.id} title={`Page: ${r.page_key}`}>
              <div className="grid gap-3">
                <FormRow label="Meta title"><Input value={row.meta_title || ""} onChange={(e) => set(r.id, "meta_title", e.target.value)} /></FormRow>
                <FormRow label="Meta description"><Textarea value={row.meta_description || ""} onChange={(e) => set(r.id, "meta_description", e.target.value)} /></FormRow>
                <FormRow label="Keywords"><Input value={row.keywords || ""} onChange={(e) => set(r.id, "keywords", e.target.value)} /></FormRow>
                <FormRow label="OG image"><MediaPicker value={row.og_image} onChange={(u: string | null) => set(r.id, "og_image", u || "")} /></FormRow>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => save(r.id)} disabled={!dirty}><Save className="w-4 h-4 mr-1.5" /> Save</Button>
                  <ConfirmDelete onConfirm={() => remove(r.id)} trigger={<Button variant="outline"><Trash2 className="w-4 h-4 mr-1.5" /> Delete</Button>} />
                </div>
              </div>
            </AdminCard>
          );
        })
      )}
    </AdminPage>
  );
}
