import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform, useSpring, type Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import portrait from "@/assets/ali-portrait-baked.jpg";
import { ImageOff, ExternalLink, Sparkles, User, Quote, Star, ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  useFHero,
  useFSkills,
  useFProjects,
  useFRealtimeSync,
  useFPhotocard,
} from "@/hooks/useFContent";
import { getIcon } from "@/lib/iconRegistry";
import { HireMeProvider, useHireMe } from "@/components/HireMeProvider";
import { Footer } from "@/components/Footer";
import { PageQuote } from "@/components/PageQuote";
import { OrganicCenterpiece } from "@/components/about/OrganicCenterpiece";
import { MagneticButton } from "@/components/about/MagneticButton";

const tools = ["Canva", "Adobe Photoshop", "Adobe Illustrator", "Figma", "AI workflow tools"];
const marqueeWords = [
  "Branding",
  "Logo Design",
  "Posters",
  "Banners",
  "Social",
  "Packaging",
  "Web Visuals",
  "Editorial",
];
const stats: { value: string; label: string }[] = [
  { value: "2+", label: "Years designing" },
  { value: "120+", label: "Pieces shipped" },
  { value: "24h", label: "Avg. reply time" },
  { value: "100%", label: "Brand-ready" },
];

/* -------------------- Reusable motion primitives -------------------- */

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(10px)" }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: easeOutExpo, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Word-by-word kinetic reveal — used for the hero headline. */
function WordReveal({
  text,
  highlight,
  className,
  style,
}: {
  text: string;
  highlight?: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/);
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0.1 } },
  };
  const word: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } }
    : {
        hidden: { opacity: 0, y: "60%", filter: "blur(8px)" },
        show: {
          opacity: 1,
          y: "0%",
          filter: "blur(0px)",
          transition: { duration: 0.85, ease: easeOutExpo },
        },
      };

  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
      style={style}
    >
      {words.map((w, i) => {
        const isHi = highlight && w.toLowerCase().includes(highlight.toLowerCase());
        return (
          <span key={i} className="inline-block overflow-hidden align-baseline mr-[0.22em] last:mr-0">
            <motion.span
              variants={word}
              className={`inline-block ${
                isHi ? "bg-clip-text text-transparent" : ""
              }`}
              style={
                isHi
                  ? {
                      backgroundImage:
                        "linear-gradient(110deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 35%, var(--foreground)) 100%)",
                    }
                  : undefined
              }
            >
              {w}
            </motion.span>
          </span>
        );
      })}
    </motion.h1>
  );
}

/* -------------------------------- Page -------------------------------- */

