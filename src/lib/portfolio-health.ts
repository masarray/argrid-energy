import type { DemoScenarioId } from "./demo-simulation";

export type PortfolioSiteStatus = "On target" | "Watch" | "Critical";
export type QualityState = "GOOD" | "UNCERTAIN" | "STALE" | "BAD" | "SUBSTITUTED" | "ESTIMATED" | "MANUAL";
export type DataIssueType =
  | "Missing interval"
  | "Estimated interval"
  | "Substituted value"
  | "Meter reset"
  | "Rollover"
  | "Duplicate reading"
  | "Time drift"
  | "Stale communication"
  | "Abnormal value";

export type PortfolioSite = {
  id: string;
  name: string;
  region: string;
  type: string;
  status: PortfolioSiteStatus;
  energyMWh: number;
  mtdCostIDR: number;
  budgetVariancePct: number;
  demandUtilizationPct: number;
  energyIntensityIndex: number;
  targetIntensityIndex: number;
  renewableSharePct: number;
  dataConfidencePct: number;
  verifiedSavingsIDR: number;
  opportunityValueIDR: number;
  criticalAlarms: number;
  productionIndex: number;
  floorAreaM2: number;
  outputUnit: string;
  selected: boolean;
};

export type MeterHealthRecord = {
  id: string;
  name: string;
  site: string;
  sourcePath: string;
  role: "Revenue" | "Main incomer" | "Submeter" | "Power quality" | "Process";
  quality: QualityState;
  completenessPct: number;
  estimatedPct: number;
  freshnessSeconds: number;
  timeDriftSeconds: number;
  calibrationDue: string;
  lastInterval: string;
  affectedCalculations: string[];
  billingImpactIDR: number;
  owner: string;
};

export type DataIssueRecord = {
  id: string;
  meterId: string;
  site: string;
  type: DataIssueType;
  severity: "Info" | "Warning" | "Critical";
  status: "Open" | "Investigating" | "Accepted" | "Resolved";
  openedAt: string;
  duration: string;
  intervals: number;
  description: string;
  consequence: string;
  recommendedAction: string;
  blocking: boolean;
};

