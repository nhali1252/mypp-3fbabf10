import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useFHero,
  useFSkills,
  useFProjects,
  useFRealtimeSync,
  F_KEYS,
  type FSkill,
  type FProject,
} from "@/hooks/useFContent";
import { useQueryClient } from "@tanstack/react-query";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Save, Trash2, GripVertical, Loader2, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ICON_NAMES, getIcon } from "@/lib/iconRegistry";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/_admin/admin/f-page")({
  component: AdminFPage,
});

function AdminFPage() {
  const { isAdmin, loading } = useAuth();
  useFRealtimeSync();

  if (loading) {
    return (
      <div className="grid place-items-center h-60 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <AdminPage title="Page F · Editor">
        <AdminCard>
          <p className="text-sm text-muted-foreground">
            This editor is restricted to admins only.
          </p>
        </AdminCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Page F · Editor"
      description="Edit /F hero, weekly skills, working style, and weekly portfolio. Changes sync live to the preview panel."
      actions={
        <a
          href="/F"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open /F
        </a>
      }
    >
      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-6 max-w-[1400px] -mx-2 px-2">
        <div className="min-w-0 space-y-6">
          <Tabs defaultValue="hero" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="design">Design skills</TabsTrigger>
              <TabsTrigger value="soft">Working style</TabsTrigger>
              <TabsTrigger value="projects">Weekly portfolio</TabsTrigger>
            </TabsList>
            <TabsContent value="hero">
              <HeroEditor />
            </TabsContent>
            <TabsContent value="design">
              <SkillsEditor kind="design" title="Design skills" />
            </TabsContent>
            <TabsContent value="soft">
              <SkillsEditor kind="soft" title="Working style" />
            </TabsContent>
            <TabsContent value="projects">
              <ProjectsEditor />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-4 self-start">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/40">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Eye className="w-3.5 h-3.5" /> Live preview
              </div>
              <span className="text-[10px] text-muted-foreground">syncs in realtime</span>
            </div>
            <div className="max-h-[calc(100vh-160px)] overflow-y-auto">
              <FPreview />
            </div>
          </div>
        </aside>
      </div>
    </AdminPage>
  );
}

/* ------------------------ Hero editor ------------------------ */

function HeroEditor() {
  const { data, isLoading } = useFHero();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data]); // eslint-disable-line

  if (isLoading || !draft) {
    return (
      <AdminCard>
        <Loader2 className="w-4 h-4 animate-spin" />
      </AdminCard>
    );
  }

  async function save() {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("f_hero")
      .update({
        headline: draft.headline,
        intro: draft.intro,
        eyebrow: draft.eyebrow,
        highlight: draft.highlight,
      })
      .eq("id", draft.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Hero saved");
    qc.invalidateQueries({ queryKey: F_KEYS.hero });
  }

  // Push edits into preview cache as user types (live preview without saving)
  function patch(p: any) {
    const next = { ...draft, ...p };
    setDraft(next);
    qc.setQueryData(F_KEYS.hero, next);
  }

  return (
    <AdminCard title="Hero">
      <div className="grid sm:grid-cols-2 gap-3">
        <FormRow label="Eyebrow">
          <Input value={draft.eyebrow} onChange={(e) => patch({ eyebrow: e.target.value })} />
        </FormRow>
        <FormRow label="Highlight word" hint="Used inside the headline gradient">
          <Input value={draft.highlight} onChange={(e) => patch({ highlight: e.target.value })} />
        </FormRow>
        <div className="sm:col-span-2">
          <FormRow label="Headline" hint="Plain text. The Highlight word inside is auto-styled.">
            <Textarea
              rows={2}
              value={draft.headline}
              onChange={(e) => patch({ headline: e.target.value })}
            />
          </FormRow>
        </div>
        <div className="sm:col-span-2">
          <FormRow label="Intro paragraph">
            <Textarea
              rows={4}
              value={draft.intro}
              onChange={(e) => patch({ intro: e.target.value })}
            />
          </FormRow>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          Save hero
        </Button>
      </div>
    </AdminCard>
  );
}

/* ------------------------ Skills editor (drag-and-drop) ------------------------ */

