import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTable } from "@/hooks/useTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/navigation")({ component: AdminNavigation });

function LinksManager({ table, title, description }: { table: string; title: string; description: string }) {
  const t = useTable(table);
  const rows = t.data ?? [];
  const [draft, setDraft] = useState({ label: "", url: "" });
  const [edits, setEdits] = useState<Record<string, any>>({});

  const get = (r: any) => edits[r.id] ?? r;
  const setEdit = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draft.label.trim() || !draft.url.trim()) return;
    const ok = await t.insert({ ...draft, active: true, sort_order: rows.length + 1 });
    if (ok) setDraft({ label: "", url: "" });
  }

  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, { label: p.label, url: p.url, active: p.active });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminCard title={title}>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <Input placeholder="URL (#about, /page, https://…)" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
        <Button onClick={add}><Plus className="w-4 h-4" /></Button>
      </div>
      {rows.length === 0 ? <EmptyState message="No links yet." /> : (
        <div className="space-y-2">
          {rows.map((r: any, i: number) => {
            const row = get(r); const dirty = !!edits[r.id];
            return (
              <div key={r.id} className="flex items-center gap-2 flex-wrap p-3 border border-border rounded-xl">
                <Input className="flex-1 min-w-[120px]" value={row.label || ""} onChange={(e) => setEdit(r.id, { label: e.target.value })} placeholder="Label" />
                <Input className="flex-1 min-w-[160px]" value={row.url || ""} onChange={(e) => setEdit(r.id, { url: e.target.value })} placeholder="URL" />
                <div className="flex items-center gap-2 text-xs">
                  <span>Active</span><Switch checked={!!row.active} onCheckedChange={(v) => setEdit(r.id, { active: v })} />
                </div>
                <Button size="sm" onClick={() => save(r.id)} disabled={!dirty}><Save className="w-3.5 h-3.5" /></Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, 1)} disabled={i === rows.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                <ConfirmDelete onConfirm={() => t.remove(r.id)} trigger={<Button variant="outline" size="icon"><Trash2 className="w-4 h-4" /></Button>} />
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
  );
}

function AdminNavigation() {
  return (
    <AdminPage title="Navigation & Footer" description="Manage navbar links and footer links.">
      <LinksManager table="nav_links" title="Navbar links" description="Top navigation menu." />
      <LinksManager table="footer_links" title="Footer links" description="Links shown in the page footer." />
    </AdminPage>
  );
}
