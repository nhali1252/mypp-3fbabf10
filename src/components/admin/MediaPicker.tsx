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
import { presignUpload, listAssets, deleteAsset, uploadAsset } from "@/server/r2.functions";
import type { R2AssetFolder } from "@/server/r2-keys";
import { Image as ImageIcon, Upload, X, CheckCircle2, Loader2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = /^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/i;

/**
 * Convert a File to base64 (without data: prefix). Uses FileReader so browsers
 * handle large files without the spread-operator argument-limit problem.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Robust upload helper: tries presigned-PUT first (fast, direct to R2). If that
 * fails with a network/CORS error (TypeError "Failed to fetch"), automatically
 * falls back to a server-side proxy upload so the user never sees CORS errors.
 *
 * Exposed so multi-file flows (admin portfolio batch upload) can reuse it.
 */
export async function uploadToR2(
  file: File,
  folder: R2AssetFolder,
  presign: (args: { data: { folder: R2AssetFolder; filename: string; contentType: string } }) => Promise<{ uploadUrl: string; publicUrl: string }>,
  proxy?: (args: { data: { folder: R2AssetFolder; filename: string; contentType: string; base64: string } }) => Promise<{ publicUrl: string }>,
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 25 MB.`);
  }
  if (file.type && !ALLOWED_TYPES.test(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  const safe = file.name.replace(/[^\w\-. ]+/g, "_").slice(0, 180);
  const contentType = file.type || "application/octet-stream";

  // 1) Try presigned PUT direct to R2.
  try {
    const { uploadUrl, publicUrl } = await presign({ data: { folder, filename: safe, contentType } });
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (putRes.ok) return publicUrl;
    // R2 returned an error — fall through to proxy fallback.
    const text = await putRes.text().catch(() => "");
    console.warn("[uploadToR2] presigned PUT failed", putRes.status, text.slice(0, 200));
  } catch (err) {
    // TypeError "Failed to fetch" is what CORS / network failures surface as.
    console.warn("[uploadToR2] presigned PUT threw — falling back to proxy:", err);
  }

  // 2) Fallback: server-side proxy upload (always works regardless of CORS).
  if (!proxy) throw new Error("Direct upload failed and no server-side fallback was provided");
  const base64 = await fileToBase64(file);
  const { publicUrl } = await proxy({ data: { folder, filename: safe, contentType, base64 } });
  return publicUrl;
}

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
  const proxy = useServerFn(uploadAsset);

  const { data: media = [], refetch, isLoading, isError, error } = useQuery({
    queryKey: ["r2-media-library", folder],
    queryFn: async () => {
      const items = await list({ data: { folder } });
      // Newest first — keys are prefixed with `${Date.now()}-`
      return [...items].sort((a, b) => (a.key < b.key ? 1 : -1));
    },
    enabled: open,
    retry: 1,
    staleTime: 30_000,
  });

  async function handleUpload(file: File) {
    if (file.size > MAX_BYTES) {
      const msg = `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 25 MB.`;
      toast.error(msg);
      setStatus({ kind: "error", message: msg });
      return;
    }
    if (file.type && !ALLOWED_TYPES.test(file.type)) {
      const msg = `Unsupported file type: ${file.type || "unknown"}`;
      toast.error(msg);
      setStatus({ kind: "error", message: msg });
      return;
    }

    const replacing = !!value;
    setStatus({ kind: "uploading", name: file.name });
    setUploading(true);
    const toastId = toast.loading(replacing ? "Replacing image…" : "Uploading image…");
    try {
      const publicUrl = await uploadToR2(file, folder, presign, proxy);
      const msg = replacing ? "Image replaced — remember to Save" : "Image uploaded — remember to Save";
      toast.success(msg, { id: toastId });
      setStatus({ kind: "success", message: msg });
      refetch();
      onChange(publicUrl);
      setOpen(false);
    } catch (e: any) {
      const raw = e?.message || String(e) || "Upload failed";
      // Translate common error shapes into actionable messages.
      const msg = /failed to fetch|networkerror/i.test(raw)
        ? "Network error reaching storage. Check your internet and try again."
        : /forbidden|access denied/i.test(raw)
          ? "Storage rejected the upload (permissions). Contact admin to verify R2 token scope."
          : raw;
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
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = ""; // allow re-selecting same file
                  }}
                />
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/40 transition">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 mx-auto mb-2 text-primary animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  )}
                  <p className="text-sm">
                    {uploading ? "Uploading…" : "Click to upload a new image"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    Folder: {folder} · Max 25 MB · png/jpg/webp/gif/avif/svg
                  </p>
                </div>
              </label>

              {isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg skeleton-shimmer" />
                  ))}
                </div>
              ) : isError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-semibold">Could not load media library</p>
                    <p className="text-xs mt-1 opacity-80">
                      {(error as Error)?.message || "Storage request failed."}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                  </Button>
                </div>
              ) : media.length === 0 ? (
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
                      <Thumbnail url={m.url} alt={m.key} />
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
      {value && <Thumbnail url={value} alt="" className="w-32 h-32 rounded-lg border border-border" />}
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

/**
 * Thumbnail with skeleton + graceful error fallback. Never renders a broken
 * image icon — replaces with a "image unavailable" pill instead.
 */
function resolveImageSrc(url: string, useProxy: boolean): string {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  // Same-origin URLs don't need proxying
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "http://localhost");
    if (typeof window !== "undefined" && u.origin === window.location.origin) return url;
    if (!useProxy) return url;
    return `/api/public/media/?url=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}

function Thumbnail({ url, alt, className }: { url: string; alt: string; className?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  // First try via server-side R2 proxy (bypasses Cloudflare hotlink challenges
  // on the public R2 domain). If that fails, fall back to the direct URL.
  const [useProxy, setUseProxy] = useState(true);
  const src = resolveImageSrc(url, useProxy);
  return (
    <div className={`relative overflow-hidden bg-muted ${className ?? "w-full h-full"}`}>
      {state === "loading" && <div className="absolute inset-0 skeleton-shimmer" />}
      {state === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-center">
          Image unavailable
        </div>
      ) : (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => {
            if (useProxy) {
              // Retry without proxy (e.g. external non-R2 image)
              setUseProxy(false);
              setState("loading");
            } else {
              setState("error");
            }
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${state === "ok" ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
