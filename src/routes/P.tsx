import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ExternalLink, Github, ArrowRight, FolderKanban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/P")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects — Ali Nur Hasan (TasTaj)" },
      { name: "description", content: "Selected work and projects by Ali Nur Hasan." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Projects — Ali Nur Hasan (TasTaj)" },
      { property: "og:description", content: "Selected work and projects." },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const accents = [
  "from-emerald-500/30 to-cyan-500/20",
  "from-amber-500/30 to-rose-500/20",
  "from-indigo-500/30 to-fuchsia-500/20",
  "from-sky-500/30 to-violet-500/20",
  "from-rose-500/30 to-orange-500/20",
];

function ProjectsPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["public-projects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors">
            ← All versions
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
            <Link to="/B" className="text-muted-foreground hover:text-foreground transition-colors">/B</Link>
            <Link to="/F" className="text-muted-foreground hover:text-foreground transition-colors">/F</Link>
            <Link to="/P" className="text-primary">/P</Link>
          </nav>
        </div>
      </header>

      <section className="px-5 sm:px-6 md:px-10 pt-8 sm:pt-10 md:pt-14 pb-4 sm:pb-6">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-3">Projects</p>
          <h1 className="font-black tracking-tight leading-[1.05] mb-3" style={{ fontSize: "clamp(30px, 5.4vw, 64px)" }}>
            Selected work
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            A curated set of projects reflecting design thinking, research and practical digital products.
          </p>
        </div>
      </section>

      <section className="px-5 sm:px-6 md:px-10 pb-14 sm:pb-16">
        <div className="max-w-[1200px] mx-auto grid gap-5 sm:gap-6 md:gap-8">
          {isLoading && (
            <div className="text-center py-20 text-sm text-muted-foreground">Loading projects…</div>
          )}
          {!isLoading && projects.length === 0 && (
            <div className="text-center py-20 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              No projects published yet.
            </div>
          )}
          {projects.map((p: any, i: number) => {
            const accent = accents[i % accents.length];
            const tools: string[] = Array.isArray(p.tools) ? p.tools : [];
            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
                className="group relative rounded-[20px] sm:rounded-[24px] border border-border bg-card overflow-hidden"
              >
                {p.image_url && (
                  <div className="relative aspect-[16/7] sm:aspect-[16/6] overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={`${p.title} banner`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div aria-hidden className={`absolute -bottom-24 -right-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-700 bg-gradient-to-br ${accent}`} />
                    <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-background/70 backdrop-blur-md text-primary grid place-items-center ring-1 ring-primary/30">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      {p.category && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md text-primary border border-primary/25">
                          {p.category}
                        </span>
                      )}
                      {p.featured && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative grid lg:grid-cols-[1fr_360px] gap-0">
                  <div className="p-6 sm:p-8 md:p-10">
                    <h2 className="font-black tracking-tight leading-tight mb-2 break-words" style={{ fontSize: "clamp(20px, 3.4vw, 34px)" }}>
                      {p.title}
                    </h2>
                    {p.summary && (
                      <p className="text-sm sm:text-base text-foreground/80 mb-4 italic">{p.summary}</p>
                    )}
                    {p.description && (
                      <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
                        {p.description}
                      </p>
                    )}

                    {tools.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {tools.map((t) => (
                          <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-background/40">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {(p.live_url || p.github_url) && (
                      <div className="flex flex-wrap gap-2.5">
                        {p.live_url && (
                          <a href={p.live_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)]">
                            <ExternalLink className="w-4 h-4" /> Visit live
                          </a>
                        )}
                        {p.github_url && (
                          <a href={p.github_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold hover:border-primary hover:text-primary transition-colors">
                            <Github className="w-4 h-4" /> GitHub
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {tools.length > 0 && (
                    <div className="border-t lg:border-t-0 lg:border-l border-border p-6 sm:p-8 md:p-10 bg-background/30">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                        Tools & Tech
                      </p>
                      <ul className="space-y-2.5">
                        {tools.map((t) => (
                          <li key={t} className="flex gap-2.5 text-sm">
                            <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                            <span className="text-foreground/85 leading-relaxed">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <footer className="px-5 sm:px-6 md:px-10 py-8 sm:py-10 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Ali Nur Hasan · TasTaj ·{" "}
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
      </footer>
    </div>
  );
}
