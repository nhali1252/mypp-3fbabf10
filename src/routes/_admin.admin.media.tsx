import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAssets, deleteAsset, type AssetFolder } from "@/server/content.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Upload, Trash2, Copy } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/media")({ component: AdminMedia });

const FOLDERS: { value: R2AssetFolder; label: string }[] = [
  { value: "profile", label: "Profile" },
  { value: "projects", label: "Projects" },
  { value: "portfolio", label: "Portfolio" },
  { value: "resume", label: "Resume" },
];

function AdminMedia() {
  const qc = useQueryClient();
  const [folder, setFolder] = useState<R2AssetFolder>("projects");
  const [uploading, setUploading] = useState(false);

  const presign = useServerFn(presignUpload);
  const list = useServerFn(listAssets);
  const remove = useServerFn(deleteAsset);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-r2-media", folder],
    queryFn: async () => {
      const items = await list({ data: { folder } });
      return [...items].sort((a, b) => (a.key < b.key ? 1 : -1));
    },
  });

  async function upload(_file: File) {
    setUploading(true);
    toast.error("Direct upload from this page is disabled — use the Library button on a content card instead.");
    setUploading(false);
  }

  async function deleteOne(key: string) {
    try {
      await remove({ data: { key } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-r2-media", folder] });
      qc.invalidateQueries({ queryKey: ["r2-media-library", folder] });
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  }

  return (
    <AdminPage
      title="Media library"
      description="Images stored in Cloudflare R2. Pick a folder to browse or upload."
      actions={
        <label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <Button asChild disabled={uploading}>
            <span>
              <Upload className="w-4 h-4 mr-1.5" />
              {uploading ? "Uploading…" : "Upload image"}
            </span>
          </Button>
        </label>
      }
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {FOLDERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFolder(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
              folder === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState message={`No media in “${folder}” yet.`} />
      ) : (
        <AdminCard>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rows.map((m) => {
              const name = m.key.split("/").pop() ?? m.key;
              return (
                <div key={m.key} className="border border-border rounded-xl overflow-hidden bg-muted">
                  <div className="aspect-square">
                    <img src={m.url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-2 space-y-1.5">
                    <p className="text-xs truncate" title={name}>{name}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(m.url);
                          toast.success("URL copied");
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy URL
                      </Button>
                      <ConfirmDelete
                        onConfirm={() => deleteOne(m.key)}
                        trigger={
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}
    </AdminPage>
  );
}
