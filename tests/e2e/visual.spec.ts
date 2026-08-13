import { expect, test } from "@playwright/test";
import { openWorkspace, prepareDemo, settleVisual } from "./support";

test.describe("ArGrid visual regression", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Reviewed pixel baselines are Chromium-only.");

  test("management overview at 1440×900", async ({ page }) => {
    await prepareDemo(page, { scenario: "normal" });
    await openWorkspace(page, "/");
    await settleVisual(page);
    await expect(page).toHaveScreenshot("management-overview-1440x900.png", { fullPage: false });
  });

  test("operations electrical workspace at 1440×900", async ({ page }) => {
    await prepareDemo(page, { scenario: "voltage-sag" });
    await openWorkspace(page, "/electrical");
    await settleVisual(page);
    await expect(page).toHaveScreenshot("operations-electrical-1440x900.png", { fullPage: false });
  });

  test("billing assurance workspace at 1440×900", async ({ page }) => {
    await prepareDemo(page, { scenario: "billing-exception" });
    await openWorkspace(page, "/billing");
    await settleVisual(page);
    await expect(page).toHaveScreenshot("billing-assurance-1440x900.png", { fullPage: false });
  });

  test("portfolio remains readable at compact engineering viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await prepareDemo(page, { scenario: "peak-demand" });
    await openWorkspace(page, "/portfolio");
    await settleVisual(page);
    await expect(page).toHaveScreenshot("portfolio-1280x800.png", { fullPage: false });
  });
});
