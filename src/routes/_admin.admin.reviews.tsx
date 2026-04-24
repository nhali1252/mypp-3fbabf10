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
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Star } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/reviews")({ component: AdminReviews });

function AdminReviews() {
  const t = useTable("testimonials");
  const rows = t.data ?? [];
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ rating: 5, published: true });
  const [edits, setEdits] = useState<Record<string, any>>({});
  const get = (r: any) => edits[r.id] ?? r;
  const setE = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draft.client_name?.trim() || !draft.review?.trim()) return;
    const ok = await t.insert({ ...draft, sort_order: rows.length + 1 });
    if (ok) { setDraft({ rating: 5, published: true }); setCreating(false); }
  }
  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, {
      client_name: p.client_name, role: p.role, company: p.company,
      review: p.review, rating: p.rating, avatar_url: p.avatar_url, published: p.published,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage
      title="Reviews & testimonials"
      description="Client reviews shown on About & Skills and other pages."
      actions={<Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add review</Button>}
    >
      {creating && (
        <AdminCard title="New review">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Client name"><Input value={draft.client_name ?? ""} onChange={(e) => setDraft({ ...draft, client_name: e.target.value })} /></FormRow>
            <FormRow label="Role / title"><Input value={draft.role ?? ""} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></FormRow>
            <FormRow label="Company"><Input value={draft.company ?? ""} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></FormRow>
            <FormRow label="Rating (1-5)"><Input type="number" min={1} max={5} value={draft.rating ?? 5} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })} /></FormRow>
            <div className="sm:col-span-2"><FormRow label="Review"><Textarea rows={4} value={draft.review ?? ""} onChange={(e) => setDraft({ ...draft, review: e.target.value })} /></FormRow></div>
            <div className="sm:col-span-2"><FormRow label="Avatar"><MediaPicker value={draft.avatar_url} onChange={(u: string | null) => setDraft({ ...draft, avatar_url: u })} /></FormRow></div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <Switch checked={!!draft.published} onCheckedChange={(v) => setDraft({ ...draft, published: v })} />
              <span className="text-sm font-semibold">Published</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}

      {rows.length === 0 ? <EmptyState message="No reviews yet." /> :
        rows.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          return (
            <AdminCard key={r.id} title={row.client_name || "Untitled"}>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Client name"><Input value={row.client_name ?? ""} onChange={(e) => setE(r.id, { client_name: e.target.value })} /></FormRow>
                <FormRow label="Role / title"><Input value={row.role ?? ""} onChange={(e) => setE(r.id, { role: e.target.value })} /></FormRow>
                <FormRow label="Company"><Input value={row.company ?? ""} onChange={(e) => setE(r.id, { company: e.target.value })} /></FormRow>
                <FormRow label="Rating (1-5)"><Input type="number" min={1} max={5} value={row.rating ?? 5} onChange={(e) => setE(r.id, { rating: Number(e.target.value) })} /></FormRow>
                <div className="sm:col-span-2"><FormRow label="Review"><Textarea rows={4} value={row.review ?? ""} onChange={(e) => setE(r.id, { review: e.target.value })} /></FormRow></div>
                <div className="sm:col-span-2"><FormRow label="Avatar"><MediaPicker value={row.avatar_url} onChange={(u: string | null) => setE(r.id, { avatar_url: u })} /></FormRow></div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <Switch checked={!!row.published} onCheckedChange={(v) => setE(r.id, { published: v })} />
                  <span className="text-sm font-semibold">Published</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-primary text-xs">
                    {Array.from({ length: row.rating ?? 0 }).map((_, k) => <Star key={k} className="w-3 h-3 fill-current" />)}
                  </span>
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
