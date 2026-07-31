import { expect, test } from "@playwright/test";
import { expectWorkspaceHeading, openWorkspace, prepareDemo } from "./support";

test.describe("ArGrid browser smoke", () => {
  test("global shell navigation preserves workspace context and trusted-state messaging", async ({ page }) => {
    await prepareDemo(page, { scenario: "normal" });
    await openWorkspace(page, "/");
    await expectWorkspaceHeading(page, "Enterprise Overview");
    await expect(page.locator(".workspace-management")).toBeVisible();
    await expect(page.getByText("Demo · simulation only", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Electrical Network" }).click();
    await expectWorkspaceHeading(page, "Electrical Network");
    await expect(page.locator(".workspace-operations")).toBeVisible();

    await page.getByLabel("Select demo scenario").selectOption("billing-exception");
    await expect(page.getByText("Decision confidence reduced", { exact: true })).toBeVisible();
    await expect(page.getByText(/ESTIMATED source quality/)).toBeVisible();

    await page.getByRole("button", { name: "LIVE" }).click();
    await expect(page.getByText("Simulation paused", { exact: true })).toBeVisible();
  });

  test("guided demo advances across governed workspaces", async ({ page }) => {
    await prepareDemo(page, { scenario: "normal" });
    await openWorkspace(page, "/");

    await page.getByRole("button", { name: "Guided demo" }).click();
    await expect(page.getByText("1 · Portfolio confidence", { exact: true })).toBeVisible();
    await expectWorkspaceHeading(page, "Enterprise Portfolio");

    await page.getByRole("button", { name: "Next scene" }).click();
    await expect(page.getByText("2 · Enterprise condition", { exact: true })).toBeVisible();
    await expectWorkspaceHeading(page, "Enterprise Overview");
  });

  test("energy flow and Phase A analytics render decision-ready visuals", async ({ page }) => {
    await prepareDemo(page, { scenario: "normal" });
    await openWorkspace(page, "/");

    await expect(page.getByRole("heading", { name: "Energy Flow Sankey" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Power energy flow Sankey diagram" })).toBeVisible();
    await page.getByRole("tab", { name: "Cost" }).click();
    await expect(page.getByRole("region", { name: "Cost energy flow Sankey diagram" })).toBeVisible();
    await expect(page.getByText("Blended energy rate", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Energy Analytics" }).click();
    await expectWorkspaceHeading(page, "Energy Analytics");
    await expect(page.getByRole("heading", { name: "Energy Heatmap" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Load Duration Curve" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top Consumer Pareto" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Energy Signature" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Insight Summary" })).toBeVisible();
  });

  test("billing exception can be reviewed and accepted without external posting", async ({ page }) => {
    await prepareDemo(page, { scenario: "billing-exception" });
    await openWorkspace(page, "/billing");
    await expectWorkspaceHeading(page, "Billing & Invoicing");

    await page.getByRole("button", { name: /Review exception/ }).click();
    await expect(page.getByText("Measurement provenance", { exact: true })).toBeVisible();
    const acceptButton = page.getByRole("button", { name: "Accept in demo" }).first();
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();
    await expect(page.getByText(/accepted for demonstration with analyst accountability/)).toBeVisible();
    await expect(page.getByText("No ERP posting", { exact: true })).toBeVisible();
  });

  test("power-quality replay exposes synchronized engineering evidence", async ({ page }) => {
    await prepareDemo(page, { scenario: "voltage-sag" });
    await openWorkspace(page, "/alarms/power-quality");
    await expectWorkspaceHeading(page, "Power Quality Investigation");

    await expect(page.getByText("RMS Voltage Envelope", { exact: true })).toBeVisible();
    await expect(page.getByText("Instantaneous Waveform", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Restart event replay" }).click();
    await page.getByRole("button", { name: "Play deterministic event replay" }).click();
    await expect(page.getByRole("button", { name: "Pause event replay" })).toBeVisible();
  });

  test("portfolio benchmark rows support keyboard selection", async ({ page }) => {
    await prepareDemo(page, { scenario: "normal" });
    await openWorkspace(page, "/portfolio");
    await expectWorkspaceHeading(page, "Enterprise Portfolio");

    const gresikRow = page.getByLabel("Select Gresik Process Utilities");
    await gresikRow.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".portfolio-identity").getByText("Gresik Process Utilities", { exact: true })).toBeVisible();

    const batamRow = page.getByLabel("Select Batam Electronics Campus");
    await batamRow.focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".portfolio-identity").getByText("Batam Electronics Campus", { exact: true })).toBeVisible();
  });

});
