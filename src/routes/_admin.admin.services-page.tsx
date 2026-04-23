import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ICON_NAMES, getIcon } from "@/lib/iconRegistry";
import { toast } from "sonner";
import { Plus, Save, Trash2, ArrowUp, ArrowDown, ExternalLink, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/services-page")({
  component: AdminServicesPage,
});

type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  active: boolean;
};

function AdminServicesPage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_services"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ServiceRow[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin_services"] });
    qc.invalidateQueries({ queryKey: ["public-services"] });
  };

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ active: true, icon: "Sparkles" });
  const [edits, setEdits] = useState<Record<string, Partial<ServiceRow>>>({});

  const get = (r: ServiceRow) => ({ ...r, ...(edits[r.id] || {}) }) as ServiceRow;
  const setEdit = (id: string, patch: Partial<ServiceRow>) =>
    setEdits((e) => ({ ...e, [id]: { ...(e[id] || {}), ...patch } }));

  async function add() {
    if (!draft.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    const max = rows.length ? Math.max(...rows.map((r) => r.sort_order)) : 0;
    const { error } = await (supabase as any).from("services").insert({
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      icon: draft.icon || "Sparkles",
      sort_order: max + 10,
      active: draft.active ?? true,
    });
    if (error) return toast.error(error.message);
    toast.success("Service added");
    setCreating(false);
    setDraft({ active: true, icon: "Sparkles" });
    refresh();
  }

  async function save(id: string) {
    const p = edits[id];
    if (!p) return;
    const { error } = await (supabase as any)
      .from("services")
      .update({
        title: p.title,
        description: p.description ?? null,
        icon: p.icon ?? "Sparkles",
        active: p.active,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEdits((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
    refresh();
  }

  async function remove(id: string) {
    const { error } = await (supabase as any).from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = rows.findIndex((r) => r.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= rows.length) return;
    const a = rows[idx];
    const b = rows[swap];
    await Promise.all([
      (supabase as any).from("services").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("services").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    refresh();
  }

  return (
    <AdminPage
      title="Services page"
      description='Manage the "What I offer" cards on the public /services page.'
      actions={
        <div className="flex gap-2">
          <a
            href="/services"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View page
          </a>
          <Button size="sm" onClick={() => setCreating((c) => !c)}>
            <Plus className="w-4 h-4 mr-1.5" /> New service
          </Button>
        </div>
      }
    >
      {creating && (
        <AdminCard title="New service">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Title">
              <Input
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Brand Identity"
              />
            </FormRow>
            <FormRow label="Icon">
              <IconSelect
                value={draft.icon || "Sparkles"}
                onChange={(v) => setDraft({ ...draft, icon: v })}
              />
            </FormRow>
            <div className="sm:col-span-2">
              <FormRow label="Description">
                <Textarea
                  rows={3}
                  value={draft.description || ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </FormRow>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-sm font-semibold">Active</span>
              <Switch
                checked={draft.active !== false}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}

      {isLoading ? (
        <AdminCard>
          <Loader2 className="w-4 h-4 animate-spin" />
        </AdminCard>
      ) : rows.length === 0 ? (
        <EmptyState message="No services yet — add the first one." />
      ) : (
        rows.map((r, i) => {
          const row = get(r);
          const dirty = !!edits[r.id];
          const Icon = getIcon(row.icon || "Sparkles");
          return (
            <AdminCard key={r.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg grid place-items-center bg-primary/10 text-primary border border-primary/20">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Service card
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Title">
                  <Input
                    value={row.title || ""}
                    onChange={(e) => setEdit(r.id, { title: e.target.value })}
                  />
                </FormRow>
                <FormRow label="Icon">
                  <IconSelect
                    value={row.icon || "Sparkles"}
                    onChange={(v) => setEdit(r.id, { icon: v })}
                  />
                </FormRow>
                <div className="sm:col-span-2">
                  <FormRow label="Description">
                    <Textarea
                      rows={3}
                      value={row.description || ""}
                      onChange={(e) => setEdit(r.id, { description: e.target.value })}
                    />
                  </FormRow>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-sm font-semibold">Active</span>
                  <Switch
                    checked={!!row.active}
                    onCheckedChange={(v) => setEdit(r.id, { active: v })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button onClick={() => save(r.id)} disabled={!dirty}>
                  <Save className="w-4 h-4 mr-1.5" /> Save
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => move(r.id, -1)}
                  disabled={i === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => move(r.id, 1)}
                  disabled={i === rows.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <ConfirmDelete
                  title="Delete service?"
                  description={`Remove "${r.title}" from the services page.`}
                  onConfirm={() => remove(r.id)}
                  trigger={
                    <Button variant="outline">
                      <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                    </Button>
                  }
                />
              </div>
            </AdminCard>
          );
        })
      )}

      <AdminCard title="Tip">
        <p className="text-sm text-muted-foreground">
          The Services page also pulls "Technical mastery" and "Working style" cards from the
          <strong> Page F editor → Design skills / Working style</strong> tabs.
        </p>
      </AdminCard>
    </AdminPage>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {ICON_NAMES.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
