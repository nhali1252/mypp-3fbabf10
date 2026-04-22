import { test, expect } from "@playwright/test";

/**
 * E2E: PageLoader visibility timing across a route navigation.
 *
 * The loader is configured for 4000ms (initialMs/routeMs in
 * src/hooks/useLoaderTimings.ts) plus a ~260ms hide-fade. We assert it stays
 * visible through ~3.5s after a route change and is gone by ~4.5s.
 */
const LOADER_SELECTOR = '[data-testid="page-loader"]';
const LOADER_DONE_SELECTOR = '[data-testid="page-loader-live"][data-loader-state="hidden"]';
const EXPECTED_MS = 4000;
const TOLERANCE_BEFORE_MS = 500; // still visible until close to 4000ms
const TOLERANCE_AFTER_MS = 1000; // hidden by ~5000ms (4000 + fade + buffer)

test.describe("PageLoader timing", () => {
  test.beforeEach(async ({ context }) => {
    // Ensure a clean slate so debug-page localStorage overrides don't leak in.
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem("pageLoader.timings.v1");
      } catch {
        /* ignore */
      }
    });
  });

  test("stays visible for ~4000ms on initial load", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });

    // Loader should appear immediately.
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible({ timeout: 2000 });

    const start = Date.now();

    // Loader must STILL be visible just before the configured threshold.
    await page.waitForTimeout(EXPECTED_MS - TOLERANCE_BEFORE_MS);
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible();
    const stillVisibleAt = Date.now() - start;
    expect(stillVisibleAt).toBeGreaterThanOrEqual(EXPECTED_MS - TOLERANCE_BEFORE_MS);

    // After the configured threshold (+ hide fade + buffer) it must be gone.
    await expect(page.locator(LOADER_SELECTOR)).toBeHidden({
      timeout: TOLERANCE_BEFORE_MS + TOLERANCE_AFTER_MS + 500,
    });
    const goneAt = Date.now() - start;
    expect(goneAt).toBeLessThanOrEqual(EXPECTED_MS + TOLERANCE_AFTER_MS);
  });

  test("re-shows for ~4000ms when navigating between routes", async ({ page }) => {
    // Load home and wait for the initial loader to fully clear.
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator(LOADER_SELECTOR)).toBeHidden({ timeout: 8000 });

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

    // Still visible just before 4000ms.
    await page.waitForTimeout(EXPECTED_MS - TOLERANCE_BEFORE_MS);
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible();

    // Gone within tolerance after 4000ms.
    await expect(page.locator(LOADER_SELECTOR)).toBeHidden({
      timeout: TOLERANCE_BEFORE_MS + TOLERANCE_AFTER_MS + 500,
    });
    const goneAt = Date.now() - start;
    expect(goneAt).toBeGreaterThanOrEqual(EXPECTED_MS - TOLERANCE_BEFORE_MS);
    expect(goneAt).toBeLessThanOrEqual(EXPECTED_MS + TOLERANCE_AFTER_MS);
  });
});
