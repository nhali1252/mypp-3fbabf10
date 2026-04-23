import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Eye, Folder, FolderOpen, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FProject = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  url: string | null;
  tags: string[] | null;
  sort_order: number;
  active: boolean;
};

export function PortfolioPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["public-f-projects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("f_projects")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FProject[];
    },
  });

  const [active, setActive] = useState<FProject | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative px-5 sm:px-6 md:px-10 pt-10 sm:pt-14 md:pt-20 pb-6 sm:pb-10 overflow-hidden">
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
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-[11px] font-bold uppercase tracking-[0.25em] text-primary"
          >
            <Folder className="w-3.5 h-3.5" /> Portfolio · Design & client work
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05 }}
            className="font-black tracking-tight leading-[1.02] mt-5"
            style={{ fontSize: "clamp(34px, 6.4vw, 78px)" }}
          >
            Selected{" "}
            <span className="font-serif-display italic font-medium text-primary">design work</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-muted-foreground mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Branding, posters, packaging, invitations and digital design — open any folder to peek inside the project.
          </motion.p>
        </div>
      </section>

      <section className="px-5 sm:px-6 md:px-10 pb-14 sm:pb-20">
        <div className="max-w-[1240px] mx-auto">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              No portfolio items yet — add some from the admin /F page.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((p, i) => (
                <FolderCard key={p.id} project={p} index={i} onPreview={() => setActive(p)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {active && <ProjectModal project={active} onClose={() => setActive(null)} />}
      </AnimatePresence>

      <footer className="px-5 sm:px-6 md:px-10 py-8 sm:py-10 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Ali Nur Hasan · TasTaj ·{" "}
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
      </footer>
    </div>
  );
}

function FolderCard({
  project,
  index,
  onPreview,
}: {
  project: FProject;
  index: number;
  onPreview: () => void;
}) {
  const cover = project.image_url;
  const tags = Array.isArray(project.tags) ? project.tags : [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.05 }}
      className="group relative block w-full overflow-hidden rounded-2xl border border-border hover:border-primary/45 transition-all duration-500 hover:-translate-y-1 bg-card"
    >
      <button type="button" onClick={onPreview} aria-label={`Open ${project.title}`} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted via-card to-background">
          {cover ? (
            <img
              src={cover}
              alt={project.title}
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

          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, color-mix(in oklab, var(--background) 96%, transparent) 0%, color-mix(in oklab, var(--background) 35%, transparent) 60%, transparent 100%)",
            }}
          >
            <h3 className="font-serif-display text-2xl tracking-tight font-light">{project.title}</h3>
            {project.description && (
              <p className="mt-1.5 text-sm text-foreground/70 line-clamp-2">{project.description}</p>
            )}
            <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-primary">
              Open folder <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.6} />
            </span>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-3 border-t border-border">
          <div className="min-w-0">
            <h3 className="text-base font-bold tracking-tight truncate">{project.title}</h3>
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground mt-0.5 truncate">
              {tags[0] || "View folder"}
            </p>
          </div>
          <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/35 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors duration-300">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPreview(); }}
        aria-label={`Quick preview ${project.title}`}
        className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-background/70 backdrop-blur-md border border-primary/30 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary text-[10px] font-mono uppercase tracking-[0.22em]"
      >
        <Eye className="h-3 w-3" strokeWidth={1.8} />
        Preview
      </button>
    </motion.div>
  );
}

function ProjectModal({ project, onClose }: { project: FProject; onClose: () => void }) {
  const tags = Array.isArray(project.tags) ? project.tags : [];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-4 sm:p-8 overflow-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl bg-card border border-primary/30 rounded-2xl my-4 text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 p-6 sm:p-7 border-b border-border">
          <div className="flex items-center gap-4 min-w-0">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary shrink-0">
              <FolderOpen className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Folder</p>
              <h3 className="font-serif-display text-2xl sm:text-3xl tracking-tight font-light truncate">{project.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 h-10 w-10 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-300 inline-flex items-center justify-center" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 sm:p-7 max-h-[70vh] overflow-y-auto space-y-6">
          {project.image_url && (
            <div className="rounded-xl overflow-hidden border border-border">
              <img src={project.image_url} alt={project.title} className="w-full h-auto" />
            </div>
          )}
          {project.description && (
            <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          )}
          {tags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-background/40">{t}</span>
                ))}
              </div>
            </div>
          )}
          {project.url && (
            <div className="pt-2">
              <a href={project.url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity shadow-glow">
                <ExternalLink className="w-4 h-4" /> Visit
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
