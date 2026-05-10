import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { Hero3DText } from "./Hero3DText";

beforeAll(() => {
  if (!window.matchMedia) {
    // jsdom doesn't ship matchMedia; Hero3DText uses it to detect mobile.
    window.matchMedia = (q: string) =>
      ({
        matches: false,
        media: q,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }
});

/**
 * Visual-regression snapshot test for Hero3DText letter/word spans.
 *
 * Why this exists:
 *   The global heading shimmer in src/styles.css targets `h1 > span` and
 *   `h1 > span > span` to paint per-letter spans with the gold gradient
 *   (background-clip: text + transparent fill). If Hero3DText's DOM shape
 *   ever changes — e.g. an extra wrapper is introduced, or the per-unit
 *   <span> is replaced with a <div> — those CSS selectors stop matching
 *   and the headline renders as fully transparent (invisible) text.
 *
 *   These snapshots lock in the exact span structure so any future change
 *   that would break the gradient/transparent-letter pipeline shows up as
 *   a snapshot diff in CI. If you intentionally change the DOM shape,
 *   update src/styles.css selectors in the SAME commit as the snapshot.
 */

// Mock framer-motion so motion.h1/motion.span render as plain h1/span.
// This keeps snapshots stable (no animation styles / data attributes) and
// lets us assert on the structural shape that the global CSS depends on.
vi.mock("framer-motion", () => {
  const React = require("react");
  const passthrough = (Tag: string) =>
    React.forwardRef((props: any, ref: any) => {
      const {
        initial: _i,
        animate: _a,
        variants: _v,
        transition: _t,
        whileHover: _wh,
        whileTap: _wt,
        ...rest
      } = props;
      return React.createElement(Tag, { ...rest, ref });
    });
  const motion = new Proxy(
    {},
    { get: (_t, key: string) => passthrough(key) },
  );
  return {
    motion,
    useReducedMotion: () => false,
  };
});

describe("Hero3DText DOM shape (gradient/transparent-letter regression)", () => {
  it("by-word: each word is a direct <span> child of the heading", () => {
    const { container } = render(<Hero3DText text="Pick a page" as="h1" />);
    const h1 = container.querySelector("h1")!;
    expect(h1).not.toBeNull();

    // Selectors used by the global shimmer CSS — these MUST match.
    const directSpans = h1.querySelectorAll(":scope > span");
    expect(directSpans.length).toBeGreaterThan(0);

    // No nested wrappers around words (would break `h1 > span` targeting).
    directSpans.forEach((span) => {
      expect(span.tagName).toBe("SPAN");
      expect(span.parentElement).toBe(h1);
    });

    expect(h1).toMatchSnapshot();
  });

  it("by-letter: each letter is a direct <span> with text content", () => {
    const { container } = render(
      <Hero3DText text="Hi!" as="h1" byLetter />,
    );
    const h1 = container.querySelector("h1")!;
    const directSpans = h1.querySelectorAll(":scope > span");

    // 3 visible characters → 3 direct spans (no spaces in "Hi!").
    expect(directSpans.length).toBe(3);
    expect(Array.from(directSpans).map((s) => s.textContent).join("")).toBe(
      "Hi!",
    );

    expect(h1).toMatchSnapshot();
  });

  it("preserves whitespace between words as inert spans (not collapsed)", () => {
    const { container } = render(<Hero3DText text="A B" as="h1" />);
    const h1 = container.querySelector("h1")!;
    // "A", " ", "B" → 3 spans
    const directSpans = h1.querySelectorAll(":scope > span");
    expect(directSpans.length).toBe(3);
    expect(directSpans[1].textContent).toMatch(/\s/);
  });

  it("forwards the `as` tag so non-h1 headings still match their CSS", () => {
    const { container } = render(<Hero3DText text="Hello" as="h2" />);
    expect(container.querySelector("h2")).not.toBeNull();
    expect(container.querySelector("h1")).toBeNull();
  });

  it("preserves className (e.g. .text-primary opt-out for solid accents)", () => {
    const { container } = render(
      <Hero3DText text="gold" as="h1" className="text-primary" />,
    );
    const h1 = container.querySelector("h1")!;
    // The `h1 > span.text-primary` opt-out in styles.css depends on the
    // class landing on the heading itself.
    expect(h1.classList.contains("text-primary")).toBe(true);
  });
});
