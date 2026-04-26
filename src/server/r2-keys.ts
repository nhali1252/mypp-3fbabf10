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
} as const;

export type R2ContentKey = keyof typeof R2_KEYS;

export const R2_ASSET_PREFIXES = {
  profile: "assets/profile/",
  projects: "assets/projects/",
  portfolio: "assets/portfolio/",
  resume: "assets/resume/",
} as const;

export type R2AssetFolder = keyof typeof R2_ASSET_PREFIXES;
