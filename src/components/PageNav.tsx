import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";

const items = [
  { to: "/basic" as const, label: "Basic" },
  { to: "/about-and-skills" as const, label: "About" },
  { to: "/projects" as const, label: "Portfolio" },
  { to: "/services" as const, label: "Services" },
  { to: "/contact" as const, label: "Contact" },
];

export function PageNav({ active }: { active?: string }) {
  return (
    <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3">
        <Link
          to="/"
          className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All pages
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="hidden sm:flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className={
                  active === it.to
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {it.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
