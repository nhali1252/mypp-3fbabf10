import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTable(name: string) {
  const qc = useQueryClient();
  const key = ["admin-table", name];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(name)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: [name] });
  }

  async function insert(row: any) {
    const { error } = await (supabase as any).from(name).insert(row);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Created");
    invalidate();
    return true;
  }

  async function update(id: string, patch: any) {
    const { error } = await (supabase as any).from(name).update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Saved");
    invalidate();
    return true;
  }

  async function remove(id: string) {
    const { error } = await (supabase as any).from(name).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Deleted");
    invalidate();
    return true;
  }

  async function move(rows: any[], id: string, dir: -1 | 1) {
    const idx = rows.findIndex((r) => r.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= rows.length) return;
    const a = rows[idx];
    const b = rows[swap];
    await Promise.all([
      (supabase as any).from(name).update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from(name).update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    invalidate();
  }

  return { ...query, insert, update, remove, move, invalidate };
}
