import { useServices } from "@/hooks/useContent";
import { SectionHeader } from "../SectionHeader";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "../motion/Reveal";
import { SectionSkeleton, SectionError, SectionEmpty } from "./SectionState";

interface Service {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
}

export function SkillsSection() {
  const { data: groups = [], isLoading, isError, error, refetch } = useServices();
  const list = groups as Service[];

  return (
    <section id="skills" className="pt-24">
      <SectionHeader label="Skills" title="My strengths." />
      {isLoading ? (
        <SectionSkeleton count={4} cols={4} label="Loading skills…" />
      ) : isError ? (
        <SectionError
          title="Couldn't load skills"
          error={error}
          onRetry={() => refetch()}
        />
      ) : list.length === 0 ? (
        <SectionEmpty title="No skills published yet" />
      ) : (
        <Stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.09}>
          {list.map((s) => {
            const iconKey =
              s.icon
                ?.split("-")
                .map((p: string) => (p[0]?.toUpperCase() ?? "") + p.slice(1))
                .join("") || "Sparkles";
            const Icon = ((Icons as unknown as Record<string, LucideIcon>)[iconKey] ||
              Icons.Sparkles) as LucideIcon;
            return (
              <StaggerItem key={s.id}>
                <article className="group h-full bg-gradient-card border border-white/5 rounded-[22px] p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-card hover:border-primary/30">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 grid place-items-center mb-5 transition-all duration-500 group-hover:bg-gradient-gold group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-glow">
                    <Icon
                      size={22}
                      className="text-primary transition-colors group-hover:text-primary-foreground"
                    />
                  </div>
                  <h3 className="font-bold text-base mb-2 text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </section>
  );
}
