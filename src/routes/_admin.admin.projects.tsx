import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTable } from "@/hooks/useTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { TagListEditor } from "@/components/admin/TagListEditor";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/projects")({ component: AdminProjects });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminProjects() {
  const t = useTable("projects");
  const rows = t.data ?? [];
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ featured: false, published: true, tools: [] });
  const [edits, setEdits] = useState<Record<string, any>>({});

  const get = (r: any) => edits[r.id] ?? r;
  const setEdit = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draft.title?.trim()) return;
    const slug = (draft.slug?.trim() || slugify(draft.title)) || `project-${Date.now()}`;
    const ok = await t.insert({ ...draft, slug, tools: draft.tools || [], sort_order: rows.length + 1 });
    if (ok) { setDraft({ featured: false, published: true, tools: [] }); setCreating(false); }
  }

  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, {
      title: p.title, slug: p.slug, category: p.category, summary: p.summary,
      description: p.description, image_url: p.image_url, tools: Array.isArray(p.tools) ? p.tools : [],
      live_url: p.live_url, github_url: p.github_url, featured: p.featured, published: p.published,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage title="Projects" description="Showcase work shown in the Projects section."
      actions={<Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add project</Button>}>
      {creating && (
        <AdminCard title="New project">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Title"><Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></FormRow>
            <FormRow label="Slug" hint="auto-generated"><Input value={draft.slug || ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></FormRow>
            <FormRow label="Category"><Input value={draft.category || ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></FormRow>
            <FormRow label="Live URL"><Input value={draft.live_url || ""} onChange={(e) => setDraft({ ...draft, live_url: e.target.value })} /></FormRow>
            <FormRow label="GitHub URL"><Input value={draft.github_url || ""} onChange={(e) => setDraft({ ...draft, github_url: e.target.value })} /></FormRow>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={!!draft.featured} onCheckedChange={(v) => setDraft({ ...draft, featured: v })} />Featured</label>
              <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={!!draft.published} onCheckedChange={(v) => setDraft({ ...draft, published: v })} />Published</label>
            </div>
            <div className="sm:col-span-2"><FormRow label="Summary"><Textarea rows={2} value={draft.summary || ""} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></FormRow></div>
            <div className="sm:col-span-2"><FormRow label="Description"><Textarea rows={4} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></FormRow></div>
            <div className="sm:col-span-2"><FormRow label="Cover image"><MediaPicker value={draft.image_url} onChange={(u: string | null) => setDraft({ ...draft, image_url: u })} /></FormRow></div>
            <div className="sm:col-span-2"><FormRow label="Tools / Tech"><TagListEditor value={draft.tools || []} onChange={(v: string[]) => setDraft({ ...draft, tools: v })} /></FormRow></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}
      {rows.length === 0 ? <EmptyState message="No projects yet." /> :
        rows.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          const tools: string[] = Array.isArray(row.tools) ? row.tools : [];
          return (
            <AdminCard key={r.id} title={row.title || "Untitled"}>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Title"><Input value={row.title || ""} onChange={(e) => setEdit(r.id, { title: e.target.value })} /></FormRow>
                <FormRow label="Slug"><Input value={row.slug || ""} onChange={(e) => setEdit(r.id, { slug: e.target.value })} /></FormRow>
                <FormRow label="Category"><Input value={row.category || ""} onChange={(e) => setEdit(r.id, { category: e.target.value })} /></FormRow>
                <FormRow label="Live URL"><Input value={row.live_url || ""} onChange={(e) => setEdit(r.id, { live_url: e.target.value })} /></FormRow>
                <FormRow label="GitHub URL"><Input value={row.github_url || ""} onChange={(e) => setEdit(r.id, { github_url: e.target.value })} /></FormRow>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={!!row.featured} onCheckedChange={(v) => setEdit(r.id, { featured: v })} />Featured</label>
                  <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={!!row.published} onCheckedChange={(v) => setEdit(r.id, { published: v })} />Published</label>
                </div>
                <div className="sm:col-span-2"><FormRow label="Summary"><Textarea rows={2} value={row.summary || ""} onChange={(e) => setEdit(r.id, { summary: e.target.value })} /></FormRow></div>
                <div className="sm:col-span-2"><FormRow label="Description"><Textarea rows={4} value={row.description || ""} onChange={(e) => setEdit(r.id, { description: e.target.value })} /></FormRow></div>
                <div className="sm:col-span-2"><FormRow label="Cover image"><MediaPicker value={row.image_url} onChange={(u: string | null) => setEdit(r.id, { image_url: u })} /></FormRow></div>
                <div className="sm:col-span-2"><FormRow label="Tools / Tech"><TagListEditor value={tools} onChange={(v: string[]) => setEdit(r.id, { tools: v })} /></FormRow></div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button onClick={() => save(r.id)} disabled={!dirty}><Save className="w-4 h-4 mr-1.5" />Save</Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, 1)} disabled={i === rows.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                <ConfirmDelete onConfirm={() => t.remove(r.id)} trigger={<Button variant="outline"><Trash2 className="w-4 h-4 mr-1.5" />Delete</Button>} />
              </div>
            </AdminCard>
          );
        })}
    </AdminPage>
  );
}
