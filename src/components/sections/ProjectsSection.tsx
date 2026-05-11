import { useProjects } from "@/hooks/useContent";
import { SectionHeader } from "../SectionHeader";
import { ArrowUpRight } from "lucide-react";
import { Stagger, StaggerItem } from "../motion/Reveal";

interface Project {
  id: string;
  title: string;
  category?: string | null;
  summary?: string | null;
  image_url?: string | null;
  live_url?: string | null;
  tools?: string[] | null;
  featured?: boolean | null;
}

export function ProjectsSection() {
  const { data: projects = [] } = useProjects();

  return (
    <section id="portfolio" className="pt-14 sm:pt-20 md:pt-24">
      <SectionHeader label="Projects" title="Academic work." />
      <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" stagger={0.1}>
        {(projects as Project[]).map((p) => (
          <StaggerItem key={p.id}>
            <a
              href={p.live_url || "#"}
              target={p.live_url ? "_blank" : undefined}
              rel="noreferrer"
              className="group block bg-gradient-card border border-white/5 rounded-[24px] overflow-hidden relative transition-all duration-500 hover:-translate-y-2 hover:shadow-card hover:border-primary/30 h-full"
            >
              <div className="aspect-[16/11] overflow-hidden bg-ink-soft relative">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center relative"
                    style={{
                      background:
                        "radial-gradient(120% 80% at 20% 20%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%), linear-gradient(160deg, var(--ink-soft) 0%, var(--ink) 100%)",
                    }}
                  >
                    <span className="font-serif-display italic text-foreground/40 text-3xl md:text-4xl px-6 text-center leading-tight">
                      {p.title.split("—")[0].trim()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-6 flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <span className="text-[0.7rem] font-bold tracking-wider uppercase text-primary">
                    {p.category}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-2 mb-1.5 transition-colors group-hover:text-primary">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.summary}</p>
                  {Array.isArray(p.tools) && p.tools.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {p.tools.map((t: string) => (
                        <span
                          key={t}
                          className="text-[0.7rem] font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.live_url && (
                    <span className="inline-flex items-center gap-1.5 mt-4 text-[0.72rem] font-bold text-primary uppercase tracking-wider">
                      Live preview
                      <ArrowUpRight size={12} />
                    </span>
                  )}
                </div>
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 grid place-items-center text-foreground/80 group-hover:bg-gradient-gold group-hover:text-primary-foreground group-hover:rotate-45 group-hover:border-transparent transition-all duration-500 shrink-0">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              {p.featured && (
                <span className="absolute top-4 left-4 bg-gradient-gold text-primary-foreground text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-glow">
                  Featured
                </span>
              )}
            </a>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
