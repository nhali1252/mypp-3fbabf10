import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/server/content.functions";
import { AdminPage, AdminCard, FormRow, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { MediaPicker, uploadToR2 } from "@/components/admin/MediaPicker";
import { TagListEditor } from "@/components/admin/TagListEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, FolderOpen, ChevronRight, Image as ImageIcon, Star, Eye, MessageSquare, Shield, GripVertical, CircleDot, CheckCircle2, Upload, Loader2 } from "lucide-react";
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
  parent_id: string | null;
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
  show_in_feed: boolean;
  feed_caption: string | null;
  featured: boolean;
  watermark_text: string | null;
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
        show_in_feed: r.show_in_feed ?? true,
        feed_caption: r.feed_caption ?? null,
        featured: r.featured ?? false,
        watermark_text: r.watermark_text ?? null,
      })) as Item[];
    },
    enabled: !!activeFolderId,
  });
  const items = itemsQ.data ?? [];

  // ---- Folder CRUD ------------------------------------------------------
  const [newFolder, setNewFolder] = useState<Partial<Folder>>({ active: true, parent_id: null });
  const [folderEdits, setFolderEdits] = useState<Record<string, Partial<Folder>>>({});
  const fGet = (f: Folder) => ({ ...f, ...(folderEdits[f.id] ?? {}) });
  const fSet = (id: string, patch: Partial<Folder>) =>
    setFolderEdits((e) => ({ ...e, [id]: { ...(e[id] ?? {}), ...patch } }));

  // Group folders by parent for tree rendering
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Folder[]>();
    for (const f of folders) {
      const k = f.parent_id ?? null;
      const arr = map.get(k) ?? [];
      arr.push(f);
      map.set(k, arr);
    }
    return map;
  }, [folders]);

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
        parent_id: newFolder.parent_id ?? null,
        sort_order: folders.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Folder created");
      setNewFolder({ active: true, parent_id: null });
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
  const [newItem, setNewItem] = useState<Partial<Item>>({ active: true, tags: [], show_in_feed: true, featured: false });
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
        show_in_feed: newItem.show_in_feed ?? true,
        feed_caption: newItem.feed_caption ?? null,
        featured: newItem.featured ?? false,
        watermark_text: newItem.watermark_text ?? null,
        sort_order: items.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item added");
      setNewItem({ active: true, tags: [], show_in_feed: true, featured: false });
      qc.invalidateQueries({ queryKey: ["admin_portfolio_items", activeFolderId] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_items"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ---- Bulk multi-file upload ------------------------------------------
  // Uploads many image files at once into the active folder. Each file becomes
  // a portfolio item titled after the file's base name. Useful for quickly
  // populating a brand-new folder from a folder of finished work.
  const proxy = useServerFn(uploadAsset);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const bulkUpload = useMutation({
    mutationFn: async (files: File[]) => {
      if (!activeFolderId) throw new Error("Pick a folder first");
      if (files.length === 0) return;
      setBulkProgress({ done: 0, total: files.length });
      const baseSort = items.length;
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        try {
          const url = await uploadToR2(file, "projects", proxy);
          const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || `Item ${idx + 1}`;
          const { error } = await (supabase as any).from("portfolio_items").insert({
            folder_id: activeFolderId,
            title: baseName,
            image_url: url,
            tags: [],
            active: true,
            show_in_feed: true,
            featured: false,
            sort_order: baseSort + idx + 1,
          });
          if (error) throw error;
        } catch (e: any) {
          toast.error(`${file.name}: ${e?.message ?? "failed"}`);
        }
        setBulkProgress({ done: idx + 1, total: files.length });
      }
    },
    onSuccess: () => {
      toast.success("Bulk upload complete");
      qc.invalidateQueries({ queryKey: ["admin_portfolio_items", activeFolderId] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_items"] });
      setTimeout(() => setBulkProgress(null), 1200);
    },
    onError: (e: any) => {
      toast.error(e.message);
      setBulkProgress(null);
    },
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

  // ---- Drag & drop reorder ---------------------------------------------
  // Persists a new ordering by writing sequential sort_orders (1..N) for the
  // affected rows. Optimistically applies the order via React Query cache so
  // the UI doesn't snap back while the writes are in flight.
  async function persistReorder<T extends { id: string }>(
    table: "portfolio_folders" | "portfolio_items",
    nextOrder: T[],
    queryKey: any[],
  ) {
    qc.setQueryData(queryKey, nextOrder.map((row, i) => ({ ...row, sort_order: i + 1 })));
    try {
      await Promise.all(
        nextOrder.map((row, i) =>
          (supabase as any).from(table).update({ sort_order: i + 1 }).eq("id", row.id),
        ),
      );
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["public_portfolio_folders"] });
      qc.invalidateQueries({ queryKey: ["public_portfolio_items"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't save new order");
      qc.invalidateQueries({ queryKey });
    }
  }

  const dragRef = useRef<{ kind: "folder" | "item"; id: string } | null>(null);

  function onFolderDragStart(id: string) { dragRef.current = { kind: "folder", id }; }
  function onItemDragStart(id: string) { dragRef.current = { kind: "item", id }; }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  async function onFolderDrop(targetId: string) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.kind !== "folder" || drag.id === targetId) return;
    const fromIdx = folders.findIndex((f) => f.id === drag.id);
    const toIdx = folders.findIndex((f) => f.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...folders];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await persistReorder("portfolio_folders", next, ["admin_portfolio_folders"]);
  }
  async function onItemDrop(targetId: string) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.kind !== "item" || drag.id === targetId) return;
    const fromIdx = items.findIndex((i) => i.id === drag.id);
    const toIdx = items.findIndex((i) => i.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await persistReorder("portfolio_items", next, ["admin_portfolio_items", activeFolderId]);
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
              <FolderTree
                parentId={null}
                depth={0}
                childrenByParent={childrenByParent}
                folders={folders}
                activeFolderId={activeFolderId}
                setActiveFolderId={setActiveFolderId}
                fGet={fGet}
                fSet={fSet}
                folderEdits={folderEdits}
                onFolderDragStart={onFolderDragStart}
                onDragOver={onDragOver}
                onFolderDrop={onFolderDrop}
                saveFolder={saveFolder}
                deleteFolder={deleteFolder}
                moveFolder={moveFolder}
              />
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
              <FormRow label="Parent folder (optional)" hint="Leave empty for a top-level folder.">
                <ParentSelect
                  folders={folders}
                  value={newFolder.parent_id ?? null}
                  excludeId={null}
                  onChange={(v) => setNewFolder({ ...newFolder, parent_id: v })}
                />
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
                        <li
                          key={it.id}
                          draggable
                          onDragStart={() => onItemDragStart(it.id)}
                          onDragOver={onDragOver}
                          onDrop={() => onItemDrop(it.id)}
                          className="rounded-xl border border-border bg-background p-4"
                        >
                          <div className="grid sm:grid-cols-[24px_120px_1fr] gap-4 items-start">
                            <span
                              aria-hidden
                              className="pt-2 text-muted-foreground/70 cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
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

                              <div className="rounded-lg border border-border bg-muted/30 p-3 grid gap-2.5">
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                                  <MessageSquare className="w-3 h-3" /> Feed options
                                </div>
                                <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                                  <span className="inline-flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-muted-foreground" />Show in feed</span>
                                  <Switch checked={!!row.show_in_feed} onCheckedChange={(v) => iSet(it.id, { show_in_feed: v })} />
                                </label>
                                <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                                  <span className="inline-flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" />Featured (pinned strip)</span>
                                  <Switch checked={!!row.featured} onCheckedChange={(v) => iSet(it.id, { featured: v })} />
                                </label>
                                <FormRow label="Feed caption (optional)" hint="Shown only on the feed; falls back to description.">
                                  <Textarea
                                    rows={2}
                                    value={row.feed_caption ?? ""}
                                    onChange={(e) => iSet(it.id, { feed_caption: e.target.value || null })}
                                    placeholder="A different caption just for the feed…"
                                  />
                                </FormRow>
                                <FormRow label="Watermark text (optional)" hint="Overrides the site-name diagonal watermark for this item.">
                                  <Input
                                    value={row.watermark_text ?? ""}
                                    onChange={(e) => iSet(it.id, { watermark_text: e.target.value || null })}
                                    placeholder="© Ali Nur Hasan"
                                  />
                                </FormRow>
                              </div>

                              <FormRow label="Status" hint="Drafts are hidden from the public portfolio.">
                                <DraftPublishedToggle
                                  published={!!row.active}
                                  onChange={(v) => iSet(it.id, { active: v })}
                                />
                              </FormRow>
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

              <AdminCard title="Bulk upload" >
                <p className="text-xs text-muted-foreground mb-3">
                  Drop or pick multiple images at once. Each becomes a new item titled after the file name. You can edit titles, tags, and captions afterwards.
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={bulkUpload.isPending}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      e.currentTarget.value = "";
                      if (files.length > 0) bulkUpload.mutate(files);
                    }}
                  />
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${bulkUpload.isPending ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                    {bulkUpload.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" />
                        <p className="text-sm font-semibold">
                          Uploading {bulkProgress?.done ?? 0} / {bulkProgress?.total ?? 0}…
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-semibold">Click to select multiple images</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                          Adds new items to “{activeFolder.name}”
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </AdminCard>

              <AdminCard title="Add item">
                <div className="grid gap-3">
                  <FormRow label="Title"><Input value={newItem.title ?? ""} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} /></FormRow>
                  <FormRow label="Description"><Textarea rows={2} value={newItem.description ?? ""} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} /></FormRow>
                  <FormRow label="Image"><MediaPicker value={newItem.image_url ?? undefined} onChange={(u: string | null) => setNewItem({ ...newItem, image_url: u })} /></FormRow>
                  <FormRow label="External link (optional)"><Input value={newItem.external_url ?? ""} onChange={(e) => setNewItem({ ...newItem, external_url: e.target.value })} placeholder="https://…" /></FormRow>
                  <FormRow label="Tags"><TagListEditor value={newItem.tags ?? []} onChange={(v: string[]) => setNewItem({ ...newItem, tags: v })} /></FormRow>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 grid gap-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Feed options
                    </div>
                    <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                      <span className="inline-flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-muted-foreground" />Show in feed</span>
                      <Switch checked={newItem.show_in_feed !== false} onCheckedChange={(v) => setNewItem({ ...newItem, show_in_feed: v })} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                      <span className="inline-flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" />Featured</span>
                      <Switch checked={!!newItem.featured} onCheckedChange={(v) => setNewItem({ ...newItem, featured: v })} />
                    </label>
                    <FormRow label="Feed caption (optional)">
                      <Textarea rows={2} value={newItem.feed_caption ?? ""} onChange={(e) => setNewItem({ ...newItem, feed_caption: e.target.value || null })} />
                    </FormRow>
                    <FormRow label="Watermark text (optional)">
                      <Input value={newItem.watermark_text ?? ""} onChange={(e) => setNewItem({ ...newItem, watermark_text: e.target.value || null })} placeholder="© Ali Nur Hasan" />
                    </FormRow>
                  </div>
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

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${
        published
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
      }`}
    >
      {published ? <CheckCircle2 className="w-2.5 h-2.5" /> : <CircleDot className="w-2.5 h-2.5" />}
      {published ? "Published" : "Draft"}
    </span>
  );
}

function DraftPublishedToggle({
  published,
  onChange,
}: {
  published: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-3 py-1.5 rounded-[5px] inline-flex items-center gap-1.5 transition-colors ${
          !published ? "bg-amber-500/20 text-amber-300" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <CircleDot className="w-3.5 h-3.5" /> Draft
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-3 py-1.5 rounded-[5px] inline-flex items-center gap-1.5 transition-colors ${
          published ? "bg-emerald-500/20 text-emerald-300" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Published
      </button>
    </div>
  );
}

// --- Hierarchical folder tree -------------------------------------------
// Renders folders as a tree; each node can be expanded inline to edit its
// metadata (name, slug, description, cover, parent, status). Drag-reordering
// is preserved per parent group via the existing onFolderDrop handler.
function FolderTree(props: {
  parentId: string | null;
  depth: number;
  childrenByParent: Map<string | null, Folder[]>;
  folders: Folder[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  fGet: (f: Folder) => Folder;
  fSet: (id: string, patch: Partial<Folder>) => void;
  folderEdits: Record<string, Partial<Folder>>;
  onFolderDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onFolderDrop: (id: string) => void;
  saveFolder: { mutate: (id: string) => void };
  deleteFolder: { mutate: (id: string) => void };
  moveFolder: (id: string, dir: -1 | 1) => void;
}) {
  const {
    parentId, depth, childrenByParent, folders,
    activeFolderId, setActiveFolderId, fGet, fSet, folderEdits,
    onFolderDragStart, onDragOver, onFolderDrop,
    saveFolder, deleteFolder, moveFolder,
  } = props;
  const list = childrenByParent.get(parentId) ?? [];
  if (list.length === 0) {
    if (depth > 0) return null;
    return <EmptyState message="No folders yet — add one below." />;
  }
  return (
    <ul className={depth === 0 ? "space-y-1.5" : "space-y-1.5 mt-2 ml-4 border-l border-border pl-3"}>
      {list.map((f, i) => {
        const row = fGet(f);
        const dirty = !!folderEdits[f.id];
        const isActive = activeFolderId === f.id;
        const hasChildren = (childrenByParent.get(f.id) ?? []).length > 0;
        return (
          <li key={f.id}>
            <div
              draggable
              onDragStart={() => onFolderDragStart(f.id)}
              onDragOver={onDragOver}
              onDrop={() => onFolderDrop(f.id)}
              className={`rounded-xl border ${isActive ? "border-primary bg-primary/5" : "border-border bg-card"} transition-colors`}
            >
              <div className="flex items-center">
                <span aria-hidden className="pl-2 pr-1 py-3 text-muted-foreground/70 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                  <GripVertical className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  onClick={() => setActiveFolderId(f.id)}
                  className="flex-1 flex items-center justify-between gap-2 p-3 pl-1 text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-2">
                        {row.name}
                        <StatusPill published={!!row.active} />
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        /{row.slug}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
                </button>
              </div>

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
                  <FormRow label="Parent folder" hint="Move under another folder. Cannot pick itself or its descendants.">
                    <ParentSelect
                      folders={folders}
                      value={row.parent_id ?? null}
                      excludeId={f.id}
                      onChange={(v: string | null) => fSet(f.id, { parent_id: v })}
                    />
                  </FormRow>
                  <FormRow label="Status" hint="Drafts are hidden from the public site.">
                    <DraftPublishedToggle published={!!row.active} onChange={(v) => fSet(f.id, { active: v })} />
                  </FormRow>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => saveFolder.mutate(f.id)} disabled={!dirty}>
                      <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => moveFolder(f.id, -1)} disabled={i === 0}>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => moveFolder(f.id, 1)} disabled={i === list.length - 1}>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <ConfirmDelete
                      onConfirm={() => deleteFolder.mutate(f.id)}
                      trigger={<Button size="sm" variant="outline"><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete</Button>}
                    />
                  </div>
                  {hasChildren && (
                    <p className="text-[10px] text-amber-400/80 uppercase tracking-wider">
                      Has subfolders — they must be deleted or moved first.
                    </p>
                  )}
                </div>
              )}
            </div>
            {hasChildren && (
              <FolderTree {...props} parentId={f.id} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Computes the set of descendant folder IDs for the given root, used to
// prevent picking a folder's own descendant as its parent (would create a cycle).
function collectDescendants(folders: Folder[], rootId: string): Set<string> {
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const f of folders) {
      if (f.parent_id === cur && !out.has(f.id)) {
        out.add(f.id);
        stack.push(f.id);
      }
    }
  }
  return out;
}

function ParentSelect({
  folders,
  value,
  excludeId,
  onChange,
}: {
  folders: Folder[];
  value: string | null;
  excludeId: string | null;
  onChange: (v: string | null) => void;
}) {
  const blocked = excludeId
    ? new Set<string>([excludeId, ...collectDescendants(folders, excludeId)])
    : new Set<string>();
  const rendered: { id: string; label: string }[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const f of folders.filter((x) => (x.parent_id ?? null) === parentId)) {
      if (!blocked.has(f.id)) rendered.push({ id: f.id, label: `${"— ".repeat(depth)}${f.name}` });
      walk(f.id, depth + 1);
    }
  }
  walk(null, 0);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
    >
      <option value="">— Top level —</option>
      {rendered.map((r) => (
        <option key={r.id} value={r.id}>{r.label}</option>
      ))}
    </select>
  );
}
