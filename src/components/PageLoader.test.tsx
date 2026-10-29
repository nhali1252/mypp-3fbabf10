import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { PageLoader } from "./PageLoader";

// Minimal mocks for the hooks PageLoader depends on so we can isolate timing.
vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => "/",
}));

vi.mock("@/hooks/useContent", () => ({
  useSiteSettings: () => ({ data: { site_name: "Test", hero_subtitle: "" } }),
}));

vi.mock("@/hooks/usePageLoaderSettings", () => ({
  usePageLoaderSettings: () => ({ data: null }),
  PAGE_LOADER_DEFAULTS: {
    initial_ms: 4000,
    route_ms: 4000,
    routes: {},
  },
}));

const HIDE_FADE = 260; // matches PageLoader's internal fade-out duration

describe("PageLoader timings", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Make the initial "wait for document ready" branch resolve immediately.
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "complete",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses 4000ms as the default initialMs and routeMs", async () => {
    // Read the source file directly — compiled JSX strips default-param syntax,
    // so PageLoader.toString() can't be relied on for this check.
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(path.resolve(__dirname, "PageLoader.tsx"), "utf8");
    expect(src).toMatch(/initialMs\s*=\s*4000/);
    expect(src).toMatch(/routeMs\s*=\s*4000/);
  });

  it("stays visible for the full configured initialMs before hiding", () => {
    const { container } = render(<PageLoader initialMs={4000} routeMs={4000} />);

    // Loader present immediately on mount.
    expect(container.querySelector(".page-loader-bar")).not.toBeNull();

    // Just before 4000ms it must still be visible.
    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(container.querySelector(".page-loader-bar")).not.toBeNull();

    // After initialMs + the hide-fade window, it should be removed.
    act(() => {
      vi.advanceTimersByTime(1 + HIDE_FADE + 50);
    });
    expect(container.querySelector(".page-loader-bar")).toBeNull();
  });

  it("respects custom initialMs when provided", () => {
    const { container } = render(<PageLoader initialMs={1000} routeMs={1000} />);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(container.querySelector(".page-loader-bar")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1 + HIDE_FADE + 50);
    });
    expect(container.querySelector(".page-loader-bar")).toBeNull();
  });
});
