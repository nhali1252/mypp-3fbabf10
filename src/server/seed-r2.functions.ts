/**
 * One-time seed: copy the current database content into R2 JSON files.
 * Admin-only. Idempotent — safe to run multiple times (overwrites).
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { writeJson } from "./r2.server";
import { R2_KEYS } from "./r2-keys";

export const seedR2FromDatabase = createServerFn({ method: "POST" })
  .handler(async () => {
    const [
      hero, about, contact, services, reviews, projects, folders, items,
      navLinks, footerLinks, footerApps, footerCta, ticker,
      siteSettings, seoSettings, pageLoader,
      launcherHero, launcherPages,
      fHero, fPhotocard, fSkills, fProjects,
      activities, education,
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
    ]);

    const h = hero.data ?? ({} as any);
    const a = about.data ?? ({} as any);
    const c = contact.data ?? ({} as any);

    // Group site_settings & seo_settings by page_key for direct lookup.
    const siteByKey: Record<string, any> = {};
    (siteSettings.data ?? []).forEach((row) => { siteByKey[row.page_key ?? "B"] = row; });
    const seoByKey: Record<string, any> = {};
    (seoSettings.data ?? []).forEach((row) => { seoByKey[row.page_key] = row; });

    const basicInfo = {
      // page-keyed shapes preserved so admin/edit forms keep working
      hero: h,
      about: a,
      contact: c,
      siteSettings: siteByKey,
      // Legacy convenience
      name: "Ali Nur Hasan",
      title: h.headline ?? "",
      shortIntro: h.subheadline ?? "",
      eyebrow: h.eyebrow ?? "",
      profileImage: h.portrait_url ?? "",
      socials: c.social_links ?? {},
    };

    const aboutDoc = {
      ...a,
      activities: activities.data ?? [],
      education: education.data ?? [],
    };

    const portfolioDoc = (folders.data ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      description: f.description ?? "",
      cover_url: f.cover_url ?? "",
      icon: f.icon ?? "",
      sort_order: f.sort_order ?? 0,
      active: f.active,
      items: (items.data ?? [])
        .filter((it) => it.folder_id === f.id)
        .map((it) => ({
          id: it.id,
          folder_id: it.folder_id,
          title: it.title,
          description: it.description ?? "",
          image_url: it.image_url ?? "",
          external_url: it.external_url ?? "",
          tags: Array.isArray(it.tags) ? it.tags : [],
          sort_order: it.sort_order ?? 0,
          active: it.active,
        })),
    }));

    const projectsDoc = projects.data ?? [];
    const servicesDoc = services.data ?? [];
    const contactDoc = { ...c };
    const reviewsDoc = reviews.data ?? [];

    const launcherDoc = {
      hero: launcherHero.data ?? null,
      pages: launcherPages.data ?? [],
    };

    const chromeDoc = {
      navLinks: navLinks.data ?? [],
      footerLinks: footerLinks.data ?? [],
      footerApps: footerApps.data ?? [],
      footerCta: footerCta.data ?? null,
      tickerItems: ticker.data ?? [],
      seoSettings: seoByKey,
      pageLoader: pageLoader.data ?? null,
    };

    const fPageDoc = {
      hero: fHero.data ?? null,
      photocard: fPhotocard.data ?? null,
      skills: fSkills.data ?? [],
      projects: fProjects.data ?? [],
    };

    await Promise.all([
      writeJson(R2_KEYS.basicInfo, basicInfo),
      writeJson(R2_KEYS.about, aboutDoc),
      writeJson(R2_KEYS.portfolio, portfolioDoc),
      writeJson(R2_KEYS.projects, projectsDoc),
      writeJson(R2_KEYS.services, servicesDoc),
      writeJson(R2_KEYS.contact, contactDoc),
      writeJson(R2_KEYS.reviews, reviewsDoc),
      writeJson(R2_KEYS.launcher, launcherDoc),
      writeJson(R2_KEYS.chrome, chromeDoc),
      writeJson(R2_KEYS.fPage, fPageDoc),
    ]);

    return {
      ok: true,
      counts: {
        portfolio: portfolioDoc.length,
        projects: projectsDoc.length,
        services: servicesDoc.length,
        reviews: reviewsDoc.length,
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
    };
  });
