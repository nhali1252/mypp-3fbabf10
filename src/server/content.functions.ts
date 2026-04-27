/**
 * Content server functions backed directly by Supabase. Replaces the previous
 * Cloudflare R2 JSON pipeline. Hooks call `getContent({ key })` and receive
 * the same JSON shape they used to get from R2 — so no client-side changes
 * are required outside the hook layer.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabasePublic } from "@/integrations/supabase/client.public";

export const CONTENT_KEYS = [
  "basicInfo",
  "about",
  "portfolio",
  "projects",
  "services",
  "contact",
  "reviews",
  "launcher",
  "chrome",
  "fPage",
  "pageQuotes",
] as const;

export type ContentKey = (typeof CONTENT_KEYS)[number];

const contentKeySchema = z.enum(CONTENT_KEYS as unknown as [ContentKey, ...ContentKey[]]);

async function buildContent(key: ContentKey): Promise<unknown> {
  switch (key) {
    case "basicInfo": {
      const [hero, about, contact, siteSettings] = await Promise.all([
        supabaseAdmin.from("hero_content").select("*").limit(1).maybeSingle(),
        supabaseAdmin.from("about_content").select("*").limit(1).maybeSingle(),
        supabaseAdmin.from("contact_settings").select("*").limit(1).maybeSingle(),
        supabaseAdmin.from("site_settings").select("*"),
      ]);
      const h = hero.data ?? ({} as any);
      const a = about.data ?? ({} as any);
      const c = contact.data ?? ({} as any);
      const siteByKey: Record<string, any> = {};
      (siteSettings.data ?? []).forEach((row) => {
        siteByKey[row.page_key ?? "B"] = row;
      });
      return {
        hero: h,
        about: a,
        contact: c,
        siteSettings: siteByKey,
        name: "Ali Nur Hasan",
        title: h.headline ?? "",
        shortIntro: h.subheadline ?? "",
        eyebrow: h.eyebrow ?? "",
        profileImage: h.portrait_url ?? "",
        socials: c.social_links ?? {},
      };
    }
    case "about": {
      const [about, activities, education] = await Promise.all([
        supabaseAdmin.from("about_content").select("*").limit(1).maybeSingle(),
        supabaseAdmin.from("activities").select("*").eq("active", true).order("sort_order"),
        supabaseAdmin.from("education").select("*").eq("active", true).order("sort_order"),
      ]);
      return {
        ...(about.data ?? {}),
        activities: activities.data ?? [],
        education: education.data ?? [],
      };
    }
    case "portfolio": {
      const [folders, items] = await Promise.all([
        supabaseAdmin.from("portfolio_folders").select("*").eq("active", true).order("sort_order"),
        supabaseAdmin.from("portfolio_items").select("*").eq("active", true).order("sort_order"),
      ]);
      return (folders.data ?? []).map((f: any) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        description: f.description ?? "",
        cover_url: f.cover_url ?? "",
        icon: f.icon ?? "",
        sort_order: f.sort_order ?? 0,
        active: f.active,
        parent_id: f.parent_id ?? null,
        items: (items.data ?? [])
          .filter((it: any) => it.folder_id === f.id)
          .map((it: any) => ({
            id: it.id,
            folder_id: it.folder_id,
            title: it.title,
            description: it.description ?? "",
            image_url: it.image_url ?? "",
            external_url: it.external_url ?? "",
            tags: Array.isArray(it.tags) ? it.tags : [],
            sort_order: it.sort_order ?? 0,
            active: it.active,
            featured: !!it.featured,
            show_in_feed: it.show_in_feed !== false,
            watermark_text: it.watermark_text ?? null,
            feed_caption: it.feed_caption ?? null,
            created_at: it.created_at ?? null,
            updated_at: it.updated_at ?? null,
          })),
      }));
    }
    case "projects": {
      const { data } = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      return data ?? [];
    }
    case "services": {
      const { data } = await supabaseAdmin
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      return data ?? [];
    }
    case "contact": {
      const { data } = await supabaseAdmin
        .from("contact_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      return data ?? {};
    }
    case "reviews": {
      const { data } = await supabaseAdmin
        .from("testimonials")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      return data ?? [];
    }
    case "launcher": {
      const [hero, pages] = await Promise.all([
        supabaseAdmin.from("launcher_hero").select("*").limit(1).maybeSingle(),
        supabaseAdmin.from("launcher_pages").select("*").eq("active", true).order("sort_order"),
      ]);
      return { hero: hero.data ?? null, pages: pages.data ?? [] };
    }
    case "chrome": {
      const [navLinks, footerLinks, footerApps, footerCta, ticker, seoSettings, pageLoader] =
        await Promise.all([
          supabaseAdmin.from("nav_links").select("*").eq("active", true).order("sort_order"),
          supabaseAdmin.from("footer_links").select("*").eq("active", true).order("sort_order"),
          supabaseAdmin.from("footer_apps").select("*").eq("active", true).order("sort_order"),
          supabaseAdmin.from("footer_cta").select("*").limit(1).maybeSingle(),
          supabaseAdmin.from("ticker_items").select("*").eq("active", true).order("sort_order"),
          supabaseAdmin.from("seo_settings").select("*"),
          supabaseAdmin.from("page_loader_settings").select("*").limit(1).maybeSingle(),
        ]);
      const seoByKey: Record<string, any> = {};
      (seoSettings.data ?? []).forEach((row: any) => {
        seoByKey[row.page_key] = row;
      });
      return {
        navLinks: navLinks.data ?? [],
        footerLinks: footerLinks.data ?? [],
        footerApps: footerApps.data ?? [],
        footerCta: footerCta.data ?? null,
        tickerItems: ticker.data ?? [],
        seoSettings: seoByKey,
        pageLoader: pageLoader.data ?? null,
      };
    }
    case "fPage": {
      const [hero, photocard, skills, projects] = await Promise.all([
        supabaseAdmin.from("f_hero").select("*").limit(1).maybeSingle(),
        supabaseAdmin.from("f_photocard").select("*").limit(1).maybeSingle(),
        supabaseAdmin.from("f_skills").select("*").eq("active", true).order("sort_order"),
        supabaseAdmin.from("f_projects").select("*").eq("active", true).order("sort_order"),
      ]);
      return {
        hero: hero.data ?? null,
        photocard: photocard.data ?? null,
        skills: skills.data ?? [],
        projects: projects.data ?? [],
      };
    }
    case "pageQuotes": {
      const { data } = await supabaseAdmin
        .from("page_quotes")
        .select("*")
        .eq("active", true);
      const map: Record<string, any> = {};
      for (const row of data ?? []) {
        if (row?.page_slug) map[row.page_slug] = row;
      }
      return map;
    }
  }
}

/** Public read of any content "doc". Returns the same shape the R2 hooks expected. */
export const getContent = createServerFn({ method: "GET" })
  .inputValidator((data: { key: ContentKey }) => ({ key: contentKeySchema.parse(data.key) }))
  .handler(async ({ data }) => {
    try {
      const value = await buildContent(data.key);
      return { key: data.key, data: value as any };
    } catch (err) {
      console.error(`[content.getContent] FAILED key=${data.key}:`, err);
      throw err;
    }
  });

