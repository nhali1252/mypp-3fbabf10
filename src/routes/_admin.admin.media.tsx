import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Trash2, Copy } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/media")({ component: AdminMedia });

function AdminMedia() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data } = await supabase.from("media").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function upload(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("media").insert({
        filename: file.name, url: urlData.publicUrl, storage_path: path,
        mime_type: file.type, size_bytes: file.size, uploaded_by: user.id,
      });
      if (dbErr) throw dbErr;
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      qc.invalidateQueries({ queryKey: ["media-library"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  }

  async function remove(row: any) {
    await supabase.storage.from("media").remove([row.storage_path]).catch(() => {});
    const { error } = await supabase.from("media").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-media"] });
    qc.invalidateQueries({ queryKey: ["media-library"] });
  }

  return (
    <AdminPage title="Media library" description="Images uploaded here can be selected from any image picker on the site."
      actions={
        <label>
          <input type="file" accept="image/*" className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          <Button asChild disabled={uploading}><span><Upload className="w-4 h-4 mr-1.5" />{uploading ? "Uploading…" : "Upload image"}</span></Button>
        </label>
      }>
      {isLoading ? <div>Loading…</div> :
       rows.length === 0 ? <EmptyState message="No media uploaded yet." /> : (
        <AdminCard>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rows.map((m: any) => (
              <div key={m.id} className="border border-border rounded-xl overflow-hidden bg-muted">
                <div className="aspect-square">
                  <img src={m.url} alt={m.filename} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2 space-y-1.5">
                  <p className="text-xs truncate" title={m.filename}>{m.filename}</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1"
                      onClick={() => { navigator.clipboard.writeText(m.url); toast.success("URL copied"); }}>
                      <Copy className="w-3 h-3 mr-1" />Copy URL
                    </Button>
                    <ConfirmDelete onConfirm={() => remove(m)}
                      trigger={<Button size="sm" variant="outline"><Trash2 className="w-3 h-3" /></Button>} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </AdminPage>
  );
}
