/**
 * Admin → Theme audit
 *
 * Read-only inspector for the active design tokens.
 *
 * - Reads computed CSS variable values from :root at runtime so what you
 *   see is what the page actually renders (light/dark switching included).
 * - Groups tokens: Color, Surface, Brand gradients, Shadows, Typography.
 * - Live component previews use the real semantic Tailwind classes
 *   (bg-primary, text-foreground, …) — same code paths as production pages.
 *
 * No DB writes. To change a token, edit src/styles.css.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminPage, AdminCard } from "@/components/admin/AdminPage";
import { Palette, Layers, Sparkles, Sun, Moon, Copy, Check, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { contrastRatio, gradeContrast, gradeStyle } from "@/lib/contrast";

/**
 * Text/background pairs that actually appear on public pages. Each pair is
 * graded against WCAG 2.1 ratios. Pairs marked `large` use ≥18pt / ≥14pt bold
 * thresholds (3:1 AA, 4.5:1 AAA) — appropriate for hero headings.
 */
const CONTRAST_PAIRS: Array<{ label: string; fg: string; bg: string; large?: boolean; note?: string }> = [
  { label: "Body text on background", fg: "var(--foreground)", bg: "var(--background)" },
  { label: "Body text on card", fg: "var(--foreground)", bg: "var(--card)" },
  { label: "Muted text on background", fg: "var(--muted-foreground)", bg: "var(--background)" },
  { label: "Muted text on card", fg: "var(--muted-foreground)", bg: "var(--card)" },
  { label: "Primary accent text on background", fg: "var(--primary)", bg: "var(--background)", note: "Italic gold accents (\"people\", \"folder\", \"build\")" },
  { label: "Primary accent text on card", fg: "var(--primary)", bg: "var(--card)" },
  { label: "Hero accent (large text)", fg: "var(--primary)", bg: "var(--background)", large: true, note: "Headings ≥18pt or ≥14pt bold" },
  { label: "Primary button label on primary", fg: "var(--primary-foreground)", bg: "var(--primary)" },
  { label: "Secondary button label", fg: "var(--secondary-foreground)", bg: "var(--secondary)" },
  { label: "Destructive button label", fg: "var(--destructive-foreground)", bg: "var(--destructive)" },
  { label: "Destructive text on background", fg: "var(--destructive)", bg: "var(--background)" },
];

export const Route = createFileRoute("/_admin/admin/theme")({
  component: AdminThemePage,
});

const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
];

const BRAND_TOKENS = ["ink", "ink-soft", "watermark"];
const GRADIENT_TOKENS = ["gradient-card", "gradient-gold"];
const SHADOW_TOKENS = ["shadow-card", "shadow-soft", "shadow-elevated", "shadow-glow"];

function readVar(name: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1100);
        });
      }}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent/10 hover:text-foreground"
      aria-label="Copy value"
      title="Copy value"
    >
      {done ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function ColorSwatch({ name, value, isText }: { name: string; value: string; isText?: boolean }) {
  const swatchStyle: React.CSSProperties = isText
    ? {
        background: "var(--card)",
        color: `var(--${name})`,
        borderColor: "var(--border)",
      }
    : { background: `var(--${name})`, borderColor: "var(--border)" };
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="flex h-16 items-center justify-center text-xs font-bold tracking-wide"
        style={swatchStyle}
      >
        {isText ? "Aa" : ""}
      </div>
      <div className="flex items-start justify-between gap-2 p-2.5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-mono text-foreground">--{name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{value || "—"}</p>
        </div>
        <CopyBtn text={`var(--${name})`} />
      </div>
    </div>
  );
}

function ShadowSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div
        className="mx-auto h-16 w-full max-w-[160px] rounded-xl bg-card"
        style={{ boxShadow: `var(--${name})` }}
      />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-mono">--{name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{value || "—"}</p>
        </div>
        <CopyBtn text={`var(--${name})`} />
      </div>
    </div>
  );
}

function GradientSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="h-20 w-full" style={{ background: `var(--${name})` }} />
      <div className="flex items-start justify-between gap-2 bg-card p-2.5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-mono">--{name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{value || "—"}</p>
        </div>
        <CopyBtn text={`var(--${name})`} />
      </div>
    </div>
  );
}