function SkillsEditor({ kind, title }: { kind: "design" | "soft"; title: string }) {
  const { data: all = [], isLoading } = useFSkills({ onlyActive: false });
  const qc = useQueryClient();
  const rows = useMemo(
    () => all.filter((s) => s.kind === kind).sort((a, b) => a.sort_order - b.sort_order),
    [all, kind],
  );
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ icon: "Sparkles", active: true });
  const [edits, setEdits] = useState<Record<string, Partial<FSkill>>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function get(r: FSkill): FSkill {
    return { ...r, ...(edits[r.id] || {}) } as FSkill;
  }

  function setEdit(id: string, patch: Partial<FSkill>) {
    const base = edits[id] ?? {};
    const next = { ...base, ...patch };
    setEdits((e) => ({ ...e, [id]: next }));

    // Live preview: also patch the cache
    qc.setQueryData<FSkill[]>([...F_KEYS.skills, { onlyActive: true }], (prev) => {
      if (!prev) return prev;
      return prev.map((s) => (s.id === id ? ({ ...s, ...next } as FSkill) : s));
    });
  }

  async function add() {
    if (!draft.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    const maxOrder = rows.length ? Math.max(...rows.map((r) => r.sort_order)) : 0;
    const { error } = await (supabase as any).from("f_skills").insert({
      kind,
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      icon: draft.icon || "Sparkles",
      active: draft.active ?? true,
      sort_order: maxOrder + 10,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Card added");
    setDraft({ icon: "Sparkles", active: true });
    setCreating(false);
    qc.invalidateQueries({ queryKey: F_KEYS.skills });
  }

  async function save(id: string) {
    const p = edits[id];
    if (!p) return;
    const { error } = await (supabase as any)
      .from("f_skills")
      .update({
        title: p.title,
        description: p.description ?? null,
        icon: p.icon,
        active: p.active,
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    setEdits((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
    qc.invalidateQueries({ queryKey: F_KEYS.skills });
  }

  async function remove(id: string) {
    const { error } = await (supabase as any).from("f_skills").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: F_KEYS.skills });
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = rows.findIndex((r) => r.id === active.id);
    const newIdx = rows.findIndex((r) => r.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(rows, oldIdx, newIdx);

    // Optimistic preview
    qc.setQueryData<FSkill[]>([...F_KEYS.skills, { onlyActive: false }], (prev) => {
      if (!prev) return prev;
      const others = prev.filter((s) => s.kind !== kind);
      const reordered = next.map((s, i) => ({ ...s, sort_order: (i + 1) * 10 }));
      return [...others, ...reordered];
    });
    qc.setQueryData<FSkill[]>([...F_KEYS.skills, { onlyActive: true }], (prev) => {
      if (!prev) return prev;
      const others = prev.filter((s) => s.kind !== kind);
      const reordered = next
        .filter((s) => s.active)
        .map((s, i) => ({ ...s, sort_order: (i + 1) * 10 }));
      return [...others, ...reordered];
    });

    // Persist new sort_order values
    const updates = next.map((s, i) =>
      (supabase as any).from("f_skills").update({ sort_order: (i + 1) * 10 }).eq("id", s.id),
    );
    const results = await Promise.all(updates);
    const failed = results.find((r: any) => r.error);
    if (failed) toast.error("Failed to save order");
    qc.invalidateQueries({ queryKey: F_KEYS.skills });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Drag the handle to reorder. Inactive cards are hidden on /F.
        </p>
        <Button onClick={() => setCreating((c) => !c)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add card
        </Button>
      </div>

      {creating && (
        <AdminCard title={`New ${title.toLowerCase()} card`}>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Title">
              <Input
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </FormRow>
            <FormRow label="Icon">
              <IconPicker value={draft.icon} onChange={(v) => setDraft({ ...draft, icon: v })} />
            </FormRow>
            <div className="sm:col-span-2">
              <FormRow label="Short description">
                <Textarea
                  rows={2}
                  value={draft.description || ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </FormRow>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : rows.length === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} cards yet.`} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {rows.map((r) => {
                const row = get(r);
                const dirty = !!edits[r.id];
                return (
                  <SortableSkillRow
                    key={r.id}
                    row={row}
                    dirty={dirty}
                    onChange={(patch) => setEdit(r.id, patch)}
                    onSave={() => save(r.id)}
                    onDelete={() => remove(r.id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableSkillRow({
  row,
  dirty,
  onChange,
  onSave,
  onDelete,
}: {
  row: FSkill;
  dirty: boolean;
  onChange: (p: Partial<FSkill>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const Icon = getIcon(row.icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 grid sm:grid-cols-[1fr_180px] gap-3 min-w-0">
          <FormRow label="Title">
            <Input value={row.title} onChange={(e) => onChange({ title: e.target.value })} />
          </FormRow>
          <FormRow label="Icon">
            <IconPicker value={row.icon} onChange={(v) => onChange({ icon: v })} />
          </FormRow>
          <div className="sm:col-span-2">
            <FormRow label="Short description">
              <Textarea
                rows={2}
                value={row.description ?? ""}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </FormRow>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={row.active} onCheckedChange={(v) => onChange({ active: v })} />
          <span>Visible on /F</span>
        </label>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={!dirty} size="sm">
            <Save className="w-4 h-4 mr-1.5" /> Save
          </Button>
          <ConfirmDelete
            onConfirm={onDelete}
            trigger={
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}

function IconPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value ?? "Sparkles"} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {ICON_NAMES.map((n) => {
          const I = getIcon(n);
          return (
            <SelectItem key={n} value={n}>
              <span className="inline-flex items-center gap-2">
                <I className="w-3.5 h-3.5" /> {n}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/* ------------------------ Projects editor ------------------------ */

function ProjectsEditor() {
  const { data: rows = [], isLoading } = useFProjects({ onlyActive: false });
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ active: true, tags: [] as string[] });
  const [edits, setEdits] = useState<Record<string, Partial<FProject>>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function get(r: FProject): FProject {
    return { ...r, ...(edits[r.id] || {}) } as FProject;
  }

  function setEdit(id: string, patch: Partial<FProject>) {
    const base = edits[id] ?? {};
    const next = { ...base, ...patch };
    setEdits((e) => ({ ...e, [id]: next }));
    qc.setQueryData<FProject[]>([...F_KEYS.projects, { onlyActive: true }], (prev) => {
      if (!prev) return prev;
      return prev.map((p) => (p.id === id ? ({ ...p, ...next } as FProject) : p));
    });
  }

  async function add() {
    if (!draft.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    const maxOrder = rows.length ? Math.max(...rows.map((r) => r.sort_order)) : 0;
    const { error } = await (supabase as any).from("f_projects").insert({
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      image_url: draft.image_url || null,
      url: draft.url?.trim() || null,
      tags: draft.tags ?? [],
      active: draft.active ?? true,
      sort_order: maxOrder + 10,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Project added");
    setDraft({ active: true, tags: [] });
    setCreating(false);
    qc.invalidateQueries({ queryKey: F_KEYS.projects });
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
        tags: p.tags ?? [],
        active: p.active,
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    setEdits((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
    qc.invalidateQueries({ queryKey: F_KEYS.projects });
  }

  async function remove(id: string) {
    const { error } = await (supabase as any).from("f_projects").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: F_KEYS.projects });
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = rows.findIndex((r) => r.id === active.id);
    const newIdx = rows.findIndex((r) => r.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(rows, oldIdx, newIdx);
    qc.setQueryData<FProject[]>([...F_KEYS.projects, { onlyActive: true }], (prev) => {
      if (!prev) return prev;
      return next.filter((s) => s.active).map((s, i) => ({ ...s, sort_order: (i + 1) * 10 }));
    });
    qc.setQueryData<FProject[]>([...F_KEYS.projects, { onlyActive: false }], () =>
      next.map((s, i) => ({ ...s, sort_order: (i + 1) * 10 })),
    );
    const updates = next.map((s, i) =>
      (supabase as any).from("f_projects").update({ sort_order: (i + 1) * 10 }).eq("id", s.id),
    );
    const results = await Promise.all(updates);
    if (results.find((r: any) => r.error)) toast.error("Failed to save order");
    qc.invalidateQueries({ queryKey: F_KEYS.projects });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Weekly portfolio items shown on /F. Drag the handle to reorder.
        </p>
        <Button onClick={() => setCreating((c) => !c)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add project
        </Button>
      </div>

      {creating && (
        <AdminCard title="New project">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Title">
              <Input
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </FormRow>
            <FormRow label="Link (optional)">
              <Input
                value={draft.url || ""}
                placeholder="https://…"
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
            </FormRow>
            <div className="sm:col-span-2">
              <FormRow label="Short description">
                <Textarea
                  rows={2}
                  value={draft.description || ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </FormRow>
            </div>
            <div className="sm:col-span-2">
              <FormRow label="Tags" hint="Comma-separated, e.g. Logo, Branding">
                <TagsInput
                  value={draft.tags ?? []}
                  onChange={(tags) => setDraft({ ...draft, tags })}
                />
              </FormRow>
            </div>
            <div className="sm:col-span-2">
              <FormRow label="Image">
                <MediaPicker
                  value={draft.image_url}
                  onChange={(url) => setDraft({ ...draft, image_url: url })}
                />
              </FormRow>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={add}>Create</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </AdminCard>
      )}

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : rows.length === 0 ? (
        <EmptyState message="No projects yet. Add your first weekly portfolio item." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {rows.map((r) => {
                const row = get(r);
                const dirty = !!edits[r.id];
                return (
                  <SortableProjectRow
                    key={r.id}
                    row={row}
                    dirty={dirty}
                    onChange={(patch) => setEdit(r.id, patch)}
                    onSave={() => save(r.id)}
                    onDelete={() => remove(r.id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableProjectRow({
  row,
  dirty,
  onChange,
  onSave,
  onDelete,
}: {
  row: FProject;
  dirty: boolean;
  onChange: (p: Partial<FProject>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 grid sm:grid-cols-2 gap-3 min-w-0">
          <FormRow label="Title">
            <Input value={row.title} onChange={(e) => onChange({ title: e.target.value })} />
          </FormRow>
          <FormRow label="Link (optional)">
            <Input
              value={row.url ?? ""}
              placeholder="https://…"
              onChange={(e) => onChange({ url: e.target.value })}
            />
          </FormRow>
          <div className="sm:col-span-2">
            <FormRow label="Short description">
              <Textarea
                rows={2}
                value={row.description ?? ""}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </FormRow>
          </div>
          <div className="sm:col-span-2">
            <FormRow label="Tags">
              <TagsInput value={row.tags} onChange={(tags) => onChange({ tags })} />
            </FormRow>
          </div>
          <div className="sm:col-span-2">
            <FormRow label="Image">
              <MediaPicker
                value={row.image_url}
                onChange={(url) => onChange({ image_url: url })}
              />
            </FormRow>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={row.active} onCheckedChange={(v) => onChange({ active: v })} />
          <span>Visible on /F</span>
        </label>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={!dirty} size="sm">
            <Save className="w-4 h-4 mr-1.5" /> Save
          </Button>
          <ConfirmDelete
            onConfirm={onDelete}
            trigger={
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}

function TagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState(value.join(", "));
  useEffect(() => {
    setText(value.join(", "));
  }, [value]);
  return (
    <Input
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const tags = t
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        onChange(tags);
      }}
      placeholder="Logo, Branding, Poster"
    />
  );
}

/* ------------------------ Live preview ------------------------ */

function FPreview() {
  const { data: hero } = useFHero();
  const { data: skills = [] } = useFSkills({ onlyActive: true });
  const { data: projects = [] } = useFProjects({ onlyActive: true });

  const design = skills.filter((s) => s.kind === "design");
  const soft = skills.filter((s) => s.kind === "soft");

  return (
    <div className="bg-background text-foreground p-5 space-y-7">
      {hero && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">
            {hero.eyebrow}
          </p>
          <h1
            className="font-black leading-[1.05] mb-3"
            style={{ fontSize: "clamp(22px, 3vw, 32px)" }}
          >
            {renderHighlightedHeadline(hero.headline, hero.highlight)}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {hero.intro}
          </p>
        </div>
      )}

      <PreviewSection eyebrow="Design skills" title="What I build every week" cards={design} />
      <PreviewSection eyebrow="Working style" title="How I work with clients" cards={soft} />

      {projects.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">
            Weekly portfolio
          </p>
          <h2 className="font-black leading-tight mb-3" style={{ fontSize: "clamp(18px, 2.4vw, 24px)" }}>
            Recent work
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {projects.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {p.image_url ? (
                  <div className="aspect-[4/3] bg-muted">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-muted/40 grid place-items-center text-[10px] text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-xs font-bold leading-tight truncate">{p.title}</p>
                  {p.tags.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {p.tags.join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewSection({
  eyebrow,
  title,
  cards,
}: {
  eyebrow: string;
  title: string;
  cards: FSkill[];
}) {
  if (cards.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">{eyebrow}</p>
      <h2 className="font-black leading-tight mb-3" style={{ fontSize: "clamp(18px, 2.4vw, 24px)" }}>
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((c) => {
          const Icon = getIcon(c.icon);
          return (
            <motion.div
              key={c.id}
              layout
              className="rounded-xl border border-border bg-card p-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 mb-2">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold leading-tight">{c.title}</p>
              {c.description && (
                <p className="text-[10px] text-muted-foreground leading-snug mt-1">
                  {c.description}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function renderHighlightedHeadline(headline: string, highlight: string) {
  if (!highlight || !headline.includes(highlight)) return headline;
  const parts = headline.split(highlight);
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && (
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(110deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 40%, var(--foreground)) 100%)",
          }}
        >
          {highlight}
        </span>
      )}
    </span>
  ));
}
