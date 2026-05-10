/**
 * Page-block registry. Source of truth for the new admin dashboard.
 *
 * Each entry maps a page slug -> the editor sections that should appear
 * inside its admin block. The slug must match either:
 *   - a `launcher_pages.label` slug, OR
 *   - a manually-added entry below (for pages not in launcher_pages).
 *
 * The new admin dashboard at /admin renders one card per entry. Clicking
 * a card opens /admin/page/$slug, which lazy-loads each section in order.
 *
 * To add a new editor to an existing page: add a section to its `sections` array.
 * To add a new page: add a new entry here. (If the slug also exists in
 * launcher_pages, the card thumbnail/description/accent are pulled from there.)
 */
export type PageBlockSection = {
  /** Stable id used in the section anchor & accordion key. */
  id: string;
  /** Display title in the page-editor accordion. */
  title: string;
  /** Short helper text shown under the title. */
  description?: string;
};

export type PageBlock = {
  slug: string;
  /** Display name shown on the dashboard card. Falls back to launcher row title. */
  title: string;
  /** Short blurb for the card. Falls back to launcher row description. */
  description: string;
  /** Lucide icon name (string — resolved at render time). */
  icon: string;
  /** Ordered editor sections that render inside the page-editor route. */
  sections: PageBlockSection[];
};

/** The main pages from the public launcher, in canonical order. */
export const PAGE_BLOCKS: PageBlock[] = [
  {
    slug: "home",
    title: "Home (Launcher)",
    description: "Hero, launcher cards, and the welcome quote.",
    icon: "Home",
    sections: [
      { id: "quote", title: "Quote block", description: "Welcome quote shown above the footer on the launcher." },
    ],
  },
  {
    slug: "basic",
    title: "Basic Info",
    description: "Hero, identity, site settings, social links.",
    icon: "User",
    sections: [
      { id: "hero", title: "Hero", description: "Headline, subheadline, CTAs, portrait." },
      { id: "site-settings", title: "Site settings", description: "Site name, theme, logo, favicon." },
      { id: "socials", title: "Social links", description: "Where people can find you elsewhere." },
      { id: "quote", title: "Quote block", description: "Highlighted quote that appears near the bottom of this page." },
    ],
  },
  {
    slug: "about",
    title: "Skills & About",
    description: "Bio, skills, stats, activities, education, story.",
    icon: "Sparkles",
    sections: [
      { id: "intro", title: "Intro & bio", description: "Title, intro, long bio, portrait." },
      { id: "skills", title: "Skills", description: "Skill chips and ordering." },
      { id: "stats", title: "Stats", description: "Numeric highlights (years, projects, clients)." },
      { id: "activities", title: "Activities", description: "Side projects, hobbies, ongoing work." },
      { id: "education", title: "Education", description: "Degrees, schools, dates." },
      { id: "quote", title: "Quote block", description: "Story / identity-focused quote." },
    ],
  },
  {
    slug: "portfolio",
    title: "Portfolio",
    description: "Folders and items grouped by category.",
    icon: "FolderOpen",
    sections: [
      { id: "folders", title: "Folders", description: "Top-level portfolio categories." },
      { id: "items", title: "Items", description: "Individual portfolio entries." },
      { id: "quote", title: "Quote block", description: "Creativity / craft quote." },
    ],
  },
  {
    slug: "projects",
    title: "Projects",
    description: "Featured case studies with details and links.",
    icon: "Layers",
    sections: [
      { id: "list", title: "Projects", description: "Add, edit, reorder, publish projects." },
      { id: "quote", title: "Quote block", description: "Build / shipping quote." },
    ],
  },
  {
    slug: "services",
    title: "Services",
    description: "What you offer, with descriptions and icons.",
    icon: "Briefcase",
    sections: [
      { id: "list", title: "Services", description: "Manage the services list." },
      { id: "quote", title: "Quote block", description: "Value / results quote." },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    description: "Email, phone, WhatsApp, address, socials, form.",
    icon: "Mail",
    sections: [
      { id: "channels", title: "Channels", description: "Email, phone, WhatsApp, address, map." },
      { id: "socials", title: "Socials", description: "Per-page social handles." },
      { id: "quote", title: "Quote block", description: "Connection / conversation quote." },
    ],
  },
  {
    slug: "reviews",
    title: "Reviews",
    description: "Testimonials, moderation, ordering.",
    icon: "Star",
    sections: [
      { id: "list", title: "Testimonials", description: "Approve, feature, edit, hide reviews." },
      { id: "quote", title: "Quote block", description: "Trust / proof quote." },
    ],
  },
];

export const PAGE_BLOCK_BY_SLUG: Record<string, PageBlock> = Object.fromEntries(
  PAGE_BLOCKS.map((b) => [b.slug, b]),
);