function AboutSkillsInner() {
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

  // Sticky hero scroll choreography
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const orbScale = useSpring(useTransform(heroProgress, [0, 1], [1, 1.35]), {
    stiffness: 60,
    damping: 20,
  });
  const orbY = useSpring(useTransform(heroProgress, [0, 1], [0, -120]), {
    stiffness: 60,
    damping: 20,
  });
  const orbOpacity = useTransform(heroProgress, [0, 0.7, 1], [1, 1, 0]);
  const titleY = useTransform(heroProgress, [0, 1], [0, -80]);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Ambient gradient field — drifts through the whole page */}
      <AmbientField />

      {/* Top nav — minimal floating */}
      <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10 relative z-30">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All pages
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <nav className="hidden md:flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              <Link to="/basic" className="text-muted-foreground hover:text-foreground transition-colors">Basic</Link>
              <Link to="/about-and-skills" className="text-primary">About</Link>
              <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
              <Link to="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
              <Link to="/services" className="text-muted-foreground hover:text-foreground transition-colors">Services</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ============ CINEMATIC HERO — sticky 3D centerpiece ============ */}
      <section
        ref={heroRef}
        className="relative h-[180vh] px-5 sm:px-6 md:px-10"
      >
        <div className="sticky top-0 h-screen flex items-center justify-center">
          {/* Full-bleed orb behind everything */}
          <motion.div
            style={{
              scale: reduce ? 1 : orbScale,
              y: reduce ? 0 : orbY,
              opacity: orbOpacity,
            }}
            className="absolute inset-0 grid place-items-center pointer-events-none"
          >
            <OrganicCenterpiece size={Math.min(640, typeof window !== "undefined" ? window.innerWidth * 0.85 : 520)} />
          </motion.div>

          {/* Editorial copy in corners — Emergent-style layered chrome */}
          <div className="relative z-10 w-full max-w-[1280px] mx-auto h-full">
            {/* Top-left corner card */}
            <Reveal delay={0.4} y={20} className="absolute top-[14vh] left-0 max-w-[260px] hidden md:block">
              <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md px-4 py-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary mb-1">
                  {eyebrow}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  An editorial look at how I design — slowed down, in detail.
                </p>
              </div>
            </Reveal>

            {/* Top-right meta */}
            <Reveal delay={0.5} y={20} className="absolute top-[14vh] right-0 hidden md:flex flex-col items-end gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                Chapter 01
              </span>
              <span className="text-[11px] text-foreground/80 font-mono">
                {new Date().toISOString().slice(0, 10)}
              </span>
            </Reveal>

            {/* Centered headline pinned to bottom of viewport */}
            <motion.div
              style={{ y: reduce ? 0 : titleY }}
              className="absolute inset-x-0 bottom-[12vh] md:bottom-[14vh] text-center px-3"
            >
              <WordReveal
                text={headline}
                highlight={highlight}
                className="font-black tracking-[-0.03em] leading-[0.98] mx-auto max-w-[1100px]"
                style={{ fontSize: "clamp(38px, 8.4vw, 120px)" }}
              />
              <Reveal delay={1.2} y={18} className="mt-6">
                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {intro.split(/\.\s+/)[0]}.
                </p>
              </Reveal>
              <Reveal delay={1.4} y={14} className="mt-7 flex justify-center gap-3 flex-wrap">
                <HireMeMagnetic />
                <MagneticButton
                  as="a"
                  href="#about-text"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 backdrop-blur-md px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] hover:border-primary/50 hover:text-primary transition-colors"
                  strength={14}
                >
                  Read more
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </MagneticButton>
              </Reveal>
            </motion.div>

            {/* Scroll cue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-4 flex flex-col items-center gap-1.5 text-[9px] uppercase tracking-[0.3em] text-muted-foreground"
            >
              <span>Scroll</span>
              <motion.span
                aria-hidden
                animate={reduce ? undefined : { y: [0, 6, 0] }}
                transition={reduce ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="block w-px h-6 bg-foreground/40"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ ABOUT TEXT REVEAL — editorial intro ============ */}
      <section id="about-text" className="relative px-5 sm:px-6 md:px-10 py-24 md:py-32 z-10">
        <div className="max-w-[1100px] mx-auto grid lg:grid-cols-[280px_1fr] gap-10 md:gap-14 items-start">
          <div className="lg:sticky lg:top-24 self-start">
            <PhotoCard
              isLoading={photocardLoading}
              name={photocard?.name ?? "Ali Nur Hasan"}
              role={photocard?.role ?? "Designer · TasTaj"}
              badgeTop={photocard?.badge_top ?? "2 yrs"}
              badgeBottom={photocard?.badge_bottom ?? "✦ Designer"}
              openLabel={photocard?.open_label ?? "Open"}
              imageUrl={photocard?.image_url || portrait}
            />
          </div>
          <div>
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4">
                About — in my own words
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <p
                className="font-serif-display leading-[1.18] tracking-tight text-foreground/95 mb-8"
                style={{ fontSize: "clamp(22px, 2.4vw, 34px)" }}
              >
                {intro}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="flex flex-wrap gap-2 mb-8">
                {tools.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-border/70 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border/70 bg-card/50 p-4 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                  >
                    <div
                      className="font-black tracking-tight bg-clip-text text-transparent"
                      style={{
                        fontSize: "clamp(24px, 3vw, 34px)",
                        backgroundImage:
                          "linear-gradient(135deg, var(--foreground) 0%, var(--primary) 100%)",
                      }}
                    >
                      {s.value}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Marquee — kinetic strip */}
      <section aria-hidden className="relative overflow-hidden border-y border-border/50 bg-card/30 py-3">
        <div className="flex gap-10 whitespace-nowrap ticker-track">
          {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((w, i) => (
            <span
              key={i}
              className="font-serif-display italic text-base sm:text-xl md:text-2xl text-foreground/55 flex items-center gap-10"
            >
              {w}
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </span>
          ))}
        </div>
      </section>

      {/* ============ DESIGN SKILLS — staggered cards ============ */}
      <section className="relative px-5 sm:px-6 md:px-10 py-20 md:py-28 z-10">
        <div className="max-w-[1280px] mx-auto">
          <SectionHeader eyebrow="Design skills" title="What I build every week" />
          {design.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills yet — add some in the admin panel.</p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
              }}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            >
              {design.map((s) => {
                const Icon = getIcon(s.icon);
                return (
                  <motion.div
                    key={s.id}
                    variants={{
                      hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 28, filter: "blur(8px)" },
                      show: reduce
                        ? { opacity: 1, transition: { duration: 0.4 } }
                        : {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: { duration: 0.7, ease: easeOutExpo },
                          },
                    }}
                    whileHover={reduce ? undefined : { y: -6 }}
                    className="group rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-5 hover:border-primary/50 hover:shadow-[0_28px_60px_-24px_color-mix(in_oklab,var(--primary)_55%,transparent)] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold leading-tight mb-1">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground leading-snug">{s.description}</p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ============ EDITORIAL QUOTE ============ */}
      <section className="relative px-5 sm:px-6 md:px-10 pb-20 md:pb-28 z-10">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <figure className="relative rounded-[28px] border border-border/70 bg-card/60 backdrop-blur-md overflow-hidden p-8 sm:p-12 md:p-16">
              <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-primary/40 mb-4" />
              <blockquote
                className="font-serif-display italic leading-[1.1] tracking-tight text-foreground"
                style={{ fontSize: "clamp(24px, 4vw, 44px)" }}
              >
                "Design isn't decoration — it's how a brand earns trust in the first three seconds."
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold tracking-tight text-foreground">Working principle</div>
                  <div className="uppercase tracking-[0.2em] text-[10px]">how I approach every brief</div>
                </div>
              </figcaption>
              <div
                aria-hidden
                className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-primary/40 to-transparent"
              />
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ============ SOFT SKILLS ============ */}
      <section className="relative px-5 sm:px-6 md:px-10 pb-20 md:pb-28 z-10">
        <div className="max-w-[1280px] mx-auto">
          <SectionHeader eyebrow="Working style" title="How I work with clients" />
          {soft.length === 0 ? (
            <p className="text-sm text-muted-foreground">No working style cards yet.</p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
              }}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            >
              {soft.map((s) => {
                const Icon = getIcon(s.icon);
                return (
                  <motion.div
                    key={s.id}
                    variants={{
                      hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutExpo } },
                    }}
                    className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-5 flex flex-col items-center text-center hover:border-primary/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 mb-3">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold leading-tight mb-1">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground leading-snug">{s.description}</p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ============ PROJECTS ============ */}
      {projects.length > 0 && (
        <section className="relative px-5 sm:px-6 md:px-10 pb-20 md:pb-28 z-10">
          <div className="max-w-[1280px] mx-auto">
            <SectionHeader eyebrow="Weekly portfolio" title="Recent design work" />
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
              }}
              className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {projects.map((p) => {
                const card = (
                  <motion.div
                    variants={{
                      hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 },
                      show: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.75, ease: easeOutExpo },
                      },
                    }}
                    whileHover={reduce ? undefined : { y: -6 }}
                    className="group rounded-2xl border border-border/70 bg-card/60 overflow-hidden hover:border-primary/50 transition-colors h-full flex flex-col"
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
                    <div className="p-5 flex-1 flex flex-col">
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
                    {card}
                  </a>
                ) : (
                  <div key={p.id}>{card}</div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* ============ TRUST STRIP ============ */}
      <section className="relative px-5 sm:px-6 md:px-10 pb-20 md:pb-28 z-10">
        <div className="max-w-[1280px] mx-auto grid sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { name: "TasTaj Studio", role: "Creative collaboration", quote: "Clean, brand-ready, on time — every time." },
            { name: "Local brand client", role: "Logo & packaging", quote: "Captured our voice in the very first round." },
            { name: "Founder", role: "Social campaign", quote: "Felt premium without ever feeling overdesigned." },
          ].map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-5 hover:border-primary/40 transition-colors h-full">
                <div className="flex items-center gap-1 text-primary mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed mb-3">"{t.quote}"</p>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="font-bold text-foreground">{t.name}</span> · {t.role}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ TASTAJ — closer ============ */}
      <section className="relative px-5 sm:px-6 md:px-10 pb-24 z-10">
        <div className="max-w-[1280px] mx-auto">
          <Reveal>
            <div className="relative rounded-[28px] border border-border/70 bg-card/60 backdrop-blur-md overflow-hidden p-8 sm:p-12 md:p-16">
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
                  style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
                >
                  TasTaj
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  TasTaj is my collaboration / reference name for creative design work. We've
                  collaborated together on creative design projects — sharing craft, tools and
                  workflow to deliver clean, brand-ready outcomes.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <PageQuote slug="about" />
      <Footer />
      <HireMeFloatingButton />
    </div>
  );
}

