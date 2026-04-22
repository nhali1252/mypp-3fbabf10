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

export const Route = createFileRoute("/_admin/admin/slots")({ component: AdminSlots });

const CARD_SIZES = ["small", "medium", "large", "wide"] as const;

function AdminSlots() {
  const t = useTable("slots");
  const rows = t.data ?? [];
  const { data: folders = [] } = useQuery({
    queryKey: ["admin-table", "folders"],
    queryFn: async () => {
      const { data } = await supabase.from("folders").select("id,name").order("sort_order");
      return data ?? [];
    },
  });

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ status: true, card_size: "medium" });
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState<string>("all");

  const filtered = useMemo(
    () => rows.filter((r: any) => {
      if (folderFilter !== "all" && r.folder_id !== folderFilter) return false;
      if (search && !`${r.title} ${r.subtitle ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [rows, folderFilter, search]
  );

  const folderName = (id: string) => folders.find((f: any) => f.id === id)?.name ?? "—";

  const get = (r: any) => edits[r.id] ?? r;
  const setEdit = (id: string, patch: any) => {
    const base = edits[id] ?? rows.find((r: any) => r.id === id);
    setEdits((e) => ({ ...e, [id]: { ...base, ...patch } }));
  };

  async function add() {
    if (!draft.title?.trim() || !draft.folder_id) return;
    const ok = await t.insert({
      folder_id: draft.folder_id, title: draft.title.trim(), subtitle: draft.subtitle || null,
      type: draft.type || null, highlight_text: draft.highlight_text || null,
      contact_number: draft.contact_number || null, whatsapp_number: draft.whatsapp_number || null,
      card_size: draft.card_size || "medium", status: draft.status !== false,
      sort_order: rows.length + 1,
    });
    if (ok) { setDraft({ status: true, card_size: "medium" }); setCreating(false); }
  }

  async function save(id: string) {
    const p = edits[id]; if (!p) return;
    const ok = await t.update(id, {
      folder_id: p.folder_id, title: p.title, subtitle: p.subtitle, type: p.type,
      highlight_text: p.highlight_text, contact_number: p.contact_number,
      whatsapp_number: p.whatsapp_number, card_size: p.card_size, status: p.status,
    });
    if (ok) setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <AdminPage
      title="Slots"
      description="Slots are featured cards inside a folder. Each slot can hold multiple services."
      actions={
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Search slots…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-44" />
          <Select value={folderFilter} onValueChange={setFolderFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filter by folder" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              {folders.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreating((c) => !c)} disabled={!folders.length}><Plus className="w-4 h-4 mr-1.5" />Add slot</Button>
        </div>
      }
    >
      {!folders.length && (
        <AdminCard><p className="text-sm text-muted-foreground">Create a folder first before adding slots.</p></AdminCard>
      )}

      {creating && (
        <AdminCard title="New slot">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Folder">
              <Select value={draft.folder_id || ""} onValueChange={(v) => setDraft({ ...draft, folder_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choose folder" /></SelectTrigger>
                <SelectContent>
                  {folders.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Card size">
              <Select value={draft.card_size || "medium"} onValueChange={(v) => setDraft({ ...draft, card_size: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CARD_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Title"><Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></FormRow>
            <FormRow label="Subtitle"><Input value={draft.subtitle || ""} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} /></FormRow>
            <FormRow label="Type" hint="e.g. Premium, Economy, Outstation"><Input value={draft.type || ""} onChange={(e) => setDraft({ ...draft, type: e.target.value })} /></FormRow>
            <FormRow label="Highlight text" hint="Badge / banner copy"><Input value={draft.highlight_text || ""} onChange={(e) => setDraft({ ...draft, highlight_text: e.target.value })} /></FormRow>
            <FormRow label="Contact number"><Input value={draft.contact_number || ""} onChange={(e) => setDraft({ ...draft, contact_number: e.target.value })} /></FormRow>
            <FormRow label="WhatsApp number"><Input value={draft.whatsapp_number || ""} onChange={(e) => setDraft({ ...draft, whatsapp_number: e.target.value })} /></FormRow>
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
        <EmptyState message={search || folderFilter !== "all" ? "No slots match your filter." : "No slots yet."} />
      ) : (
        filtered.map((r: any, i: number) => {
          const row = get(r); const dirty = !!edits[r.id];
          return (
            <AdminCard key={r.id}>
              <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Folder · {folderName(row.folder_id)}</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Folder">
                  <Select value={row.folder_id || ""} onValueChange={(v) => setEdit(r.id, { folder_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{folders.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Card size">
                  <Select value={row.card_size || "medium"} onValueChange={(v) => setEdit(r.id, { card_size: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CARD_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Title"><Input value={row.title || ""} onChange={(e) => setEdit(r.id, { title: e.target.value })} /></FormRow>
                <FormRow label="Subtitle"><Input value={row.subtitle || ""} onChange={(e) => setEdit(r.id, { subtitle: e.target.value })} /></FormRow>
                <FormRow label="Type"><Input value={row.type || ""} onChange={(e) => setEdit(r.id, { type: e.target.value })} /></FormRow>
                <FormRow label="Highlight text"><Input value={row.highlight_text || ""} onChange={(e) => setEdit(r.id, { highlight_text: e.target.value })} /></FormRow>
                <FormRow label="Contact number"><Input value={row.contact_number || ""} onChange={(e) => setEdit(r.id, { contact_number: e.target.value })} /></FormRow>
                <FormRow label="WhatsApp number"><Input value={row.whatsapp_number || ""} onChange={(e) => setEdit(r.id, { whatsapp_number: e.target.value })} /></FormRow>
                <div className="flex items-end gap-2">
                  <span className="text-sm font-semibold">Active</span>
                  <Switch checked={!!row.status} onCheckedChange={(v) => setEdit(r.id, { status: v })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button onClick={() => save(r.id)} disabled={!dirty}><Save className="w-4 h-4 mr-1.5" />Save</Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => t.move(rows, r.id, 1)} disabled={i === filtered.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                <ConfirmDelete onConfirm={() => t.remove(r.id)} trigger={<Button variant="outline"><Trash2 className="w-4 h-4 mr-1.5" />Delete</Button>}
                  description="This will also delete every service inside this slot." />
              </div>
            </AdminCard>
          );
        })
      )}
    </AdminPage>
  );
}
