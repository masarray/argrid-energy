import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openWorkspace, prepareDemo, type DemoScenario } from "./support";

const workspaces: Array<{ name: string; path: string; scenario: DemoScenario }> = [
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

test.describe("ArGrid route accessibility", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Run Axe once in Chromium; workflow smoke tests cover every engine.");

  for (const workspace of workspaces) {
    test(`${workspace.name} passes the blocking WCAG audit`, async ({ page }, testInfo) => {
      await prepareDemo(page, { scenario: workspace.scenario });
      await openWorkspace(page, workspace.path);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      await testInfo.attach("axe-results.json", {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json",
      });

      const blocking = results.violations
        .filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))
        .map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          targets: violation.nodes.flatMap((node) => node.target),
        }));

      expect(blocking).toEqual([]);
    });
  }
});