const baseSites: Omit<PortfolioSite, "selected">[] = [
  {
    id: "cikarang",
    name: "Cikarang Manufacturing Complex",
    region: "West Java",
    type: "Discrete manufacturing",
    status: "Watch",
    energyMWh: 1_742,
    mtdCostIDR: 2_310_000_000,
    budgetVariancePct: 4.8,
    demandUtilizationPct: 96.5,
    energyIntensityIndex: 103,
    targetIntensityIndex: 96,
    renewableSharePct: 12.4,
    dataConfidencePct: 98.5,
    verifiedSavingsIDR: 232_800_000,
    opportunityValueIDR: 943_900_000,
    criticalAlarms: 1,
    productionIndex: 104,
    floorAreaM2: 86_000,
    outputUnit: "kWh / production index",
  },
  {
    id: "batam",
    name: "Batam Electronics Campus",
    region: "Riau Islands",
    type: "Electronics campus",
    status: "On target",
    energyMWh: 1_084,
    mtdCostIDR: 1_376_000_000,
    budgetVariancePct: -3.2,
    demandUtilizationPct: 78.4,
    energyIntensityIndex: 88,
    targetIntensityIndex: 92,
    renewableSharePct: 18.6,
    dataConfidencePct: 99.2,
    verifiedSavingsIDR: 184_000_000,
    opportunityValueIDR: 428_000_000,
    criticalAlarms: 0,
    productionIndex: 96,
    floorAreaM2: 62_000,
    outputUnit: "kWh / production index",
  },
  {
    id: "gresik",
    name: "Gresik Process Utilities",
    region: "East Java",
    type: "Process utilities",
    status: "Critical",
    energyMWh: 2_486,
    mtdCostIDR: 3_184_000_000,
    budgetVariancePct: 8.7,
    demandUtilizationPct: 91.2,
    energyIntensityIndex: 112,
    targetIntensityIndex: 98,
    renewableSharePct: 8.1,
    dataConfidencePct: 96.4,
    verifiedSavingsIDR: 318_600_000,
    opportunityValueIDR: 1_264_000_000,
    criticalAlarms: 2,
    productionIndex: 101,
    floorAreaM2: 104_000,
    outputUnit: "kWh / production index",
  },
  {
    id: "karawang",
    name: "Karawang Assembly Plant",
    region: "West Java",
    type: "Automotive assembly",
    status: "On target",
    energyMWh: 1_392,
    mtdCostIDR: 1_846_000_000,
    budgetVariancePct: -1.4,
    demandUtilizationPct: 82.7,
    energyIntensityIndex: 91,
    targetIntensityIndex: 94,
    renewableSharePct: 14.2,
    dataConfidencePct: 98.9,
    verifiedSavingsIDR: 226_000_000,
    opportunityValueIDR: 382_000_000,
    criticalAlarms: 0,
    productionIndex: 107,
    floorAreaM2: 74_000,
    outputUnit: "kWh / vehicle equivalent",
  },
  {
    id: "surabaya",
    name: "Surabaya Distribution Center",
    region: "East Java",
    type: "Logistics",
    status: "Watch",
    energyMWh: 624,
    mtdCostIDR: 846_000_000,
    budgetVariancePct: 2.6,
    demandUtilizationPct: 68.9,
    energyIntensityIndex: 99,
    targetIntensityIndex: 95,
    renewableSharePct: 21.8,
    dataConfidencePct: 94.8,
    verifiedSavingsIDR: 68_200_000,
    opportunityValueIDR: 176_000_000,
    criticalAlarms: 0,
    productionIndex: 93,
    floorAreaM2: 46_000,
    outputUnit: "kWh / shipped pallet",
  },
  {
    id: "bandung",
    name: "Bandung R&D Campus",
    region: "West Java",
    type: "Research campus",
    status: "On target",
    energyMWh: 418,
    mtdCostIDR: 578_000_000,
    budgetVariancePct: -5.1,
    demandUtilizationPct: 61.3,
    energyIntensityIndex: 84,
    targetIntensityIndex: 90,
    renewableSharePct: 26.5,
    dataConfidencePct: 99.5,
    verifiedSavingsIDR: 42_800_000,
    opportunityValueIDR: 92_000_000,
    criticalAlarms: 0,
    productionIndex: 98,
    floorAreaM2: 38_000,
    outputUnit: "kWh / occupied m²",
  },
];

