/**
 * Build TanStack `head().meta` from a `seo_settings` row, falling back to
 * route-defined defaults. Used in every public route's `head()` so admins
 * can override per-page metadata via /admin/seo without code changes.
 */
import type { SeoRow } from "@/server/seo.functions";

export type SeoFallback = {
  title: string;
  description: string;
  image?: string | null;
};

export function buildSeoMeta(seo: SeoRow | null | undefined, fb: SeoFallback) {
  const title = seo?.meta_title?.trim() || fb.title;
  const description = seo?.meta_description?.trim() || fb.description;
  const image = seo?.og_image?.trim() || fb.image || null;
  const keywords = seo?.keywords?.trim();

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { property: "twitter:title", content: title },
    { property: "twitter:description", content: description },
  ];
  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ property: "twitter:image", content: image });
  }
  if (keywords) meta.push({ name: "keywords", content: keywords });
  return meta;
}
