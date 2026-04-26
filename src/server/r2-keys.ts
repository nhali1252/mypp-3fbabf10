/** Canonical R2 object keys. Safe to import from anywhere. */
export const R2_KEYS = {
  basicInfo: "content/basic-info.json",
  about: "content/about.json",
  portfolio: "content/portfolio.json",
  projects: "content/projects.json",
  services: "content/services.json",
  contact: "content/contact.json",
  reviews: "content/reviews.json",
  // Phase 2 additions
  launcher: "content/launcher.json",
  chrome: "content/chrome.json",
  fPage: "content/f-page.json",
  /** Per-page quote/highlight blocks, keyed by page slug. */
  pageQuotes: "content/page-quotes.json",
  /** Manifest for the parallel paginated feed index (folder/media/featured/sort matrix). */
  feedIndexManifest: "feed-index/manifest.json",
} as const;

/** Page size used by the prebuilt feed index. Kept in sync with the builder. */
export const FEED_INDEX_PAGE_SIZE = 24;

/** Build the R2 key for a single prebuilt feed page. */
export function feedIndexPageKey(opts: {
  sort: "newest" | "featured-first";
  folder: string | null;
  media: "all" | "image" | "video";
  featured: boolean;
  page: number; // zero-indexed
}): string {
  const folder = opts.folder?.trim() || "all";
  const featured = opts.featured ? "1" : "0";
  // URL-safe: slugs only, plus a few literals.
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return `feed-index/pages/${opts.sort}/${safeFolder}/${opts.media}/${featured}/${opts.page}.json`;
}

export type R2ContentKey = keyof typeof R2_KEYS;

export const R2_ASSET_PREFIXES = {
  profile: "assets/profile/",
  projects: "assets/projects/",
  portfolio: "assets/portfolio/",
  resume: "assets/resume/",
} as const;

export type R2AssetFolder = keyof typeof R2_ASSET_PREFIXES;
