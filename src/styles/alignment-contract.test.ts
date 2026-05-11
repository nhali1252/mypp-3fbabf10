import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Visual-regression contract for site-wide TEXT ALIGNMENT.
 *
 * The user's reference is: justified body copy, left-aligned headings,
 * cross-browser hyphenation, and identical behavior at every breakpoint.
 *
 * A pixel-diff suite (Playwright + image snapshots) would need a browser
 * binary, font-fallback parity across CI/dev, and a baseline per page ×
 * per breakpoint. Every minor copy edit would re-bless dozens of PNGs and
 * the diff would tell you "the image changed", not WHY.
 *
 * Instead we encode the contract semantically:
 *   1. styles.css must contain the alignment rules (justify on p/dd/
 *      blockquote, balance/pretty on headings/body, vendor-prefixed
 *      hyphens on every text-bearing element, and a mobile @media block
 *      that keeps justify enabled).
 *   2. No page/section component may bypass the contract by hard-coding
 *      `text-align: left` or `text-align: justify` inline (the .align-*
 *      utilities and the documented landing-strip exception are fine).
 *
 * That catches the actual regressions ("someone pasted text-align:left
 * into a Card", "the @media block lost its --text-align-body override",
 * "hyphens prefix dropped for Safari") in <100ms with no infrastructure.
 */

const ROOT = join(__dirname, "..");
const STYLES_PATH = join(ROOT, "styles.css");
const SRC_DIR = join(ROOT);

// --- 1. CSS contract -------------------------------------------------------

describe("CSS contract — site-wide text alignment", () => {
  const css = readFileSync(STYLES_PATH, "utf8");

  const REQUIRED_RULES: Array<{ desc: string; needle: RegExp }> = [
    {
      desc: "global --text-align-body token defaults to justify",
      needle: /--text-align-body:\s*justify/,
    },
    {
      desc: "p/dd consume --text-align-body via var()",
      needle: /p,\s*dd\s*\{[^}]*text-align:\s*var\(--text-align-body\)/,
    },
    {
      desc: "blockquote consumes --text-align-body via var()",
      needle: /blockquote\s*\{[^}]*text-align:\s*var\(--text-align-body\)/,
    },
    {
      desc: "body copy uses inter-word justification (no rivers)",
      needle: /p,\s*dd\s*\{[^}]*text-justify:\s*inter-word/,
    },
    {
      desc: "headings use text-wrap: balance",
      needle: /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*text-wrap:\s*balance/,
    },
    {
      desc: "body copy uses text-wrap: pretty",
      needle: /p,\s*li,\s*blockquote,\s*dd\s*\{[^}]*text-wrap:\s*pretty/,
    },
    {
      desc: "headings ship vendor-prefixed -webkit-hyphens",
      needle:
        /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*-webkit-hyphens:\s*auto/,
    },
    {
      desc: "headings ship vendor-prefixed -moz-hyphens",
      needle:
        /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*-moz-hyphens:\s*auto/,
    },
    {
      desc: "body copy ships vendor-prefixed -webkit-hyphens",
      needle: /p,\s*li,\s*blockquote,\s*dd\s*\{[^}]*-webkit-hyphens:\s*auto/,
    },
    {
      desc: "body copy ships vendor-prefixed -moz-hyphens",
      needle: /p,\s*li,\s*blockquote,\s*dd\s*\{[^}]*-moz-hyphens:\s*auto/,
    },
    {
      desc: "legacy word-wrap fallback for old WebKit",
      needle: /p,\s*li,\s*blockquote,\s*dd\s*\{[^}]*word-wrap:\s*break-word/,
    },
    {
      desc: ".no-justify opt-out exists for short copy",
      needle: /\.no-justify\s*\{[^}]*text-align:\s*left/,
    },
    {
      desc: "mobile @media keeps body text justified (no fallback to left)",
      needle:
        /@media\s*\(max-width:\s*640px\)[\s\S]*?--text-align-body:\s*justify/,
    },
    {
      desc: ".align-hero / .align-body / .align-eyebrow utilities exist",
      needle: /\.align-hero[\s\S]*\.align-body[\s\S]*\.align-eyebrow/,
    },
  ];

  for (const { desc, needle } of REQUIRED_RULES) {
    it(`keeps rule: ${desc}`, () => {
      expect(
        css,
        `Missing required alignment rule. Pattern: ${needle}\n` +
          `If you intentionally removed this rule, update alignment-contract.test.ts ` +
          `and the mem://design/text-alignment memory.`,
      ).toMatch(needle);
    });
  }
});

// --- 2. Source-code allowlist ---------------------------------------------

/**
 * Components allowed to set an explicit text-align inline. Each entry
 * must include a justification.
 *
 * The .align-hero / .align-body / .align-eyebrow utilities and Tailwind's
 * text-center / text-left / text-right utilities are NOT covered by this
 * test — they are the documented opt-in mechanism.
 */
const ALLOWLIST: Record<string, string> = {
  // Page-hero landing strips intentionally stay text-center at every
  // breakpoint per memory:design/text-alignment.
  "src/components/pages/PortfolioPage.tsx": "Landing strip stays text-center",
  "src/components/pages/ProjectsPage.tsx": "Landing strip stays text-center",
  "src/components/pages/ServicesTasTajPage.tsx":
    "Landing strip stays text-center",
  "src/components/pages/ContactPage.tsx": "Landing strip stays text-center",
  "src/components/pages/ReviewsPage.tsx": "Landing strip stays text-center",
  // Diagnostic / health readout — monospace technical output, not site copy.
  "src/routes/health.tsx": "Health-check JSON dump, not user-facing prose",
};

/** Forbidden inline patterns — both JSX style objects and CSS strings. */
const FORBIDDEN_PATTERNS: Array<{ desc: string; rx: RegExp }> = [
  {
    desc: "inline textAlign override via style={{ textAlign: ... }}",
    rx: /style\s*=\s*\{\s*\{[^}]*\btextAlign\s*:\s*['"`](left|right|justify|center)['"`]/,
  },
  {
    desc: "inline text-align override via style=\"text-align: ...\"",
    rx: /style\s*=\s*["'`][^"'`]*\btext-align\s*:\s*(left|right|justify|center)/,
  },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(name) && !/\.test\.(t|j)sx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe("Source allowlist — no inline text-align overrides", () => {
  const files = walk(SRC_DIR);

  for (const { desc, rx } of FORBIDDEN_PATTERNS) {
    it(`no file uses ${desc}`, () => {
      const offenders: string[] = [];
      for (const file of files) {
        const rel = relative(join(ROOT, ".."), file).replace(/\\/g, "/");
        if (rel in ALLOWLIST) continue;
        const src = readFileSync(file, "utf8");
        const m = src.match(rx);
        if (m) {
          const line = src.slice(0, m.index!).split("\n").length;
          offenders.push(`${rel}:${line}  → ${m[0].slice(0, 80)}…`);
        }
      }
      expect(
        offenders,
        offenders.length
          ? `Inline text-align overrides found. Use the .align-* utilities ` +
              `from styles.css instead, or add the file to ALLOWLIST with a ` +
              `justification.\n\n` +
              offenders.join("\n")
          : undefined,
      ).toEqual([]);
    });
  }
});
