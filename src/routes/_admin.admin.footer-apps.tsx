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
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/footer-apps")({ component: AdminFooterApps });

function AdminFooterApps() {
  const t = useTable("footer_apps");
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
    if (!draft.name?.trim() || !draft.url?.trim()) return;
    const ok = await t.insert({ ...draft, sort_order: rows.length + 1 });
    if (ok) { setDraft({ active: true }); setCreating(false); }
  }

  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, {
      name: p.name, description: p.description, url: p.url,
      logo_url: p.logo_url, active: p.active,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage
      title="Footer Apps"
      description="Premium clickable app cards displayed in the footer (e.g. Pocket Ledger, Business Automation)."
      actions={<Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add app</Button>}
    >
      {creating && (
        <AdminCard title="New footer app">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Name"><Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></FormRow>
            <FormRow label="URL"><Input value={draft.url || ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://..." /></FormRow>
            <div className="sm:col-span-2"><FormRow label="Description"><Textarea rows={2} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></FormRow></div>
            <div className="sm:col-span-2"><FormRow label="Logo / Image"><MediaPicker value={draft.logo_url} onChange={(u) => setDraft({ ...draft, logo_url: u })} /></FormRow></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}
      {rows.length === 0 ? <EmptyState message="No footer apps yet." /> :
        rows.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          return (
            <AdminCard key={r.id} title={row.name || "Untitled"}>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Name"><Input value={row.name || ""} onChange={(e) => setEdit(r.id, { name: e.target.value })} /></FormRow>
                <FormRow label="URL"><Input value={row.url || ""} onChange={(e) => setEdit(r.id, { url: e.target.value })} /></FormRow>
                <div className="sm:col-span-2"><FormRow label="Description"><Textarea rows={2} value={row.description || ""} onChange={(e) => setEdit(r.id, { description: e.target.value })} /></FormRow></div>
                <div className="sm:col-span-2"><FormRow label="Logo / Image"><MediaPicker value={row.logo_url} onChange={(u) => setEdit(r.id, { logo_url: u })} /></FormRow></div>
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
