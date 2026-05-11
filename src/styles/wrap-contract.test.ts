import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Contract / regression tests for the global text-wrap and overflow
 * safeguard system.
 *
 * Two layers:
 *   1. CSS contract — the critical rules in src/styles.css must exist
 *      and stay in @layer base (so utility classes can still override
 *      per-component, but components can't accidentally lose them).
 *   2. Source-code allowlist — no component may reintroduce an inline
 *      style override that fights the global rules. New offenders fail
 *      the test with a precise file:line so the author knows where to
 *      look.
 *
 * If you legitimately need to override one of the forbidden patterns
 * (e.g. a single-line marquee, an explicit truncation surface), add the
 * file path to the ALLOWLIST below with a one-line justification.
 *
 * Why not Playwright VRT? A pixel-diff regression suite would need a
 * full browser and a snapshot baseline checked into git. The actual
 * failure mode we're guarding against is "someone pastes
 * `style={{ textWrap: 'nowrap' }}` into a Card" — this static check
 * catches that in <100ms with no infrastructure.
 */

const ROOT = join(__dirname, "..");
const STYLES_PATH = join(ROOT, "styles.css");
const SRC_DIR = join(ROOT);

// --- 1. CSS contract -------------------------------------------------------

describe("CSS contract — global wrapping & overflow safeguards", () => {
  const css = readFileSync(STYLES_PATH, "utf8");

  // A loose substring check is intentional: we want any whitespace /
  // comment placement to count as a match. The canonical formatting is
  // tested separately by Prettier.
  const REQUIRED_RULES: Array<{ desc: string; needle: RegExp }> = [
    {
      desc: "html, body never scroll horizontally",
      needle: /html,\s*body\s*\{\s*overflow-x:\s*clip/,
    },
    {
      desc: "#root and main hard-clip overflow",
      needle: /#root,\s*main\s*\{\s*max-width:\s*100%;\s*overflow-x:\s*clip/,
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
      desc: "a/code/kbd break long unbroken strings",
      needle:
        /a\[href\],\s*code,\s*kbd,\s*samp,\s*var\s*\{[^}]*overflow-wrap:\s*anywhere/,
    },
    {
      desc: "form controls clamp their intrinsic min-width",
      needle:
        /input,\s*textarea,\s*select\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/,
    },
    {
      desc: ".break-token uses friendly break-word (not anywhere)",
      needle:
        /\.break-token\s*\{[^}]*overflow-wrap:\s*break-word[^}]*word-break:\s*normal/,
    },
    {
      desc: ".break-token-hard escape hatch exists",
      needle: /\.break-token-hard\s*\{[^}]*overflow-wrap:\s*anywhere/,
    },
    {
      desc: "tables clamp to 100% and cells wrap long tokens",
      needle: /table\s*\{\s*max-width:\s*100%/,
    },
    {
      desc: "<pre> scrolls inside itself, never wraps",
      needle: /pre\s*\{[^}]*overflow-x:\s*auto[^}]*white-space:\s*pre/,
    },
    {
      desc: "monospace baseline applies to code/kbd/samp/var/pre",
      needle:
        /code,\s*kbd,\s*samp,\s*var,\s*pre\s*\{[^}]*font-family:\s*[^;]*ui-monospace/,
    },
  ];

  for (const { desc, needle } of REQUIRED_RULES) {
    it(`keeps rule: ${desc}`, () => {
      expect(
        css,
        `Missing required CSS rule. Pattern: ${needle}\n` +
          `If you intentionally removed this rule, update the CSS contract test.`,
      ).toMatch(needle);
    });
  }
});

// --- 2. Source-code allowlist ---------------------------------------------

/**
 * Files allowed to use one of the forbidden patterns. Each entry must
 * include a justification — the test runner prints it on failure so the
 * next reviewer understands why the override exists.
 *
 * Path is relative to the project root (e.g. "src/components/foo.tsx").
 */
const ALLOWLIST: Record<string, string> = {
  // The component IS the truncation primitive — its job is to override
  // the global wrap rule with `[overflow-wrap:normal]` so single-line
  // ellipsis works.
  "src/components/ui/truncated-text.tsx":
    "TruncatedText is the opt-in single-line ellipsis primitive.",
  // Self-test fixture — renders worst-case strings on purpose.
  "src/routes/_admin.admin.overflow-tests.tsx":
    "QA bench renders forbidden patterns deliberately to verify safeguards.",
  // Contract test itself contains the forbidden patterns as string literals.
  "src/styles/wrap-contract.test.ts":
    "This file lists the forbidden patterns as test data.",
};

/**
 * Regex patterns that indicate a component is fighting the global
 * wrap/overflow system. Each pattern targets ONE specific override
 * mechanism — keep them precise to minimize false positives.
 */
const FORBIDDEN_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: "inline style textWrap override",
    regex: /style=\{\{[^}]*textWrap\s*:/,
  },
  {
    name: "inline style wordBreak override",
    regex: /style=\{\{[^}]*wordBreak\s*:/,
  },
  {
    name: "inline style hyphens override",
    regex: /style=\{\{[^}]*hyphens\s*:/,
  },
  {
    name: "inline style overflowWrap override",
    regex: /style=\{\{[^}]*overflowWrap\s*:/,
  },
  {
    name: "inline style whiteSpace: nowrap (use `whitespace-nowrap` Tailwind class only on chips/buttons/marquees)",
    regex: /style=\{\{[^}]*whiteSpace\s*:\s*['"]nowrap/,
  },
];

const SCAN_EXTENSIONS = new Set([".tsx", ".ts"]);
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".vite",
  "coverage",
  "integrations", // generated supabase files
]);

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walk(full);
    } else if (SCAN_EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) {
      yield full;
    }
  }
}

describe("Source allowlist — no component overrides the wrap safeguards", () => {
  it("does not reintroduce forbidden inline-style overrides", () => {
    const violations: string[] = [];
    const projectRoot = join(__dirname, "..", "..");

    for (const file of walk(SRC_DIR)) {
      const rel = relative(projectRoot, file);
      const allowReason = ALLOWLIST[rel];
      const content = readFileSync(file, "utf8");

      for (const { name, regex } of FORBIDDEN_PATTERNS) {
        const match = content.match(regex);
        if (!match) continue;

        if (allowReason) continue; // Allowlisted file — skip silently.

        // Find line number for a useful error message.
        const before = content.slice(0, match.index ?? 0);
        const line = before.split("\n").length;
        violations.push(`  ${rel}:${line}  → ${name}\n      ${match[0]}`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `\nFound ${violations.length} forbidden wrap-override(s):\n\n${violations.join(
          "\n",
        )}\n\n` +
          `These patterns fight the global text-wrap / overflow-safeguard\n` +
          `rules in src/styles.css. Use Tailwind utilities (truncate,\n` +
          `whitespace-nowrap, .break-token) or the <TruncatedText /> primitive\n` +
          `instead. If the override is genuinely required, add the file path\n` +
          `to ALLOWLIST in src/styles/wrap-contract.test.ts with a justification.\n`,
      );
    }
  });
});
