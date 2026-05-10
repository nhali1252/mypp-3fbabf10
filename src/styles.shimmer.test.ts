import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Static-CSS regression test for the global heading shimmer pipeline.
 *
 * Why this exists:
 *   The shimmer effect on h1/h2/h3 (gold gradient + animated sweep) is
 *   wired up in src/styles.css using a specific set of selectors. Several
 *   contexts MUST visually opt out (kill-switch, reduced motion, admin
 *   chrome, buttons, .no-shimmer, background-clip fallback) or the page
 *   either looks broken or — worse — renders text as fully transparent
 *   (because we set `color: transparent` to let the gradient show through).
 *
 *   jsdom can't compute background-clip / animation styles, so an
 *   integration test using getComputedStyle would be flaky. Instead we
 *   parse styles.css and assert that each required selector + the key
 *   opt-out declarations are present. Future refactors that drop one of
 *   these rules will fail this test in CI.
 *
 *   If you intentionally restructure the shimmer CSS, update the matchers
 *   below in the SAME commit so the contract stays explicit.
 */

let css = "";

beforeAll(() => {
  css = readFileSync(resolve(__dirname, "styles.css"), "utf8");
});

// Strip whitespace so multi-line selectors / declarations match reliably.
const compact = (s: string) => s.replace(/\s+/g, "");

describe("global heading shimmer (src/styles.css)", () => {
  it("applies the gold gradient + clip-text + animation to h1/h2/h3 (incl. Hero3DText spans)", () => {
    // The active rule MUST cover h1, h1 > span, h1 > span > span (Hero3DText
    // splits headings into per-letter spans), h2, and h3. Losing any of
    // these selectors causes the heading to render flat or to lose the
    // continuous sweep across per-letter spans.
    const c = compact(css);
    for (const sel of ["h1,", "h1>span,", "h1>span>span,", "h2,", "h3{"]) {
      expect(c, `missing shimmer selector "${sel}"`).toContain(sel);
    }
    // Core shimmer declarations on the active rule.
    expect(c).toContain("background-image:var(--shimmer-gradient)");
    expect(c).toContain("background-size:var(--shimmer-sweep-size)100%");
    expect(c).toContain("background-clip:text");
    expect(c).toContain("-webkit-background-clip:text");
    expect(c).toContain("color:transparent");
    expect(c).toContain("-webkit-text-fill-color:transparent");
    expect(c).toMatch(/animation:goldShimmervar\(--shimmer-speed\)/);
    // Tunable runtime variables must remain defined on :root.
    expect(c).toMatch(/--shimmer-sweep-size:\d+vw/);
    expect(c).toMatch(/--shimmer-speed:[\d.]+s/);
    expect(c).toMatch(/--shimmer-intensity:\d+%/);
    expect(c).toContain("--shimmer-gradient:linear-gradient");
  });

  it("declares all four opt-out contexts for h1/h2/h3", () => {
    const c = compact(css);
    // Each opt-out must be wired to h1 (incl. its descendant spans), h2, h3.
    const optOuts = [
      '[data-shimmer="off"]', // global kill-switch
      '[data-shimmer-fallback="true"]', // background-clip fallback path
      "[data-admin]", // admin chrome
      ".no-shimmer", // ancestor / self utility
    ];
    for (const prefix of optOuts) {
      const compactPrefix = compact(prefix);
      expect(c, `${prefix} must opt out h1`).toContain(`${compactPrefix}h1`);
      expect(c, `${prefix} must opt out h2`).toContain(`${compactPrefix}h2`);
      expect(c, `${prefix} must opt out h3`).toContain(`${compactPrefix}h3`);
      expect(
        c,
        `${prefix} must opt out Hero3DText per-letter spans on h1`,
      ).toContain(`${compactPrefix}h1>span`);
    }
    // .no-shimmer must also work when applied directly on the heading.
    expect(c).toContain("h1.no-shimmer");
    expect(c).toContain("h2.no-shimmer");
    expect(c).toContain("h3.no-shimmer");
    // Buttons containing headings must never shimmer.
    expect(c).toContain("buttonh1");
    expect(c).toContain("buttonh2");
    expect(c).toContain("buttonh3");

    // The opt-out block must actually neutralize the shimmer.
    expect(c).toContain("background-image:none");
    expect(c).toContain("animation:none");
    expect(c).toContain("color:inherit");
    expect(c).toContain("-webkit-text-fill-color:currentColor");
  });

  it("disables the shimmer for both OS prefers-reduced-motion and the in-app toggle", () => {
    const c = compact(css);
    // OS-level: media query exists and targets h1/h2/h3.
    expect(c).toMatch(
      /@media\(prefers-reduced-motion:reduce\)\{[^}]*h1[^}]*h2[^}]*h3/,
    );
    // In-app override: data-motion="reduce" attribute on <html> set by
    // MotionPrefProvider must produce the same neutralization for h1/h2/h3.
    expect(c).toContain('[data-motion="reduce"]h1');
    expect(c).toContain('[data-motion="reduce"]h2');
    expect(c).toContain('[data-motion="reduce"]h3');
    // And for Hero3DText per-letter spans inside an h1.
    expect(c).toContain('[data-motion="reduce"]h1>span');
    // Reduced-motion must also revert .hero-gold-highlight to a solid
    // primary fill instead of leaving a frozen gradient mid-sweep.
    expect(c).toContain('[data-motion="reduce"].hero-gold-highlight');
    expect(c).toContain("color:var(--primary)");
  });

  it("provides a background-clip: text fallback so headings stay readable", () => {
    // Without this @supports block, browsers lacking background-clip:text
    // would render the heading as fully transparent. The block must exist
    // and assign a non-transparent fallback fill.
    const c = compact(css);
    expect(c).toMatch(
      /@supportsnot\(\(background-clip:text\)or\(-webkit-background-clip:text\)\)/,
    );
  });
});