/** Public reviews submission — anyone can append a pending testimonial. */
export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; role?: string; review: string; rating: number }) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        role: z.string().trim().max(120).optional().or(z.literal("")),
        review: z.string().trim().min(8).max(2000),
        rating: z.number().int().min(1).max(5),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("testimonials").insert({
      client_name: data.name,
      role: data.role || null,
      review: data.review,
      rating: data.rating,
      status: "pending",
      published: false,
      featured: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Media helpers (Supabase Storage)
// ---------------------------------------------------------------------------

export const ASSET_FOLDERS = ["profile", "projects", "portfolio", "resume"] as const;
export type AssetFolder = (typeof ASSET_FOLDERS)[number];
const folderSchema = z.enum(ASSET_FOLDERS as unknown as [AssetFolder, ...AssetFolder[]]);

const BUCKET = "media";

async function assertAdminOrEditor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "editor"]);
  if (error) throw new Error("Role check failed");
  if (!data?.length) throw new Error("Forbidden — admin or editor role required");
}

function publicUrlFor(key: string): string {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

/** List media in a folder (admin only). */
export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { folder: AssetFolder }) => ({ folder: folderSchema.parse(data.folder) }))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    const { data: rows, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(data.folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw new Error(error.message);
    return (rows ?? [])
      .filter((r) => r.name && !r.name.endsWith("/"))
      .map((r) => {
        const key = `${data.folder}/${r.name}`;
        return { key, url: publicUrlFor(key) };
      });
  });

/** Delete a media object (admin only). */
export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { key: string }) => ({
    key: z
      .string()
      .min(1)
      .max(500)
      .regex(/^(profile|projects|portfolio|resume)\//, "Refusing to delete outside known folders")
      .parse(data.key),
  }))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([data.key]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Server-side proxy upload. The browser POSTs base64 bytes; the server uploads
 * them to Supabase Storage. Limit: 25 MB.
 */
export const uploadAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { folder: AssetFolder; filename: string; contentType: string; base64: string }) => ({
      folder: folderSchema.parse(data.folder),
      filename: z
        .string()
        .min(1)
        .max(200)
        .regex(/^[\w\-. ]+$/, "Invalid filename")
        .parse(data.filename),
      contentType: z.string().min(1).max(120).parse(data.contentType),
      base64: z.string().min(1).max(40_000_000).parse(data.base64),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.byteLength > 25 * 1024 * 1024) {
      throw new Error("File too large — max 25 MB");
    }
    const safeName = data.filename.replace(/\s+/g, "-");
    const key = `${data.folder}/${Date.now()}-${safeName}`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { key, publicUrl: publicUrlFor(key) };
  });
