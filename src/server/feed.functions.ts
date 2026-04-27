/**
 * Server-side slicing for the public Feed — backed by Supabase directly.
 * Reads `portfolio_folders` + `portfolio_items` and returns a paginated
 * filtered slice. Filters: show_in_feed (always), folder slug, media kind,
 * featured-only.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabasePublic } from "@/integrations/supabase/client.public";

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
  total: number;
  filteredTotal: number;
  featuredCount: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

const inputSchema = z.object({
  folder: z.string().min(1).max(120).optional(),
  media: z.enum(["all", "image", "video"]).optional().default("all"),
  featured: z.boolean().optional().default(false),
  sort: z.enum(["newest", "featured-first", "oldest"]).optional().default("newest"),
  offset: z.number().int().min(0).max(10_000).optional().default(0),
  limit: z.number().int().min(1).max(MAX_LIMIT).optional().default(24),
});

export type FeedSort = "newest" | "featured-first" | "oldest";

function detectKind(url: string | null | undefined): "image" | "video" {
  if (!url) return "image";
  return VIDEO_EXT.test(url) ? "video" : "image";
}

export const getFeedSlice = createServerFn({ method: "GET" })
  .inputValidator((data: z.input<typeof inputSchema>) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<FeedSlice> => {
    const [foldersRes, itemsRes] = await Promise.all([
      supabasePublic.from("portfolio_folders").select("*").eq("active", true),
      supabasePublic
        .from("portfolio_items")
        .select("*")
        .eq("active", true)
        .neq("show_in_feed", false),
    ]);

    const folderById = new Map<string, any>();
    for (const f of foldersRes.data ?? []) folderById.set(f.id, f);

    const all: FeedItem[] = [];
    for (const raw of itemsRes.data ?? []) {
      if (!raw.image_url) continue;
      const folder = folderById.get(raw.folder_id);
      if (!folder) continue;
      all.push({
        id: String(raw.id),
        folder_id: String(raw.folder_id),
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
        date: raw.updated_at ?? raw.created_at ?? null,
      });
    }

    const byDateDesc = (a: FeedItem, b: FeedItem) => {
      const ta = a.date ? Date.parse(a.date) : 0;
      const tb = b.date ? Date.parse(b.date) : 0;
      return tb - ta;
    };
    const byDateAsc = (a: FeedItem, b: FeedItem) => -byDateDesc(a, b);
    if (data.sort === "featured-first") {
      all.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return byDateDesc(a, b);
      });
    } else if (data.sort === "oldest") {
      all.sort(byDateAsc);
    } else {
      all.sort(byDateDesc);
    }

    const folderMap = new Map<string, FeedFolder>();
    for (const it of all) {
      if (!it.folder_slug) continue;
      const existing = folderMap.get(it.folder_slug);
      if (existing) existing.count += 1;
      else folderMap.set(it.folder_slug, { slug: it.folder_slug, name: it.folder_name, count: 1 });
    }
    const folders = Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    const featuredCount = all.reduce((n, it) => n + (it.featured ? 1 : 0), 0);

    const filtered = all.filter((it) => {
      if (data.folder && it.folder_slug !== data.folder) return false;
      if (data.media !== "all" && it.media_kind !== data.media) return false;
      if (data.featured && !it.featured) return false;
      return true;
    });

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
