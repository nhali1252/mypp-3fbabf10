/**
 * Resync R2 from the current database. Used both as a one-time seed and as
 * the hybrid auto-resync target after admin saves. Admin/editor only.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { writeJson } from "./r2.server";
import { R2_KEYS, type R2ContentKey } from "./r2-keys";

async function assertAdminOrEditor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "editor"]);
  if (error) throw new Error("Role check failed");
  if (!data?.length) throw new Error("Forbidden — admin or editor role required");
}

const scopeSchema = z
  .array(z.enum(Object.keys(R2_KEYS) as [R2ContentKey, ...R2ContentKey[]]))
  .optional();

export const seedR2FromDatabase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { scope?: R2ContentKey[] } | undefined) => ({
    scope: scopeSchema.parse(data?.scope),
  }))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    const want = (k: R2ContentKey) => !data.scope || data.scope.includes(k);

    const [
      hero, about, contact, services, reviews, projects, folders, items,
      navLinks, footerLinks, footerApps, footerCta, ticker,
      siteSettings, seoSettings, pageLoader,
      launcherHero, launcherPages,
      fHero, fPhotocard, fSkills, fProjects,
      activities, education,
      pageQuotes,
    ] = await Promise.all([
      supabaseAdmin.from("hero_content").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("about_content").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("contact_settings").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("services").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("testimonials").select("*").eq("published", true).order("sort_order"),
      supabaseAdmin.from("projects").select("*").eq("published", true).order("sort_order"),
      supabaseAdmin.from("portfolio_folders").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("portfolio_items").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("nav_links").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("footer_links").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("footer_apps").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("footer_cta").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("ticker_items").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("site_settings").select("*"),
      supabaseAdmin.from("seo_settings").select("*"),
      supabaseAdmin.from("page_loader_settings").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("launcher_hero").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("launcher_pages").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("f_hero").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("f_photocard").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("f_skills").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("f_projects").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("activities").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("education").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("page_quotes").select("*").eq("active", true),
    ]);

    // Page-quotes JSON: a slug-keyed map so the public side can do
    // `pageQuotes[slug]` without scanning an array.
    const pageQuotesDoc: Record<string, any> = {};
    for (const row of pageQuotes.data ?? []) {
      if (row?.page_slug) pageQuotesDoc[row.page_slug] = row;
    }

    const h = hero.data ?? ({} as any);
    const a = about.data ?? ({} as any);
    const c = contact.data ?? ({} as any);

    const siteByKey: Record<string, any> = {};
    (siteSettings.data ?? []).forEach((row) => { siteByKey[row.page_key ?? "B"] = row; });
    const seoByKey: Record<string, any> = {};
    (seoSettings.data ?? []).forEach((row) => { seoByKey[row.page_key] = row; });

    const basicInfo = {
      hero: h, about: a, contact: c, siteSettings: siteByKey,
      name: "Ali Nur Hasan",
      title: h.headline ?? "",
      shortIntro: h.subheadline ?? "",
      eyebrow: h.eyebrow ?? "",
      profileImage: h.portrait_url ?? "",
      socials: c.social_links ?? {},
    };

    const aboutDoc = { ...a, activities: activities.data ?? [], education: education.data ?? [] };

    const portfolioDoc = (folders.data ?? []).map((f) => ({
      id: f.id, name: f.name, slug: f.slug,
      description: f.description ?? "", cover_url: f.cover_url ?? "",
      icon: f.icon ?? "", sort_order: f.sort_order ?? 0, active: f.active,
      items: (items.data ?? [])
        .filter((it) => it.folder_id === f.id)
        .map((it) => ({
          id: it.id, folder_id: it.folder_id, title: it.title,
          description: it.description ?? "", image_url: it.image_url ?? "",
          external_url: it.external_url ?? "",
          tags: Array.isArray(it.tags) ? it.tags : [],
          sort_order: it.sort_order ?? 0, active: it.active,
          // Used by /feed for newest-first ordering + date display.
          created_at: it.created_at ?? null,
          updated_at: it.updated_at ?? null,
        })),
    }));

    const launcherDoc = { hero: launcherHero.data ?? null, pages: launcherPages.data ?? [] };
    const chromeDoc = {
      navLinks: navLinks.data ?? [], footerLinks: footerLinks.data ?? [],
      footerApps: footerApps.data ?? [], footerCta: footerCta.data ?? null,
      tickerItems: ticker.data ?? [], seoSettings: seoByKey,
      pageLoader: pageLoader.data ?? null,
    };
    const fPageDoc = {
      hero: fHero.data ?? null, photocard: fPhotocard.data ?? null,
      skills: fSkills.data ?? [], projects: fProjects.data ?? [],
    };

    const writes: Promise<void>[] = [];
    if (want("basicInfo")) writes.push(writeJson(R2_KEYS.basicInfo, basicInfo));
    if (want("about")) writes.push(writeJson(R2_KEYS.about, aboutDoc));
    if (want("portfolio")) writes.push(writeJson(R2_KEYS.portfolio, portfolioDoc));
    if (want("projects")) writes.push(writeJson(R2_KEYS.projects, projects.data ?? []));
    if (want("services")) writes.push(writeJson(R2_KEYS.services, services.data ?? []));
    if (want("contact")) writes.push(writeJson(R2_KEYS.contact, { ...c }));
    if (want("reviews")) writes.push(writeJson(R2_KEYS.reviews, reviews.data ?? []));
    if (want("launcher")) writes.push(writeJson(R2_KEYS.launcher, launcherDoc));
    if (want("chrome")) writes.push(writeJson(R2_KEYS.chrome, chromeDoc));
    if (want("fPage")) writes.push(writeJson(R2_KEYS.fPage, fPageDoc));
    if (want("pageQuotes")) writes.push(writeJson(R2_KEYS.pageQuotes, pageQuotesDoc));

    await Promise.all(writes);

    // After portfolio.json is written, rebuild the parallel paginated feed
    // index so /feed pages are served from prematerialized R2 page files
    // instead of slicing the full doc on every request. Best-effort: an index
    // failure must not fail the whole resync — the slow path still works.
    let feedIndex: { built: boolean; pages?: number; error?: string } = { built: false };
    if (want("portfolio")) {
      try {
        const { buildFeedIndex } = await import("./feed-index.server");
        const manifest = await buildFeedIndex();
        const totalPages = Object.values(manifest.pageCounts).reduce(
          (n, b) => n + b.pages,
          0,
        );
        feedIndex = { built: true, pages: totalPages };
      } catch (err: any) {
        feedIndex = { built: false, error: err?.message ?? String(err) };
      }
    }

    return {
      ok: true,
      scope: data.scope ?? "all",
      counts: {
        portfolio: portfolioDoc.length,
        projects: (projects.data ?? []).length,
        services: (services.data ?? []).length,
        reviews: (reviews.data ?? []).length,
        launcherPages: launcherDoc.pages.length,
        navLinks: chromeDoc.navLinks.length,
        footerLinks: chromeDoc.footerLinks.length,
        footerApps: chromeDoc.footerApps.length,
        tickerItems: chromeDoc.tickerItems.length,
        fSkills: fPageDoc.skills.length,
        fProjects: fPageDoc.projects.length,
        activities: (aboutDoc.activities as any[]).length,
        education: (aboutDoc.education as any[]).length,
      },
      feedIndex,
    };
  });
