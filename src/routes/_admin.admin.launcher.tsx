import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/launcher")({
  component: AdminLauncher,
});

type Card = {
  id: string;
  label: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  route: string;
  accent: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  active: boolean;
};

const ACCENTS = [
  { label: "Amber → Rose", value: "from-amber-400/40 to-rose-500/10" },
  { label: "Emerald → Cyan", value: "from-emerald-400/40 to-cyan-500/10" },
  { label: "Violet → Fuchsia", value: "from-violet-500/40 to-fuchsia-500/10" },
  { label: "Sky → Indigo", value: "from-sky-400/40 to-indigo-500/10" },
  { label: "Primary glow", value: "from-primary/40 to-primary/10" },
];

function AdminLauncher() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin_launcher_pages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("launcher_pages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Card[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin_launcher_pages"] });
  const refreshPublic = () => qc.invalidateQueries({ queryKey: ["launcher_pages"] });

  const upsert = useMutation({
    mutationFn: async (input: Partial<Card> & { id?: string }) => {
      const payload: any = { ...input };
      if (input.id) {
        const { error } = await (supabase as any)
          .from("launcher_pages")
          .update(payload)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        delete payload.id;
        const { error } = await (supabase as any).from("launcher_pages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Saved"); refresh(); refreshPublic(); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("launcher_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); refresh(); refreshPublic(); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any)
        .from("launcher_pages")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); refreshPublic(); },
    onError: (e: any) => toast.error(e.message),
  });

  // Swap sort_order with the neighbour above/below — keeps reorder dead simple
  // without bringing in a drag library on this admin route.
  async function move(id: string, dir: -1 | 1) {
    const list = data ?? [];
    const idx = list.findIndex((c) => c.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    const a = list[idx], b = list[swap];
    const { error } = await (supabase as any).rpc("noop", {}).then(async () => {
      const r1 = await (supabase as any).from("launcher_pages").update({ sort_order: b.sort_order }).eq("id", a.id);
      const r2 = await (supabase as any).from("launcher_pages").update({ sort_order: a.sort_order }).eq("id", b.id);
      return { error: r1.error ?? r2.error };
    });
    if (error) return toast.error(error.message);
    refresh();
    refreshPublic();
  }

  return (
    <AdminPage
      title="Launcher pages"
      description="Manage cards shown on the homepage launcher (/). Add new pages, set order, toggle visibility."
      actions={
        <CardDialog
          trigger={<Button size="sm"><Plus size={14} className="mr-1.5" /> New card</Button>}
          onSubmit={(v) => upsert.mutateAsync(v)}
        />
      }
    >
      <AdminCard>
        {isLoading ? (
          <p className="text-sm">Loading…</p>
        ) : !data?.length ? (
          <EmptyState message="No launcher cards yet." />
        ) : (
          <ul className="divide-y divide-border">
            {data.map((c) => (
              <li key={c.id} className="py-3 flex items-center gap-3 flex-wrap">
                <GripVertical size={14} className="text-muted-foreground/40" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">
                    {c.title}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      → {c.route}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.subtitle || c.description || c.label}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Active
                    </span>
                    <Switch
                      checked={c.active}
                      onCheckedChange={(v) => toggle.mutate({ id: c.id, active: v })}
                    />
                  </div>
                  <CardDialog
                    initial={c}
                    trigger={
                      <Button size="sm" variant="outline">
                        <Pencil size={13} className="mr-1.5" /> Edit
                      </Button>
                    }
                    onSubmit={(v) => upsert.mutateAsync({ ...v, id: c.id })}
                  />
                  <ConfirmDelete
                    title="Delete card?"
                    description={`Remove ${c.title} from the launcher.`}
                    onConfirm={() => remove.mutate(c.id)}
                    trigger={<Button size="sm" variant="destructive">Delete</Button>}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Tips">
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Use real public routes like <code className="text-foreground">/basic</code>, <code className="text-foreground">/about-and-skills</code>, <code className="text-foreground">/portfolio</code>, <code className="text-foreground">/projects</code>, <code className="text-foreground">/services</code>, <code className="text-foreground">/contact</code>.</li>
          <li>Lower <strong>sort order</strong> appears first.</li>
          <li>Inactive cards stay in the database but are hidden from visitors.</li>
        </ul>
      </AdminCard>
    </AdminPage>
  );
}

function CardDialog({
  trigger,
  initial,
  onSubmit,
}: {
  trigger: React.ReactNode;
  initial?: Card;
  onSubmit: (v: Partial<Card>) => Promise<any>;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Partial<Card>>(
    initial ?? {
      label: "",
      title: "",
      subtitle: "",
      description: "",
      badge: "",
      route: "/",
      accent: ACCENTS[0].value,
      thumbnail_url: "",
      sort_order: 99,
      active: true,
    },
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title || !v.route || !v.label) {
      toast.error("Label, title and route are required");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(v);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit card" : "New launcher card"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Label</Label>
              <Input
                value={v.label ?? ""}
                onChange={(e) => setV({ ...v, label: e.target.value })}
                placeholder="Page B"
              />
            </div>
            <div>
              <Label>Badge (optional)</Label>
              <Input
                value={v.badge ?? ""}
                onChange={(e) => setV({ ...v, badge: e.target.value })}
                placeholder="Profile"
              />
            </div>
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={v.title ?? ""}
              onChange={(e) => setV({ ...v, title: e.target.value })}
              placeholder="Basic info"
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input
              value={v.subtitle ?? ""}
              onChange={(e) => setV({ ...v, subtitle: e.target.value })}
              placeholder="Personal introduction"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={v.description ?? ""}
              onChange={(e) => setV({ ...v, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Route</Label>
              <Input
                value={v.route ?? ""}
                onChange={(e) => setV({ ...v, route: e.target.value })}
                placeholder="/basic"
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={v.sort_order ?? 0}
                onChange={(e) => setV({ ...v, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Accent gradient</Label>
            <select
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              value={v.accent ?? ACCENTS[0].value}
              onChange={(e) => setV({ ...v, accent: e.target.value })}
            >
              {ACCENTS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Thumbnail URL (optional)</Label>
            <Input
              value={v.thumbnail_url ?? ""}
              onChange={(e) => setV({ ...v, thumbnail_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
            <Label className="mb-0">Visible on /</Label>
            <Switch
              checked={v.active ?? true}
              onCheckedChange={(c) => setV({ ...v, active: c })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