function ContrastChecker({ tick }: { tick: number }) {
  // tick forces a re-render after the theme class changes so var() values re-resolve
  void tick;
  const rows = CONTRAST_PAIRS.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    const grade = ratio == null ? "Fail" : gradeContrast(ratio, p.large);
    const style = gradeStyle(grade as ReturnType<typeof gradeContrast>);
    return { ...p, ratio, grade, style };
  });
  const failing = rows.filter((r) => r.grade === "Fail").length;
  const warning = rows.filter((r) => r.grade === "AA Large" && !r.large).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {failing === 0 && warning === 0
            ? "All checked pairs meet WCAG AA."
            : `${failing} failing · ${warning} marginal`}
        </span>
        <span className="text-foreground/40">·</span>
        <span>Thresholds: AA 4.5:1, AAA 7:1 (large text 3:1 / 4.5:1)</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Pair</th>
              <th className="px-3 py-2 font-medium">Sample</th>
              <th className="px-3 py-2 font-medium text-right">Ratio</th>
              <th className="px-3 py-2 font-medium text-right">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} className={i % 2 ? "bg-card/40" : "bg-background/40"}>
                <td className="px-3 py-3 align-middle">
                  <p className="font-medium text-foreground">{r.label}</p>
                  {r.note && <p className="text-[11px] text-muted-foreground">{r.note}</p>}
                </td>
                <td className="px-3 py-3 align-middle">
                  <span
                    className="inline-block rounded-md px-3 py-1.5"
                    style={{ background: r.bg, color: r.fg }}
                  >
                    <span className={r.large ? "text-lg font-bold" : ""}>Aa Sample</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-right align-middle font-mono text-xs">
                  {r.ratio != null ? `${r.ratio.toFixed(2)}:1` : "—"}
                </td>
                <td className="px-3 py-3 text-right align-middle">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${r.style.className}`}>
                    {r.style.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComponentPreviews() {
  return (
    <div className="space-y-6">
      {/* Buttons */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Buttons</p>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Primary
          </button>
          <button className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:opacity-90">
            Secondary
          </button>
          <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent/10">
            Outline
          </button>
          <button className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:opacity-90">
            Destructive
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            style={{ background: "var(--gradient-gold)" }}
          >
            Gradient
          </button>
        </div>
      </div>

      {/* Headings */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Headings</p>
        <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-extrabold tracking-tight text-2xl text-foreground">
            Trusted by <span className="font-serif-display italic text-primary">people</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Body copy uses <code className="text-foreground">text-muted-foreground</code> on{" "}
            <code className="text-foreground">bg-card</code>.
          </p>
        </div>
      </div>

      {/* Form */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Form</p>
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
          <input
            placeholder="Input"
            className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option>Select…</option>
            <option>Option A</option>
          </select>
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Badges & accents</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            Default
          </span>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">Primary</span>
          <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive">
            Error
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            Premium
          </span>
        </div>
      </div>
    </div>
  );
}

function AdminThemePage() {
  const { theme, setTheme } = useTheme();
  const [tick, setTick] = useState(0);

  // Re-read CSS vars whenever theme changes
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setTick((t) => t + 1));
    return () => window.cancelAnimationFrame(id);
  }, [theme]);

  const colors = COLOR_TOKENS.map((n) => ({ name: n, value: readVar(n), isText: /foreground$/.test(n) }));
  const brand = BRAND_TOKENS.map((n) => ({ name: n, value: readVar(n) }));
  const gradients = GRADIENT_TOKENS.map((n) => ({ name: n, value: readVar(n) }));
  const shadows = SHADOW_TOKENS.map((n) => ({ name: n, value: readVar(n) }));
  // tick is consumed via the readVar() above re-evaluating on render
  void tick;

  return (
    <AdminPage
      title="Theme audit"
      description="Live snapshot of the active design tokens. Edit src/styles.css to change values — this page reflects whatever the page is actually rendering."
      actions={
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          <button
            onClick={() => setTheme("light")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${
              theme === "light" ? "bg-accent/15 text-foreground" : "text-muted-foreground"
            }`}
          >
            <Sun className="h-3 w-3" /> Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${
              theme === "dark" ? "bg-accent/15 text-foreground" : "text-muted-foreground"
            }`}
          >
            <Moon className="h-3 w-3" /> Dark
          </button>
        </div>
      }
    >
      <AdminCard
        title="Semantic colors"
        className=""
      >
        <p className="mb-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Palette className="h-3.5 w-3.5" />
          Foreground tokens preview as text on a card; surface tokens preview as a fill.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {colors.map((c) => (
            <ColorSwatch key={c.name} name={c.name} value={c.value} isText={c.isText} />
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Brand surfaces">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {brand.map((c) => (
            <ColorSwatch key={c.name} name={c.name} value={c.value} />
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Gradients">
        <div className="grid gap-3 sm:grid-cols-2">
          {gradients.map((g) => (
            <GradientSwatch key={g.name} name={g.name} value={g.value} />
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Shadows">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {shadows.map((s) => (
            <ShadowSwatch key={s.name} name={s.name} value={s.value} />
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Typography">
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">font-serif-display · italic</p>
            <p className="font-serif-display italic text-3xl text-primary">remarkable.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">font-sans · extrabold</p>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">Things I build</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">font-numeric</p>
            <p className="font-numeric text-3xl tabular-nums text-foreground">1,284 · 99.9%</p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Component previews">
        <p className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          Same Tailwind classes used across public pages.
        </p>
        <ComponentPreviews />
      </AdminCard>

      <AdminCard title="How to change tokens">
        <p className="text-sm text-muted-foreground">
          All tokens live in <code className="text-foreground">src/styles.css</code> under{" "}
          <code className="text-foreground">.dark</code> and{" "}
          <code className="text-foreground">.light</code>. Edit there and every page updates
          automatically — there is no DB-driven theme override.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Tip: use Visual Edits for one-off color tweaks on
          static elements without touching code.
        </div>
      </AdminCard>
    </AdminPage>
  );
}
