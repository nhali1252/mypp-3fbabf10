import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTable } from "@/hooks/useTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/folders")({ component: AdminFolders });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminFolders() {
  const t = useTable("folders");
  const rows = t.data ?? [];
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ status: true });
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r: any) =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const get = (r: any) => edits[r.id] ?? r;
  const setEdit = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draft.name?.trim()) return;
    const slug = draft.slug?.trim() || slugify(draft.name);
    const ok = await t.insert({
      name: draft.name.trim(), slug, icon: draft.icon || null,
      status: draft.status !== false, sort_order: rows.length + 1,
    });
    if (ok) { setDraft({ status: true }); setCreating(false); }
  }

  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, {
      name: p.name, slug: p.slug || slugify(p.name || ""), icon: p.icon, status: p.status,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage
      title="Folders"
      description="Top-level service categories. Folders contain slots, slots contain services."
      actions={
        <div className="flex gap-2">
          <Input placeholder="Search folders…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add folder</Button>
        </div>
      }
    >
      {creating && (
        <AdminCard title="New folder">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Name"><Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. City Taxis" /></FormRow>
            <FormRow label="Slug" hint="Auto-generated if blank"><Input value={draft.slug || ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="city-taxis" /></FormRow>
            <FormRow label="Icon (lucide name)" hint="Optional, e.g. car, truck, bus"><Input value={draft.icon || ""} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} /></FormRow>
            <div className="flex items-end gap-2">
              <span className="text-sm font-semibold">Active</span>
              <Switch checked={draft.status !== false} onCheckedChange={(v) => setDraft({ ...draft, status: v })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}

      {filtered.length === 0 ? (
        <EmptyState message={search ? "No folders match your search." : "No folders yet. Add your first one."} />
      ) : (
        filtered.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          return (
            <AdminCard key={r.id}>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Name"><Input value={row.name || ""} onChange={(e) => setEdit(r.id, { name: e.target.value })} /></FormRow>
                <FormRow label="Slug"><Input value={row.slug || ""} onChange={(e) => setEdit(r.id, { slug: e.target.value })} /></FormRow>
                <FormRow label="Icon"><Input value={row.icon || ""} onChange={(e) => setEdit(r.id, { icon: e.target.value })} /></FormRow>
                <div className="flex items-end gap-2">
                  <span className="text-sm font-semibold">Active</span>
                  <Switch checked={!!row.status} onCheckedChange={(v) => setEdit(r.id, { status: v })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap items-center">
                <Button onClick={() => save(r.id)} disabled={!dirty}><Save className="w-4 h-4 mr-1.5" />Save</Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, 1)} disabled={i === filtered.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                <ConfirmDelete onConfirm={() => t.remove(r.id)} trigger={<Button variant="outline"><Trash2 className="w-4 h-4 mr-1.5" />Delete</Button>}
                  description="This will permanently delete the folder, all slots inside it, and all services inside those slots." />
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 ml-auto">
                  <FolderKanban className="w-3.5 h-3.5" /> id: {r.id.slice(0, 8)}…
                </span>
              </div>
            </AdminCard>
          );
        })
      )}
    </AdminPage>
  );
}
