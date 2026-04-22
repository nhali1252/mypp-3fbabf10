import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTable } from "@/hooks/useTable";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/services-cms")({ component: AdminTaxiServices });

function AdminTaxiServices() {
  const t = useTable("taxi_services");
  const rows = t.data ?? [];
  const { data: slots = [] } = useQuery({
    queryKey: ["admin-table", "slots"],
    queryFn: async () => {
      const { data } = await supabase.from("slots").select("id,title,folder_id").order("sort_order");
      return data ?? [];
    },
  });
  const { data: folders = [] } = useQuery({
    queryKey: ["admin-table", "folders"],
    queryFn: async () => {
      const { data } = await supabase.from("folders").select("id,name").order("sort_order");
      return data ?? [];
    },
  });

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ status: true, button_text: "Book Now" });
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState<string>("all");

  const slotLabel = (id: string) => {
    const s = slots.find((x: any) => x.id === id);
    if (!s) return "—";
    const f = folders.find((x: any) => x.id === s.folder_id);
    return f ? `${f.name} → ${s.title}` : s.title;
  };

  const filtered = useMemo(
    () => rows.filter((r: any) => {
      if (slotFilter !== "all" && r.slot_id !== slotFilter) return false;
      if (search && !`${r.service_name} ${r.description ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [rows, slotFilter, search]
  );

  const get = (r: any) => edits[r.id] ?? r;
  const setEdit = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draft.service_name?.trim() || !draft.slot_id) return;
    const ok = await t.insert({
      slot_id: draft.slot_id, service_name: draft.service_name.trim(),
      description: draft.description || null, price: draft.price || null,
      badge: draft.badge || null, contact_number: draft.contact_number || null,
      button_text: draft.button_text || "Book Now", button_link: draft.button_link || null,
      status: draft.status !== false, sort_order: rows.length + 1,
    });
    if (ok) { setDraft({ status: true, button_text: "Book Now" }); setCreating(false); }
  }

  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, {
      slot_id: p.slot_id, service_name: p.service_name, description: p.description,
      price: p.price, badge: p.badge, contact_number: p.contact_number,
      button_text: p.button_text, button_link: p.button_link, status: p.status,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage
      title="Taxi Services"
      description="Individual service offerings inside each slot."
      actions={
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Search services…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-44" />
          <Select value={slotFilter} onValueChange={setSlotFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filter by slot" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All slots</SelectItem>
              {slots.map((s: any) => <SelectItem key={s.id} value={s.id}>{slotLabel(s.id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreating((c) => !c)} disabled={!slots.length}><Plus className="w-4 h-4 mr-1.5" />Add service</Button>
        </div>
      }
    >
      {!slots.length && (
        <AdminCard><p className="text-sm text-muted-foreground">Create a slot first before adding services.</p></AdminCard>
      )}

      {creating && (
        <AdminCard title="New service">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Slot">
              <Select value={draft.slot_id || ""} onValueChange={(v) => setDraft({ ...draft, slot_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choose slot" /></SelectTrigger>
                <SelectContent>{slots.map((s: any) => <SelectItem key={s.id} value={s.id}>{slotLabel(s.id)}</SelectItem>)}</SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Service name"><Input value={draft.service_name || ""} onChange={(e) => setDraft({ ...draft, service_name: e.target.value })} /></FormRow>
            <div className="sm:col-span-2"><FormRow label="Description"><Textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></FormRow></div>
            <FormRow label="Price" hint="e.g. ₹499 or From $25"><Input value={draft.price || ""} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></FormRow>
            <FormRow label="Badge" hint="e.g. Popular, New"><Input value={draft.badge || ""} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} /></FormRow>
            <FormRow label="Contact number"><Input value={draft.contact_number || ""} onChange={(e) => setDraft({ ...draft, contact_number: e.target.value })} /></FormRow>
            <FormRow label="Button text"><Input value={draft.button_text || ""} onChange={(e) => setDraft({ ...draft, button_text: e.target.value })} /></FormRow>
            <div className="sm:col-span-2"><FormRow label="Button link" hint="tel:, https:// or mailto:"><Input value={draft.button_link || ""} onChange={(e) => setDraft({ ...draft, button_link: e.target.value })} /></FormRow></div>
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
        <EmptyState message={search || slotFilter !== "all" ? "No services match your filter." : "No services yet."} />
      ) : (
        filtered.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          return (
            <AdminCard key={r.id}>
              <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Slot · {slotLabel(row.slot_id)}</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Slot">
                  <Select value={row.slot_id || ""} onValueChange={(v) => setEdit(r.id, { slot_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{slots.map((s: any) => <SelectItem key={s.id} value={s.id}>{slotLabel(s.id)}</SelectItem>)}</SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Service name"><Input value={row.service_name || ""} onChange={(e) => setEdit(r.id, { service_name: e.target.value })} /></FormRow>
                <div className="sm:col-span-2"><FormRow label="Description"><Textarea value={row.description || ""} onChange={(e) => setEdit(r.id, { description: e.target.value })} /></FormRow></div>
                <FormRow label="Price"><Input value={row.price || ""} onChange={(e) => setEdit(r.id, { price: e.target.value })} /></FormRow>
                <FormRow label="Badge"><Input value={row.badge || ""} onChange={(e) => setEdit(r.id, { badge: e.target.value })} /></FormRow>
                <FormRow label="Contact number"><Input value={row.contact_number || ""} onChange={(e) => setEdit(r.id, { contact_number: e.target.value })} /></FormRow>
                <FormRow label="Button text"><Input value={row.button_text || ""} onChange={(e) => setEdit(r.id, { button_text: e.target.value })} /></FormRow>
                <div className="sm:col-span-2"><FormRow label="Button link"><Input value={row.button_link || ""} onChange={(e) => setEdit(r.id, { button_link: e.target.value })} /></FormRow></div>
                <div className="flex items-end gap-2">
                  <span className="text-sm font-semibold">Active</span>
                  <Switch checked={!!row.status} onCheckedChange={(v) => setEdit(r.id, { status: v })} />
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
        })
      )}
    </AdminPage>
  );
}
