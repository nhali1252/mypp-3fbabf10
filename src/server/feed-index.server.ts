/**
 * Builds a parallel paginated index of the public feed in R2.
 *
 * Why: `getFeedSlice` already paginates server-side off `content/portfolio.json`,
 * but every request still pulls the entire portfolio doc (every folder + every
 * item) to compute one page. For larger portfolios this becomes the dominant
 * cost.
 *
 * The index pre-materializes pages for the common filter matrix:
 *   sort   = newest | featured-first
 *   folder = all | <folder slug>
 *   media  = all | image | video
 *   featured = 0 | 1
 *
 * Each page is a small JSON file at `feed-index/pages/{sort}/{folder}/{media}/{featured}/{n}.json`.
 * A `feed-index/manifest.json` summarizes folders, totals, and per-bucket page
 * counts so the client can paginate without a HEAD-style probe.
 *
 * RLS-safe: this builder reuses the SAME `show_in_feed` filter that
 * `feed.functions.ts` applies. Items hidden from the feed are never written to
 * any page file, regardless of folder/media/featured combo. The runtime fast
 * path also re-validates inputs before reading, so a stale or missing page
 * file degrades to the on-the-fly slicer rather than leaking hidden items.
 */

import { writeJson, readJson, r2, bucket } from "./r2.server";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import {
  R2_KEYS,
  FEED_INDEX_PAGE_SIZE,
  feedIndexPageKey,
} from "./r2-keys";
import type { FeedItem, FeedFolder, FeedSort } from "./feed.functions";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const SORTS: FeedSort[] = ["newest", "featured-first", "oldest"];
const MEDIA: ("all" | "image" | "video")[] = ["all", "image", "video"];
const FEATURED_FLAGS = [false, true];

export type FeedIndexManifest = {
  version: 1;
  builtAt: string;
  pageSize: number;
  folders: FeedFolder[];
  /** Total items after `show_in_feed` (matches `getFeedSlice.total`). */
  total: number;
  featuredCount: number;
  /**
   * Per-bucket page count, so a client can know `hasMore` / total pages without
   * downloading the page itself. Key shape: `{sort}/{folder}/{media}/{featured}`.
   */
  pageCounts: Record<string, { items: number; pages: number }>;
};

function detectKind(url: string | null | undefined): "image" | "video" {
  if (!url) return "image";
  return VIDEO_EXT.test(url) ? "video" : "image";
}

function normalizeItem(folder: any, raw: any): FeedItem | null {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.image_url) return null;
  // RLS-equivalent: the show_in_feed filter is the source of truth for what's
  // public. Mirror feed.functions.ts exactly.
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

function flattenAndSort(portfolioDoc: any[], sort: FeedSort): FeedItem[] {
  const out: FeedItem[] = [];
  for (const folder of portfolioDoc ?? []) {
    if (!folder || !Array.isArray(folder.items)) continue;
    for (const raw of folder.items) {
      const norm = normalizeItem(folder, raw);
      if (norm) out.push(norm);
    }
  }
  const byDateDesc = (a: FeedItem, b: FeedItem) => {
    const ta = a.date ? Date.parse(a.date) : 0;
    const tb = b.date ? Date.parse(b.date) : 0;
    return tb - ta;
  };
  if (sort === "featured-first") {
    out.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return byDateDesc(a, b);
    });
  } else if (sort === "oldest") {
    out.sort((a, b) => -byDateDesc(a, b));
  } else {
    out.sort(byDateDesc);
  }
  return out;
}

function bucketKey(opts: {
  sort: FeedSort;
  folder: string | null;
  media: "all" | "image" | "video";
  featured: boolean;
}) {
  return `${opts.sort}/${opts.folder ?? "all"}/${opts.media}/${opts.featured ? "1" : "0"}`;
}

/** Delete every existing object under `feed-index/pages/`. */
async function purgeOldPages(): Promise<void> {
  const client = r2();
  const Bucket = bucket();
  let token: string | undefined;
  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: "feed-index/pages/",
        ContinuationToken: token,
      }),
    );
    const objs = listed.Contents?.map((o) => ({ Key: o.Key! })) ?? [];
    if (objs.length > 0) {
      // S3 Delete supports up to 1000 per call.
      for (let i = 0; i < objs.length; i += 1000) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket,
            Delete: { Objects: objs.slice(i, i + 1000), Quiet: true },
          }),
        );
      }
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);
}

