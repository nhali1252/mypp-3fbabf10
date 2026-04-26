import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { TagListEditor } from "@/components/admin/TagListEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, FolderOpen, ChevronRight, Image as ImageIcon, Star, Eye, MessageSquare, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/portfolio")({ component: AdminPortfolio });

type Folder = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  sort_order: number;
  active: boolean;
};

type Item = {
  id: string;
  folder_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  tags: string[];
  sort_order: number;
  active: boolean;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminPortfolio() {
  const qc = useQueryClient();

  const foldersQ = useQuery({
    queryKey: ["admin_portfolio_folders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("portfolio_folders")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Folder[];
    },
  });
  const folders = foldersQ.data ?? [];
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;

  const itemsQ = useQuery({
    queryKey: ["admin_portfolio_items", activeFolderId],
    queryFn: async () => {
      if (!activeFolderId) return [] as Item[];
      const { data, error } = await (supabase as any)
        .from("portfolio_items")
        .select("*")
        .eq("folder_id", activeFolderId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        ...r,
        tags: Array.isArray(r.tags) ? r.tags : [],
      })) as Item[];
    },
    enabled: !!activeFolderId,
  });
  const items = itemsQ.data ?? [];

  // ---- Folder CRUD ------------------------------------------------------
  const [newFolder, setNewFolder] = useState<Partial<Folder>>({ active: true });
  const [folderEdits, setFolderEdits] = useState<Record<string, Partial<Folder>>>({});
  const fGet = (f: Folder) => ({ ...f, ...(folderEdits[f.id] ?? {}) });
  const fSet = (id: string, patch: Partial<Folder>) =>
    setFolderEdits((e) => ({ ...e, [id]: { ...(e[id] ?? {}), ...patch } }));

  const createFolder = useMutation({
    mutationFn: async () => {
      if (!newFolder.name?.trim()) throw new Error("Folder name required");
      const slug = (newFolder.slug?.trim() || slugify(newFolder.name)) || `folder-${Date.now()}`;
      const { error } = await (supabase as any).from("portfolio_folders").insert({
        name: newFolder.name,
        slug,
        description: newFolder.description ?? null,
        cover_url: newFolder.cover_url ?? null,
        active: newFolder.active ?? true,
        sort_order: folders.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Folder created");
      setNewFolder({ active: true });
      qc.invalidateQueries({ queryKey: ["admin_portfolio_folders"] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_folders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveFolder = useMutation({
    mutationFn: async (id: string) => {
      const patch = folderEdits[id];
      if (!patch) return;
      const { error } = await (supabase as any).from("portfolio_folders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      toast.success("Folder saved");
      setFolderEdits((e) => { const n = { ...e }; delete n[id]; return n; });
      qc.invalidateQueries({ queryKey: ["admin_portfolio_folders"] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_folders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("portfolio_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Folder deleted");
      setActiveFolderId(null);
      qc.invalidateQueries({ queryKey: ["admin_portfolio_folders"] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_folders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function moveFolder(id: string, dir: -1 | 1) {
    const idx = folders.findIndex((f) => f.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= folders.length) return;
    const a = folders[idx], b = folders[swap];
    await Promise.all([
      (supabase as any).from("portfolio_folders").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("portfolio_folders").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    qc.invalidateQueries({ queryKey: ["admin_portfolio_folders"] });
    qc.invalidateQueries({ queryKey: ["public_portfolio_folders"] });
  }

  // ---- Item CRUD --------------------------------------------------------
  const [newItem, setNewItem] = useState<Partial<Item>>({ active: true, tags: [] });
  const [itemEdits, setItemEdits] = useState<Record<string, Partial<Item>>>({});
  const iGet = (it: Item) => ({ ...it, ...(itemEdits[it.id] ?? {}) });
  const iSet = (id: string, patch: Partial<Item>) =>
    setItemEdits((e) => ({ ...e, [id]: { ...(e[id] ?? {}), ...patch } }));

  const createItem = useMutation({
    mutationFn: async () => {
      if (!activeFolderId) throw new Error("Pick a folder first");
      if (!newItem.title?.trim()) throw new Error("Title required");
      const { error } = await (supabase as any).from("portfolio_items").insert({
        folder_id: activeFolderId,
        title: newItem.title,
        description: newItem.description ?? null,
        image_url: newItem.image_url ?? null,
        external_url: newItem.external_url ?? null,
        tags: newItem.tags ?? [],
        active: newItem.active ?? true,
        sort_order: items.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item added");
      setNewItem({ active: true, tags: [] });
      qc.invalidateQueries({ queryKey: ["admin_portfolio_items", activeFolderId] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_items"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveItem = useMutation({
    mutationFn: async (id: string) => {
      const patch = itemEdits[id];
      if (!patch) return;
      const { error } = await (supabase as any).from("portfolio_items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      toast.success("Saved");
      setItemEdits((e) => { const n = { ...e }; delete n[id]; return n; });
      qc.invalidateQueries({ queryKey: ["admin_portfolio_items", activeFolderId] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_items"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("portfolio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item removed");
      qc.invalidateQueries({ queryKey: ["admin_portfolio_items", activeFolderId] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_items"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function moveItem(id: string, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= items.length) return;
    const a = items[idx], b = items[swap];
    await Promise.all([
      (supabase as any).from("portfolio_items").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("portfolio_items").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    qc.invalidateQueries({ queryKey: ["admin_portfolio_items", activeFolderId] });
  }

  return (
    <AdminPage
      title="Portfolio"
      description="Folder-based portfolio. Create folders, then upload items into each folder. Empty folders show 'No data, will be uploaded soon' on the public page."
    >
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* FOLDERS COLUMN */}
        <div className="space-y-4">
          <AdminCard title="Folders">
            {foldersQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : folders.length === 0 ? (
              <EmptyState message="No folders yet — add one below." />
            ) : (
              <ul className="space-y-1.5">
                {folders.map((f, i) => {
                  const row = fGet(f);
                  const dirty = !!folderEdits[f.id];
                  const isActive = activeFolderId === f.id;
                  return (
                    <li
                      key={f.id}
                      className={`rounded-xl border ${isActive ? "border-primary bg-primary/5" : "border-border bg-card"} transition-colors`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFolderId(f.id)}
                        className="w-full flex items-center justify-between gap-2 p-3 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{row.name}</div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                              /{row.slug} {!row.active && "· hidden"}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
                      </button>

                      {isActive && (
                        <div className="border-t border-border p-3 space-y-3">
                          <FormRow label="Name">
                            <Input value={row.name} onChange={(e) => fSet(f.id, { name: e.target.value })} />
                          </FormRow>
                          <FormRow label="Slug">
                            <Input value={row.slug} onChange={(e) => fSet(f.id, { slug: e.target.value })} />
                          </FormRow>
                          <FormRow label="Description">
                            <Textarea rows={2} value={row.description ?? ""} onChange={(e) => fSet(f.id, { description: e.target.value })} />
                          </FormRow>
                          <FormRow label="Cover image">
                            <MediaPicker value={row.cover_url ?? undefined} onChange={(u: string | null) => fSet(f.id, { cover_url: u })} />
                          </FormRow>
                          <label className="flex items-center gap-2 text-xs font-semibold">
                            <Switch checked={!!row.active} onCheckedChange={(v) => fSet(f.id, { active: v })} />
                            Visible on site
                          </label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button size="sm" onClick={() => saveFolder.mutate(f.id)} disabled={!dirty}>
                              <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => moveFolder(f.id, -1)} disabled={i === 0}>
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => moveFolder(f.id, 1)} disabled={i === folders.length - 1}>
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <ConfirmDelete
                              onConfirm={() => deleteFolder.mutate(f.id)}
                              trigger={<Button size="sm" variant="outline"><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete</Button>}
                            />
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="New folder">
            <div className="grid gap-3">
              <FormRow label="Name">
                <Input value={newFolder.name ?? ""} onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })} placeholder="e.g. Logos" />
              </FormRow>
              <FormRow label="Slug" hint="auto-generated from name if empty">
                <Input value={newFolder.slug ?? ""} onChange={(e) => setNewFolder({ ...newFolder, slug: e.target.value })} placeholder="logos" />
              </FormRow>
              <FormRow label="Description">
                <Textarea rows={2} value={newFolder.description ?? ""} onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })} />
              </FormRow>
              <FormRow label="Cover image">
                <MediaPicker value={newFolder.cover_url ?? undefined} onChange={(u: string | null) => setNewFolder({ ...newFolder, cover_url: u })} />
              </FormRow>
              <Button onClick={() => createFolder.mutate()} disabled={createFolder.isPending}>
                <Plus className="w-4 h-4 mr-1.5" /> Create folder
              </Button>
            </div>
          </AdminCard>
        </div>

        {/* ITEMS COLUMN */}
        <div className="space-y-4">
          {!activeFolder ? (
            <AdminCard>
              <EmptyState message="Pick a folder on the left to manage its items." />
            </AdminCard>
          ) : (
            <>
              <AdminCard title={`Items in “${activeFolder.name}”`}>
                {itemsQ.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : items.length === 0 ? (
                  <EmptyState message="Empty folder — add the first item below. The public page will show: 'No Data, will be uploaded soon'." />
                ) : (
                  <ul className="space-y-3">
                    {items.map((it, i) => {
                      const row = iGet(it);
                      const dirty = !!itemEdits[it.id];
                      const tags = Array.isArray(row.tags) ? row.tags : [];
                      return (
                        <li key={it.id} className="rounded-xl border border-border bg-background p-4">
                          <div className="grid sm:grid-cols-[120px_1fr] gap-4">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted grid place-items-center">
                              {row.image_url ? (
                                <img src={row.image_url} alt={row.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="grid gap-2">
                              <FormRow label="Title"><Input value={row.title} onChange={(e) => iSet(it.id, { title: e.target.value })} /></FormRow>
                              <FormRow label="Description"><Textarea rows={2} value={row.description ?? ""} onChange={(e) => iSet(it.id, { description: e.target.value })} /></FormRow>
                              <FormRow label="Image"><MediaPicker value={row.image_url ?? undefined} onChange={(u: string | null) => iSet(it.id, { image_url: u })} /></FormRow>
                              <FormRow label="External link (optional)"><Input value={row.external_url ?? ""} onChange={(e) => iSet(it.id, { external_url: e.target.value })} placeholder="https://…" /></FormRow>
                              <FormRow label="Tags"><TagListEditor value={tags} onChange={(v: string[]) => iSet(it.id, { tags: v })} /></FormRow>
                              <label className="flex items-center gap-2 text-xs font-semibold">
                                <Switch checked={!!row.active} onCheckedChange={(v) => iSet(it.id, { active: v })} />
                                Visible
                              </label>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <Button size="sm" onClick={() => saveItem.mutate(it.id)} disabled={!dirty}><Save className="w-3.5 h-3.5 mr-1.5" />Save</Button>
                                <Button size="sm" variant="outline" onClick={() => moveItem(it.id, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></Button>
                                <Button size="sm" variant="outline" onClick={() => moveItem(it.id, 1)} disabled={i === items.length - 1}><ArrowDown className="w-3.5 h-3.5" /></Button>
                                <ConfirmDelete
                                  onConfirm={() => deleteItem.mutate(it.id)}
                                  trigger={<Button size="sm" variant="outline"><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete</Button>}
                                />
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </AdminCard>

              <AdminCard title="Add item">
                <div className="grid gap-3">
                  <FormRow label="Title"><Input value={newItem.title ?? ""} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} /></FormRow>
                  <FormRow label="Description"><Textarea rows={2} value={newItem.description ?? ""} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} /></FormRow>
                  <FormRow label="Image"><MediaPicker value={newItem.image_url ?? undefined} onChange={(u: string | null) => setNewItem({ ...newItem, image_url: u })} /></FormRow>
                  <FormRow label="External link (optional)"><Input value={newItem.external_url ?? ""} onChange={(e) => setNewItem({ ...newItem, external_url: e.target.value })} placeholder="https://…" /></FormRow>
                  <FormRow label="Tags"><TagListEditor value={newItem.tags ?? []} onChange={(v: string[]) => setNewItem({ ...newItem, tags: v })} /></FormRow>
                  <Button onClick={() => createItem.mutate()} disabled={createItem.isPending}>
                    <Plus className="w-4 h-4 mr-1.5" /> Add to “{activeFolder.name}”
                  </Button>
                </div>
              </AdminCard>
            </>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
