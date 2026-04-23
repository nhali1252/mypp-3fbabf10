import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Zap,
  Cpu,
  Layers,
  Wand2,
  Palette,
  PenTool,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/iconRegistry";
import { Footer } from "@/components/Footer";

type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  active: boolean;
};

type FSkillRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  kind: string;
  active: boolean;
  sort_order: number;
};

const aiPillars = [
  { icon: Brain, title: "Idea development", body: "Faster concept exploration without losing originality or taste." },
  { icon: Zap, title: "Workflow efficiency", body: "Automating busywork so we spend more time on craft and detail." },
  { icon: Cpu, title: "Faster execution", body: "Quicker mockups and variations across creative directions." },
  { icon: Layers, title: "Multi-format range", body: "Graphic design, web, and basic video — one cohesive offering." },
];

const fallbackOffers = [
  { id: "fo-1", title: "Brand Identity", description: "Logos, marks and complete brand systems built to last.", icon: "Sparkles" },
  { id: "fo-2", title: "Posters & Banners", description: "Editorial layouts and event-ready visuals with intent.", icon: "Palette" },
  { id: "fo-3", title: "Product Visuals", description: "Clean product cards, mockups and social-ready assets.", icon: "PenTool" },
];

export function ServicesTasTajPage() {
  const services = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []) as ServiceRow[];
    },
  });

  const skills = useQuery({
    queryKey: ["public-f-skills"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("f_skills")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []) as FSkillRow[];
    },
  });

  const offers = (services.data?.length ? services.data : fallbackOffers) as Array<
    Pick<ServiceRow, "id" | "title" | "description" | "icon">
  >;
  const designSkills = (skills.data ?? []).filter((s) => s.kind === "design");
  const softSkills = (skills.data ?? []).filter((s) => s.kind !== "design");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative px-5 sm:px-6 md:px-10 pt-10 sm:pt-14 md:pt-20 pb-10 overflow-hidden">
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
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-[11px] font-bold uppercase tracking-[0.25em] text-primary"
          >
            <Sparkles className="w-3.5 h-3.5" /> Services
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="font-black tracking-tight leading-[1.02] mt-5"
            style={{ fontSize: "clamp(34px, 6.4vw, 78px)" }}
          >
            Every brief, treated like{" "}
            <span className="font-serif-display italic font-medium text-primary">a brand.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-muted-foreground mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            From logos to posters to social campaigns — premium design built for clarity, beauty
            and longevity. Synced live to my CMS.
          </motion.p>
        </div>
      </section>

      {/* WHAT I OFFER */}
      <section className="px-5 sm:px-6 md:px-10 py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
                Services
              </p>
              <h2
                className="font-black tracking-tight leading-tight"
                style={{ fontSize: "clamp(26px, 4.6vw, 48px)" }}
              >
                What I{" "}
                <span className="font-serif-display italic font-medium text-primary">offer</span>
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              A focused range of design services built for founders, families and brands that want
              every visual to feel intentional.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {offers.map((s, i) => {
              const Icon = getIcon(s.icon || "Sparkles");
              return (
                <motion.article
                  key={s.id}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className="group relative rounded-2xl border border-border bg-card p-6 sm:p-7 overflow-hidden hover:border-primary/40 transition-colors"
                  style={{ background: "var(--gradient-card)" }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in oklab, var(--primary) 65%, transparent), transparent 70%)",
                    }}
                  />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl grid place-items-center bg-primary/10 text-primary border border-primary/25 mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    {s.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {s.description}
                      </p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* TECHNICAL MASTERY (synced from f_skills design) */}
      <section className="px-5 sm:px-6 md:px-10 py-12 sm:py-16 border-t border-border">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
                Skills & Tools
              </p>
              <h2
                className="font-black tracking-tight leading-tight"
                style={{ fontSize: "clamp(26px, 4.6vw, 48px)" }}
              >
                Technical{" "}
                <span className="font-serif-display italic font-medium text-primary">mastery</span>
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Every tool below earns its place — chosen for control, output quality and the freedom
              to focus on craft.
            </p>
          </div>

          {designSkills.length === 0 && !skills.isLoading ? (
            <div className="text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl py-14">
              No design skills published yet — add them from the admin /F page.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {designSkills.map((s, i) => {
                const Icon = getIcon(s.icon || "Sparkles");
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: i * 0.04 }}
                    className="rounded-xl border border-border bg-card/60 p-4 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg grid place-items-center bg-primary/10 text-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{s.title}</p>
                        {s.description && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* MODERN TOOLKIT — AI pillars + working style */}
      <section className="px-5 sm:px-6 md:px-10 py-12 sm:py-16 border-t border-border">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
                Modern toolkit
              </p>
              <h2
                className="font-black tracking-tight leading-tight max-w-3xl"
                style={{ fontSize: "clamp(26px, 4.6vw, 48px)" }}
              >
                A modern designer with a{" "}
                <span className="font-serif-display italic font-medium text-primary">modern</span>{" "}
                toolkit
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              I use AI thoughtfully — to support idea development, creative exploration and faster
              execution — while keeping originality and craft intact.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {aiPillars.map((p, i) => (
              <motion.article
                key={p.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group relative rounded-2xl border border-border bg-card p-6 overflow-hidden hover:border-primary/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl grid place-items-center bg-primary/10 text-primary border border-primary/25 mb-4 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </motion.article>
            ))}
          </div>

          {/* Working style strip from f_skills (kind != design) */}
          {softSkills.length > 0 && (
            <div className="mt-10 sm:mt-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4">
                Working style
              </p>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-card/40"
                  >
                    <Wand2 className="w-3 h-3 text-primary" />
                    {s.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-6 md:px-10 py-14 sm:py-20 border-t border-border">
        <div className="max-w-[1100px] mx-auto rounded-[28px] border border-border bg-card p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ background: "var(--gradient-card)" }}>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-full blur-[100px] opacity-50"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 70%, transparent), transparent)",
            }}
          />
          <h3
            className="relative font-black tracking-tight leading-tight"
            style={{ fontSize: "clamp(24px, 4vw, 42px)" }}
          >
            Have a brief in mind?
          </h3>
          <p className="relative mt-3 text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Share a few details and I'll reply with first thoughts within 24 hours.
          </p>
          <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity shadow-glow"
            >
              Start a project <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold hover:border-primary hover:text-primary transition-colors"
            >
              See selected work
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
