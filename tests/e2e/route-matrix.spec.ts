import { expect, test } from "@playwright/test";
import { routeCatalog } from "./route-catalog";
import { openWorkspace, prepareDemo, settleVisual } from "./support";

test.describe("ArGrid full route visual matrix", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Reviewed pixel baselines are Chromium-only.");

  for (const route of routeCatalog) {
    test(`${route.slug} route at 1440×900`, async ({ page }) => {
      await prepareDemo(page, { scenario: route.scenario });
      await openWorkspace(page, route.path);
      await settleVisual(page);

      await expect(page.locator("#main-content")).toHaveScreenshot(`route-${route.slug}-1440x900.png`, {
        animations: "disabled",
      });
    });
  }
});
