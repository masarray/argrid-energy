import { expect, test } from "@playwright/test";
import { openWorkspace, prepareDemo, settleVisual, type DemoScenario } from "./support";

const routeMatrix: Array<{ name: string; path: string; scenario: DemoScenario }> = [
  { name: "overview", path: "/", scenario: "normal" },
  { name: "portfolio", path: "/portfolio", scenario: "peak-demand" },
  { name: "analytics", path: "/analytics", scenario: "efficiency-loss" },
  { name: "demand", path: "/demand", scenario: "peak-demand" },
  { name: "opportunities", path: "/opportunities", scenario: "efficiency-loss" },
  { name: "savings", path: "/savings", scenario: "efficiency-loss" },
  { name: "electrical", path: "/electrical", scenario: "voltage-sag" },
  { name: "alarms", path: "/alarms", scenario: "voltage-sag" },
  { name: "power-quality", path: "/alarms/power-quality", scenario: "voltage-sag" },
  { name: "reports", path: "/reports", scenario: "normal" },
  { name: "billing", path: "/billing", scenario: "billing-exception" },
  { name: "sustainability", path: "/sustainability", scenario: "normal" },
  { name: "data-health", path: "/data-health", scenario: "billing-exception" },
];

const compactMatrix = [
  { name: "portfolio", path: "/portfolio", scenario: "peak-demand" as const },
  { name: "electrical", path: "/electrical", scenario: "voltage-sag" as const },
  { name: "billing", path: "/billing", scenario: "billing-exception" as const },
];

test.describe("ArGrid full-route visual regression", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Reviewed visual baselines are Chromium-only; smoke coverage runs in all engines.");

  for (const route of routeMatrix) {
    test(`${route.name} workspace at 1440×900`, async ({ page }) => {
      await prepareDemo(page, { scenario: route.scenario });
      await openWorkspace(page, route.path);
      await settleVisual(page);
      await expect(page).toHaveScreenshot(`${route.name}-1440x900.png`, { fullPage: false });
    });
  }

  for (const route of compactMatrix) {
    test(`${route.name} workspace at compact 1280×800`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await prepareDemo(page, { scenario: route.scenario });
      await openWorkspace(page, route.path);
      await settleVisual(page);
      await expect(page).toHaveScreenshot(`${route.name}-1280x800.png`, { fullPage: false });
    });
  }
});
