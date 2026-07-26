import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openWorkspace, prepareDemo } from "./support";

const representativeWorkspaces = [
  { name: "enterprise overview", path: "/", scenario: "normal" as const },
  { name: "electrical operations", path: "/electrical", scenario: "voltage-sag" as const },
  { name: "billing assurance", path: "/billing", scenario: "billing-exception" as const },
  { name: "data health", path: "/data-health", scenario: "billing-exception" as const },
];

for (const workspace of representativeWorkspaces) {
  test(`${workspace.name} has no serious or critical automated accessibility violations`, async ({ page }, testInfo) => {
    await prepareDemo(page, { scenario: workspace.scenario });
    await openWorkspace(page, workspace.path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    await testInfo.attach("axe-results.json", {
      body: JSON.stringify(results, null, 2),
      contentType: "application/json",
    });

    const blocking = results.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious",
    );
    const summary = blocking.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.flatMap((node) => node.target),
    }));

    expect(summary).toEqual([]);
  });
}