/* -------------------------- Wrapper + ambient -------------------------- */

export function AboutSkillsPage() {
  return (
    <HireMeProvider>
      <AboutSkillsInner />
    </HireMeProvider>
  );
}

function AmbientField() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 -left-40 w-[60vw] h-[60vw] rounded-full blur-[160px] opacity-25"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent) 0%, transparent 70%)",
        }}
        animate={reduce ? undefined : { x: [0, 60, -20, 0], y: [0, 30, 60, 0] }}
        transition={reduce ? undefined : { duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-30vh] right-[-20vw] w-[55vw] h-[55vw] rounded-full blur-[160px] opacity-20"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.18 60) 0%, transparent 70%)",
        }}
        animate={reduce ? undefined : { x: [0, -40, 30, 0], y: [0, -50, 20, 0] }}
        transition={reduce ? undefined : { duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* -------------------------- Section header -------------------------- */

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8 sm:mb-12 max-w-3xl">
      <Reveal>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={0.05}>
        <h2
          className="font-black tracking-[-0.02em] leading-[1]"
          style={{ fontSize: "clamp(28px, 4.4vw, 56px)" }}
        >
          {title}
        </h2>
      </Reveal>
    </div>
  );
}

/* -------------------------- Hire Me buttons -------------------------- */

