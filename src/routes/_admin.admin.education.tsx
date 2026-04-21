import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTable } from "@/hooks/useTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/education")({ component: AdminEducation });

function AdminEducation() {
  const t = useTable("education");
  const rows = t.data ?? [];
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ active: true });
  const [edits, setEdits] = useState<Record<string, any>>({});

  const get = (r: any) => edits[r.id] ?? r;
  const setEdit = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draft.degree?.trim()) return;
    const ok = await t.insert({ ...draft, sort_order: rows.length + 1 });
    if (ok) { setDraft({ active: true }); setCreating(false); }
  }

  async function save(id: string) {
    const patch = edits[id]; if (!patch) return;
    const ok = await t.update(id, {
      degree: patch.degree, institution: patch.institution, university: patch.university,
      period: patch.period, gpa: patch.gpa, description: patch.description, active: patch.active,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage title="Education" description="Timeline entries shown in the Education section."
      actions={<Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add entry</Button>}>
      {creating && (
        <AdminCard title="New entry">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Degree"><Input value={draft.degree || ""} onChange={(e) => setDraft({ ...draft, degree: e.target.value })} /></FormRow>
            <FormRow label="Institution"><Input value={draft.institution || ""} onChange={(e) => setDraft({ ...draft, institution: e.target.value })} /></FormRow>
            <FormRow label="University"><Input value={draft.university || ""} onChange={(e) => setDraft({ ...draft, university: e.target.value })} /></FormRow>
            <FormRow label="Period"><Input value={draft.period || ""} onChange={(e) => setDraft({ ...draft, period: e.target.value })} /></FormRow>
            <FormRow label="GPA"><Input value={draft.gpa || ""} onChange={(e) => setDraft({ ...draft, gpa: e.target.value })} /></FormRow>
            <div />
            <div className="sm:col-span-2"><FormRow label="Description"><Textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></FormRow></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}
      {rows.length === 0 ? <EmptyState message="No education entries yet." /> :
        rows.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          return (
            <AdminCard key={r.id}>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Degree"><Input value={row.degree || ""} onChange={(e) => setEdit(r.id, { degree: e.target.value })} /></FormRow>
                <FormRow label="Institution"><Input value={row.institution || ""} onChange={(e) => setEdit(r.id, { institution: e.target.value })} /></FormRow>
                <FormRow label="University"><Input value={row.university || ""} onChange={(e) => setEdit(r.id, { university: e.target.value })} /></FormRow>
                <FormRow label="Period"><Input value={row.period || ""} onChange={(e) => setEdit(r.id, { period: e.target.value })} /></FormRow>
                <FormRow label="GPA"><Input value={row.gpa || ""} onChange={(e) => setEdit(r.id, { gpa: e.target.value })} /></FormRow>
                <div className="flex items-end gap-2">
                  <span className="text-sm font-semibold">Active</span>
                  <Switch checked={!!row.active} onCheckedChange={(v) => setEdit(r.id, { active: v })} />
                </div>
                <div className="sm:col-span-2"><FormRow label="Description"><Textarea value={row.description || ""} onChange={(e) => setEdit(r.id, { description: e.target.value })} /></FormRow></div>
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
