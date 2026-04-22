import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import portrait from "@/assets/ali-portrait.png";
import { AdminEditFab } from "@/components/AdminEditFab";
import {
  Palette,
  Brush,
  ImageIcon,
  Layout,
  Type,
  Sparkles,
  Globe,
  Megaphone,
  Users,
  Clock,
  Eye,
  HeartHandshake,
  MessagesSquare,
  Wand2,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/F")({
  component: SkillsPage,
  head: () => ({
    meta: [
      { title: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Ali Nur Hasan — graphic designer with 2 years of design experience working with TasTaj on logos, banners, posters, product and basic web design. Canva and Adobe workflow.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content:
          "Graphic designer · 2 years with TasTaj · Logo, banner, poster, product & basic web design · Canva + Adobe + AI workflow.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        property: "twitter:description",
        content:
          "Graphic designer with 2 years of experience working with TasTaj — logo, banner, poster, product & basic web design.",
      },
    ],
  }),
});

const designSkills = [
  { label: "Logo design", Icon: Palette },
  { label: "Logo making", Icon: Brush },
  { label: "Banner design", Icon: ImageIcon },
  { label: "Product-level design", Icon: Layers },
  { label: "Poster design", Icon: Megaphone },
  { label: "Basic website design", Icon: Globe },
  { label: "Canva design", Icon: Wand2 },
  { label: "Brand identity design", Icon: Sparkles },
  { label: "Layout & composition", Icon: Layout },
  { label: "Typography selection", Icon: Type },
  { label: "Visual communication", Icon: Eye },
  { label: "Creative concept dev.", Icon: Brush },
  { label: "Social media design sense", Icon: ImageIcon },
  { label: "AI-assisted design workflow", Icon: Wand2 },
];

const softSkills = [
  { label: "Communication", Icon: MessagesSquare },
  { label: "Client understanding", Icon: HeartHandshake },
  { label: "Time management", Icon: Clock },
  { label: "Adaptability", Icon: Users },
  { label: "Attention to detail", Icon: Eye },
];

const tools = ["Canva", "Adobe Photoshop", "Adobe Illustrator", "Figma", "AI workflow tools"];

function SkillsPage() {
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
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto lg:mx-0"
          >
            {/* Rotating conic glow */}
            <motion.div
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-6 rounded-full blur-2xl opacity-60"
              style={{
                background:
                  "conic-gradient(from 0deg, color-mix(in oklab, var(--primary) 60%, transparent), transparent 30%, color-mix(in oklab, var(--primary) 40%, transparent) 60%, transparent 90%)",
              }}
            />
            <div className="relative w-[260px] h-[320px] sm:w-[300px] sm:h-[360px] rounded-[28px] overflow-hidden border border-border bg-card">
              <img
                src={portrait}
                alt="Ali Nur Hasan portrait"
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="text-center lg:text-left"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
              Skills · About · TasTaj
            </p>
            <h1
              className="font-black tracking-tight leading-[1.05] mb-4"
              style={{ fontSize: "clamp(32px, 5.5vw, 64px)" }}
            >
              Graphic designer with{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(110deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 40%, var(--foreground)) 100%)",
                }}
              >
                2 years
              </span>{" "}
              of design work with TasTaj.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
              I'm Ali Nur Hasan — a graphic designer with 2 years of design experience working
              with TasTaj. I create logos, banners, posters, product visuals and basic websites,
              blending Canva, Adobe tools and AI assistance to deliver clean, brand-ready work.
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
          </motion.div>
        </div>
      </section>

      {/* Design skills grid */}
      <section className="px-5 sm:px-6 md:px-10 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHeader eyebrow="Design skills" title="What I build every week" />
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {designSkills.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.03 }}
                className="group rounded-2xl border border-border bg-card p-4 sm:p-5 hover:border-primary/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 mb-3 group-hover:scale-110 transition-transform">
                  <s.Icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold leading-tight">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Soft skills */}
      <section className="px-5 sm:px-6 md:px-10 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionHeader eyebrow="Working style" title="How I work with clients" />
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {softSkills.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col items-center text-center"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20 mb-3">
                  <s.Icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold leading-tight">{s.label}</p>
              </motion.div>
            ))}
          </div>
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
    </div>
  );
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
