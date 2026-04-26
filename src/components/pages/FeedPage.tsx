import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  ArrowLeft, X, ChevronLeft, ChevronRight, Play, Sparkles,
  Image as ImageIcon, ExternalLink, Calendar, Folder, Star,
  Filter, LayoutGrid, Film, ImagePlay,
} from "lucide-react";
import { getFeedSlice, type FeedItem as ServerFeedItem, type FeedFolder } from "@/server/feed.functions";
import { Footer } from "@/components/Footer";
import { Watermark } from "@/components/feed/Watermark";
import { ReactionsBar } from "@/components/feed/ReactionsBar";
import { CommentThread } from "@/components/feed/CommentThread";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PFolder = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  sort_order: number;
};

type PItem = {
  id: string;
  folder_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  tags: string[];
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
  show_in_feed?: boolean;
  feed_caption?: string | null;
  featured?: boolean;
  published_at?: string | null;
  watermark_text?: string | null;
};

type PortfolioDoc = (PFolder & { items: PItem[] })[];

type FeedItem = ServerFeedItem;

type MediaFilter = "all" | "image" | "video";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_SIZE = 24;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// Debounce a value so rapid filter toggles don't fire a network request per click.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

const FILTER_DEBOUNCE_MS = 180;

export function FeedPage() {
  // Filters (instant — drives the UI). Debounced copies drive the network.
  const [folderFilter, setFolderFilter] = useState<string>("all"); // folder slug
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [sort, setSort] = useState<"newest" | "featured-first">("newest");

  const dFolder = useDebouncedValue(folderFilter, FILTER_DEBOUNCE_MS);
  const dMedia = useDebouncedValue(mediaFilter, FILTER_DEBOUNCE_MS);
  const dFeatured = useDebouncedValue(featuredOnly, FILTER_DEBOUNCE_MS);
  const dSort = useDebouncedValue(sort, FILTER_DEBOUNCE_MS);

  // True while the user has changed a filter but the debounced value hasn't
  // caught up yet — used to surface the skeleton overlay immediately.
  const filtersPending =
    dFolder !== folderFilter ||
    dMedia !== mediaFilter ||
    dFeatured !== featuredOnly ||
    dSort !== sort;

  // Server-paginated feed slice. Each "Load more" fetches only the next page.
  const sliceQuery = useInfiniteQuery({
    queryKey: ["feed-slice", { folder: dFolder, media: dMedia, featured: dFeatured, sort: dSort }],
    queryFn: async ({ pageParam = 0 }) => {
      return await getFeedSlice({
        data: {
          folder: dFolder === "all" ? undefined : dFolder,
          media: dMedia,
          featured: dFeatured,
          sort: dSort,
          offset: pageParam,
          limit: PAGE_SIZE,
        },
      });
    },
    getNextPageParam: (last) => (last.hasMore ? last.offset + last.items.length : undefined),
    initialPageParam: 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const isLoading = sliceQuery.isLoading;
  const isError = sliceQuery.isError;
  const nextPageErrorMessage: string | null =
    sliceQuery.isFetchNextPageError && sliceQuery.error instanceof Error
      ? sliceQuery.error.message
      : sliceQuery.isFetchNextPageError
        ? "Unknown error"
        : null;
  const initialErrorMessage: string | undefined =
    sliceQuery.error instanceof Error ? sliceQuery.error.message : undefined;
  const visibleItems: FeedItem[] = useMemo(
    () => (sliceQuery.data?.pages ?? []).flatMap((p) => p.items),
    [sliceQuery.data],
  );
  const firstPage = sliceQuery.data?.pages?.[0];
  const folders: { slug: string; name: string }[] = firstPage?.folders ?? [];
  const totalAll = firstPage?.total ?? 0;
  const filteredTotal = firstPage?.filteredTotal ?? 0;
  const canLoadMore = !!sliceQuery.hasNextPage;
  // Showing stale items while a new filter combination is being fetched.
  // Used to fade the grid + overlay a skeleton without unmounting it (which
  // would cause the visible flicker we're trying to avoid).
  const isRefetchingForFilters =
    filtersPending ||
    (sliceQuery.isFetching && !sliceQuery.isFetchingNextPage && visibleItems.length > 0);

  // Featured strip — fetch a small dedicated slice once, independent of filters.
  const featuredQuery = useQuery({
    queryKey: ["feed-featured"],
    queryFn: async () => {
      const res = await getFeedSlice({ data: { featured: true, limit: 12, offset: 0 } });
      return res.items;
    },
    staleTime: 60_000,
  });
  const featured = featuredQuery.data ?? [];

  // Lightbox runs over the *visible* items for predictable index/total.
  // `soloItem` lets us open items that aren't in the current slice (e.g. from
  // the Featured strip when filters hide them) without disturbing filters.
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [soloItem, setSoloItem] = useState<FeedItem | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const rememberFocus = useCallback(() => {
    lastFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
  }, []);
  const open = useCallback((i: number) => { rememberFocus(); setSoloItem(null); setActiveIdx(i); }, [rememberFocus]);
  const openSolo = useCallback((it: FeedItem) => { rememberFocus(); setActiveIdx(null); setSoloItem(it); }, [rememberFocus]);
  const close = useCallback(() => {
    setActiveIdx(null);
    setSoloItem(null);
    // Restore focus to the trigger after the modal unmounts.
    requestAnimationFrame(() => lastFocusRef.current?.focus?.());
  }, []);
  const next = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i + 1) % visibleItems.length)),
    [visibleItems.length],
  );
  const prev = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i - 1 + visibleItems.length) % visibleItems.length)),
    [visibleItems.length],
  );

  const lightboxOpen = activeIdx !== null || soloItem !== null;

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (soloItem === null && e.key === "ArrowRight") next();
      else if (soloItem === null && e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, soloItem, close, next, prev]);

  const active: FeedItem | null = soloItem ?? (activeIdx !== null ? visibleItems[activeIdx] ?? null : null);
  const lbIndex = soloItem ? 0 : (activeIdx ?? 0);
  const lbTotal = soloItem ? 1 : visibleItems.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All pages
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
            <Link to="/about-and-skills" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
            <Link to="/feed" className="text-primary">Feed</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="relative px-5 sm:px-6 md:px-10 pt-10 sm:pt-14 pb-6 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[820px] h-[520px] rounded-full blur-[140px] opacity-50"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
          }}
        />
        <div className="relative max-w-[1100px] mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-[11px] font-bold uppercase tracking-[0.25em] text-primary"
          >
            <Sparkles className="w-3.5 h-3.5" /> Feed · Latest uploads
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-black tracking-tight leading-[1.02] mt-5"
            style={{ fontSize: "clamp(34px, 6.4vw, 78px)" }}
          >
            Everything,{" "}
            <span className="font-serif-display italic font-medium text-primary">in one stream</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-muted-foreground mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            A curated stream of recent work — newest first, synced live with the portfolio.
          </motion.p>
        </div>
      </section>

      {/* Featured strip */}
      {!isLoading && !isError && featured.length > 0 && (
        <FeaturedStrip
          items={featured}
          onOpen={(item) => {
            const i = visibleItems.findIndex((x) => x.id === item.id);
            if (i >= 0) open(i);
            else openSolo(item);
          }}
        />
      )}

      {/* Toolbar */}
      {!isLoading && !isError && totalAll > 0 && (
        <FilterToolbar
          folders={folders}
          folderFilter={folderFilter}
          setFolderFilter={setFolderFilter}
          mediaFilter={mediaFilter}
          setMediaFilter={setMediaFilter}
          featuredOnly={featuredOnly}
          setFeaturedOnly={setFeaturedOnly}
          sort={sort}
          setSort={setSort}
          totalCount={totalAll}
          filteredCount={filteredTotal}
        />
      )}

      <section className="px-5 sm:px-6 md:px-10 pb-16">
        <div className="max-w-[1240px] mx-auto">
          {isLoading ? (
            <FeedSkeleton />
          ) : isError ? (
            <ErrorState
              onRetry={() => sliceQuery.refetch()}
              isRetrying={sliceQuery.isFetching}
              message={initialErrorMessage}
            />
          ) : totalAll === 0 ? (
            <EmptyState
              title="No uploads yet"
              hint={`Add items inside any portfolio folder and they'll appear here automatically.`}
            />
          ) : filteredTotal === 0 ? (
            <EmptyState
              title="No matches for this filter"
              hint="Try changing the folder, media-type, or featured filter above."
            />
          ) : (
            <>
              <MasonryGrid items={visibleItems} onOpen={open} />
              {nextPageErrorMessage ? (
                <div className="flex flex-col items-center gap-3 mt-10">
                  <p className="text-xs text-destructive font-medium text-center max-w-sm">
                    Couldn't load more items. {nextPageErrorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => sliceQuery.fetchNextPage()}
                    disabled={sliceQuery.isFetchingNextPage}
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-destructive/40 bg-destructive/5 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 text-xs font-bold uppercase tracking-[0.22em] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sliceQuery.isFetchingNextPage ? "Retrying…" : "Retry"}
                  </button>
                </div>
              ) : canLoadMore ? (
                <div className="flex justify-center mt-10">
                  <button
                    type="button"
                    onClick={() => sliceQuery.fetchNextPage()}
                    disabled={sliceQuery.isFetchingNextPage}
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-card hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-xs font-bold uppercase tracking-[0.22em] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sliceQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                    <span className="text-[10px] opacity-60 group-hover:opacity-100">
                      {Math.max(0, filteredTotal - visibleItems.length)} remaining
                    </span>
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <AnimatePresence>
        {active && (
          <Lightbox
            item={active}
            index={lbIndex}
            total={lbTotal}
            onClose={close}
            onNext={next}
            onPrev={prev}
            neighbors={
              soloItem
                ? []
                : [
                    visibleItems[(lbIndex + 1) % visibleItems.length],
                    visibleItems[(lbIndex - 1 + visibleItems.length) % visibleItems.length],
                  ].filter(Boolean) as FeedItem[]
            }
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function FilterToolbar({
  folders,
  folderFilter,
  setFolderFilter,
  mediaFilter,
  setMediaFilter,
  featuredOnly,
  setFeaturedOnly,
  sort,
  setSort,
  totalCount,
  filteredCount,
}: {
  folders: { slug: string; name: string }[];
  folderFilter: string;
  setFolderFilter: (v: string) => void;
  mediaFilter: MediaFilter;
  setMediaFilter: (v: MediaFilter) => void;
  featuredOnly: boolean;
  setFeaturedOnly: (v: boolean) => void;
  sort: "newest" | "featured-first";
  setSort: (v: "newest" | "featured-first") => void;
  totalCount: number;
  filteredCount: number;
}) {
  return (
    <section className="px-5 sm:px-6 md:px-10 pb-6">
      <div className="max-w-[1240px] mx-auto">
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
          {/* Media-type segmented control */}
          <div className="flex items-center gap-1 p-1 rounded-full border border-border bg-background/50 self-start">
            <SegBtn active={mediaFilter === "all"} onClick={() => setMediaFilter("all")} icon={LayoutGrid} label="All" />
            <SegBtn active={mediaFilter === "image"} onClick={() => setMediaFilter("image")} icon={ImagePlay} label="Images" />
            <SegBtn active={mediaFilter === "video"} onClick={() => setMediaFilter("video")} icon={Film} label="Videos" />
          </div>

          {/* Folder chips */}
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1 -mb-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Chip active={folderFilter === "all"} onClick={() => setFolderFilter("all")}>All folders</Chip>
            {folders.map((f) => (
              <Chip key={f.slug} active={folderFilter === f.slug} onClick={() => setFolderFilter(f.slug)}>
                {f.name}
              </Chip>
            ))}
          </div>

          {/* Sort dropdown */}
          <label className="shrink-0 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="hidden sm:inline">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "featured-first")}
              aria-label="Sort feed"
              className="appearance-none pl-3 pr-7 py-1.5 rounded-full border border-border bg-background/60 text-foreground text-[11px] font-bold uppercase tracking-[0.2em] hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors bg-no-repeat bg-[right_0.6rem_center] bg-[length:0.65rem]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
              }}
            >
              <option value="newest">Newest</option>
              <option value="featured-first">Featured first</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => setFeaturedOnly(!featuredOnly)}
            aria-pressed={featuredOnly}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
              featuredOnly
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${featuredOnly ? "fill-current" : ""}`} />
            Featured
          </button>

          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground shrink-0">
            {filteredCount === totalCount ? `${totalCount} items` : `${filteredCount} of ${totalCount}`}
          </div>
        </div>
      </div>
    </section>
  );
}

function SegBtn({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
      aria-pressed={active}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Featured strip
// ---------------------------------------------------------------------------

function FeaturedStrip({
  items, onOpen,
}: { items: FeedItem[]; onOpen: (it: FeedItem) => void }) {
  return (
    <section className="px-5 sm:px-6 md:px-10 pb-6">
      <div className="max-w-[1240px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-3.5 h-3.5 text-primary fill-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Featured</span>
          <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-5 sm:-mx-6 md:-mx-10 px-5 sm:px-6 md:px-10 snap-x snap-mandatory scrollbar-thin">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onOpen(it)}
              className="group relative shrink-0 w-[260px] sm:w-[300px] aspect-[4/5] rounded-2xl overflow-hidden border border-border hover:border-primary/60 bg-card snap-start text-left transition-colors"
              aria-label={`Open featured: ${it.title}`}
            >
              <LazyMedia item={it} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.22em]">
                <Star className="w-3 h-3 fill-current" /> Featured
              </div>
              {it.media_kind === "video" && (
                <div className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-primary/40 text-primary">
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/70 mb-1 truncate">
                  {it.folder_name}
                </div>
                <h3 className="font-serif-display text-lg leading-snug font-light line-clamp-2">{it.title}</h3>
              </div>
              <Watermark text={it.watermark_text ?? null} size="sm" cornerBadge />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Empty / error / skeleton states
// ---------------------------------------------------------------------------

function FeedSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="mb-4 break-inside-avoid rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div
            className="bg-gradient-to-br from-muted via-muted/60 to-muted animate-pulse"
            style={{ height: 180 + ((i * 53) % 220) }}
          />
          <div className="p-4 space-y-2">
            <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-2.5 w-1/2 bg-muted/60 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  onRetry,
  isRetrying = false,
  message,
}: {
  onRetry?: () => void;
  isRetrying?: boolean;
  message?: string;
}) {
  return (
    <div className="text-center py-24 max-w-md mx-auto">
      <div className="mx-auto h-16 w-16 rounded-full border border-destructive/30 bg-destructive/5 grid place-items-center mb-5">
        <ImageIcon className="w-7 h-7 text-destructive/60" strokeWidth={1.2} />
      </div>
      <p className="text-base font-bold tracking-tight">Couldn't load the feed</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        {message
          ? message
          : "The content service may be temporarily offline. Try again, or refresh the page if the problem persists."}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-[11px] font-bold uppercase tracking-[0.22em] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRetrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="text-center py-24 max-w-md mx-auto border border-dashed border-border rounded-2xl px-6">
      <div className="mx-auto h-16 w-16 rounded-full border border-border bg-muted/30 grid place-items-center mb-5">
        <Sparkles className="w-7 h-7 text-muted-foreground" strokeWidth={1.2} />
      </div>
      <p className="text-base font-bold tracking-tight">{title}</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{hint}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lazy media — IntersectionObserver wrapper
// ---------------------------------------------------------------------------

function LazyMedia({
  item, className, eager = false,
}: { item: FeedItem; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className ? "" : "w-full h-full"}>
      {visible ? (
        item.media_kind === "video" && item.image_url ? (
          <video
            src={item.image_url}
            muted
            playsInline
            preload="metadata"
            className={className ?? "w-full h-auto block"}
          />
        ) : item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            // @ts-expect-error — fetchpriority is a valid HTML attribute, React types lag.
            fetchpriority={eager ? "high" : "low"}
            className={className ?? "w-full h-auto block"}
          />
        ) : (
          <div className="w-full aspect-square grid place-items-center bg-muted">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )
      ) : (
        <div className={className ?? "w-full aspect-square bg-muted/40 animate-pulse"} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ViewportRender — defer rendering of off-screen card chrome
//
// Beyond lazy media, this skips rendering the entire children subtree until
// the placeholder is near the viewport. Combined with `content-visibility:
// auto`, the browser also skips style/layout/paint for cards far below the
// fold, dramatically lowering DOM work for long feeds before pagination
// virtualization lands.
// ---------------------------------------------------------------------------

function ViewportRender({
  children,
  eager = false,
  estimatedMinHeight = 360,
  rootMargin = "600px 0px",
  className,
}: {
  children: React.ReactNode;
  eager?: boolean;
  estimatedMinHeight?: number;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rendered, setRendered] = useState(eager);

  useEffect(() => {
    if (rendered) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRendered(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRendered(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rendered, rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={
        rendered
          ? undefined
          : {
              minHeight: estimatedMinHeight,
              // Skip style/layout/paint while offscreen.
              contentVisibility: "auto",
              containIntrinsicSize: `${estimatedMinHeight}px`,
            } as React.CSSProperties
      }
    >
      {rendered ? children : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid + Card
// ---------------------------------------------------------------------------

const EAGER_CARD_COUNT = 4;

function MasonryGrid({ items, onOpen }: { items: FeedItem[]; onOpen: (i: number) => void }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
      {items.map((it, i) => (
        <ViewportRender
          key={it.id}
          eager={i < EAGER_CARD_COUNT}
          className="mb-4 break-inside-avoid"
          estimatedMinHeight={420}
        >
          <FeedCard item={it} index={i} onOpen={() => onOpen(i)} eager={i < EAGER_CARD_COUNT} />
        </ViewportRender>
      ))}
    </div>
  );
}

function FeedCard({
  item, index, onOpen, eager = false,
}: { item: FeedItem; index: number; onOpen: () => void; eager?: boolean }) {
  const caption = item.feed_caption ?? item.description ?? "";
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index, 12) * 0.03, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-border hover:border-primary/45 bg-card transition-colors duration-500"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${item.title}`}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 rounded-t-2xl"
      >
        <div className="relative w-full overflow-hidden bg-muted">
          <LazyMedia
            item={item}
            eager={eager}
            className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {item.media_kind === "video" && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-primary/40 text-primary shadow-lg">
                <Play className="w-5 h-5 ml-0.5" />
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/75 backdrop-blur-md border border-primary/30 text-primary z-10">
            <Folder className="h-3 w-3" strokeWidth={1.6} />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] truncate max-w-[140px]">
              {item.folder_name}
            </span>
          </div>

          {item.featured && (
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.22em] z-10">
              <Star className="w-3 h-3 fill-current" />
            </div>
          )}

          <Watermark text={item.watermark_text ?? null} size="sm" cornerBadge />
        </div>
      </button>

      <div className="px-4 py-3 border-t border-border">
        <h3 className="text-sm font-bold tracking-tight truncate">{item.title}</h3>
        {caption && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{caption}</p>
        )}
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {item.date ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> {formatDate(item.date)}
            </span>
          ) : (
            <span />
          )}
          {item.tags.length > 0 && (
            <span className="truncate">{item.tags.slice(0, 2).join(" · ")}</span>
          )}
        </div>
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <ReactionsBar itemId={item.id} variant="light" />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Lightbox — accessible: focus trap, focus restoration, keyboard nav,
// roledescription="carousel", high-DPI image rendering, "Back" close button,
// neighbor preloading for snappy nav.
// ---------------------------------------------------------------------------

function Lightbox({
  item, index, total, onClose, onNext, onPrev, neighbors = [],
}: {
  item: FeedItem;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  neighbors?: FeedItem[];
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Auto-focus the close ("Back") button on open so keyboard users land here.
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Simple focus trap: cycle Tab within the dialog's focusable elements.
  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, video, [contenteditable="true"]',
      );
      const list = Array.from(focusables).filter((el) => !el.hasAttribute("inert") && el.offsetParent !== null);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };
    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, []);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (total > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onNext();
      else onPrev();
    } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    }
  };

  const caption = item.feed_caption ?? item.description ?? "";

  return (
    <motion.div
      ref={dialogRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-roledescription={total > 1 ? "carousel" : undefined}
      aria-label={`Media viewer: ${item.title}${total > 1 ? `, item ${index + 1} of ${total}` : ""}`}
    >
      {/* Preload immediate neighbors so prev/next feels instant on slow links. */}
      {neighbors.map((n) =>
        n.image_url && n.media_kind === "image" ? (
          <link key={n.id} rel="preload" as="image" href={n.image_url} />
        ) : null,
      )}

      <div
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono uppercase tracking-[0.22em]">
            <Folder className="w-3 h-3" /> {item.folder_name}
          </span>
          {item.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.22em]">
              <Star className="w-3 h-3 fill-current" /> Featured
            </span>
          )}
          <span
            className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/60"
            aria-live="polite"
            aria-atomic="true"
          >
            {index + 1} / {total}
          </span>
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 h-10 pl-3 pr-4 rounded-full border border-white/20 hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-colors"
          aria-label="Back to feed (Escape)"
          autoFocus
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] hidden sm:inline">Back</span>
          <X className="h-4 w-4 sm:hidden" aria-hidden="true" />
        </button>
      </div>

      <div
        className="relative flex-1 flex items-center justify-center px-2 sm:px-12 py-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {total > 1 && (
          <button
            type="button"
            onClick={onPrev}
            aria-label={`Previous item (${((index - 1 + total) % total) + 1} of ${total})`}
            aria-keyshortcuts="ArrowLeft"
            className="hidden sm:inline-flex absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-full max-h-full flex items-center justify-center"
            role="group"
            aria-roledescription={total > 1 ? "slide" : undefined}
            aria-label={total > 1 ? `${index + 1} of ${total}` : undefined}
          >
            {item.media_kind === "video" && item.image_url ? (
              <div className="relative">
                <video
                  src={item.image_url}
                  controls
                  autoPlay
                  playsInline
                  controlsList="nodownload"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-w-[92vw] max-h-[72vh] rounded-xl border border-white/10 bg-black"
                />
                <Watermark text={item.watermark_text ?? null} size="md" cornerBadge />
              </div>
            ) : item.image_url ? (
              <div className="relative">
                {/*
                  High-DPI rendering: request the image at native resolution and
                  let the browser scale down. fetchPriority=high + decoding=sync
                  + a same-URL srcSet at 1x/2x signals retina/HiDPI displays to
                  prefer the full-resolution asset, while CSS object-contain
                  keeps it crisp without upscaling beyond the source.
                */}
                <img
                  src={item.image_url}
                  srcSet={`${item.image_url} 1x, ${item.image_url} 2x`}
                  alt={item.title}
                  draggable={false}
                  loading="eager"
                  decoding="sync"
                  // @ts-expect-error — valid HTML attr, types lag in React 19
                  fetchpriority="high"
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-w-[92vw] max-h-[82vh] object-contain rounded-xl select-none [image-rendering:auto]"
                  style={{ imageRendering: "auto" }}
                />
                <Watermark text={item.watermark_text ?? null} size="md" cornerBadge />
              </div>
            ) : (
              <div className="text-white/60 text-sm">No media</div>
            )}
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <button
            type="button"
            onClick={onNext}
            aria-label={`Next item (${(index + 1) % total + 1} of ${total})`}
            aria-keyshortcuts="ArrowRight"
            className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-colors"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        className="px-4 sm:px-6 py-4 border-t border-white/10 text-white max-h-[42vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif-display text-xl sm:text-2xl tracking-tight font-light truncate">
            {item.title}
          </h2>
          {caption && (
            <p className="text-sm text-white/70 mt-2 leading-relaxed whitespace-pre-line">
              {caption}
            </p>
          )}
          <div className="mt-3 flex items-center flex-wrap gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/60">
            {item.date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> {formatDate(item.date)}
              </span>
            )}
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              onClick={onClose}
            >
              <Folder className="w-3 h-3" /> {item.folder_name}
            </Link>
            {item.external_url && (
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Open link
              </a>
            )}
            {total > 1 && (
              <div className="ml-auto flex items-center gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Previous"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Next"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <ReactionsBar itemId={item.id} variant="dark" />
          </div>

          <div className="mt-6 pt-5 border-t border-white/10">
            <CommentThread itemId={item.id} variant="dark" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
