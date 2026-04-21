import { useEducation } from "@/hooks/useContent";
import { SectionHeader } from "../SectionHeader";
import { Stagger, StaggerItem } from "../motion/Reveal";

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
  const { data: items = [] } = useEducation();

  return (
    <section id="education" className="pt-24">
      <SectionHeader label="Education" title="Academic background." />
      <Stagger className="grid gap-3.5" stagger={0.12}>
        {(items as EducationItem[]).map((r) => (
          <StaggerItem key={r.id}>
            <article className="grid md:grid-cols-[180px_1fr] gap-5 bg-gradient-card border border-white/5 rounded-[20px] p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-card hover:border-primary/25">
              <span className="text-[0.68rem] font-bold tracking-[0.1em] uppercase bg-gradient-gold text-primary-foreground px-3 py-2 rounded-lg w-fit h-fit shadow-soft">
                {r.period || "—"}
              </span>
              <div>
                <h3 className="font-bold text-base mb-1.5">{r.degree}</h3>
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
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
