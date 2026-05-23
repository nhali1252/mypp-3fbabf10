/**
 * Content server functions backed directly by Supabase. Replaces the previous
 * Cloudflare Supabase pipeline. Hooks call `getContent({ key })` and receive
 * the same JSON shape they used to get from Supabase — so no client-side changes
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
      const [hero, about, contactRpc, siteSettings] = await Promise.all([
        supabasePublic.from("hero_content").select("*").limit(1).maybeSingle(),
        supabasePublic.from("about_content").select("*").limit(1).maybeSingle(),
        // Display-safe contact via SECURITY DEFINER RPC — no service-role key required.
        supabasePublic.rpc("get_public_contact"),
        supabasePublic.from("site_settings").select("*"),
      ]);
      const h = hero.data ?? ({} as any);
      const a = about.data ?? ({} as any);
      const c = (Array.isArray(contactRpc.data) ? contactRpc.data[0] : contactRpc.data) ?? ({} as any);
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
        supabasePublic.from("about_content").select("*").limit(1).maybeSingle(),
        supabasePublic.from("activities").select("*").eq("active", true).order("sort_order"),
        supabasePublic.from("education").select("*").eq("active", true).order("sort_order"),
      ]);
      return {
        ...(about.data ?? {}),
        activities: activities.data ?? [],
        education: education.data ?? [],
      };
    }
    case "portfolio": {
      const [folders, items] = await Promise.all([
        supabasePublic.from("portfolio_folders").select("*").eq("active", true).order("sort_order"),
        supabasePublic.from("portfolio_items").select("*").eq("active", true).order("sort_order"),
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
      const { data } = await supabasePublic
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      return data ?? [];
    }
    case "services": {
      const { data } = await supabasePublic
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      return data ?? [];
    }
    case "contact": {
      // Public callers see only display-safe fields via a SECURITY DEFINER
      // RPC, so this works without SUPABASE_SERVICE_ROLE_KEY being deployed.
      // form_receiver_email and other internal fields stay server-side.
      const { data } = await supabasePublic.rpc("get_public_contact");
      const row = Array.isArray(data) ? data[0] : data;
      return row ?? {};
    }
    case "reviews": {
      const { data } = await supabasePublic
        .from("testimonials")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      return data ?? [];
    }
    case "launcher": {
      const [hero, pages] = await Promise.all([
        supabasePublic.from("launcher_hero").select("*").limit(1).maybeSingle(),
        supabasePublic.from("launcher_pages").select("*").eq("active", true).order("sort_order"),
      ]);
      return { hero: hero.data ?? null, pages: pages.data ?? [] };
    }
    case "chrome": {
      const [navLinks, footerLinks, footerApps, footerCta, ticker, seoSettings, pageLoader, headingShimmer, headingShimmerOverrides] =
        await Promise.all([
          supabasePublic.from("nav_links").select("*").eq("active", true).order("sort_order"),
          supabasePublic.from("footer_links").select("*").eq("active", true).order("sort_order"),
          supabasePublic.from("footer_apps").select("*").eq("active", true).order("sort_order"),
          supabasePublic.from("footer_cta").select("*").limit(1).maybeSingle(),
          supabasePublic.from("ticker_items").select("*").eq("active", true).order("sort_order"),
          supabasePublic.from("seo_settings").select("*"),
          supabasePublic.from("page_loader_settings").select("*").limit(1).maybeSingle(),
          supabasePublic.from("heading_shimmer_settings").select("*").limit(1).maybeSingle(),
          supabasePublic.from("heading_shimmer_overrides").select("*"),
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
        headingShimmer: headingShimmer.data ?? null,
        headingShimmerOverrides: headingShimmerOverrides.data ?? [],
      };
    }
    case "fPage": {
      const [hero, photocard, skills, projects] = await Promise.all([
        supabasePublic.from("f_hero").select("*").limit(1).maybeSingle(),
        supabasePublic.from("f_photocard").select("*").limit(1).maybeSingle(),
        supabasePublic.from("f_skills").select("*").eq("active", true).order("sort_order"),
        supabasePublic.from("f_projects").select("*").eq("active", true).order("sort_order"),
      ]);
      return {
        hero: hero.data ?? null,
        photocard: photocard.data ?? null,
        skills: skills.data ?? [],
        projects: projects.data ?? [],
      };
    }
    case "pageQuotes": {
      const { data } = await supabasePublic
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

/** Public read of any content "doc". Returns the same shape the Supabase hooks expected. */
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
    // Use the public (anon) client so submission works without the
    // SUPABASE_SERVICE_ROLE_KEY being deployed to the Worker. RLS policy
    // "Anon can submit testimonial" permits inserts that are pending,
    // unpublished, and unfeatured — exactly the shape we send below.
    const { error } = await supabasePublic.from("testimonials").insert({
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

async function assertAdminOrEditor(sb: typeof supabaseAdmin, userId: string) {
  try {
    const { data, error } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "editor"]);
    if (error) {
      console.error("[content.assertAdminOrEditor] supabase error:", error);
      throw new Error(`Role check failed: ${error.message}`);
    }
    if (!data?.length) throw new Error("Forbidden — admin or editor role required");
  } catch (e: any) {
    if (e?.message?.startsWith("Forbidden")) throw e;
    if (e?.message?.startsWith("Role check failed")) throw e;
    console.error("[content.assertAdminOrEditor] unexpected:", e);
    throw new Error(`Role check failed: ${e?.message ?? String(e)}`);
  }
}

