import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTable } from "@/hooks/useTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { TagListEditor } from "@/components/admin/TagListEditor";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/activities")({ component: AdminActivities });

function AdminActivities() {
  const t = useTable("activities");
  const rows = t.data ?? [];
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ active: true, tags: [] });
  const [edits, setEdits] = useState<Record<string, any>>({});

  const get = (r: any) => edits[r.id] ?? r;
  const setEdit = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draft.title?.trim()) return;
    const ok = await t.insert({ ...draft, tags: draft.tags || [], sort_order: rows.length + 1 });
    if (ok) { setDraft({ active: true, tags: [] }); setCreating(false); }
  }

  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, {
      title: p.title, period: p.period, description: p.description,
      tags: Array.isArray(p.tags) ? p.tags : [], active: p.active,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage title="Activities" description="Clubs, leadership, workshops, and self-learning."
      actions={<Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add activity</Button>}>
      {creating && (
        <AdminCard title="New activity">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Title"><Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></FormRow>
            <FormRow label="Period"><Input value={draft.period || ""} onChange={(e) => setDraft({ ...draft, period: e.target.value })} /></FormRow>
            <div className="sm:col-span-2"><FormRow label="Description"><Textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></FormRow></div>
            <div className="sm:col-span-2"><FormRow label="Tags"><TagListEditor value={draft.tags || []} onChange={(v) => setDraft({ ...draft, tags: v })} /></FormRow></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}
      {rows.length === 0 ? <EmptyState message="No activities yet." /> :
        rows.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          const tags: string[] = Array.isArray(row.tags) ? row.tags : [];
          return (
            <AdminCard key={r.id}>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Title"><Input value={row.title || ""} onChange={(e) => setEdit(r.id, { title: e.target.value })} /></FormRow>
                <FormRow label="Period"><Input value={row.period || ""} onChange={(e) => setEdit(r.id, { period: e.target.value })} /></FormRow>
                <div className="sm:col-span-2"><FormRow label="Description"><Textarea value={row.description || ""} onChange={(e) => setEdit(r.id, { description: e.target.value })} /></FormRow></div>
                <div className="sm:col-span-2"><FormRow label="Tags"><TagListEditor value={tags} onChange={(v) => setEdit(r.id, { tags: v })} /></FormRow></div>
                <div className="flex items-end gap-2">
                  <span className="text-sm font-semibold">Active</span>
                  <Switch checked={!!row.active} onCheckedChange={(v) => setEdit(r.id, { active: v })} />
                </div>
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
