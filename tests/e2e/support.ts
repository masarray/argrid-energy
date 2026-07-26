import { expect, type Page } from "@playwright/test";

export type DemoScenario = "normal" | "peak-demand" | "voltage-sag" | "efficiency-loss" | "billing-exception";

export async function prepareDemo(
  page: Page,
  options: { scenario?: DemoScenario; site?: "cikarang" | "batam" | "gresik"; range?: "Today" | "This week" | "This month" } = {},
) {
  const scenario = options.scenario ?? "normal";
  const site = options.site ?? "cikarang";
  const range = options.range ?? "Today";

  await page.clock.install({ time: new Date("2026-07-15T14:32:17+07:00") });
  await page.addInitScript(
    ({ selectedScenario, selectedSite, selectedRange }) => {
      window.localStorage.clear();
      window.localStorage.setItem("argrid-demo-scenario", selectedScenario);
      window.localStorage.setItem("argrid-demo-site", selectedSite);
      window.localStorage.setItem("argrid-demo-range", selectedRange);
    },
    { selectedScenario: scenario, selectedSite: site, selectedRange: range },
  );
}

export async function openWorkspace(page: Page, path: string) {
  await page.goto(`/#${path}`);
  await expect(page.locator("#main-content")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

export async function settleVisual(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
      .recharts-wrapper, .recharts-wrapper * {
        animation: none !important;
        transition: none !important;
      }
    `,
  });
  await page.waitForTimeout(350);
}

export async function expectWorkspaceHeading(page: Page, name: string) {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}
