import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import portrait from "@/assets/ali-portrait-baked.jpg";
import { ImageOff, ExternalLink, Sparkles, User } from "lucide-react";
import { useFHero, useFSkills, useFProjects, useFRealtimeSync, useFPhotocard } from "@/hooks/useFContent";
import { getIcon } from "@/lib/iconRegistry";
import { HireMeProvider, useHireMe } from "@/components/HireMeProvider";

export const Route = createFileRoute("/F")({
  component: SkillsPageWrapper,
  head: () => ({
    meta: [
      { title: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Ali Nur Hasan — designer with 2 years of design experience working with TasTaj on logos, banners, posters, product and basic web design. Canva and Adobe workflow.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content:
          "Designer · 2 years with TasTaj · Logo, banner, poster, product & basic web design · Canva + Adobe + AI workflow.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        property: "twitter:description",
        content:
          "Designer with 2 years of design experience working with TasTaj — logo, banner, poster, product & basic web design.",
      },
    ],
  }),
});

const tools = ["Canva", "Adobe Photoshop", "Adobe Illustrator", "Figma", "AI workflow tools"];

function SkillsPage() {
  // Live sync from CMS — admin edits update this page in realtime.
  useFRealtimeSync();
  const { data: hero } = useFHero();
  const { data: skills = [] } = useFSkills();
  const { data: projects = [] } = useFProjects();
  const { data: photocard, isLoading: photocardLoading } = useFPhotocard();

  const design = skills.filter((s) => s.kind === "design");
  const soft = skills.filter((s) => s.kind === "soft");

  const eyebrow = hero?.eyebrow ?? "Skills · About · TasTaj";
  const headline = hero?.headline ?? "Designer with 2 years of design work with TasTaj.";
  const highlight = hero?.highlight ?? "2 years";
  const intro =
    hero?.intro ??
    "I'm Ali Nur Hasan — a Designer with 2 years of design experience working with TasTaj. I create logos, banners, posters, product visuals and basic websites, blending Canva, Adobe tools and AI assistance to deliver clean, brand-ready work.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All pages
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
            <Link to="/B" className="text-muted-foreground hover:text-foreground transition-colors">/B</Link>
            <Link to="/F" className="text-primary">/F</Link>
            <Link to="/P" className="text-muted-foreground hover:text-foreground transition-colors">/P</Link>
          </nav>
        </div>
      </header>

      {/* Hero — portrait + intro */}
      <section className="px-5 sm:px-6 md:px-10 pt-8 sm:pt-12 md:pt-16 pb-10 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full blur-[140px] opacity-25"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-[340px_1fr] gap-8 md:gap-12 items-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, rotate: -0.6 }}
            className="relative mx-auto lg:mx-0 group [perspective:1200px]"
          >
            {/* Rotating conic halo */}
            <motion.div
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-8 rounded-[36px] blur-2xl opacity-70"
              style={{
                background:
                  "conic-gradient(from 0deg, color-mix(in oklab, var(--primary) 65%, transparent), transparent 30%, color-mix(in oklab, var(--primary) 45%, transparent) 60%, transparent 90%)",
              }}
            />
            {/* Soft pulsing glow underneath */}
            <motion.div
              aria-hidden
              animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.05, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-4 rounded-[34px] blur-3xl"
              style={{
                background:
                  "radial-gradient(circle at 50% 60%, color-mix(in oklab, var(--primary) 60%, transparent), transparent 70%)",
              }}
            />

            {/* Decorative offset frame */}
            <div
              aria-hidden
              className="absolute -inset-2 rounded-[32px] border border-primary/30 opacity-60 group-hover:opacity-100 group-hover:-inset-3 transition-all duration-500"
            />

            {/* Photo card */}
            <div className="relative w-[260px] h-[330px] sm:w-[300px] sm:h-[380px] rounded-[28px] overflow-hidden border border-border/80 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)] transition-transform duration-500 group-hover:[transform:rotateX(2deg)_rotateY(-3deg)]">
              <img
                src={portrait}
                alt="Ali Nur Hasan portrait"
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07]"
              />
              {/* Bottom gradient for legibility */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background/90 via-background/30 to-transparent"
              />
              {/* Inner shine sweep on hover */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  background:
                    "linear-gradient(115deg, transparent 30%, color-mix(in oklab, var(--primary) 35%, transparent) 50%, transparent 70%)",
                  mixBlendMode: "overlay",
                }}
              />
              {/* Inner ring */}
              <div aria-hidden className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />

              {/* Bottom name plate */}
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-background/55 backdrop-blur-md px-3 py-2.5 flex items-center gap-2.5">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-none tracking-tight truncate">Ali Nur Hasan</p>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground mt-1 truncate">
                    Designer · TasTaj
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  Open
                </span>
              </div>
            </div>

            {/* Floating accent badges */}
            <motion.div
              aria-hidden
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_12px_30px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
            >
              2 yrs
            </motion.div>
            <motion.div
              aria-hidden
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute -bottom-2 -left-3 sm:-bottom-3 sm:-left-4 px-3 py-1.5 rounded-full bg-card border border-border text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/85 shadow-lg"
            >
              ✦ Designer
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="text-center lg:text-left"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
              {eyebrow}
            </p>
            <h1
              className="font-black tracking-tight leading-[1.05] mb-4"
              style={{ fontSize: "clamp(32px, 5.5vw, 64px)" }}
            >
              {renderHeadline(headline, highlight)}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0 whitespace-pre-line">
              {intro}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center lg:justify-start">
              {tools.map((t) => (
                <span
                  key={t}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-card"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-7 flex justify-center lg:justify-start">
              <HireMeInlineButton />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Design skills grid */}
      <section className="px-5 sm:px-6 md:px-10 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHeader eyebrow="Design skills" title="What I build every week" />
          {design.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills yet — add some in the admin panel.</p>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {design.map((s, i) => {
                const Icon = getIcon(s.icon);
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.03 }}
                    className="group rounded-2xl border border-border bg-card p-4 sm:p-5 hover:border-primary/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold leading-tight mb-1">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground leading-snug">{s.description}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Soft skills */}
      <section className="px-5 sm:px-6 md:px-10 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHeader eyebrow="Working style" title="How I work with clients" />
          {soft.length === 0 ? (
            <p className="text-sm text-muted-foreground">No working style cards yet.</p>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {soft.map((s, i) => {
                const Icon = getIcon(s.icon);
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
                    className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col items-center text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 mb-3">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold leading-tight mb-1">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground leading-snug">{s.description}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Weekly portfolio */}
      {projects.length > 0 && (
        <section className="px-5 sm:px-6 md:px-10 pb-10">
          <div className="max-w-[1200px] mx-auto">
            <SectionHeader eyebrow="Weekly portfolio" title="Recent design work" />
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => {
                const Card = (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
                    className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors h-full flex flex-col"
                  >
                    {p.image_url ? (
                      <div className="aspect-[4/3] bg-muted overflow-hidden">
                        <img
                          src={p.image_url}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-muted/40 grid place-items-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold leading-tight">{p.title}</h3>
                        {p.url && (
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground leading-snug mb-3">
                          {p.description}
                        </p>
                      )}
                      {p.tags.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-1.5">
                          {p.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border bg-background/60"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
                return p.url ? (
                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="block">
                    {Card}
                  </a>
                ) : (
                  <div key={p.id}>{Card}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TasTaj reference */}
      <section className="px-5 sm:px-6 md:px-10 pb-16">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[24px] border border-border bg-card overflow-hidden p-7 sm:p-9 md:p-11"
          >
            <div
              aria-hidden
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-primary/40 to-transparent"
            />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
                Reference collaborator
              </p>
              <h2
                className="font-black tracking-tight leading-tight mb-3"
                style={{ fontSize: "clamp(24px, 3.4vw, 38px)" }}
              >
                TasTaj
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                TasTaj is my collaboration / reference name for creative design work. We've
                collaborated together on creative design projects — sharing craft, tools and
                workflow to deliver clean, brand-ready outcomes.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="px-5 sm:px-6 md:px-10 py-8 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Ali Nur Hasan · TasTaj ·{" "}
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
      </footer>
      <HireMeFloatingButton />
    </div>
  );
}

function SkillsPageWrapper() {
  return (
    <HireMeProvider>
      <SkillsPage />
    </HireMeProvider>
  );
}

function HireMeInlineButton() {
  const { openHireMe } = useHireMe();
  return (
    <button
      type="button"
      onClick={openHireMe}
      className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
    >
      <Sparkles className="w-4 h-4 text-primary" />
      Hire me
    </button>
  );
}

function HireMeFloatingButton() {
  const { openHireMe } = useHireMe();
  return (
    <button
      type="button"
      onClick={openHireMe}
      aria-label="Hire me"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground pl-3 pr-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] hover:scale-[1.03] active:scale-[0.98] transition-transform"
    >
      <span className="grid place-items-center w-7 h-7 rounded-full bg-primary-foreground/15">
        <Sparkles className="w-3.5 h-3.5" />
      </span>
      Hire me
    </button>
  );
}

function renderHeadline(headline: string, highlight: string) {
  if (!highlight || !headline.includes(highlight)) return headline;
  const parts = headline.split(highlight);
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && (
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(110deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 40%, var(--foreground)) 100%)",
          }}
        >
          {highlight}
        </span>
      )}
    </span>
  ));
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6 sm:mb-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-2">
        {eyebrow}
      </p>
      <h2
        className="font-black tracking-tight leading-tight"
        style={{ fontSize: "clamp(22px, 3vw, 32px)" }}
      >
        {title}
      </h2>
    </div>
  );
}