export async function buildFeedIndex(): Promise<FeedIndexManifest> {
  const portfolioDoc = (await readJson<any[]>(R2_KEYS.portfolio)) ?? [];

  // 1. Build per-sort full lists once, then derive every filter combo from them.
  const bySort: Record<FeedSort, FeedItem[]> = {
    newest: flattenAndSort(portfolioDoc, "newest"),
    "featured-first": flattenAndSort(portfolioDoc, "featured-first"),
  };

  // Folder index + featured count are computed from the canonical (unfiltered)
  // newest list — they describe the full feed regardless of active filters.
  const allItems = bySort.newest;
  const folderMap = new Map<string, FeedFolder>();
  for (const it of allItems) {
    if (!it.folder_slug) continue;
    const cur = folderMap.get(it.folder_slug);
    if (cur) cur.count += 1;
    else folderMap.set(it.folder_slug, { slug: it.folder_slug, name: it.folder_name, count: 1 });
  }
  const folders = Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const featuredCount = allItems.reduce((n, it) => n + (it.featured ? 1 : 0), 0);

  // 2. Wipe stale page files so deleted/hidden items never re-surface.
  await purgeOldPages();

  // 3. For each (sort × folder × media × featured) combo, paginate and write.
  const folderKeys: (string | null)[] = [null, ...folders.map((f) => f.slug)];
  const pageCounts: Record<string, { items: number; pages: number }> = {};
  const writes: Promise<void>[] = [];

  for (const sort of SORTS) {
    const sorted = bySort[sort];
    for (const folder of folderKeys) {
      // Filter once per folder, then derive media / featured subsets.
      const folderItems = folder ? sorted.filter((it) => it.folder_slug === folder) : sorted;
      for (const media of MEDIA) {
        const mediaItems =
          media === "all" ? folderItems : folderItems.filter((it) => it.media_kind === media);
        for (const featured of FEATURED_FLAGS) {
          const items = featured ? mediaItems.filter((it) => it.featured) : mediaItems;
          const pages = Math.max(1, Math.ceil(items.length / FEED_INDEX_PAGE_SIZE));
          pageCounts[bucketKey({ sort, folder, media, featured })] = {
            items: items.length,
            pages: items.length === 0 ? 0 : pages,
          };
          for (let p = 0; p < pages; p++) {
            const slice = items.slice(p * FEED_INDEX_PAGE_SIZE, (p + 1) * FEED_INDEX_PAGE_SIZE);
            // Skip writing entirely-empty pages (the manifest already says 0 pages).
            if (slice.length === 0 && items.length === 0) continue;
            writes.push(
              writeJson(
                feedIndexPageKey({ sort, folder, media, featured, page: p }),
                slice,
              ),
            );
          }
        }
      }
    }
  }

  await Promise.all(writes);

  const manifest: FeedIndexManifest = {
    version: 1,
    builtAt: new Date().toISOString(),
    pageSize: FEED_INDEX_PAGE_SIZE,
    folders,
    total: allItems.length,
    featuredCount,
    pageCounts,
  };
  await writeJson(R2_KEYS.feedIndexManifest, manifest);
  return manifest;
}

/**
 * Try to serve a feed slice from the prebuilt index.
 * Returns null if the request is incompatible (custom limit/offset alignment,
 * missing manifest, missing page file) so the caller can fall back to the
 * on-the-fly slicer.
 */
export async function tryServeFromIndex(opts: {
  sort: FeedSort;
  folder: string | null;
  media: "all" | "image" | "video";
  featured: boolean;
  offset: number;
  limit: number;
}): Promise<{
  items: FeedItem[];
  folders: FeedFolder[];
  total: number;
  filteredTotal: number;
  featuredCount: number;
  hasMore: boolean;
} | null> {
  // Index is materialized only at the canonical page size. Any other request
  // shape (custom limit, mid-page offset) falls back to the on-the-fly path.
  if (opts.limit !== FEED_INDEX_PAGE_SIZE) return null;
  if (opts.offset % FEED_INDEX_PAGE_SIZE !== 0) return null;

  const manifest = await readJson<FeedIndexManifest>(R2_KEYS.feedIndexManifest);
  if (!manifest || manifest.version !== 1 || manifest.pageSize !== FEED_INDEX_PAGE_SIZE) {
    return null;
  }

  const bk = bucketKey(opts);
  const counts = manifest.pageCounts[bk];
  if (!counts) return null;

  const page = opts.offset / FEED_INDEX_PAGE_SIZE;
  // Past the end of the bucket → return an empty (but valid) slice rather than
  // falling back; this is the common "infinite scroll reached end" case.
  if (page >= counts.pages) {
    return {
      items: [],
      folders: manifest.folders,
      total: manifest.total,
      filteredTotal: counts.items,
      featuredCount: manifest.featuredCount,
      hasMore: false,
    };
  }

  const items = await readJson<FeedItem[]>(
    feedIndexPageKey({ ...opts, page }),
  );
  if (!items) return null; // page promised by manifest is missing → fall back

  const consumed = page * FEED_INDEX_PAGE_SIZE + items.length;
  return {
    items,
    folders: manifest.folders,
    total: manifest.total,
    filteredTotal: counts.items,
    featuredCount: manifest.featuredCount,
    hasMore: consumed < counts.items,
  };
}