const baseMeters: MeterHealthRecord[] = [
  {
    id: "PM-MAIN-01",
    name: "20 kV Main Incomer",
    site: "Cikarang Manufacturing Complex",
    sourcePath: "Utility 20 kV / MSB-Main / PM-MAIN-01",
    role: "Main incomer",
    quality: "GOOD",
    completenessPct: 99.8,
    estimatedPct: 0.2,
    freshnessSeconds: 3,
    timeDriftSeconds: 0.4,
    calibrationDue: "2027-03-18",
    lastInterval: "2026-07-25 08:45",
    affectedCalculations: ["Enterprise KPI", "Demand forecast", "Energy balance"],
    billingImpactIDR: 0,
    owner: "Electrical Operations",
  },
  {
    id: "PM-TNT-03",
    name: "Tenant C Revenue Meter",
    site: "Cikarang Manufacturing Complex",
    sourcePath: "Tenant Distribution / Cold Storage / PM-TNT-03",
    role: "Revenue",
    quality: "ESTIMATED",
    completenessPct: 94.1,
    estimatedPct: 5.9,
    freshnessSeconds: 12,
    timeDriftSeconds: 1.8,
    calibrationDue: "2026-11-15",
    lastInterval: "2026-07-25 08:45",
    affectedCalculations: ["Tenant invoice", "Cost allocation", "Billing energy"],
    billingImpactIDR: 318_400_000,
    owner: "Billing Assurance",
  },
  {
    id: "PM-CHP-01",
    name: "Chiller Plant",
    site: "Cikarang Manufacturing Complex",
    sourcePath: "MSB-Main / F-04 / PM-CHP-01",
    role: "Submeter",
    quality: "GOOD",
    completenessPct: 98.7,
    estimatedPct: 1.3,
    freshnessSeconds: 4,
    timeDriftSeconds: 0.7,
    calibrationDue: "2027-02-14",
    lastInterval: "2026-07-25 08:45",
    affectedCalculations: ["Chiller M&V", "Opportunity baseline", "Energy intensity"],
    billingImpactIDR: 0,
    owner: "Energy Performance",
  },
  {
    id: "PQ-F07-01",
    name: "Utility & Auxiliary PQ Meter",
    site: "Cikarang Manufacturing Complex",
    sourcePath: "MSB-Main / F-07 / PQ-F07-01",
    role: "Power quality",
    quality: "GOOD",
    completenessPct: 99.4,
    estimatedPct: 0,
    freshnessSeconds: 2,
    timeDriftSeconds: 0.2,
    calibrationDue: "2027-05-09",
    lastInterval: "2026-07-25 08:45",
    affectedCalculations: ["PQ event correlation", "Alarm evidence"],
    billingImpactIDR: 0,
    owner: "Power Quality",
  },
  {
    id: "PM-BTM-02",
    name: "SMT Production Hall",
    site: "Batam Electronics Campus",
    sourcePath: "LVMDP-02 / SMT Hall / PM-BTM-02",
    role: "Process",
    quality: "GOOD",
    completenessPct: 99.2,
    estimatedPct: 0.4,
    freshnessSeconds: 5,
    timeDriftSeconds: 0.9,
    calibrationDue: "2027-01-22",
    lastInterval: "2026-07-25 08:45",
    affectedCalculations: ["Production intensity", "Site benchmark"],
    billingImpactIDR: 0,
    owner: "Batam Energy Team",
  },
  {
    id: "PM-GRK-04",
    name: "Boiler House Common",
    site: "Gresik Process Utilities",
    sourcePath: "Utility Bus / Boiler House / PM-GRK-04",
    role: "Submeter",
    quality: "STALE",
    completenessPct: 96.8,
    estimatedPct: 2.1,
    freshnessSeconds: 780,
    timeDriftSeconds: 14.2,
    calibrationDue: "2026-09-30",
    lastInterval: "2026-07-25 08:30",
    affectedCalculations: ["Boiler efficiency", "Process utilities benchmark", "Opportunity detection"],
    billingImpactIDR: 0,
    owner: "Gresik Utilities",
  },
  {
    id: "PM-SBY-01",
    name: "Distribution Center Main",
    site: "Surabaya Distribution Center",
    sourcePath: "Utility / Main LV Panel / PM-SBY-01",
    role: "Main incomer",
    quality: "SUBSTITUTED",
    completenessPct: 94.8,
    estimatedPct: 5.2,
    freshnessSeconds: 9,
    timeDriftSeconds: 2.4,
    calibrationDue: "2027-06-11",
    lastInterval: "2026-07-25 08:45",
    affectedCalculations: ["Portfolio benchmark", "Monthly cost forecast"],
    billingImpactIDR: 0,
    owner: "Surabaya Facilities",
  },
  {
    id: "PM-BDG-01",
    name: "R&D Campus Main",
    site: "Bandung R&D Campus",
    sourcePath: "Utility / Main Distribution / PM-BDG-01",
    role: "Main incomer",
    quality: "GOOD",
    completenessPct: 99.5,
    estimatedPct: 0.2,
    freshnessSeconds: 4,
    timeDriftSeconds: 0.5,
    calibrationDue: "2027-08-20",
    lastInterval: "2026-07-25 08:45",
    affectedCalculations: ["Portfolio benchmark", "Campus intensity"],
    billingImpactIDR: 0,
    owner: "Bandung Facilities",
  },
];

