import { useEducation } from "@/hooks/useContent";
import { SectionHeader } from "../SectionHeader";
import { Stagger, StaggerItem } from "../motion/Reveal";
import { SectionSkeleton, SectionError, SectionEmpty } from "./SectionState";

interface EducationItem {
  id: string;
  degree: string;
  institution?: string | null;
  university?: string | null;
  period?: string | null;
  gpa?: string | null;
  description?: string | null;
}

export function EducationSection() {
  const { data: items = [], isLoading, isError, error, refetch } = useEducation();
  const list = items as EducationItem[];

  return (
    <section id="education" className="pt-24">
      <SectionHeader label="Education" title="Academic background." />
      {isLoading ? (
        <SectionSkeleton count={2} label="Loading education…" />
      ) : isError ? (
        <SectionError
          title="Couldn't load education"
          error={error}
          onRetry={() => refetch()}
        />
      ) : list.length === 0 ? (
        <SectionEmpty title="No education entries yet" />
      ) : (
        <Stagger className="grid gap-3.5" stagger={0.12}>
          {list.map((r) => (
            <StaggerItem key={r.id}>
              <article className="bg-gradient-card border border-white/5 rounded-[20px] p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-card hover:border-primary/25">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <h3 className="font-bold text-base leading-tight">{r.degree}</h3>
                  {r.period && (
                    <span className="shrink-0 text-[0.62rem] font-bold tracking-[0.12em] uppercase text-primary border border-primary/30 bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {r.period}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[r.institution, r.university].filter(Boolean).join(" · ")}
                  {r.gpa && (
                    <>
                      {" · "}
                      <strong className="text-foreground/80">{r.gpa}</strong>
                    </>
                  )}
                </p>
                {r.description && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {r.description}
                  </p>
                )}
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
