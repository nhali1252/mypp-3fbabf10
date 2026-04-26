import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { presignUpload, listAssets, deleteAsset } from "@/server/r2.functions";
import type { R2AssetFolder } from "@/server/r2-keys";
import { Image as ImageIcon, Upload, X, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function MediaPicker({
  value,
  onChange,
  label = "Image",
  folder = "projects",
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  folder?: R2AssetFolder;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "uploading"; name: string }
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const presign = useServerFn(presignUpload);
  const list = useServerFn(listAssets);
  const remove = useServerFn(deleteAsset);

  const { data: media = [], refetch } = useQuery({
    queryKey: ["r2-media-library", folder],
    queryFn: async () => {
      const items = await list({ data: { folder } });
      // Newest first — keys are prefixed with `${Date.now()}-`
      return [...items].sort((a, b) => (a.key < b.key ? 1 : -1));
    },
    enabled: open,
  });

  async function handleUpload(file: File) {
    const replacing = !!value;
    setStatus({ kind: "uploading", name: file.name });
    setUploading(true);
    const toastId = toast.loading(replacing ? "Replacing image…" : "Uploading image…");
    try {
      const safe = file.name.replace(/[^\w\-. ]+/g, "_").slice(0, 180);
      const { uploadUrl, publicUrl } = await presign({
        data: { folder, filename: safe, contentType: file.type || "application/octet-stream" },
      });
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);

      const msg = replacing ? "Image replaced — remember to Save" : "Image uploaded — remember to Save";
      toast.success(msg, { id: toastId });
      setStatus({ kind: "success", message: msg });
      refetch();
      onChange(publicUrl);
      setOpen(false);
    } catch (e: any) {
      const msg = e.message || "Upload failed";
      toast.error(msg, { id: toastId });
      setStatus({ kind: "error", message: msg });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(key: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this file from storage? This can't be undone.")) return;
    try {
      await remove({ data: { key } });
      toast.success("Deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Delete failed");
    }
  }

  function handleRemove() {
    onChange(null);
    setStatus({ kind: "success", message: "Image removed — remember to Save" });
    toast.success("Image removed — remember to Save");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Paste image URL or pick from library"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="secondary">
              <ImageIcon className="w-4 h-4 mr-1.5" /> Library
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{label}: pick or upload</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/40">
                  <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">
                    {uploading ? "Uploading…" : "Click to upload a new image"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    Folder: {folder}
                  </p>
                </div>
              </label>

              {media.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No media in this folder yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {media.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => {
                        onChange(m.url);
                        setOpen(false);
                      }}
                      className="group relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition"
                    >
                      <img
                        src={m.url}
                        alt={m.key}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleDelete(m.key, e)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition hover:bg-destructive hover:text-destructive-foreground"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemove}
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {value && (
        <img
          src={value}
          alt=""
          className="w-32 h-32 object-cover rounded-lg border border-border"
        />
      )}
      {status.kind !== "idle" && (
        <div
          className={`flex items-center gap-2 text-xs font-medium ${
            status.kind === "error"
              ? "text-destructive"
              : status.kind === "uploading"
                ? "text-muted-foreground"
                : "text-primary"
          }`}
        >
          {status.kind === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {status.kind === "success" && <CheckCircle2 className="w-3.5 h-3.5" />}
          {status.kind === "error" && <X className="w-3.5 h-3.5" />}
          <span>
            {status.kind === "uploading"
              ? `Uploading ${status.name}…`
              : status.message}
          </span>
        </div>
      )}
    </div>
  );
}
