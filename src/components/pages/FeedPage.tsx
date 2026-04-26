import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Play, Sparkles, Image as ImageIcon, ExternalLink, Calendar, Folder } from "lucide-react";
import { useR2Content } from "@/hooks/useR2Content";
import { Footer } from "@/components/Footer";

type PortfolioDoc = (PFolder & { items: PItem[] })[];

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
  // Optional future fields (forward-compat, ignored if missing):
  show_in_feed?: boolean;
  feed_caption?: string | null;
  published_at?: string | null;
  watermark_text?: string | null;
};

type FeedItem = PItem & {
  folder_name: string;
  folder_slug: string;
  media_kind: "image" | "video";
  date: string | null;
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function detectKind(url: string | null | undefined): "image" | "video" {
  if (!url) return "image";
  return VIDEO_EXT.test(url) ? "video" : "image";
}

function flattenFeed(doc: PortfolioDoc | null | undefined): FeedItem[] {
  if (!doc) return [];
  const out: FeedItem[] = [];
  for (const f of doc) {
    for (const it of f.items ?? []) {
      // Honor show_in_feed when present; default true for backward-compat.
      if (it.show_in_feed === false) continue;
      if (!it.image_url) continue;
      out.push({
        ...it,
        tags: Array.isArray(it.tags) ? it.tags : [],
        folder_name: f.name,
        folder_slug: f.slug,
        media_kind: detectKind(it.image_url),
        date: it.published_at ?? it.updated_at ?? it.created_at ?? null,
      });
    }
  }
  // Newest first; missing date sinks to the bottom.
  out.sort((a, b) => {
    const ta = a.date ? Date.parse(a.date) : 0;
    const tb = b.date ? Date.parse(b.date) : 0;
    return tb - ta;
  });
  return out;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function FeedPage() {
  const { data, isLoading, isError } = useR2Content<PortfolioDoc>("portfolio", { staleTime: 5_000 });
  const items = useMemo(() => flattenFeed(data ?? null), [data]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const open = useCallback((i: number) => setActiveIdx(i), []);
  const close = useCallback(() => setActiveIdx(null), []);
  const next = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length],
  );
  const prev = useCallback(
    () => setActiveIdx((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length],
  );

  // Keyboard nav.
  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while viewer open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeIdx, close, next, prev]);

  const active = activeIdx !== null ? items[activeIdx] ?? null : null;

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
            A live social-style feed of every image and video uploaded across all portfolio folders.
            Newest first — synced automatically with the portfolio CMS.
          </motion.p>
        </div>
      </section>

      <section className="px-5 sm:px-6 md:px-10 pb-16">
        <div className="max-w-[1240px] mx-auto">
          {isLoading ? (
            <FeedSkeleton />
          ) : isError ? (
            <div className="text-center py-20">
              <ImageIcon className="w-14 h-14 mx-auto text-destructive/40 mb-4" strokeWidth={0.9} />
              <p className="text-base font-bold tracking-tight">Couldn't load the feed</p>
              <p className="text-xs text-muted-foreground mt-2">Please refresh the page to try again.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              No uploads yet — add items inside any folder at <code>/admin/portfolio</code> and they'll appear here automatically.
            </div>
          ) : (
            <MasonryGrid items={items} onOpen={open} />
          )}
        </div>
      </section>

      <AnimatePresence>
        {active && activeIdx !== null && (
          <Lightbox
            item={active}
            index={activeIdx}
            total={items.length}
            onClose={close}
            onNext={next}
            onPrev={prev}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="mb-4 break-inside-avoid rounded-2xl border border-border bg-card animate-pulse"
          style={{ height: 180 + ((i * 53) % 220) }}
        />
      ))}
    </div>
  );
}

function MasonryGrid({ items, onOpen }: { items: FeedItem[]; onOpen: (i: number) => void }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
      {items.map((it, i) => (
        <FeedCard key={it.id} item={it} index={i} onOpen={() => onOpen(i)} />
      ))}
    </div>
  );
}

function FeedCard({ item, index, onOpen }: { item: FeedItem; index: number; onOpen: () => void }) {
  const caption = item.feed_caption ?? item.description ?? "";
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index, 12) * 0.03, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group mb-4 break-inside-avoid block w-full text-left overflow-hidden rounded-2xl border border-border hover:border-primary/45 bg-card transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
      aria-label={`Open ${item.title}`}
    >
      <div className="relative w-full overflow-hidden bg-muted">
        {item.media_kind === "video" && item.image_url ? (
          <video
            src={item.image_url}
            muted
            playsInline
            preload="metadata"
            className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            loading="lazy"
            className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full aspect-square grid place-items-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {item.media_kind === "video" && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-primary/40 text-primary shadow-lg">
              <Play className="w-5 h-5 ml-0.5" />
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/75 backdrop-blur-md border border-primary/30 text-primary">
          <Folder className="h-3 w-3" strokeWidth={1.6} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] truncate max-w-[140px]">
            {item.folder_name}
          </span>
        </div>
      </div>

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
      </div>
    </motion.button>
  );
}

function Lightbox({
  item,
  index,
  total,
  onClose,
  onNext,
  onPrev,
}: {
  item: FeedItem;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  // Touch-swipe support.
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
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onNext();
      else onPrev();
    } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    }
  };

  const caption = item.feed_caption ?? item.description ?? "";

  return (
    <motion.div
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
      aria-label={`Viewer: ${item.title}`}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono uppercase tracking-[0.22em]">
            <Folder className="w-3 h-3" /> {item.folder_name}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/60">
            {index + 1} / {total}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-10 w-10 rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors inline-flex items-center justify-center"
          aria-label="Close viewer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Media stage */}
      <div
        className="relative flex-1 flex items-center justify-center px-2 sm:px-12 py-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev */}
        {total > 1 && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous"
            className="hidden sm:inline-flex absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
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
          >
            {item.media_kind === "video" && item.image_url ? (
              <video
                src={item.image_url}
                controls
                autoPlay
                playsInline
                className="max-w-[92vw] max-h-[72vh] rounded-xl border border-white/10 bg-black"
              />
            ) : item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="max-w-[92vw] max-h-[72vh] object-contain rounded-xl"
              />
            ) : (
              <div className="text-white/60 text-sm">No media</div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next */}
        {total > 1 && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next"
            className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom meta */}
      <div
        className="px-4 sm:px-6 py-4 border-t border-white/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif-display text-xl sm:text-2xl tracking-tight font-light truncate">
            {item.title}
          </h2>
          {caption && (
            <p className="text-sm text-white/70 mt-2 leading-relaxed line-clamp-3 whitespace-pre-line">
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
            {/* Mobile prev/next */}
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
        </div>
      </div>
    </motion.div>
  );
}
