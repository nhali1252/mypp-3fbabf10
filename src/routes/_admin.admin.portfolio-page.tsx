import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { TagListEditor } from "@/components/admin/TagListEditor";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { toast } from "sonner";
import { Plus, Save, Trash2, ArrowUp, ArrowDown, ExternalLink, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/portfolio-page")({
  component: AdminPortfolioPage,
});

type FProject = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  url: string | null;
  tags: string[] | null;
  sort_order: number;
  active: boolean;
};

function AdminPortfolioPage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_f_projects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("f_projects")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FProject[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin_f_projects"] });
    qc.invalidateQueries({ queryKey: ["public-f-projects"] });
  };

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ active: true, tags: [] });
  const [edits, setEdits] = useState<Record<string, Partial<FProject>>>({});

  useEffect(() => {
    if (!creating) setDraft({ active: true, tags: [] });
  }, [creating]);

  const get = (r: FProject) => ({ ...r, ...(edits[r.id] || {}) }) as FProject;
  const setEdit = (id: string, patch: Partial<FProject>) =>
    setEdits((e) => ({ ...e, [id]: { ...(e[id] || {}), ...patch } }));

  async function add() {
    if (!draft.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    const max = rows.length ? Math.max(...rows.map((r) => r.sort_order)) : 0;
    const { error } = await (supabase as any).from("f_projects").insert({
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      image_url: draft.image_url || null,
      url: draft.url || null,
      tags: Array.isArray(draft.tags) ? draft.tags : [],
      sort_order: max + 10,
      active: draft.active ?? true,
    });
    if (error) return toast.error(error.message);
    toast.success("Portfolio item added");
    setCreating(false);
    refresh();
  }

  async function save(id: string) {
    const p = edits[id];
    if (!p) return;
    const { error } = await (supabase as any)
      .from("f_projects")
      .update({
        title: p.title,
        description: p.description ?? null,
        image_url: p.image_url ?? null,
        url: p.url ?? null,
        tags: Array.isArray(p.tags) ? p.tags : undefined,
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
    const { error } = await (supabase as any).from("f_projects").delete().eq("id", id);
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
      (supabase as any).from("f_projects").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("f_projects").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    refresh();
  }

  return (
    <AdminPage
      title="Portfolio page"
      description="Manage every card on the public /portfolio page — selected design & client work."
      actions={
        <div className="flex gap-2">
          <a
            href="/portfolio"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View page
          </a>
          <Button size="sm" onClick={() => setCreating((c) => !c)}>
            <Plus className="w-4 h-4 mr-1.5" /> New item
          </Button>
        </div>
      }
    >
      {creating && (
        <AdminCard title="New portfolio item">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Title">
              <Input
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Project title"
              />
            </FormRow>
            <FormRow label="Project URL (optional)">
              <Input
                value={draft.url || ""}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://…"
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
            <div className="sm:col-span-2">
              <FormRow label="Cover image">
                <MediaPicker
                  value={draft.image_url || ""}
                  onChange={(url) => setDraft({ ...draft, image_url: url })}
                />
              </FormRow>
            </div>
            <div className="sm:col-span-2">
              <FormRow label="Tags">
                <TagListEditor
                  value={Array.isArray(draft.tags) ? draft.tags : []}
                  onChange={(tags) => setDraft({ ...draft, tags })}
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
        <EmptyState message="No portfolio items yet — add the first one." />
      ) : (
        rows.map((r, i) => {
          const row = get(r);
          const dirty = !!edits[r.id];
          return (
            <AdminCard key={r.id}>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormRow label="Title">
                  <Input
                    value={row.title || ""}
                    onChange={(e) => setEdit(r.id, { title: e.target.value })}
                  />
                </FormRow>
                <FormRow label="Project URL">
                  <Input
                    value={row.url || ""}
                    onChange={(e) => setEdit(r.id, { url: e.target.value })}
                    placeholder="https://…"
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
                <div className="sm:col-span-2">
                  <FormRow label="Cover image">
                    <MediaPicker
                      value={row.image_url || ""}
                      onChange={(url) => setEdit(r.id, { image_url: url })}
                    />
                  </FormRow>
                </div>
                <div className="sm:col-span-2">
                  <FormRow label="Tags">
                    <TagListEditor
                      value={Array.isArray(row.tags) ? row.tags : []}
                      onChange={(tags) => setEdit(r.id, { tags })}
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
                  title="Delete portfolio item?"
                  description={`Remove "${r.title}" from the portfolio page.`}
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
    </AdminPage>
  );
}
