import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Folder, FolderOpen, X, ExternalLink, Sparkles, Image as ImageIcon, ChevronRight, Home } from "lucide-react";
import { useContentDoc } from "@/hooks/useContentDoc";
import { Footer } from "@/components/Footer";
import { PageQuote } from "@/components/PageQuote";
import { Hero3DText } from "@/components/Hero3DText";
import { Watermark } from "@/components/feed/Watermark";

type PortfolioDoc = (PFolder & { items: PItem[] })[];

type PFolder = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  sort_order: number;
  parent_id?: string | null;
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
  watermark_text?: string | null;
};

export function PortfolioPage() {
  const { data: portfolioDoc, isLoading: foldersLoading } = useContentDoc<PortfolioDoc>("portfolio");
  const allFolders: PFolder[] = (portfolioDoc ?? []).map(({ items: _items, ...f }) => f);

  // Only top-level folders show on the landing grid; subfolders are revealed
  // when the user opens their parent.
  const rootFolders = useMemo(
    () => allFolders.filter((f) => !f.parent_id),
    [allFolders],
  );

  // Folder navigation stack — each entry is one level deep. The last entry is
  // the currently open folder. Empty stack = closed viewer.
  const [folderStack, setFolderStack] = useState<PFolder[]>([]);
  const [previewItem, setPreviewItem] = useState<PItem | null>(null);

  const openFolder = (f: PFolder) => setFolderStack([f]);
  const drillInto = (f: PFolder) => setFolderStack((s) => [...s, f]);
  const goBack = () => setFolderStack((s) => s.slice(0, -1));
  const jumpTo = (i: number) => setFolderStack((s) => s.slice(0, i + 1));
  const closeViewer = () => setFolderStack([]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3 md:gap-4">
          <Link
            to="/"
            className="shrink-0 inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All pages
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] overflow-x-auto whitespace-nowrap min-w-0 -mx-2 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link to="/about-and-skills" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/portfolio" className="shrink-0 text-primary">Portfolio</Link>
            <Link to="/projects" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
            <Link to="/contact" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
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
            <Sparkles className="w-3.5 h-3.5" /> Portfolio · Folder library
          </motion.span>
          <h1
            className="font-black tracking-tight leading-[1.02] mt-5 text-3d text-3d-pop"
            style={{ fontSize: "clamp(34px, 6.4vw, 78px)" }}
          >
            <Hero3DText as="span" text="Open a " delay={0.1} stagger={0.08} />
            <Hero3DText
              as="span"
              text="folder"
              className="font-serif-display italic font-medium text-primary"
              delay={0.3}
              stagger={0.08}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-muted-foreground mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Each folder groups related design work — logos, posters, packaging and more. Tap a folder to peek inside.
          </motion.p>
        </div>
      </section>

      <section className="px-5 sm:px-6 md:px-10 pb-14 sm:pb-20">
        <div className="max-w-[1240px] mx-auto">
          {foldersLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl border border-border skeleton-shimmer" />
              ))}
            </div>
          ) : rootFolders.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              No folders yet — add some from <code>/admin/portfolio</code>.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rootFolders.map((f, i) => (
                <FolderCard key={f.id} folder={f} index={i} onOpen={() => openFolder(f)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {folderStack.length > 0 && (
          <FolderViewer
            stack={folderStack}
            allFolders={allFolders}
            portfolioDoc={portfolioDoc ?? []}
            onClose={closeViewer}
            onBack={goBack}
            onJump={jumpTo}
            onDrillInto={drillInto}
            onPreview={setPreviewItem}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewItem && <ItemPreview item={previewItem} onClose={() => setPreviewItem(null)} />}
      </AnimatePresence>

      <PageQuote slug="portfolio" />
      <Footer />
    </div>
  );
}

function FolderCard({ folder, index, onOpen }: { folder: PFolder; index: number; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="group relative block w-full text-left overflow-hidden rounded-2xl border border-border hover:border-primary/45 transition-colors duration-500 bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
      aria-label={`Open folder ${folder.name}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted via-card to-background">
        {folder.cover_url ? (
          <img
            src={folder.cover_url}
            alt={folder.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Folder className="h-20 w-20 text-primary/25 transition-all duration-500 group-hover:text-primary/45 group-hover:scale-110" strokeWidth={0.9} />
            <span className="absolute font-serif-display italic font-light text-7xl text-primary/10 select-none">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        )}
        <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur-md border border-primary/30 text-primary">
          <Folder className="h-3 w-3" strokeWidth={1.6} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Folder</span>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-3 border-t border-border">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight truncate">{folder.name}</h3>
          {folder.description && (
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mt-0.5 truncate">
              {folder.description}
            </p>
          )}
        </div>
        <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/35 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors duration-300">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.button>
  );
}

function FolderViewer({
  stack,
  allFolders,
  portfolioDoc,
  onClose,
  onBack,
  onJump,
  onDrillInto,
  onPreview,
}: {
  stack: PFolder[];
  allFolders: PFolder[];
  portfolioDoc: PortfolioDoc;
  onClose: () => void;
  onBack: () => void;
  onJump: (i: number) => void;
  onDrillInto: (f: PFolder) => void;
  onPreview: (item: PItem) => void;
}) {
  const folder = stack[stack.length - 1];
  const subfolders = allFolders.filter((f) => f.parent_id === folder.id);
  const items: PItem[] = (
    portfolioDoc.find((f) => f.id === folder.id)?.items ?? []
  ).map((r) => ({ ...r, tags: Array.isArray(r.tags) ? r.tags : [] }));

  const isEmpty = subfolders.length === 0 && items.length === 0;
  const canGoBack = stack.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md overflow-auto"
      onClick={onClose}
    >
      <motion.div
        aria-hidden
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1.4, opacity: 0.35 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[160px]"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 70%, transparent), transparent)",
        }}
      />

      <motion.div
        key={folder.id}
        initial={{ y: 30, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-5xl mx-auto my-6 sm:my-12 mx-4 sm:mx-auto bg-card border border-primary/30 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 p-5 sm:p-7 border-b border-border">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {canGoBack && (
              <button
                onClick={onBack}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-[11px] font-bold uppercase tracking-[0.2em]"
                aria-label="Back to parent folder"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary shrink-0">
              <FolderOpen className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Folder</p>
              <h3 className="font-serif-display text-2xl sm:text-3xl tracking-tight font-light truncate">{folder.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-10 w-10 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-300 inline-flex items-center justify-center"
            aria-label="Close folder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 flex-wrap px-5 sm:px-7 py-3 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-[0.18em]">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-3 w-3" /> Portfolio
          </button>
          {stack.map((f, i) => (
            <span key={f.id} className="inline-flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              {i === stack.length - 1 ? (
                <span className="text-primary font-bold truncate max-w-[160px]">{f.name}</span>
              ) : (
                <button
                  onClick={() => onJump(i)}
                  className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[160px]"
                >
                  {f.name}
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="p-5 sm:p-7 max-h-[70vh] overflow-y-auto space-y-6">
          {isEmpty ? (
            <div className="text-center py-16">
              <Folder className="w-14 h-14 mx-auto text-primary/30 mb-4" strokeWidth={0.9} />
              <p className="text-base font-bold tracking-tight">No Data, will be uploaded soon</p>
              <p className="text-xs text-muted-foreground mt-2">
                This folder is empty for now — check back shortly.
              </p>
            </div>
          ) : (
            <>
              {subfolders.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
                    Subfolders · {subfolders.length}
                  </h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subfolders.map((sf, i) => (
                      <FolderCard key={sf.id} folder={sf} index={i} onOpen={() => onDrillInto(sf)} />
                    ))}
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div>
                  {subfolders.length > 0 && (
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
                      Items · {items.length}
                    </h4>
                  )}
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {items.map((it) => (
                      <motion.button
                        key={it.id}
                        type="button"
                        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -4 }}
                        onClick={() => onPreview(it)}
                        className="group relative text-left overflow-hidden rounded-xl border border-border bg-background hover:border-primary/45 transition-colors"
                        aria-label={`Preview ${it.title}`}
                      >
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          {it.image_url ? (
                            <>
                              <img
                                src={it.image_url}
                                alt={it.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <Watermark text={it.watermark_text ?? undefined} size="sm" />
                            </>
                          ) : (
                            <div className="w-full h-full grid place-items-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-bold tracking-tight truncate">{it.title}</h4>
                          {it.tags.length > 0 && (
                            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mt-1 truncate">
                              {it.tags.slice(0, 3).join(" · ")}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ItemPreview({ item, onClose }: { item: PItem; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-start sm:items-center justify-center p-4 sm:p-8 overflow-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 18, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl bg-card border border-primary/30 rounded-2xl my-4 text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-border">
          <h3 className="font-serif-display text-xl sm:text-2xl tracking-tight font-light truncate">{item.title}</h3>
          <button
            onClick={onClose}
            className="shrink-0 h-9 w-9 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors inline-flex items-center justify-center"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto space-y-5">
          {item.image_url && (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={item.image_url} alt={item.title} loading="lazy" decoding="async" className="w-full h-auto" />
              <Watermark text={item.watermark_text ?? undefined} size="md" />
            </div>
          )}
          {item.description && (
            <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          )}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-background/40">{t}</span>
              ))}
            </div>
          )}
          {item.external_url && (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" /> Open link
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
