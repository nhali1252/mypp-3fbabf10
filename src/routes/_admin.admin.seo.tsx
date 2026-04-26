import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { SeoPreview, CharCounter } from "@/components/admin/SeoPreview";
import { Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/seo")({ component: AdminSEO });

const seoSchema = z.object({
  page_key: z
    .string()
    .trim()
    .min(1, "Page key required")
    .max(60, "Page key too long")
    .regex(/^[a-z0-9-]+$/i, "Use letters, numbers, and dashes only"),
  meta_title: z.string().trim().max(120, "Title too long (max 120)").optional().or(z.literal("")),
  meta_description: z.string().trim().max(320, "Description too long (max 320)").optional().or(z.literal("")),
  keywords: z.string().trim().max(255, "Keywords too long").optional().or(z.literal("")),
  og_image: z
    .string()
    .trim()
    .max(2048)
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

function validate(row: { page_key?: string; meta_title?: string | null; meta_description?: string | null; keywords?: string | null; og_image?: string | null }) {
  const r = seoSchema.safeParse({
    page_key: row.page_key ?? "",
    meta_title: row.meta_title ?? "",
    meta_description: row.meta_description ?? "",
    keywords: row.keywords ?? "",
    og_image: row.og_image ?? "",
  });
  if (r.success) return { ok: true as const, errors: {} as Record<string, string> };
  const errors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false as const, errors };
}

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
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  const [newRow, setNewRow] = useState({ page_key: "", meta_title: "", meta_description: "", keywords: "", og_image: "" });

  function getRow(r: any) { return editing[r.id] ?? r; }
  function set(id: string, k: string, v: any) {
    setEditing((e) => ({ ...e, [id]: { ...(e[id] ?? rows.find((r: any) => r.id === id)), [k]: v } }));
  }

  async function save(id: string) {
    const row = editing[id]; if (!row) return;
    const v = validate(row);
    if (!v.ok) {
      const first = Object.values(v.errors)[0];
      return toast.error(first || "Please fix validation errors");
    }
    const { error } = await supabase.from("seo_settings").update({
      meta_title: row.meta_title || null,
      meta_description: row.meta_description || null,
      keywords: row.keywords || null,
      og_image: row.og_image || null,
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
    const v = validate(newRow);
    if (!v.ok) {
      const first = Object.values(v.errors)[0];
      return toast.error(first || "Please fix validation errors");
    }
    const { error } = await supabase.from("seo_settings").insert({
      page_key: newRow.page_key.trim(),
      meta_title: newRow.meta_title || null,
      meta_description: newRow.meta_description || null,
      keywords: newRow.keywords || null,
      og_image: newRow.og_image || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Added");
    qc.invalidateQueries({ queryKey: ["admin-seo"] });
    setCreating(false);
    setNewRow({ page_key: "", meta_title: "", meta_description: "", keywords: "", og_image: "" });
  }

  const newErrors = useMemo(() => validate(newRow).errors, [newRow]);

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <AdminPage title="SEO settings" description="Per-page meta titles, descriptions, and Open Graph images. Live preview shows how each page will appear on Google and social media."
      actions={<Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add page</Button>}>
      {creating && (
        <AdminCard title="New SEO entry">
          <div className="grid gap-3">
            <FormRow label="Page key" hint="e.g. home, about, projects (lowercase, dashes only)">
              <Input value={newRow.page_key} onChange={(e) => setNewRow({ ...newRow, page_key: e.target.value })} />
              {newErrors.page_key && <p className="text-xs text-destructive mt-1">{newErrors.page_key}</p>}
            </FormRow>
            <FormRow label="Meta title">
              <Input value={newRow.meta_title} onChange={(e) => setNewRow({ ...newRow, meta_title: e.target.value })} maxLength={120} />
              <CharCounter value={newRow.meta_title} ideal={[40, 60]} max={60} />
              {newErrors.meta_title && <p className="text-xs text-destructive mt-1">{newErrors.meta_title}</p>}
            </FormRow>
            <FormRow label="Meta description">
              <Textarea value={newRow.meta_description} onChange={(e) => setNewRow({ ...newRow, meta_description: e.target.value })} maxLength={320} rows={3} />
              <CharCounter value={newRow.meta_description} ideal={[120, 160]} max={160} />
              {newErrors.meta_description && <p className="text-xs text-destructive mt-1">{newErrors.meta_description}</p>}
            </FormRow>
            <FormRow label="Keywords">
              <Input value={newRow.keywords} onChange={(e) => setNewRow({ ...newRow, keywords: e.target.value })} maxLength={255} />
            </FormRow>
            <FormRow label="OG image" hint="Recommended 1200×630">
              <MediaPicker value={newRow.og_image} onChange={(u: string | null) => setNewRow({ ...newRow, og_image: u || "" })} />
              {newErrors.og_image && <p className="text-xs text-destructive mt-1">{newErrors.og_image}</p>}
            </FormRow>
            <div className="pt-2">
              <SeoPreview
                pageKey={newRow.page_key || "preview"}
                title={newRow.meta_title}
                description={newRow.meta_description}
                ogImage={newRow.og_image}
              />
            </div>
            <div className="flex gap-2"><Button onClick={create}>Create</Button><Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button></div>
          </div>
        </AdminCard>
      )}
      {rows.length === 0 && !creating ? (
        <EmptyState message="No SEO entries yet. Click 'Add page' to start." />
      ) : (
        rows.map((r: any) => {
          const row = getRow(r);
          const dirty = !!editing[r.id];
          const errors = dirty ? validate(row).errors : {};
          const showPreview = previewOpen[r.id] ?? true;
          return (
            <AdminCard key={r.id} title={`Page: ${r.page_key}`}>
              <div className="grid gap-3">
                <FormRow label="Meta title">
                  <Input value={row.meta_title || ""} onChange={(e) => set(r.id, "meta_title", e.target.value)} maxLength={120} />
                  <CharCounter value={row.meta_title || ""} ideal={[40, 60]} max={60} />
                  {errors.meta_title && <p className="text-xs text-destructive mt-1">{errors.meta_title}</p>}
                </FormRow>
                <FormRow label="Meta description">
                  <Textarea value={row.meta_description || ""} onChange={(e) => set(r.id, "meta_description", e.target.value)} maxLength={320} rows={3} />
                  <CharCounter value={row.meta_description || ""} ideal={[120, 160]} max={160} />
                  {errors.meta_description && <p className="text-xs text-destructive mt-1">{errors.meta_description}</p>}
                </FormRow>
                <FormRow label="Keywords">
                  <Input value={row.keywords || ""} onChange={(e) => set(r.id, "keywords", e.target.value)} maxLength={255} />
                </FormRow>
                <FormRow label="OG image" hint="Recommended 1200×630">
                  <MediaPicker value={row.og_image} onChange={(u: string | null) => set(r.id, "og_image", u || "")} />
                  {errors.og_image && <p className="text-xs text-destructive mt-1">{errors.og_image}</p>}
                </FormRow>
                {showPreview && (
                  <div className="pt-2">
                    <SeoPreview
                      pageKey={r.page_key}
                      title={row.meta_title || ""}
                      description={row.meta_description || ""}
                      ogImage={row.og_image}
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => save(r.id)} disabled={!dirty}><Save className="w-4 h-4 mr-1.5" /> Save</Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewOpen((p) => ({ ...p, [r.id]: !showPreview }))}
                  >
                    {showPreview ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
                    {showPreview ? "Hide preview" : "Show preview"}
                  </Button>
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
