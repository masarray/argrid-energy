import type { DemoScenario } from "./support";

export type RouteCatalogEntry = {
  slug: string;
  path: string;
  scenario: DemoScenario;
  workspace: "management" | "operations" | "finance";
};

export const routeCatalog: RouteCatalogEntry[] = [
  { slug: "overview", path: "/", scenario: "normal", workspace: "management" },
  { slug: "portfolio", path: "/portfolio", scenario: "peak-demand", workspace: "management" },
  { slug: "analytics", path: "/analytics", scenario: "efficiency-loss", workspace: "management" },
  { slug: "demand", path: "/demand", scenario: "peak-demand", workspace: "management" },
  { slug: "opportunities", path: "/opportunities", scenario: "efficiency-loss", workspace: "management" },
  { slug: "savings", path: "/savings", scenario: "efficiency-loss", workspace: "management" },
  { slug: "electrical", path: "/electrical", scenario: "voltage-sag", workspace: "operations" },
  { slug: "alarms", path: "/alarms", scenario: "voltage-sag", workspace: "operations" },
  { slug: "power-quality", path: "/alarms/power-quality", scenario: "voltage-sag", workspace: "operations" },
  { slug: "reports", path: "/reports", scenario: "normal", workspace: "management" },
  { slug: "billing", path: "/billing", scenario: "billing-exception", workspace: "finance" },
  { slug: "sustainability", path: "/sustainability", scenario: "normal", workspace: "management" },
  { slug: "data-health", path: "/data-health", scenario: "billing-exception", workspace: "management" },
];
