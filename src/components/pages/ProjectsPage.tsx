import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Code2, ExternalLink, Github, Star, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { PageQuote } from "@/components/PageQuote";
import { Hero3DText } from "@/components/Hero3DText";
import { toExternalUrl } from "@/lib/external-url";

type Project = {
  id: string;
  title: string;
  slug: string;
  category?: string | null;
  summary?: string | null;
  description?: string | null;
  image_url?: string | null;
  live_url?: string | null;
  github_url?: string | null;
  tools?: string[] | null;
  features?: string[] | null;
  featured?: boolean | null;
};

export function ProjectsPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["public-projects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative px-4 sm:px-6 md:px-10 lg:px-12 pt-8 sm:pt-14 md:pt-20 lg:pt-24 pb-6 sm:pb-10 lg:pb-14 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[min(820px,90vw)] h-[420px] sm:h-[520px] rounded-full blur-[120px] sm:blur-[140px] opacity-50"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
          }}
        />
        <div className="relative max-w-[1100px] xl:max-w-[1280px] mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.25em] text-primary"
          >
            <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Projects · Code & Builds
          </motion.span>
          <h1
            className="font-black tracking-tight leading-[1.02] mt-4 sm:mt-5 text-3d text-3d-pop"
            style={{ fontSize: "clamp(30px, 6.4vw, 84px)" }}
          >
            <Hero3DText as="span" text="Things I " delay={0.1} stagger={0.08} />
            <Hero3DText
              as="span"
              text="build"
              className="font-serif-display italic font-medium text-primary"
              delay={0.35}
              stagger={0.08}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-muted-foreground mt-4 sm:mt-5 max-w-2xl mx-auto text-[13.5px] sm:text-base leading-relaxed px-2 sm:px-0"
          >
            Personal apps, small tools and side projects — each card lists the stack, a live demo and the source code when available.
          </motion.p>
        </div>
      </section>

      {/* PROJECT LIST — long horizontal cards */}
      <section className="px-4 sm:px-6 md:px-10 lg:px-12 pb-12 sm:pb-20 lg:pb-24">
        <div className="max-w-[1100px] xl:max-w-[1280px] mx-auto">
          {isLoading ? (
            <div className="space-y-4 sm:space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 sm:h-44 lg:h-52 rounded-2xl border border-border skeleton-shimmer" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 sm:py-20 px-4 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              No projects published yet — add some from the admin panel.
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              {projects.map((p, i) => (
                <ProjectRow key={p.id} project={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <PageQuote slug="projects" />
      <Footer />
    </div>
  );
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const tools = Array.isArray(project.tools) ? project.tools : [];
  const features = Array.isArray(project.features) ? project.features : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative grid sm:grid-cols-[240px_1fr] md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] xl:grid-cols-[400px_1fr] gap-0 overflow-hidden rounded-2xl border border-border hover:border-primary/45 transition-colors duration-300 bg-card"
    >
      {/* Cover / numeric badge */}
      <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[200px] lg:min-h-[240px] overflow-hidden bg-gradient-to-br from-muted via-card to-background">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Code2 className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-primary/25" strokeWidth={0.9} />
            <span className="absolute font-serif-display italic font-light text-6xl sm:text-7xl lg:text-8xl text-primary/10 select-none">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        )}
        {project.featured && (
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-primary text-primary-foreground text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em]">
            <Star className="w-3 h-3" /> Featured
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 md:p-7 lg:p-8 flex flex-col gap-3.5 sm:gap-4">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            {project.category && (
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.3em] text-primary mb-1.5 sm:mb-2">
                {project.category}
              </p>
            )}
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-[26px] font-bold tracking-tight leading-tight">{project.title}</h3>
            {project.summary && (
              <p className="mt-2 text-[13px] sm:text-sm lg:text-[15px] text-muted-foreground leading-relaxed line-clamp-3">
                {project.summary}
              </p>
            )}
          </div>
          <span className="shrink-0 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-primary/35 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors duration-300">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {features.length > 0 && (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-1.5 pt-1">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px] sm:text-[12.5px] leading-snug text-foreground/85">
                <Check className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tools.map((t) => (
              <span
                key={t}
                className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.18em] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-border bg-background/40 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {(project.live_url || project.github_url) && (
          <div className="flex flex-wrap gap-2 sm:gap-2.5 pt-1">
            {project.live_url && (
              <a
                href={toExternalUrl(project.live_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary text-primary-foreground px-3.5 sm:px-4 py-1.5 sm:py-2 text-[11.5px] sm:text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Live demo
              </a>
            )}
            {project.github_url && (
              <a
                href={toExternalUrl(project.github_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-border px-3.5 sm:px-4 py-1.5 sm:py-2 text-[11.5px] sm:text-xs font-bold hover:border-primary hover:text-primary transition-colors"
              >
                <Github className="w-3.5 h-3.5" /> Source
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
