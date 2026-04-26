/**
 * One-time migration: copy any image URLs still pointing at the Supabase
 * `media` storage bucket into R2 (under the appropriate assets/ folder) and
 * rewrite every referencing DB row + R2 content JSON. Idempotent — already-R2
 * URLs are skipped. Admin-only.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { putObject, publicUrl } from "./r2.server";
import { seedR2FromDatabase } from "./seed-r2.functions";

const SUPABASE_MEDIA_PREFIX = "/storage/v1/object/public/media/";

function classifyFolder(originalPath: string): string {
  // Map known prefixes inside the legacy bucket to R2 assets/ folders.
  if (originalPath.startsWith("projects/")) return "assets/projects/";
  if (originalPath.startsWith("portfolio/")) return "assets/portfolio/";
  if (originalPath.startsWith("f-photocard/")) return "assets/profile/";
  if (originalPath.startsWith("profile/")) return "assets/profile/";
  if (originalPath.startsWith("resume/")) return "assets/resume/";
  // Top-level files (e.g. logos) -> profile bucket as the catch-all "site assets" home.
  return "assets/profile/";
}

function guessContentType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "gif": return "image/gif";
    case "pdf": return "application/pdf";
    default: return "application/octet-stream";
  }
}

export const migrateMediaToR2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (!roles?.length) throw new Error("Forbidden — admin only");

    // 1. Discover every legacy URL still referenced in content tables.
    const tables: Array<{ table: string; col: string }> = [
      { table: "hero_content", col: "portrait_url" },
      { table: "about_content", col: "image_url" },
      { table: "projects", col: "image_url" },
      { table: "portfolio_items", col: "image_url" },
      { table: "portfolio_folders", col: "cover_url" },
      { table: "f_photocard", col: "image_url" },
      { table: "f_projects", col: "image_url" },
      { table: "site_settings", col: "logo_url" },
      { table: "site_settings", col: "favicon_url" },
      { table: "launcher_pages", col: "thumbnail_url" },
      { table: "testimonials", col: "avatar_url" },
    ];

    type Ref = { table: string; col: string; id: string; url: string };
    const refs: Ref[] = [];
    for (const t of tables) {
      const { data, error } = await (supabaseAdmin as any)
        .from(t.table)
        .select(`id, ${t.col}`)
        .like(t.col, `%${SUPABASE_MEDIA_PREFIX}%`);
      if (error) continue;
      for (const row of (data ?? []) as any[]) {
        const url = (row as any)[t.col];
        if (!url) continue;
        refs.push({ table: t.table, col: t.col, id: (row as any).id, url });
      }
    }

    // 2. Copy each unique legacy file into R2 and build a URL map.
    const urlMap = new Map<string, string>();
    const errors: string[] = [];
    let copied = 0;

    for (const ref of refs) {
      if (urlMap.has(ref.url)) continue;
      try {
        const idx = ref.url.indexOf(SUPABASE_MEDIA_PREFIX);
        if (idx < 0) continue;
        const originalPath = decodeURIComponent(ref.url.slice(idx + SUPABASE_MEDIA_PREFIX.length).split("?")[0]);
        const folder = classifyFolder(originalPath);
        const filename = originalPath.split("/").pop() || `legacy-${Date.now()}`;
        const r2Key = `${folder}${filename}`;

        // Fetch the file bytes.
        const res = await fetch(ref.url);
        if (!res.ok) throw new Error(`fetch ${ref.url}: ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") || guessContentType(filename);

        const newUrl = await putObject(r2Key, bytes, contentType);
        urlMap.set(ref.url, newUrl);
        copied++;
      } catch (e: any) {
        errors.push(`${ref.url}: ${e?.message || String(e)}`);
      }
    }

    // 3. Rewrite each row to point at the R2 URL.
    let rewritten = 0;
    for (const ref of refs) {
      const newUrl = urlMap.get(ref.url);
      if (!newUrl) continue;
      const { error } = await supabaseAdmin
        .from(ref.table)
        .update({ [ref.col]: newUrl })
        .eq("id", ref.id);
      if (error) {
        errors.push(`update ${ref.table}.${ref.col} (${ref.id}): ${error.message}`);
        continue;
      }
      rewritten++;
    }

    // 4. Resync R2 content JSON so public reads pick up the new URLs immediately.
    await seedR2FromDatabase({ data: { scope: undefined } });

    return {
      ok: true,
      filesCopied: copied,
      rowsRewritten: rewritten,
      uniqueUrls: urlMap.size,
      errors,
    };
  });
