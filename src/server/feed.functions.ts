/**
 * Server-side slicing for the public Feed.
 *
 * Reads the canonical R2 portfolio JSON document once per request and returns
 * a paginated, filtered slice. This keeps the network payload small (only the
 * requested page of items + folder index + counts) without re-introducing
 * per-request Postgres reads. Filters applied server-side:
 *   - show_in_feed (always enforced)
 *   - folder slug
 *   - media kind (image | video)
 *   - featured-only
 *
 * RLS is not relevant because the R2 doc is the canonical "publish-time"
 * snapshot that the admin already curates; consumers only see what was
 * written into it.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readJson } from "./r2.server";
import { R2_KEYS } from "./r2-keys";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const MAX_LIMIT = 60;

export type FeedItem = {
  id: string;
  folder_id: string;
  folder_name: string;
  folder_slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  tags: string[];
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
  show_in_feed: boolean;
  feed_caption: string | null;
  featured: boolean;
  watermark_text: string | null;
  media_kind: "image" | "video";
  date: string | null;
};

export type FeedFolder = { slug: string; name: string; count: number };

export type FeedSlice = {
  items: FeedItem[];
  folders: FeedFolder[];
  total: number;          // total after show_in_feed filter (pre folder/media/featured)
  filteredTotal: number;  // total after all filters
  featuredCount: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

const inputSchema = z.object({
  folder: z.string().min(1).max(120).optional(),
  media: z.enum(["all", "image", "video"]).optional().default("all"),
  featured: z.boolean().optional().default(false),
  sort: z.enum(["newest", "featured-first"]).optional().default("newest"),
  offset: z.number().int().min(0).max(10_000).optional().default(0),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional().default(24),
});

export type FeedSort = "newest" | "featured-first";

function detectKind(url: string | null | undefined): "image" | "video" {
  if (!url) return "image";
  return VIDEO_EXT.test(url) ? "video" : "image";
}

function normalizeItem(folder: any, raw: any): FeedItem | null {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.image_url) return null;
  if (raw.show_in_feed === false) return null;
  return {
    id: String(raw.id ?? ""),
    folder_id: String(raw.folder_id ?? folder.id ?? ""),
    folder_name: String(folder.name ?? ""),
    folder_slug: String(folder.slug ?? ""),
    title: String(raw.title ?? ""),
    description: raw.description ?? null,
    image_url: raw.image_url ?? null,
    external_url: raw.external_url ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags.map((t: unknown) => String(t)) : [],
    sort_order: Number(raw.sort_order ?? 0),
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    show_in_feed: raw.show_in_feed !== false,
    feed_caption: raw.feed_caption ?? null,
    featured: !!raw.featured,
    watermark_text: raw.watermark_text ?? null,
    media_kind: detectKind(raw.image_url),
    date: raw.published_at ?? raw.updated_at ?? raw.created_at ?? null,
  };
}

export const getFeedSlice = createServerFn({ method: "GET" })
  .inputValidator((data: z.input<typeof inputSchema>) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<FeedSlice> => {
    // Fast path — try the prebuilt parallel page index. RLS-equivalent because
    // the builder applies the same `show_in_feed` filter as the slow path.
    // Imported lazily so this stays out of any cold-start bundle that doesn't
    // need it (and so the feed keeps working even if the index module fails to
    // load for any reason — the catch below falls back to the slow path).
    try {
      const { tryServeFromIndex } = await import("./feed-index.server");
      const fast = await tryServeFromIndex({
        sort: data.sort,
        folder: data.folder ?? null,
        media: data.media,
        featured: data.featured,
        offset: data.offset,
        limit: data.limit,
      });
      if (fast) {
        return {
          items: fast.items,
          folders: fast.folders,
          total: fast.total,
          filteredTotal: fast.filteredTotal,
          featuredCount: fast.featuredCount,
          offset: data.offset,
          limit: data.limit,
          hasMore: fast.hasMore,
        };
      }
    } catch {
      // Fall through to the on-the-fly slicer.
    }

    const doc = (await readJson<any[]>(R2_KEYS.portfolio)) ?? [];

    // 1. Flatten + apply show_in_feed (the always-on filter).
    const all: FeedItem[] = [];
    for (const folder of doc) {
      if (!folder || !Array.isArray(folder.items)) continue;
      for (const raw of folder.items) {
        const norm = normalizeItem(folder, raw);
        if (norm) all.push(norm);
      }
    }

    // Sort: newest-first by default; featured-first puts featured items on top
    // and falls back to newest within each group.
    const byDateDesc = (a: FeedItem, b: FeedItem) => {
      const ta = a.date ? Date.parse(a.date) : 0;
      const tb = b.date ? Date.parse(b.date) : 0;
      return tb - ta;
    };
    if (data.sort === "featured-first") {
      all.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return byDateDesc(a, b);
      });
    } else {
      all.sort(byDateDesc);
    }

    // 2. Folder index (built from feed-eligible items only).
    const folderMap = new Map<string, FeedFolder>();
    for (const it of all) {
      if (!it.folder_slug) continue;
      const existing = folderMap.get(it.folder_slug);
      if (existing) existing.count += 1;
      else folderMap.set(it.folder_slug, { slug: it.folder_slug, name: it.folder_name, count: 1 });
    }
    const folders = Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    const featuredCount = all.reduce((n, it) => n + (it.featured ? 1 : 0), 0);

    // 3. Apply remaining filters.
    const filtered = all.filter((it) => {
      if (data.folder && it.folder_slug !== data.folder) return false;
      if (data.media !== "all" && it.media_kind !== data.media) return false;
      if (data.featured && !it.featured) return false;
      return true;
    });

    // 4. Slice.
    const items = filtered.slice(data.offset, data.offset + data.limit);

    return {
      items,
      folders,
      total: all.length,
      filteredTotal: filtered.length,
      featuredCount,
      offset: data.offset,
      limit: data.limit,
      hasMore: data.offset + items.length < filtered.length,
    };
  });
