import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTable } from "@/hooks/useTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/ticker")({ component: AdminTicker });

function AdminTicker() {
  const t = useTable("ticker_items");
  const rows = t.data ?? [];
  const [draftText, setDraftText] = useState("");
  const [edits, setEdits] = useState<Record<string, any>>({});

  const get = (r: any) => edits[r.id] ?? r;
  const setEdit = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draftText.trim()) return;
    const ok = await t.insert({ text: draftText.trim(), active: true, sort_order: rows.length + 1 });
    if (ok) setDraftText("");
  }

  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, { text: p.text, active: p.active });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage title="Ticker" description="Scrolling strip below the hero section.">
      <AdminCard title="Add ticker item">
        <div className="flex gap-2">
          <Input value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="e.g. BBA Marketing" onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
          <Button onClick={add}><Plus className="w-4 h-4 mr-1.5" />Add</Button>
        </div>
      </AdminCard>
      {rows.length === 0 ? <EmptyState message="No ticker items." /> : (
        <AdminCard title="Items">
          <div className="space-y-2">
            {rows.map((r: any, i: number) => {
              const row = get(r); const dirty = !!edits[r.id];
              return (
                <div key={r.id} className="flex items-center gap-2 flex-wrap p-3 border border-border rounded-xl">
                  <Input className="flex-1 min-w-[200px]" value={row.text || ""} onChange={(e) => setEdit(r.id, { text: e.target.value })} />
                  <div className="flex items-center gap-2 text-xs">
                    <span>Active</span>
                    <Switch checked={!!row.active} onCheckedChange={(v) => setEdit(r.id, { active: v })} />
                  </div>
                  <Button size="sm" onClick={() => save(r.id)} disabled={!dirty}><Save className="w-3.5 h-3.5" /></Button>
                  <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, 1)} disabled={i === rows.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                  <ConfirmDelete onConfirm={() => t.remove(r.id)} trigger={<Button variant="outline" size="icon" aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>} />
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}
    </AdminPage>
  );
}
