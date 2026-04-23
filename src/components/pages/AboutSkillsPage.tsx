import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import portrait from "@/assets/ali-portrait-baked.jpg";
import { ImageOff, ExternalLink, Sparkles, User, Quote, Star } from "lucide-react";
import {
  useFHero,
  useFSkills,
  useFProjects,
  useFRealtimeSync,
  useFPhotocard,
} from "@/hooks/useFContent";
import { getIcon } from "@/lib/iconRegistry";
import { HireMeProvider, useHireMe } from "@/components/HireMeProvider";

const tools = ["Canva", "Adobe Photoshop", "Adobe Illustrator", "Figma", "AI workflow tools"];
const marqueeWords = ["Branding", "Logo Design", "Posters", "Banners", "Social", "Packaging", "Web Visuals", "Editorial"];

const stats: { value: string; label: string }[] = [
  { value: "2+", label: "Years designing" },
  { value: "120+", label: "Pieces shipped" },
  { value: "24h", label: "Avg. reply time" },
  { value: "100%", label: "Brand-ready" },
];

function AboutSkillsInner() {
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
            <Link to="/basic" className="text-muted-foreground hover:text-foreground transition-colors">Basic</Link>
            <Link to="/about-and-skills" className="text-primary">About</Link>
            <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
            <Link to="/services-design" className="text-muted-foreground hover:text-foreground transition-colors">Services</Link>
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
          <PhotoCard
            isLoading={photocardLoading}
            name={photocard?.name ?? "Ali Nur Hasan"}
            role={photocard?.role ?? "Designer · TasTaj"}
            badgeTop={photocard?.badge_top ?? "2 yrs"}
            badgeBottom={photocard?.badge_bottom ?? "✦ Designer"}
            openLabel={photocard?.open_label ?? "Open"}
            imageUrl={photocard?.image_url || portrait}
          />

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
            <div className="mt-7 flex justify-center lg:justify-start gap-3 flex-wrap">
              <HireMeInlineButton />
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-colors"
              >
                See projects
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee strip — kinetic visual flair */}
      <section aria-hidden className="relative overflow-hidden border-y border-border bg-card/40 py-4 sm:py-5 mb-10">
        <div className="flex gap-12 whitespace-nowrap ticker-track">
          {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((w, i) => (
            <span
              key={i}
              className="font-serif-display italic text-2xl sm:text-3xl md:text-4xl text-foreground/60 flex items-center gap-12"
            >
              {w}
              <Sparkles className="w-4 h-4 text-primary" />
            </span>
          ))}
        </div>
      </section>

      {/* Stats cluster */}
      <section className="px-5 sm:px-6 md:px-10 pb-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-5 text-center hover:-translate-y-1 hover:border-primary/40 transition-all"
            >
              <div
                className="font-black tracking-tight bg-clip-text text-transparent"
                style={{
                  fontSize: "clamp(28px, 3.6vw, 40px)",
                  backgroundImage:
                    "linear-gradient(135deg, var(--foreground) 0%, var(--primary) 100%)",
                }}
              >
                {s.value}
              </div>
              <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {s.label}
              </div>
            </motion.div>
          ))}
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
                    whileHover={{ y: -4 }}
                    className="group rounded-2xl border border-border bg-card p-4 sm:p-5 hover:border-primary/50 hover:shadow-[0_20px_40px_-20px_color-mix(in_oklab,var(--primary)_45%,transparent)] transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
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

      {/* Editorial quote */}
      <section className="px-5 sm:px-6 md:px-10 pb-10">
        <div className="max-w-[1100px] mx-auto">
          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[24px] border border-border bg-card overflow-hidden p-7 sm:p-10 md:p-14"
          >
            <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-primary/40 mb-4" />
            <blockquote
              className="font-serif-display italic leading-[1.12] tracking-tight text-foreground"
              style={{ fontSize: "clamp(22px, 3.6vw, 38px)" }}
            >
              "Design isn't decoration — it's how a brand earns trust in the first three seconds."
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
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
          </motion.figure>
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
                    className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col items-center text-center hover:border-primary/40 transition-colors"
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

      {/* Mini testimonial / trust strip */}
      <section className="px-5 sm:px-6 md:px-10 pb-10">
        <div className="max-w-[1200px] mx-auto grid sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { name: "TasTaj Studio", role: "Creative collaboration", quote: "Clean, brand-ready, on time — every time." },
            { name: "Local brand client", role: "Logo & packaging", quote: "Captured our voice in the very first round." },
            { name: "Founder", role: "Social campaign", quote: "Felt premium without ever feeling overdesigned." },
          ].map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-1 text-primary mb-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed mb-3">"{t.quote}"</p>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="font-bold text-foreground">{t.name}</span> · {t.role}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

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

export function AboutSkillsPage() {
  return (
    <HireMeProvider>
      <AboutSkillsInner />
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

  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } }
    : {
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <motion.div
      {...enter}
      whileHover={reduce ? undefined : { y: -4, rotate: -0.3 }}
      className="relative mx-auto lg:mx-0 group [perspective:1200px]"
    >
      {!reduce && (
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-8 rounded-[36px] blur-2xl opacity-60"
          style={{
            background:
              "conic-gradient(from 0deg, color-mix(in oklab, var(--primary) 65%, transparent), transparent 30%, color-mix(in oklab, var(--primary) 45%, transparent) 60%, transparent 90%)",
          }}
        />
      )}

      {reduce ? (
        <div
          aria-hidden
          className="absolute -inset-4 rounded-[34px] blur-3xl opacity-50"
          style={{
            background:
              "radial-gradient(circle at 50% 60%, color-mix(in oklab, var(--primary) 55%, transparent), transparent 70%)",
          }}
        />
      ) : (
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
      )}

      <div
        aria-hidden
        className="absolute -inset-2 rounded-[32px] border border-primary/30 opacity-60 group-hover:opacity-100 group-hover:-inset-3 transition-all duration-500"
      />

      <div
        className={`relative w-[260px] h-[330px] sm:w-[300px] sm:h-[380px] rounded-[28px] overflow-hidden border border-border/80 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)] transition-transform duration-500 ${
          reduce ? "" : "group-hover:[transform:rotateX(1deg)_rotateY(-1.5deg)]"
        }`}
      >
        {(isLoading || imgState === "loading") && (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60 animate-pulse"
          >
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

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/45 to-transparent"
        />
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
            <p className="text-[11px] font-bold leading-none tracking-tight truncate text-white">
              {name}
            </p>
            <p className="text-[9px] uppercase tracking-[0.22em] mt-1 truncate text-white/75">
              {role}
            </p>
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
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_12px_30px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
        >
          {badgeTop}
        </motion.div>
      )}
      {badgeBottom && (
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute -bottom-2 -left-3 sm:-bottom-3 sm:-left-4 px-3 py-1.5 rounded-full bg-card border border-border text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/85 shadow-lg"
        >
          {badgeBottom}
        </motion.div>
      )}
    </motion.div>
  );
}
