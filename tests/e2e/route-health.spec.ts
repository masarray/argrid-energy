import { expect, test } from "@playwright/test";
import { routeCatalog } from "./route-catalog";
import { openWorkspace, prepareDemo } from "./support";

test.describe("ArGrid cross-browser route health", () => {
  for (const route of routeCatalog) {
    test(`${route.slug} renders without browser errors or page-level overflow`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await prepareDemo(page, { scenario: route.scenario });
      await openWorkspace(page, route.path);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(route.workspace === "operations" ? ".workspace-operations" : ".workspace-management")).toBeVisible();

      const overflow = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(overflow.content).toBeLessThanOrEqual(overflow.viewport + 1);
      expect(pageErrors).toEqual([]);
    });
  }
});
