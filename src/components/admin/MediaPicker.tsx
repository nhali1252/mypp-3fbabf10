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
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function MediaPicker({
  value,
  onChange,
  label = "Image",
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const { data: media = [], refetch } = useQuery({
    queryKey: ["media-library"],
    queryFn: async () => {
      const { data } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function handleUpload(file: File) {
    if (!user) {
      toast.error("Not authenticated");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      const url = urlData.publicUrl;
      const { error: dbErr } = await supabase.from("media").insert({
        filename: file.name,
        url,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      });
      if (dbErr) throw dbErr;
      toast.success("Uploaded");
      refetch();
      onChange(url);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
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
                </div>
              </label>

              {media.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No media yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {media.map((m: any) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onChange(m.url);
                        setOpen(false);
                      }}
                      className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition"
                    >
                      <img
                        src={m.url}
                        alt={m.filename}
                        className="w-full h-full object-cover"
                      />
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
            onClick={() => onChange(null)}
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
    </div>
  );
}
