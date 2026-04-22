import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: VersionChooser,
  head: () => ({
    meta: [
      { title: "Ali Nur Hasan — Portfolio Pages" },
      {
        name: "description",
        content:
          "Browse Ali Nur Hasan's portfolio: original site (B), skills & about (F), and projects (P).",
      },
    ],
  }),
});

type Version = {
  slug: "/B" | "/F" | "/P";
  label: string;
  title: string;
  description: string;
  badge: string;
};

const versions: Version[] = [
  {
    slug: "/B",
    label: "Page B",
    title: "Original portfolio",
    description:
      "The full original portfolio with hero, about, projects, activities and contact sections.",
    badge: "Original",
  },
  {
    slug: "/F",
    label: "Page F",
    title: "Skills & about",
    description:
      "A polished page focused on my graphic design skills, tools and professional background.",
    badge: "Skills",
  },
  {
    slug: "/P",
    label: "Page P",
    title: "Projects",
    description:
      "Selected work — my-v7 / my-v8 portfolio + CMS and the Pocket-Ledger finance app.",
    badge: "Projects",
  },
];

function VersionChooser() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 md:px-10 pt-10 md:pt-16">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Portfolio · TasTaj
          </p>
          <h1
            className="font-black tracking-tight leading-[1.05]"
            style={{ fontSize: "clamp(34px, 5.4vw, 64px)" }}
          >
            Ali Nur Hasan
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Pick a page to explore. Each card opens an independent portfolio page.
          </p>
        </div>
      </header>

      <main className="flex-1 px-6 md:px-10 py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto grid gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {versions.map((v, i) => (
            <motion.div
              key={v.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            >
              <Link
                to={v.slug}
                className="group relative block rounded-[24px] border border-border bg-card p-7 md:p-9 overflow-hidden hover:border-primary transition-colors h-full"
              >
                <div
                  aria-hidden
                  className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in oklab, var(--primary) 60%, transparent) 0%, transparent 70%)",
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
                      {v.label}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
                      {v.badge}
                    </span>
                  </div>
                  <h2
                    className="font-black tracking-tight leading-tight mb-3"
                    style={{ fontSize: "clamp(22px, 2.4vw, 30px)" }}
                  >
                    {v.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                    {v.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    Open {v.label}
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="px-6 md:px-10 py-8 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Ali Nur Hasan · TasTaj ·{" "}
        <Link to="/auth" className="hover:text-foreground transition-colors">
          Admin
        </Link>
      </footer>
    </div>
  );
}