function HireMeMagnetic() {
  const { openHireMe } = useHireMe();
  return (
    <MagneticButton
      onClick={openHireMe}
      strength={20}
      className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 shadow-[0_18px_44px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
    >
      <Sparkles className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
      Hire me
    </MagneticButton>
  );
}

function HireMeFloatingButton() {
  const { openHireMe } = useHireMe();
  return (
    <button
      type="button"
      onClick={openHireMe}
      aria-label="Hire me"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-foreground hover:text-background pl-3 pr-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] hover:scale-[1.05] active:scale-[0.98] transition-all duration-300"
    >
      <span className="grid place-items-center w-7 h-7 rounded-full bg-primary-foreground/15">
        <Sparkles className="w-3.5 h-3.5" />
      </span>
      Hire me
    </button>
  );
}

/* -------------------------- Photocard -------------------------- */

function PhotoCard({
  isLoading,
  name,
  role,
  badgeTop,
  badgeBottom,
  openLabel,
  imageUrl,
}: {
  isLoading: boolean;
  name: string;
  role: string;
  badgeTop: string | null;
  badgeBottom: string | null;
  openLabel: string | null;
  imageUrl: string;
}) {
  const reduce = useReducedMotion();
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");

  // Subtle tilt on hover (desktop)
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      setTilt({ rx: -y * 6, ry: x * 8 });
    };
    const onLeave = () => setTilt({ rx: 0, ry: 0 });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce]);

  return (
    <motion.div
      ref={ref}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, ease: easeOutExpo }}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: "preserve-3d",
        contain: "layout paint",
      }}
      className="relative mx-auto lg:mx-0 group isolate"
    >
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[34px] blur-3xl opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 60%, color-mix(in oklab, var(--primary) 55%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -inset-2 rounded-[32px] border border-primary/30 opacity-70 pointer-events-none"
      />
      <div className="relative w-[260px] h-[330px] sm:w-[280px] sm:h-[350px] rounded-[28px] overflow-hidden border border-border/80 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]">
        {(isLoading || imgState === "loading") && (
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60 animate-pulse">
            <div className="absolute inset-x-3 bottom-3 h-12 rounded-2xl bg-background/40" />
          </div>
        )}

        {imgState !== "error" && (
          <img
            src={imageUrl}
            alt={`${name} portrait`}
            onLoad={() => setImgState("loaded")}
            onError={() => setImgState("error")}
            className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-[1200ms] ease-out ${
              imgState === "loaded" ? "opacity-100" : "opacity-0"
            } ${reduce ? "" : "group-hover:scale-[1.05]"}`}
          />
        )}

        {imgState === "error" && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-card to-muted text-muted-foreground">
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
                <User className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold tracking-tight">{name}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-1">
                <ImageOff className="w-3 h-3" /> image unavailable
              </p>
            </div>
          </div>
        )}

        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        {!reduce && (
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{
              background:
                "linear-gradient(115deg, transparent 30%, color-mix(in oklab, var(--primary) 35%, transparent) 50%, transparent 70%)",
              mixBlendMode: "overlay",
            }}
          />
        )}
        <div aria-hidden className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />

        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-black/55 backdrop-blur-md px-3 py-2.5 flex items-center gap-2.5 shadow-lg">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/30 text-primary-foreground ring-1 ring-primary/40">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold leading-none tracking-tight truncate text-white">{name}</p>
            <p className="text-[9px] uppercase tracking-[0.22em] mt-1 truncate text-white/75">{role}</p>
          </div>
          {openLabel && (
            <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                {!reduce && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                )}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {openLabel}
            </span>
          )}
        </div>
      </div>

      {badgeTop && (
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_12px_30px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
        >
          {badgeTop}
        </motion.div>
      )}
      {badgeBottom && (
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute -bottom-2 -left-3 px-3 py-1.5 rounded-full bg-card border border-border text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/85 shadow-lg"
        >
          {badgeBottom}
        </motion.div>
      )}
    </motion.div>
  );
}
