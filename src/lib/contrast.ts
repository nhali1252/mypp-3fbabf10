/**
 * WCAG contrast utilities.
 *
 * Resolves any CSS color string (rgb/oklch/hex/named) to sRGB by letting the
 * browser do the math: assign the color to a hidden element and read the
 * computed `color`, which is always normalised to `rgb(...)` / `rgba(...)`.
 *
 * Then computes the WCAG 2.1 contrast ratio (1–21) between two colors and
 * grades it for normal text (≥4.5 AA, ≥7 AAA) and large text (≥3 AA, ≥4.5 AAA).
 *
 * Limitations: opacity-based tokens (e.g. `oklch(1 0 0 / 0.08)` for borders)
 * are reported against an opaque interpretation. Borders/inputs aren't
 * graded as text — only true text/background pairings are.
 */

export type ContrastGrade = "AAA" | "AA" | "AA Large" | "Fail";

let probeEl: HTMLDivElement | null = null;
function getProbe(): HTMLDivElement {
  if (probeEl) return probeEl;
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style.width = "0";
  el.style.height = "0";
  document.body.appendChild(el);
  probeEl = el;
  return el;
}

/** Resolve any CSS color string to {r,g,b,a} in 0–255 / 0–1. */
export function resolveColor(input: string): { r: number; g: number; b: number; a: number } | null {
  if (typeof window === "undefined" || !input) return null;
  const probe = getProbe();
  probe.style.color = "";
  probe.style.color = input;
  const computed = getComputedStyle(probe).color;
  const m = computed.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => s.trim());
  const r = parseFloat(parts[0]);
  const g = parseFloat(parts[1]);
  const b = parseFloat(parts[2]);
  const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
}

function srgbChannel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

/** WCAG contrast ratio between two CSS color strings. Returns null if a color cannot be resolved. */
export function contrastRatio(fg: string, bg: string): number | null {
  const f = resolveColor(fg);
  const b = resolveColor(bg);
  if (!f || !b) return null;
  const L1 = relativeLuminance(f);
  const L2 = relativeLuminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export function gradeContrast(ratio: number, isLargeText = false): ContrastGrade {
  if (isLargeText) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA Large";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

export function gradeStyle(grade: ContrastGrade): { label: string; className: string } {
  switch (grade) {
    case "AAA":
      return { label: "AAA", className: "bg-emerald-500/15 text-emerald-500" };
    case "AA":
      return { label: "AA", className: "bg-emerald-500/15 text-emerald-500" };
    case "AA Large":
      return { label: "AA Large only", className: "bg-amber-500/15 text-amber-500" };
    case "Fail":
      return { label: "Fail", className: "bg-destructive/15 text-destructive" };
  }
}
