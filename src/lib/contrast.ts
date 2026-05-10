/**
 * WCAG contrast utilities. Browsers always serialize getComputedStyle().color
 * as `rgb(r g b / a)` or `rgb(r, g, b)` even when authored as oklch(), so we
 * resolve any CSS color by writing it to a probe element and reading it back.
 */

function parseRgb(input: string): [number, number, number] | null {
  const m = input.match(/-?\d*\.?\d+/g);
  if (!m || m.length < 3) return null;
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

let probe: HTMLDivElement | null = null;
function resolveColor(cssValue: string): [number, number, number] | null {
  if (typeof document === "undefined") return null;
  if (!probe) {
    probe = document.createElement("div");
    probe.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
    document.body.appendChild(probe);
  }
  probe.style.color = "";
  probe.style.color = cssValue;
  const c = getComputedStyle(probe).color;
  return parseRgb(c);
}

function relLum([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: string, b: string): number | null {
  const ra = resolveColor(a);
  const rb = resolveColor(b);
  if (!ra || !rb) return null;
  const la = relLum(ra);
  const lb = relLum(rb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastGrade = "AAA" | "AA" | "AA Large" | "Fail";

export function gradeContrast(ratio: number, large?: boolean): ContrastGrade {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return large ? "AA" : "AA Large";
  return "Fail";
}

export function gradeStyle(grade: ContrastGrade): {
  label: string;
  className: string;
} {
  switch (grade) {
    case "AAA":
      return { label: "AAA", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" };
    case "AA":
      return { label: "AA", className: "bg-sky-500/15 text-sky-500 border-sky-500/30" };
    case "AA Large":
      return { label: "AA Large", className: "bg-amber-500/15 text-amber-500 border-amber-500/30" };
    default:
      return { label: "Fail", className: "bg-rose-500/15 text-rose-500 border-rose-500/30" };
  }
}
