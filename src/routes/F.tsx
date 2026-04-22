import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Palette,
  PenTool,
  Layout,
  Sparkles,
  Brush,
  Globe,
  MessagesSquare,
  Clock,
  Eye,
  Lightbulb,
  Users,
  Wand2,
} from "lucide-react";

export const Route = createFileRoute("/F")({
  component: SkillsPage,
  head: () => ({
    meta: [
      { title: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Ali Nur Hasan — graphics designer with 7 years of experience under the brand TasTaj. Branding, logo, poster, product and basic web design.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content:
          "Branding, logo, poster, product and basic website design. Tools: Canva, Photoshop, Illustrator, InDesign + AI-assisted workflow.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Skills & About — Ali Nur Hasan (TasTaj)" },
      {
        property: "twitter:description",
        content:
          "Graphic designer with 7 years of experience — branding, logos, posters, product & basic web design.",
      },
    ],
  }),
});

const designSkills = [
  "Logo Design",
  "Banner Design",
  "Poster Design",
  "Product Design",
  "Branding Design",
  "Basic Website Design",
];

const tools = [
  { name: "Canva", desc: "Fast, on-brand layouts and social design" },
  { name: "Adobe Photoshop", desc: "Photo retouching, composites, mockups" },
  { name: "Adobe Illustrator", desc: "Logos, vector art, brand systems" },
  { name: "Adobe InDesign", desc: "Posters, brochures, multi-page layouts" },
];

const creativeSkills = [
  { icon: Sparkles, label: "Brand identity thinking" },
  { icon: Layout, label: "Layout & composition" },
  { icon: PenTool, label: "Typography selection" },
  { icon: Eye, label: "Visual communication" },
  { icon: Lightbulb, label: "Creative concept development" },
  { icon: Brush, label: "Social media design sense" },
  { icon: Wand2, label: "AI-assisted design workflow" },
];

const softSkills = [
  { icon: MessagesSquare, label: "Communication" },
  { icon: Users, label: "Client understanding" },
  { icon: Lightbulb, label: "Creative problem solving" },
  { icon: Clock, label: "Time management" },
  { icon: Sparkles, label: "Adaptability" },
  { icon: Eye, label: "Attention to detail" },
];

const services = [
  { icon: PenTool, title: "Logo Design", desc: "Distinctive marks built around your brand idea." },
  { icon: Layout, title: "Banner Design", desc: "Clean, conversion-friendly digital banners." },
  { icon: Palette, title: "Product Design", desc: "Packaging and product visuals that sell." },
  { icon: Brush, title: "Poster Design", desc: "Eye-catching posters with strong hierarchy." },
  { icon: Globe, title: "Basic Website Design", desc: "Simple, modern sites tailored to your brand." },
];

function SkillsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="px-6 md:px-10 pt-8 md:pt-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link to="/" className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors">
            ← All versions
          </Link>
          <nav className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em]">
            <Link to="/B" className="text-muted-foreground hover:text-foreground transition-colors">
              /B
            </Link>
            <Link to="/F" className="text-primary">
              /F
            </Link>
            <Link to="/P" className="text-muted-foreground hover:text-foreground transition-colors">
              /P
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-10 pt-10 md:pt-16 pb-12">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[24px] border border-border bg-card overflow-hidden p-8 md:p-14"
          >
            <div
              aria-hidden
              className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-25"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4">
                Graphic Designer • Branding • Canva • Adobe • AI
              </p>
              <h1
                className="font-black tracking-tight leading-[1.05] mb-5"
                style={{ fontSize: "clamp(36px, 6vw, 72px)" }}
              >
                Ali Nur Hasan
                <br />
                <span className="text-muted-foreground">under the brand</span>{" "}
                <span className="text-primary">TasTaj</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                I'm a graphics designer with{" "}
                <span className="text-foreground font-semibold">7 years of experience</span>. I
                create design work with a strong focus on branding, visual clarity, and practical
                client needs — combining creativity, design software knowledge, and clear
                communication to deliver effective design solutions.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  to="/P"
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  See projects →
                </Link>
                <Link
                  to="/B"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold hover:border-primary hover:text-primary transition-colors"
                >
                  Original portfolio
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <Section
        eyebrow="Services"
        title="What I design for clients"
        description="A focused set of services built around branding and visual identity."
      >
        <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Card key={s.title} delay={i * 0.05}>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary grid place-items-center mb-4">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Graphic Design Skills */}
      <Section
        eyebrow="Graphic Design"
        title="Core design skills"
        description="The disciplines I practice every day."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {designSkills.map((label, i) => (
            <Card key={label} delay={i * 0.04} compact>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-semibold">{label}</span>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Tools */}
      <Section
        eyebrow="Design Tools"
        title="Software I work with"
        description="A blend of fast Canva workflows and the full Adobe Creative suite."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t, i) => (
            <Card key={t.name} delay={i * 0.05}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Tool
              </p>
              <h3 className="text-lg font-bold mb-1">{t.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Creative + Soft */}
      <Section
        eyebrow="Creative & Digital"
        title="How I think about design"
        description="The creative habits that shape every project I take on."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {creativeSkills.map((s, i) => (
            <Card key={s.label} delay={i * 0.04} compact>
              <div className="flex items-center gap-3">
                <s.icon className="w-4 h-4 text-primary" />
                <span className="font-semibold">{s.label}</span>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Soft Skills"
        title="Working with clients"
        description="Design only works when the collaboration around it works."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {softSkills.map((s, i) => (
            <Card key={s.label} delay={i * 0.04} compact>
              <div className="flex items-center gap-3">
                <s.icon className="w-4 h-4 text-primary" />
                <span className="font-semibold">{s.label}</span>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <footer className="px-6 md:px-10 py-10 text-center text-xs text-muted-foreground border-t border-border mt-8">
        © {new Date().getFullYear()} Ali Nur Hasan · TasTaj ·{" "}
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
      </footer>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-6 md:px-10 py-10 md:py-14">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-7 md:mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-2">
            {eyebrow}
          </p>
          <h2
            className="font-black tracking-tight leading-tight"
            style={{ fontSize: "clamp(24px, 3vw, 40px)" }}
          >
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function Card({
  children,
  delay = 0,
  compact = false,
}: {
  children: React.ReactNode;
  delay?: number;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className={`rounded-2xl border border-border bg-card hover:border-primary/60 transition-colors ${
        compact ? "p-4" : "p-6"
      }`}
    >
      {children}
    </motion.div>
  );
}
