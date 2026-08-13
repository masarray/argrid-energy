import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { routeCatalog } from "./route-catalog";
import { openWorkspace, prepareDemo } from "./support";

test.describe("ArGrid full route accessibility gate", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Axe and color-contrast blocking run once in Chromium; route health runs in every browser.");

  for (const route of routeCatalog) {
    test(`${route.slug} has no serious or critical WCAG A/AA violations`, async ({ page }, testInfo) => {
      await prepareDemo(page, { scenario: route.scenario });
      await openWorkspace(page, route.path);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      await testInfo.attach(`axe-${route.slug}.json`, {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json",
      });

      const blocking = results.violations
        .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
        .map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.map((node) => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        }));

      expect(blocking, `Axe blocking violations for ${route.path}:\n${JSON.stringify(blocking, null, 2)}`).toEqual([]);
    });
  }
});
