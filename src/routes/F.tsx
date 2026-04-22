import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import portrait from "@/assets/ali-portrait.png";
import {
  TrendingUp,
  Layout,
  Sparkles,
  Globe,
  MessagesSquare,
  Users,
  Lightbulb,
  Clock,
  Eye,
  GraduationCap,
  HeartHandshake,
  BookOpen,
  PresentationIcon,
  BarChart3,
  Briefcase,
  Languages,
} from "lucide-react";

export const Route = createFileRoute("/F")({
  component: SkillsPage,
  head: () => ({
    meta: [
      { title: "Skills & About — Ali Nur Hasan" },
      {
        name: "description",
        content:
          "Ali Nur Hasan — BBA 3rd Year, Department of Marketing at Habibullah Bahar College (National University). Skills, education, and digital tools.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: "Skills & About — Ali Nur Hasan" },
      {
        property: "og:description",
        content:
          "BBA Marketing student focused on business growth, communication, digital tools, and professional development.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Skills & About — Ali Nur Hasan" },
      {
        property: "twitter:description",
        content:
          "BBA 3rd Year — Marketing. Business awareness, communication, Excel, PowerPoint, Google Workspace.",
      },
    ],
  }),
});

const coreSkills = [
  "Marketing",
  "Business Awareness",
  "Communication",
  "Excel",
  "PowerPoint",
  "Google Workspace",
  "Problem Solving",
  "Teamwork",
  "Fast Learner",
];

const services = [
  {
    icon: TrendingUp,
    title: "Marketing & Business",
    desc: "Business awareness, market analysis, presentation, and professional communication.",
  },
  {
    icon: Layout,
    title: "Digital Tools",
    desc: "Microsoft Office, Google Workspace, and Excel-based data visualization.",
  },
  {
    icon: Sparkles,
    title: "Personal Strengths",
    desc: "Critical thinking, adaptability, teamwork, and clear professional communication.",
  },
  {
    icon: Globe,
    title: "Languages",
    desc: "Bengali (native) and English at B2 — reading, writing, listening, and speaking.",
  },
];

const tools = [
  { name: "Microsoft Excel", desc: "Spreadsheets, data tables, and basic visualization" },
  { name: "Microsoft PowerPoint", desc: "Professional presentations and decks" },
  { name: "Microsoft Word", desc: "Reports, documents, and business writing" },
  { name: "Google Workspace", desc: "Docs, Sheets, Slides, Drive, and Gmail" },
];

const creativeSkills = [
  { icon: BarChart3, label: "Market analysis thinking" },
  { icon: PresentationIcon, label: "Presentation design" },
  { icon: BookOpen, label: "Continuous learning" },
  { icon: Lightbulb, label: "Creative problem solving" },
  { icon: Briefcase, label: "Business communication" },
  { icon: Languages, label: "Bilingual communication" },
];

const softSkills = [
  { icon: MessagesSquare, label: "Communication" },
  { icon: Users, label: "Teamwork" },
  { icon: Lightbulb, label: "Critical thinking" },
  { icon: Clock, label: "Time management" },
  { icon: Sparkles, label: "Adaptability" },
  { icon: Eye, label: "Attention to detail" },
];

const education = [
  {
    degree: "BBA — Department of Marketing",
    institution: "Habibullah Bahar College",
    university: "National University",
    period: "3rd Year · Session 2022–23",
    note: "Currently pursuing my Bachelor of Business Administration with a major in Marketing.",
  },
  {
    degree: "Higher Secondary Certificate (HSC)",
    institution: "Nawab Fayzunnesa Govt. College",
    university: null,
    period: "2020–2023",
    note: "Group: Business Studies · GPA 4.00 / 5.00",
  },
  {
    degree: "Secondary School Certificate (SSC)",
    institution: "A. Malek Institution",
    university: null,
    period: "2014–2020",
    note: "Group: Science · GPA 4.67 / 5.00",
  },
];

const activities = [
  {
    icon: HeartHandshake,
    title: "BADHAN Blood Donation Club",
    period: "2021–2024",
    desc: "Organized donation drives, facilitated donor connections, and built communication and community-service skills.",
    tags: ["Community", "Leadership", "Communication"],
  },
  {
    icon: Users,
    title: "Bangladesh Scouts",
    period: "2014–2019",
    desc: "Led team activities, maintained discipline during events, and developed leadership across five structured years.",
    tags: ["Discipline", "Teamwork", "Leadership"],
  },
  {
    icon: BookOpen,
    title: "Self-directed Learning",
    period: "Ongoing",
    desc: "Ongoing development via 10 Minute School, Udemy, and YouTube — business, management, and professional skills.",
    tags: ["10 Minute School", "Udemy", "YouTube"],
  },
];

function SkillsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All versions
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
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
      <section className="px-5 sm:px-6 md:px-10 pt-8 sm:pt-10 md:pt-16 pb-10 sm:pb-12">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[20px] sm:rounded-[24px] border border-border bg-card overflow-hidden p-6 sm:p-8 md:p-14"
          >
            <div
              aria-hidden
              className="absolute -top-24 sm:-top-32 -right-24 sm:-right-32 w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full blur-3xl opacity-25 animate-pulse"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent) 0%, transparent 70%)",
              }}
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-32 w-[300px] h-[300px] rounded-full blur-3xl opacity-20"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--primary) 50%, transparent) 0%, transparent 70%)",
              }}
            />

            <div className="relative grid md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_300px] gap-6 md:gap-10 items-center">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-primary mb-3 sm:mb-4">
                  BBA · Marketing · Communication · Digital Tools
                </p>
                <h1
                  className="font-black tracking-tight leading-[1.05] mb-4 sm:mb-5"
                  style={{ fontSize: "clamp(28px, 6vw, 72px)" }}
                >
                  Ali Nur Hasan
                  <br />
                  <span className="text-muted-foreground">BBA 3rd Year —</span>{" "}
                  <span className="text-primary">Marketing</span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Department of Marketing at{" "}
                  <span className="text-foreground font-semibold">Habibullah Bahar College</span>{" "}
                  under National University (Session 2022–23). Passionate about how businesses grow
                  globally and how marketing drives long-term value.
                </p>

                <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-6 sm:mt-8">
                  <Link
                    to="/P"
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    See projects →
                  </Link>
                  <Link
                    to="/B"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-bold hover:border-primary hover:text-primary transition-colors"
                  >
                    Original portfolio
                  </Link>
                </div>
              </div>

              {/* Portrait — same image as /B, with attractive visual effects */}
              <div className="relative mx-auto md:mx-0 group">
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full blur-2xl opacity-60"
                  style={{
                    background:
                      "conic-gradient(from 0deg, color-mix(in oklab, var(--primary) 60%, transparent), color-mix(in oklab, var(--primary) 10%, transparent), color-mix(in oklab, var(--primary) 60%, transparent))",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative rounded-full overflow-hidden ring-2 ring-primary/30 w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] lg:w-[280px] lg:h-[280px] bg-card">
                  <img
                    src={portrait}
                    alt="Ali Nur Hasan portrait"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core skills snapshot */}
      <Section
        eyebrow="Skills snapshot"
        title="Core skills"
        description="The capabilities I rely on every day across study, projects, and teamwork."
      >
        <div className="flex flex-wrap gap-2.5">
          {coreSkills.map((s, i) => (
            <motion.span
              key={s}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block px-4 py-2 rounded-full border border-border bg-card text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
            >
              {s}
            </motion.span>
          ))}
        </div>
      </Section>

      {/* Services / focus areas */}
      <Section
        eyebrow="Focus areas"
        title="What I bring to the table"
        description="A focused mix of marketing thinking, digital tools, and people skills."
      >
        <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-2">
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

      {/* Tools */}
      <Section
        eyebrow="Digital Tools"
        title="Software I work with"
        description="Day-to-day tools for studying, presenting, and organizing work."
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

      {/* Creative & Digital */}
      <Section
        eyebrow="Creative & Digital"
        title="How I approach work"
        description="The habits that shape how I learn and contribute."
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

      {/* Soft skills */}
      <Section
        eyebrow="Soft Skills"
        title="Working with people"
        description="The collaboration and communication habits I bring to every team."
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

      {/* Education */}
      <Section
        eyebrow="Education"
        title="Academic background"
        description="My current studies and previous academic milestones."
      >
        <div className="grid gap-4 md:gap-5">
          {education.map((e, i) => (
            <Card key={e.degree} delay={i * 0.05}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold">{e.degree}</h3>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {e.period}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-1">
                    {e.institution}
                    {e.university ? ` · ${e.university}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{e.note}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Activities */}
      <Section
        eyebrow="Activities"
        title="Beyond the classroom"
        description="Volunteer work, leadership experience, and continuous learning."
      >
        <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a, i) => (
            <Card key={a.title} delay={i * 0.05}>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary grid place-items-center mb-4">
                <a.icon className="w-5 h-5" />
              </div>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="text-base font-bold">{a.title}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                  {a.period}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{a.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {a.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border border-border text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <footer className="px-6 md:px-10 py-10 text-center text-xs text-muted-foreground border-t border-border mt-8">
        © {new Date().getFullYear()} Ali Nur Hasan ·{" "}
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
    <section className="px-5 sm:px-6 md:px-10 py-9 sm:py-10 md:py-14">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6 sm:mb-7 md:mb-10">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-primary mb-2">
            {eyebrow}
          </p>
          <h2
            className="font-black tracking-tight leading-tight"
            style={{ fontSize: "clamp(22px, 3.4vw, 40px)" }}
          >
            {title}
          </h2>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {description}
            </p>
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
