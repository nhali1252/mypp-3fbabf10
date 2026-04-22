import { test, expect } from "@playwright/test";

/**
 * E2E: PageLoader visibility during a route A → route B transition.
 *
 * Navigates from "/" (route A) to "/B" (route B) and asserts the brand
 * loader stays visible for ~4000ms before disappearing. Uses the same
 * tolerant acceptance window as the main timing spec (3500–4500ms +
 * a 500ms fade buffer) to stay resilient across CI vs. local hardware.
 */
const LOADER_SELECTOR = '[data-testid="page-loader"]';
const LOADER_DONE_SELECTOR =
  '[data-testid="page-loader-live"][data-loader-state="hidden"]';

const ROUTE_A = "/";
const ROUTE_B = "/B";

const EXPECTED_MS = 4000;
const TOLERANCE_MS = 500; // ±500ms → 3500–4500ms acceptance window
const FADE_BUFFER_MS = 500; // slack for the 260ms hide-fade + jitter
const HIDDEN_TIMEOUT_MS = TOLERANCE_MS * 2 + FADE_BUFFER_MS; // 1500ms

test.describe("PageLoader route A → B", () => {
  test.beforeEach(async ({ context }) => {
    // Force deterministic 4000ms timings via the same localStorage key
    // PageLoader reads, so this test never depends on debug-page state.
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

  test(`shows for ~4000ms when navigating ${ROUTE_A} → ${ROUTE_B}`, async ({ page }) => {
    // Land on route A and wait for the initial loader to fully clear.
    await page.goto(ROUTE_A, { waitUntil: "commit" });
    await expect(page.locator(LOADER_DONE_SELECTOR)).toBeVisible({ timeout: 8000 });

    // Trigger A → B navigation via the in-app link if present, else direct goto.
    const link = page.locator(`a[href="${ROUTE_B}"]`).first();
    if (await link.count()) {
      await link.click();
    } else {
      await page.goto(ROUTE_B, { waitUntil: "commit" });
    }

    // Loader should appear quickly for the route transition.
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible({ timeout: 2000 });
    const start = Date.now();

    // Lower bound: still visible at the 3500ms floor.
    await page.waitForTimeout(EXPECTED_MS - TOLERANCE_MS);
    await expect(page.locator(LOADER_SELECTOR)).toBeVisible();

    // Upper bound: gone within the 4500ms ceiling (+ fade buffer).
    await expect(page.locator(LOADER_DONE_SELECTOR)).toBeVisible({
      timeout: HIDDEN_TIMEOUT_MS,
    });
    const goneAt = Date.now() - start;
    expect(goneAt).toBeGreaterThanOrEqual(EXPECTED_MS - TOLERANCE_MS);
    expect(goneAt).toBeLessThanOrEqual(EXPECTED_MS + TOLERANCE_MS + FADE_BUFFER_MS);

    // Confirm we actually landed on route B.
    await expect(page).toHaveURL(new RegExp(`${ROUTE_B}$`));
  });
});
