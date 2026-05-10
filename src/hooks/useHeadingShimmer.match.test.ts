import { describe, it, expect } from "vitest";
import {
  matchShimmerPath,
  isShimmerPathDisabled,
  pickShimmerOverride,
  type HeadingShimmerOverride,
} from "./useHeadingShimmer";

const ov = (path: string, extra: Partial<HeadingShimmerOverride> = {}): HeadingShimmerOverride => ({
  id: path,
  path,
  enabled: null,
  intensity: null,
  sweep_size: null,
  speed_ms: null,
  notes: null,
  ...extra,
});

describe("matchShimmerPath", () => {
  it("matches exact paths only when no wildcard", () => {
    expect(matchShimmerPath("/portfolio", "/portfolio")).toBe(true);
    expect(matchShimmerPath("/portfolio", "/portfolio/abc")).toBe(false);
    expect(matchShimmerPath("/portfolio", "/portfolio2")).toBe(false);
  });

  it("normalizes trailing slashes", () => {
    expect(matchShimmerPath("/portfolio/", "/portfolio")).toBe(true);
    expect(matchShimmerPath("/portfolio", "/portfolio/")).toBe(true);
  });

  it("handles trailing /* wildcard (any depth)", () => {
    expect(matchShimmerPath("/portfolio/*", "/portfolio/abc")).toBe(true);
    expect(matchShimmerPath("/portfolio/*", "/portfolio/abc/def")).toBe(false);
    expect(matchShimmerPath("/portfolio/**", "/portfolio/abc/def")).toBe(true);
    expect(matchShimmerPath("/portfolio/*", "/portfolio")).toBe(false);
  });

  it("handles single-segment wildcard in the middle", () => {
    expect(matchShimmerPath("/blog/*/comments", "/blog/123/comments")).toBe(true);
    expect(matchShimmerPath("/blog/*/comments", "/blog/123/456/comments")).toBe(false);
  });

  it("ignores empty patterns", () => {
    expect(matchShimmerPath("", "/portfolio")).toBe(false);
  });
});

describe("isShimmerPathDisabled", () => {
  it("returns true when any pattern matches", () => {
    expect(isShimmerPathDisabled(["/about", "/portfolio/*"], "/portfolio/x")).toBe(true);
    expect(isShimmerPathDisabled(["/about", "/portfolio/*"], "/contact")).toBe(false);
  });
});

describe("pickShimmerOverride", () => {
  it("picks the most specific match (literal beats wildcard)", () => {
    const list = [ov("/portfolio/*"), ov("/portfolio/special")];
    expect(pickShimmerOverride(list, "/portfolio/special")?.path).toBe("/portfolio/special");
    expect(pickShimmerOverride(list, "/portfolio/other")?.path).toBe("/portfolio/*");
  });

  it("returns null when nothing matches", () => {
    expect(pickShimmerOverride([ov("/about")], "/contact")).toBeNull();
  });
});
