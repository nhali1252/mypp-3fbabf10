/**
 * Source of truth for which Supabase tables feed which R2 content docs.
 *
 * Used by:
 *  - useR2AutoResync (subscribes to realtime changes and rebuilds matching docs)
 *  - seedR2FromDatabase (must read every table listed here)
 *  - r2-coverage validation (compares this map vs. live DB schema)
 *
 * If you add a new table that should appear in any R2 JSON doc, add it here.
 */
import type { R2ContentKey } from "./r2-keys";

export const TABLE_TO_DOCS: Record<string, R2ContentKey[]> = {
  hero_content: ["basicInfo"],
  about_content: ["about"],
  contact_settings: ["basicInfo", "contact"],
  site_settings: ["basicInfo"],
  activities: ["about"],
  education: ["about"],
  services: ["services"],
  testimonials: ["reviews"],
  projects: ["projects"],
  portfolio_folders: ["portfolio"],
  portfolio_items: ["portfolio"],
  nav_links: ["chrome"],
  footer_links: ["chrome"],
  footer_apps: ["chrome"],
  footer_cta: ["chrome"],
  ticker_items: ["chrome"],
  seo_settings: ["chrome"],
  page_loader_settings: ["chrome"],
  launcher_hero: ["launcher"],
  launcher_pages: ["launcher"],
  f_hero: ["fPage"],
  f_photocard: ["fPage"],
  f_skills: ["fPage"],
  f_projects: ["fPage"],
};

/**
 * Tables that intentionally do NOT feed any R2 content doc.
 * Coverage validation ignores these when reporting "missing" tables.
 */
export const R2_EXCLUDED_TABLES: ReadonlySet<string> = new Set([
  // Auth / role plumbing
  "profiles",
  "user_roles",
  // Private inbox (lives in private R2 bucket, not content JSON)
  "messages",
  // Legacy / deprecated — kept until cleanup migration drops them
  "media",
  "hero_content_legacy",
  // Domain-specific tables not part of the portfolio content surface
  "folders",
  "slots",
  "taxi_services",
]);

export const ALL_WATCHED_TABLES = Object.keys(TABLE_TO_DOCS);