function publicUrlFor(sb: typeof supabaseAdmin, key: string): string {
  const { data } = sb.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

/** List media in a folder (admin only). Uses user-auth client so it works
 *  even when SUPABASE_SERVICE_ROLE_KEY is not deployed — storage RLS allows
 *  authenticated reads on the public `media` bucket. */
export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { folder: AssetFolder }) => ({ folder: folderSchema.parse(data.folder) }))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as typeof supabaseAdmin;
    await assertAdminOrEditor(sb, context.userId);
    const { data: rows, error } = await sb.storage
      .from(BUCKET)
      .list(data.folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw new Error(error.message);
    return (rows ?? [])
      .filter((r) => r.name && !r.name.endsWith("/"))
      .map((r) => {
        const key = `${data.folder}/${r.name}`;
        return { key, url: publicUrlFor(sb, key) };
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
    const sb = context.supabase as unknown as typeof supabaseAdmin;
    await assertAdminOrEditor(sb, context.userId);
    const { error } = await sb.storage.from(BUCKET).remove([data.key]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Server-side proxy upload. The browser POSTs base64 bytes; the server uploads
 * them to Supabase Storage using the caller's auth token, so the deployed
 * Worker doesn't need SUPABASE_SERVICE_ROLE_KEY for media uploads.
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
    const sb = context.supabase as unknown as typeof supabaseAdmin;
    await assertAdminOrEditor(sb, context.userId);
    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.byteLength > 25 * 1024 * 1024) {
      throw new Error("File too large — max 25 MB");
    }
    const safeName = data.filename.replace(/\s+/g, "-");
    const key = `${data.folder}/${Date.now()}-${safeName}`;
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(key, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { key, publicUrl: publicUrlFor(sb, key) };
  });

/**
 * Bulk-insert portfolio items in one round trip. Used by the admin bulk-upload
 * flow so we don't depend on the browser supabase client's auth state for
 * inserts — runs server-side with the caller's verified bearer token + admin
 * role assertion. Returns the inserted rows.
 */
const portfolioItemInputSchema = z.object({
  folder_id: z.string().uuid(),
  title: z.string().trim().min(1).max(300),
  image_url: z.string().url().max(2000).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  external_url: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(80)).max(50).optional(),
  sort_order: z.number().int().min(0).max(100000).optional(),
  active: z.boolean().optional(),
  show_in_feed: z.boolean().optional(),
  feed_caption: z.string().max(2000).nullable().optional(),
  featured: z.boolean().optional(),
  watermark_text: z.string().max(200).nullable().optional(),
});

export const insertPortfolioItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { items: z.input<typeof portfolioItemInputSchema>[] }) => ({
    items: z.array(portfolioItemInputSchema).min(1).max(100).parse(data.items),
  }))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as typeof supabaseAdmin;
    await assertAdminOrEditor(sb, context.userId);
    const rows = data.items.map((it) => ({
      folder_id: it.folder_id,
      title: it.title,
      image_url: it.image_url ?? null,
      description: it.description ?? null,
      external_url: it.external_url ?? null,
      tags: it.tags ?? [],
      sort_order: it.sort_order ?? 0,
      active: it.active ?? true,
      show_in_feed: it.show_in_feed ?? true,
      feed_caption: it.feed_caption ?? null,
      featured: it.featured ?? false,
      watermark_text: it.watermark_text ?? null,
    }));
    const { data: inserted, error } = await sb
      .from("portfolio_items")
      .insert(rows)
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: inserted ?? [] };
  });
