import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTable } from "@/hooks/useTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Star, Check, X, Eye, EyeOff, Sparkles, GripVertical } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/reviews")({ component: AdminReviews });

type Status = "pending" | "approved" | "rejected" | "featured";
const STATUSES: Status[] = ["pending", "approved", "featured", "rejected"];

function statusBadge(s: Status) {
  const map: Record<Status, string> = {
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    featured: "bg-primary/15 text-primary border-primary/30",
    rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  };
  return map[s];
}

function AdminReviews() {
  const t = useTable("testimonials");
  const qc = useQueryClient();
  const rows = t.data ?? [];
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ rating: 5, published: true, status: "approved" });
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const get = (r: any) => edits[r.id] ?? r;
  const setE = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  function toggleSelected(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function clearSelection() { setSelected(new Set()); }

  async function add() {
    if (!draft.client_name?.trim() || !draft.review?.trim()) return;
    const ok = await t.insert({ ...draft, sort_order: rows.length + 1 });
    if (ok) { setDraft({ rating: 5, published: true, status: "approved" }); setCreating(false); }
  }
  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, {
      client_name: p.client_name, role: p.role, company: p.company,
      review: p.review, rating: p.rating, avatar_url: p.avatar_url,
      published: p.published, status: p.status, featured: p.featured,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  // Quick moderation actions (immediate save, no diff needed)
  async function quick(id: string, patch: any) {
    await t.update(id, patch);
    setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  // ----- Bulk actions ---------------------------------------------------
  async function bulkUpdate(patch: any, label: string) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const { error } = await (supabase as any).from("testimonials").update(patch).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${label} ${ids.length} review${ids.length === 1 ? "" : "s"}`);
    clearSelection();
    qc.invalidateQueries({ queryKey: ["admin-table", "testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  }
  async function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} review${ids.length === 1 ? "" : "s"}? This can't be undone.`)) return;
    const { error } = await (supabase as any).from("testimonials").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`Deleted ${ids.length}`);
    clearSelection();
    qc.invalidateQueries({ queryKey: ["admin-table", "testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  }

  // ----- Drag & drop reorder -------------------------------------------
  // Persists a new order by writing sequential sort_orders. Optimistic
  // cache update keeps the UI from snapping back during writes.
  const dragId = useRef<string | null>(null);
  function onDragStart(id: string) { dragId.current = id; }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  async function onDrop(targetId: string) {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const next = [...rows];
    const fromIdx = next.findIndex((r) => r.id === from);
    const toIdx = next.findIndex((r) => r.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    qc.setQueryData(["admin-table", "testimonials"], next.map((r, i) => ({ ...r, sort_order: i + 1 })));
    try {
      await Promise.all(
        next.map((r, i) => (supabase as any).from("testimonials").update({ sort_order: i + 1 }).eq("id", r.id)),
      );
      qc.invalidateQueries({ queryKey: ["admin-table", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't save order");
      qc.invalidateQueries({ queryKey: ["admin-table", "testimonials"] });
    }
  }

  const counts = useMemo(() => {
    const c = { all: rows.length, pending: 0, approved: 0, rejected: 0, featured: 0 };
    rows.forEach((r: any) => { c[(r.status as Status) ?? "approved"] = (c[(r.status as Status) ?? "approved"] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      if (filter !== "all" && (r.status ?? "approved") !== filter) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        return (r.client_name ?? "").toLowerCase().includes(needle) || (r.review ?? "").toLowerCase().includes(needle);
      }
      return true;
    });
  }, [rows, filter, q]);

  return (
    <AdminPage
      title="Reviews & testimonials"
      description="Moderate client reviews. Public submissions arrive as 'pending' and only show on the site once approved."
      actions={<Button onClick={() => setCreating((c) => !c)}><Plus className="w-4 h-4 mr-1.5" /> Add review</Button>}
    >
      {/* Filter bar */}
      <AdminCard>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
              }`}
            >
              {s} <span className="opacity-60 ml-1">({(counts as any)[s] ?? 0})</span>
            </button>
          ))}
          <div className="ml-auto w-full sm:w-72">
            <Input placeholder="Search name or review…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </AdminCard>

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

      {filtered.length === 0 ? <EmptyState message="No reviews match this view." /> :
        filtered.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          const status = (row.status ?? "approved") as Status;
          return (
            <AdminCard key={r.id} title={row.client_name || "Untitled"}>
              {/* Status + quick actions strip */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge(status)}`}>
                  {status}
                </span>
                <span className="inline-flex items-center gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className={`w-3.5 h-3.5 ${k < (row.rating ?? 0) ? "fill-current" : "opacity-25"}`} />
                  ))}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                <div className="ml-auto flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => quick(r.id, { status: "approved", published: true })}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => quick(r.id, { status: "featured", published: true, featured: true })}>
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Feature
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => quick(r.id, { published: !row.published })}>
                    {row.published ? <><EyeOff className="w-3.5 h-3.5 mr-1" />Hide</> : <><Eye className="w-3.5 h-3.5 mr-1" />Show</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => quick(r.id, { status: "rejected", published: false, featured: false })}>
                    <X className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Client name"><Input value={row.client_name ?? ""} onChange={(e) => setE(r.id, { client_name: e.target.value })} /></FormRow>
                <FormRow label="Role / title"><Input value={row.role ?? ""} onChange={(e) => setE(r.id, { role: e.target.value })} /></FormRow>
                <FormRow label="Company"><Input value={row.company ?? ""} onChange={(e) => setE(r.id, { company: e.target.value })} /></FormRow>
                <FormRow label="Rating (1-5)"><Input type="number" min={1} max={5} value={row.rating ?? 5} onChange={(e) => setE(r.id, { rating: Number(e.target.value) })} /></FormRow>
                <div className="sm:col-span-2"><FormRow label="Review"><Textarea rows={4} value={row.review ?? ""} onChange={(e) => setE(r.id, { review: e.target.value })} /></FormRow></div>
                <div className="sm:col-span-2"><FormRow label="Avatar"><MediaPicker value={row.avatar_url} onChange={(u: string | null) => setE(r.id, { avatar_url: u })} /></FormRow></div>
                <FormRow label="Status">
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={status}
                    onChange={(e) => setE(r.id, { status: e.target.value, featured: e.target.value === "featured" })}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormRow>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <Switch checked={!!row.published} onCheckedChange={(v) => setE(r.id, { published: v })} />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <Switch checked={!!row.featured} onCheckedChange={(v) => setE(r.id, { featured: v })} />
                    Featured
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button onClick={() => save(r.id)} disabled={!dirty}><Save className="w-4 h-4 mr-1.5" />Save</Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, 1)} disabled={i === filtered.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                <ConfirmDelete onConfirm={() => t.remove(r.id)} trigger={<Button variant="outline"><Trash2 className="w-4 h-4 mr-1.5" />Delete</Button>} />
              </div>
            </AdminCard>
          );
        })}
    </AdminPage>
  );
}
