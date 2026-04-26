import { useActivities } from "@/hooks/useContent";
import { SectionHeader } from "../SectionHeader";
import { Stagger, StaggerItem } from "../motion/Reveal";
import { SectionSkeleton, SectionError, SectionEmpty } from "./SectionState";

interface Activity {
  id: string;
  title: string;
  period?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

export function ActivitiesSection() {
  const { data: items = [], isLoading, isError, error, refetch } = useActivities();
  const list = items as Activity[];

  return (
    <section id="activities" className="pt-24">
      <SectionHeader label="Activities" title="Experience & development." />
      {isLoading ? (
        <SectionSkeleton count={4} cols={2} label="Loading activities…" />
      ) : isError ? (
        <SectionError
          title="Couldn't load activities"
          error={error}
          onRetry={() => refetch()}
        />
      ) : list.length === 0 ? (
        <SectionEmpty title="No activities yet" />
      ) : (
        <Stagger className="grid md:grid-cols-2 gap-4" stagger={0.1}>
          {list.map((a) => (
            <StaggerItem key={a.id}>
              <article className="h-full bg-gradient-card border border-white/5 rounded-[22px] p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-card hover:border-primary/25">
                <h3 className="font-bold text-base mb-2">
                  {a.title}
                  {a.period && (
                    <span className="ml-2 font-normal text-muted-foreground text-[0.77rem]">
                      {a.period}
                    </span>
                  )}
                </h3>
                {a.description && (
                  <p className="text-sm text-muted-foreground leading-[1.72]">{a.description}</p>
                )}
                {Array.isArray(a.tags) && a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3.5">
                    {a.tags.map((t: string) => (
                      <span
                        key={t}
                        className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[0.71rem] font-semibold text-muted-foreground transition-all hover:bg-gradient-gold hover:text-primary-foreground hover:border-transparent"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
