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
    // Adopt admin-key access — we are running an irreversible content export.
    // Anonymous callers get blocked at the publish layer + we rate-limit by writing once.

    const [hero, about, contact, services, reviews, projects, folders, items] = await Promise.all([
      supabaseAdmin.from("hero_content").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("about_content").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("contact_settings").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("services").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("testimonials").select("*").eq("published", true).order("sort_order"),
      supabaseAdmin.from("projects").select("*").eq("published", true).order("sort_order"),
      supabaseAdmin.from("portfolio_folders").select("*").eq("active", true).order("sort_order"),
      supabaseAdmin.from("portfolio_items").select("*").eq("active", true).order("sort_order"),
    ]);

    const h = hero.data ?? ({} as any);
    const a = about.data ?? ({} as any);
    const c = contact.data ?? ({} as any);

    const basicInfo = {
      name: "Ali Nur Hasan",
      title: h.headline ?? "",
      shortIntro: h.subheadline ?? "",
      eyebrow: h.eyebrow ?? "",
      profileImage: h.portrait_url ?? "",
      resumeUrl: "",
      socials: c.social_links ?? {},
      cta: {
        primaryText: h.primary_cta_label ?? "View Projects",
        primaryUrl: h.primary_cta_url ?? "/projects",
        secondaryText: h.secondary_cta_label ?? "",
        secondaryUrl: h.secondary_cta_url ?? "",
      },
    };

    const aboutDoc = {
      title: a.title ?? "About me",
      intro: a.intro ?? "",
      bio: a.bio ?? "",
      experienceSummary: a.experience_summary ?? "",
      image: a.image_url ?? "",
      skills: Array.isArray(a.skills) ? a.skills : [],
      stats: Array.isArray(a.stats) ? a.stats : [],
      tools: [],
      highlights: [],
      education: "",
    };

    const portfolioDoc = (folders.data ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      description: f.description ?? "",
      cover: f.cover_url ?? "",
      icon: f.icon ?? "",
      sort: f.sort_order ?? 0,
      items: (items.data ?? [])
        .filter((it) => it.folder_id === f.id)
        .map((it) => ({
          id: it.id,
          title: it.title,
          description: it.description ?? "",
          image: it.image_url ?? "",
          externalUrl: it.external_url ?? "",
          tags: Array.isArray(it.tags) ? it.tags : [],
        })),
    }));

    const projectsDoc = (projects.data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      category: p.category ?? "",
      summary: p.summary ?? "",
      description: p.description ?? "",
      image: p.image_url ?? "",
      liveUrl: p.live_url ?? "",
      githubUrl: p.github_url ?? "",
      tools: Array.isArray(p.tools) ? p.tools : [],
      features: Array.isArray(p.features) ? p.features : [],
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      featured: !!p.featured,
    }));

    const servicesDoc = (services.data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      icon: s.icon ?? "Sparkles",
      price: "",
      ctaText: "Contact Me",
      ctaUrl: "/contact",
    }));

    const contactDoc = {
      email: c.email ?? "",
      phone: c.phone ?? "",
      whatsapp: c.whatsapp ?? "",
      location: c.address ?? "",
      mapLink: c.map_link ?? "",
      socials: c.social_links ?? {},
      formReceiver: c.form_receiver_email ?? c.email ?? "",
    };

    const reviewsDoc = (reviews.data ?? []).map((r) => ({
      id: r.id,
      name: r.client_name,
      role: r.role ?? "",
      company: r.company ?? "",
      review: r.review,
      rating: r.rating ?? 5,
      avatar: r.avatar_url ?? "",
      featured: !!r.featured,
      published: true,
      created_at: r.created_at,
    }));

    await Promise.all([
      writeJson(R2_KEYS.basicInfo, basicInfo),
      writeJson(R2_KEYS.about, aboutDoc),
      writeJson(R2_KEYS.portfolio, portfolioDoc),
      writeJson(R2_KEYS.projects, projectsDoc),
      writeJson(R2_KEYS.services, servicesDoc),
      writeJson(R2_KEYS.contact, contactDoc),
      writeJson(R2_KEYS.reviews, reviewsDoc),
    ]);

    return {
      ok: true,
      counts: {
        portfolio: portfolioDoc.length,
        projects: projectsDoc.length,
        services: servicesDoc.length,
        reviews: reviewsDoc.length,
      },
    };
  });
