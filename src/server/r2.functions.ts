/**
 * Server functions for R2 content + uploads. Safe to import from client code —
 * the bundler replaces these with RPC stubs in the browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readJson, writeJson, presignPut, publicUrl, listObjects, deleteObject, putObject } from "./r2.server";
import { R2_KEYS, R2_ASSET_PREFIXES, type R2ContentKey, type R2AssetFolder } from "./r2-keys";

const contentKeySchema = z.enum(
  Object.keys(R2_KEYS) as [R2ContentKey, ...R2ContentKey[]],
);

const assetFolderSchema = z.enum(
  Object.keys(R2_ASSET_PREFIXES) as [R2AssetFolder, ...R2AssetFolder[]],
);

/** Read any of the canonical content JSON files (public). */
export const getContent = createServerFn({ method: "GET" })
  .inputValidator((data: { key: R2ContentKey }) => ({ key: contentKeySchema.parse(data.key) }))
  .handler(async ({ data }) => {
    const objKey = R2_KEYS[data.key];
    const startedAt = Date.now();
    try {
      const value = await readJson<any>(objKey);
      const ms = Date.now() - startedAt;
      if (value == null) {
        // Not an error per se, but worth surfacing — empty R2 doc means the
        // homepage will fall back to defaults.
        console.warn(
          `[r2.getContent] empty doc key=${data.key} objKey=${objKey} (${ms}ms)`,
        );
      } else if (data.key === "launcher") {
        console.info(
          `[r2.getContent] ok key=${data.key} bytes=${JSON.stringify(value).length} (${ms}ms)`,
        );
      }
      return { key: data.key, data: (value ?? null) as any };
    } catch (err) {
      const ms = Date.now() - startedAt;
      console.error(
        `[r2.getContent] FAILED key=${data.key} objKey=${objKey} (${ms}ms):`,
        err instanceof Error ? `${err.name}: ${err.message}` : err,
      );
      // Re-throw so the client loader's catch branch can log it too and the
      // UI can fall back gracefully.
      throw err;
    }
  });

/** Update a content JSON file. Admin/editor only. */
export const saveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { key: R2ContentKey; value: unknown }) => ({
    key: contentKeySchema.parse(data.key),
    value: data.value,
  }))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    await writeJson(R2_KEYS[data.key], data.value);
    return { ok: true };
  });

/** Generate a presigned URL so the admin browser can PUT a media file directly to R2. */
export const presignUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { folder: R2AssetFolder; filename: string; contentType: string }) => ({
    folder: assetFolderSchema.parse(data.folder),
    filename: z.string().min(1).max(200).regex(/^[\w\-. ]+$/, "Invalid filename").parse(data.filename),
    contentType: z.string().min(1).max(120).parse(data.contentType),
  }))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    const safeName = data.filename.replace(/\s+/g, "-");
    const key = `${R2_ASSET_PREFIXES[data.folder]}${Date.now()}-${safeName}`;
    const uploadUrl = await presignPut(key, data.contentType, 300);
    return { uploadUrl, key, publicUrl: publicUrl(key) };
  });

/** List media in a folder (admin only). */
export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { folder: R2AssetFolder }) => ({ folder: assetFolderSchema.parse(data.folder) }))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    const keys = await listObjects(R2_ASSET_PREFIXES[data.folder]);
    return keys.map((k) => ({ key: k, url: publicUrl(k) }));
  });

/** Delete a media object (admin only). */
export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { key: string }) => ({
    key: z.string().min(1).max(500).regex(/^assets\//, "Refusing to delete outside assets/").parse(data.key),
  }))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    await deleteObject(data.key);
    return { ok: true };
  });

/**
 * Server-side proxy upload. The browser POSTs the raw file bytes; the server
 * PUTs them to R2 with admin credentials. Bypasses CORS entirely and works
 * even when R2 bucket-level CORS is not configured for the preview domain.
 *
 * Limit: 25 MB. For larger files use the presigned-PUT flow.
 */
export const uploadAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { folder: R2AssetFolder; filename: string; contentType: string; base64: string }) => ({
    folder: assetFolderSchema.parse(data.folder),
    filename: z.string().min(1).max(200).regex(/^[\w\-. ]+$/, "Invalid filename").parse(data.filename),
    contentType: z.string().min(1).max(120).parse(data.contentType),
    base64: z.string().min(1).max(40_000_000).parse(data.base64), // ~30 MB base64 = ~22 MB binary
  }))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    // Decode base64 → Uint8Array. atob is available in the Worker runtime.
    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.byteLength > 25 * 1024 * 1024) {
      throw new Error("File too large — max 25 MB for proxy upload");
    }
    const safeName = data.filename.replace(/\s+/g, "-");
    const key = `${R2_ASSET_PREFIXES[data.folder]}${Date.now()}-${safeName}`;
    const url = await putObject(key, bytes, data.contentType);
    return { key, publicUrl: url };
  });

/** Public reviews submission — anyone can append a pending review. */
export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; role?: string; review: string; rating: number }) => z.object({
    name: z.string().trim().min(1).max(120),
    role: z.string().trim().max(120).optional().or(z.literal("")),
    review: z.string().trim().min(8).max(2000),
    rating: z.number().int().min(1).max(5),
  }).parse(data))
  .handler(async ({ data }) => {
    const list = (await readJson<any[]>(R2_KEYS.reviews)) ?? [];
    list.push({
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: data.name,
      role: data.role || null,
      review: data.review,
      rating: data.rating,
      avatar: "",
      featured: false,
      published: false,
      created_at: new Date().toISOString(),
    });
    await writeJson(R2_KEYS.reviews, list);
    return { ok: true };
  });

async function assertAdminOrEditor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "editor"]);
  if (error) throw new Error("Role check failed");
  if (!data?.length) throw new Error("Forbidden — admin or editor role required");
}