const baseIssues: DataIssueRecord[] = [
  {
    id: "DQ-3061",
    meterId: "PM-TNT-03",
    site: "Cikarang Manufacturing Complex",
    type: "Missing interval",
    severity: "Critical",
    status: "Investigating",
    openedAt: "2026-07-24 10:18",
    duration: "17 h",
    intervals: 68,
    description: "Intervals were unavailable after gateway maintenance; provisional estimation is present but not approved.",
    consequence: "Tenant C invoice and portfolio cost allocation are blocked from final approval.",
    recommendedAction: "Recover gateway buffer, compare revenue register delta, then approve or reject substitution with reason code.",
    blocking: true,
  },
  {
    id: "DQ-3062",
    meterId: "PM-TNT-03",
    site: "Cikarang Manufacturing Complex",
    type: "Estimated interval",
    severity: "Warning",
    status: "Open",
    openedAt: "2026-07-24 10:22",
    duration: "17 h",
    intervals: 68,
    description: "Matched weekday and refrigeration-load profiles were used for provisional interval estimation.",
    consequence: "Estimated energy is visible but excluded from trusted billing completeness until reviewed.",
    recommendedAction: "Review estimation method, confidence band, and register reconciliation before acceptance.",
    blocking: false,
  },
  {
    id: "DQ-3054",
    meterId: "PM-GRK-04",
    site: "Gresik Process Utilities",
    type: "Stale communication",
    severity: "Critical",
    status: "Open",
    openedAt: "2026-07-25 08:31",
    duration: "14 min",
    intervals: 1,
    description: "The latest process-meter interval is older than the configured 5-minute freshness threshold.",
    consequence: "Boiler efficiency and opportunity detection are frozen at the last trusted interval.",
    recommendedAction: "Check gateway channel, device power, and Modbus session before backfilling any interval.",
    blocking: false,
  },
  {
    id: "DQ-3047",
    meterId: "PM-SBY-01",
    site: "Surabaya Distribution Center",
    type: "Substituted value",
    severity: "Warning",
    status: "Accepted",
    openedAt: "2026-07-21 04:00",
    duration: "6 h",
    intervals: 24,
    description: "Intervals were substituted from the main utility register after a local historian service interruption.",
    consequence: "Portfolio benchmark confidence is reduced but monthly energy remains reconcilable within 0.6%.",
    recommendedAction: "Retain accepted reason code and verify historian recovery before next billing close.",
    blocking: false,
  },
  {
    id: "DQ-3038",
    meterId: "PM-MAIN-01",
    site: "Cikarang Manufacturing Complex",
    type: "Time drift",
    severity: "Info",
    status: "Resolved",
    openedAt: "2026-07-18 09:14",
    duration: "22 min",
    intervals: 0,
    description: "Meter clock drift reached 3.2 seconds before NTP resynchronization.",
    consequence: "No interval crossed the configured aggregation boundary.",
    recommendedAction: "Continue weekly time-synchronization audit.",
    blocking: false,
  },
];

export function buildPortfolioSites(activeSiteId: string, scenarioId: DemoScenarioId): PortfolioSite[] {
  return baseSites.map((site) => {
    const active = site.id === activeSiteId;
    const scenarioBudget = scenarioId === "efficiency-loss" && active ? 2.7 : scenarioId === "peak-demand" && active ? 1.8 : 0;
    const scenarioDemand = scenarioId === "peak-demand" && active ? 2.1 : 0;
    const scenarioConfidence = scenarioId === "billing-exception" && active ? -6.7 : 0;
    const confidence = Math.max(88, Math.min(99.8, site.dataConfidencePct + scenarioConfidence));
    const budgetVariancePct = site.budgetVariancePct + scenarioBudget;
    const demandUtilizationPct = Math.min(103, site.demandUtilizationPct + scenarioDemand);
    const status: PortfolioSiteStatus =
      demandUtilizationPct >= 98 || budgetVariancePct >= 7 || confidence < 95
        ? "Critical"
        : demandUtilizationPct >= 90 || budgetVariancePct > 2 || confidence < 97
          ? "Watch"
          : "On target";
    return { ...site, status, budgetVariancePct, demandUtilizationPct, dataConfidencePct: confidence, selected: active };
  });
}

