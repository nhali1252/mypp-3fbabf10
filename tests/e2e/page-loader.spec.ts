import { test, expect } from "@playwright/test";

/**
 * E2E: PageLoader visibility timing across initial load and route navigation.
 *
 * The loader is configured for 4000ms (initialMs/routeMs in
 * src/hooks/useLoaderTimings.ts) plus a ~260ms hide-fade. To stay resilient
 * across machines (CI, local dev, slower laptops) we assert against a
 * tolerant acceptance window rather than an exact 4000ms.
 *
 *   Loader MUST still be visible at:  EXPECTED_MS - TOLERANCE_MS  (3500ms)
 *   Loader MUST be hidden by:         EXPECTED_MS + TOLERANCE_MS + FADE_BUFFER_MS
 *
 * That gives a 3500–4500ms (+ ~500ms fade buffer) acceptance window.
 */
const LOADER_SELECTOR = '[data-testid="page-loader"]';
const LOADER_DONE_SELECTOR =
  '[data-testid="page-loader-live"][data-loader-state="hidden"]';

const EXPECTED_MS = 4000;
const TOLERANCE_MS = 500; // ±500ms around the 4000ms target → 3500–4500ms
const FADE_BUFFER_MS = 500; // extra slack for the 260ms hide-fade + scheduling jitter
const HIDDEN_TIMEOUT_MS = TOLERANCE_MS * 2 + FADE_BUFFER_MS; // 1500ms

test.describe("PageLoader timing", () => {
  test.beforeEach(async ({ context }) => {
    // Force deterministic timings for the E2E run by seeding the same
    // localStorage key the PageLoader reads (`pageLoader.timings.v1`).
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem(
          "pageLoader.timings.v1",
          JSON.stringify({ initialMs: 4000, routeMs: 4000 }),
        );
      } catch {
        /* ignore */
      }
    });
  });

  test("stays visible for ~4000ms (3500–4500ms) on initial load", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });

    // Loader should appear immediately on mount.
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible({ timeout: 2000 });
    const start = Date.now();

    // Lower bound: still visible just before the 3500ms floor.
    await page.waitForTimeout(EXPECTED_MS - TOLERANCE_MS);
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible();
    const stillVisibleAt = Date.now() - start;
    expect(stillVisibleAt).toBeGreaterThanOrEqual(EXPECTED_MS - TOLERANCE_MS);

    // Upper bound: must be gone within the 4500ms ceiling (+ fade buffer).
    await expect(page.locator(LOADER_DONE_SELECTOR)).toBeVisible({
      timeout: HIDDEN_TIMEOUT_MS,
    });
    const goneAt = Date.now() - start;
    expect(goneAt).toBeLessThanOrEqual(EXPECTED_MS + TOLERANCE_MS + FADE_BUFFER_MS);
  });

  test("re-shows for ~4000ms (3500–4500ms) when navigating between routes", async ({
    page,
  }) => {
    // Load home and wait for the initial loader to fully clear.
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator(LOADER_DONE_SELECTOR)).toBeVisible({ timeout: 8000 });

    // Trigger a route change to /B by clicking the launcher card link.
    // Fall back to page.goto if the link isn't present in the DOM.
    const link = page.locator('a[href="/B"]').first();
    if (await link.count()) {
      await link.click();
    } else {
      await page.goto("/B", { waitUntil: "commit" });
    }

    // Loader should reappear for the route transition.
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible({ timeout: 2000 });
    const start = Date.now();

    // Lower bound: still visible just before the 3500ms floor.
    await page.waitForTimeout(EXPECTED_MS - TOLERANCE_MS);
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible();

    // Upper bound: gone within the 4500ms ceiling (+ fade buffer).
    await expect(page.locator(LOADER_DONE_SELECTOR)).toBeVisible({
      timeout: HIDDEN_TIMEOUT_MS,
    });
    const goneAt = Date.now() - start;
    expect(goneAt).toBeGreaterThanOrEqual(EXPECTED_MS - TOLERANCE_MS);
    expect(goneAt).toBeLessThanOrEqual(EXPECTED_MS + TOLERANCE_MS + FADE_BUFFER_MS);
  });
});