export function getPortfolioTrend() {
  return [
    { month: "Jan", actual: 10.42, budget: 10.65, verified: 0.62 },
    { month: "Feb", actual: 10.18, budget: 10.52, verified: 0.71 },
    { month: "Mar", actual: 10.76, budget: 10.68, verified: 0.83 },
    { month: "Apr", actual: 10.91, budget: 10.74, verified: 0.92 },
    { month: "May", actual: 11.24, budget: 10.96, verified: 1.02 },
    { month: "Jun", actual: 11.58, budget: 11.12, verified: 1.12 },
    { month: "Jul", actual: 11.44, budget: 11.18, verified: 1.21 },
  ];
}

export function buildMeterHealth(scenarioId: DemoScenarioId): MeterHealthRecord[] {
  return baseMeters.map((meter) => {
    if (scenarioId === "billing-exception" && meter.id === "PM-TNT-03") {
      return { ...meter, quality: "ESTIMATED", completenessPct: 91.8, estimatedPct: 8.2, billingImpactIDR: 318_400_000 };
    }
    if (scenarioId === "voltage-sag" && meter.id === "PQ-F07-01") {
      return { ...meter, freshnessSeconds: 1, affectedCalculations: [...meter.affectedCalculations, "Voltage sag event RMS and waveform"] };
    }
    return meter;
  });
}

export function buildDataIssues(scenarioId: DemoScenarioId): DataIssueRecord[] {
  if (scenarioId !== "billing-exception") return baseIssues;
  return baseIssues.map((issue) =>
    issue.meterId === "PM-TNT-03"
      ? { ...issue, consequence: `${issue.consequence} Billing-exception scenario increases provisional coverage to 8.2%.` }
      : issue,
  );
}

export function getDataHealthSummary(meters: MeterHealthRecord[], issues: DataIssueRecord[]) {
  const totalWeight = meters.length || 1;
  const completeness = meters.reduce((sum, meter) => sum + meter.completenessPct, 0) / totalWeight;
  const estimated = meters.reduce((sum, meter) => sum + meter.estimatedPct, 0) / totalWeight;
  const trusted = meters.filter((meter) => meter.quality === "GOOD").length;
  const stale = meters.filter((meter) => meter.quality === "STALE" || meter.freshnessSeconds > 300).length;
  const blocking = issues.filter((issue) => issue.blocking && issue.status !== "Resolved").length;
  const billingExposure = meters.reduce((sum, meter) => sum + meter.billingImpactIDR, 0);
  return { completeness, estimated, trusted, stale, blocking, billingExposure };
}

export function getMissingDataCalendar() {
  const meters = ["MAIN", "TNT-03", "CHP", "PQ-F07", "GRK-04", "SBY-01"];
  return meters.map((meter, row) => ({
    meter,
    days: Array.from({ length: 30 }, (_, day) => {
      const missing = meter === "TNT-03" && day >= 22 && day <= 23 ? 3 : meter === "GRK-04" && day === 24 ? 2 : meter === "SBY-01" && day >= 19 && day <= 20 ? 1 : 0;
      const deterministic = (row * 7 + day * 3) % 31 === 0 ? 1 : 0;
      return Math.max(missing, deterministic);
    }),
  }));
}

export function getFreshnessDistribution(meters: MeterHealthRecord[]) {
  const buckets = [
    { label: "≤5 s", min: 0, max: 5 },
    { label: "6–30 s", min: 6, max: 30 },
    { label: "31–300 s", min: 31, max: 300 },
    { label: ">5 min", min: 301, max: Number.POSITIVE_INFINITY },
  ];
  return buckets.map((bucket) => ({
    bucket: bucket.label,
    meters: meters.filter((meter) => meter.freshnessSeconds >= bucket.min && meter.freshnessSeconds <= bucket.max).length,
  }));
}
