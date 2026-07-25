import type { DemoScenarioId } from "./demo-simulation";

export type CarbonMethod = "Location-based" | "Market-based";
export type AssuranceState = "Ready" | "Review" | "Blocked";
export type ReportStatus = "Draft" | "Review required" | "Approved" | "Published";
export type ReportFrequency = "Monthly" | "Quarterly" | "Annual" | "On demand";

export type EmissionFactor = {
  id: string;
  activity: string;
  scope: "Scope 1" | "Scope 2";
  factor: number;
  unit: string;
  source: string;
  version: string;
  effectiveFrom: string;
  effectiveTo: string;
  quality: "Primary" | "Supplier-specific" | "Regional average" | "Engineering estimate";
};

export type MonthlyCarbonPoint = {
  month: string;
  gridMWh: number;
  renewableMWh: number;
  dieselLitres: number;
  naturalGasGJ: number;
  refrigerantKg: number;
  scope1Tco2e: number;
  scope2LocationTco2e: number;
  scope2MarketTco2e: number;
  targetTco2e: number;
  productionKt: number;
  completenessPct: number;
};

export type RenewableInstrument = {
  id: string;
  type: "On-site generation" | "Energy attribute certificate" | "Supplier product";
  vintage: string;
  volumeMWh: number;
  allocatedMWh: number;
  remainingMWh: number;
  geography: string;
  evidence: string;
  status: "Available" | "Allocated" | "Retired" | "Review required";
};

export type AssuranceCheck = {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
  blocking: boolean;
  owner: string;
};

export type SustainabilityInventory = {
  site: string;
  boundary: string;
  reportingYear: number;
  months: MonthlyCarbonPoint[];
  factors: EmissionFactor[];
  instruments: RenewableInstrument[];
  scope1Tco2e: number;
  scope2LocationTco2e: number;
  scope2MarketTco2e: number;
  renewableSharePct: number;
  intensityLocationTco2ePerKt: number;
  intensityMarketTco2ePerKt: number;
  targetYtdTco2e: number;
  forecastYearEndTco2e: number;
  baselineYearTco2e: number;
  dataCompletenessPct: number;
  estimatedCoveragePct: number;
  assuranceState: AssuranceState;
  checks: AssuranceCheck[];
};

export type ReportDefinition = {
  id: string;
  title: string;
  category: "Executive" | "Energy" | "Carbon" | "Billing" | "Power quality" | "Savings" | "Data quality";
  audience: string;
  frequency: ReportFrequency;
  period: string;
  owner: string;
  reviewer: string;
  status: ReportStatus;
  lastGenerated: string;
  nextRun: string;
  completenessPct: number;
  blockingIssues: number;
  sections: string[];
  sourceSystems: string[];
};

const factorRegistry: EmissionFactor[] = [
  {
    id: "EF-GRID-LB-2026",
    activity: "Purchased grid electricity — location-based",
    scope: "Scope 2",
    factor: 0.75,
    unit: "tCO₂e/MWh",
    source: "Configured regional grid factor",
    version: "2026.1",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    quality: "Regional average",
  },
  {
    id: "EF-GRID-MB-2026",
    activity: "Purchased grid electricity — residual/supplier mix",
    scope: "Scope 2",
    factor: 0.61,
    unit: "tCO₂e/MWh",
    source: "Configured supplier and residual mix",
    version: "2026.1",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    quality: "Supplier-specific",
  },
  {
    id: "EF-DIESEL-2026",
    activity: "Stationary diesel combustion",
    scope: "Scope 1",
    factor: 0.00268,
    unit: "tCO₂e/litre",
    source: "Configured combustion factor registry",
    version: "2026.1",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    quality: "Regional average",
  },
  {
    id: "EF-GAS-2026",
    activity: "Natural-gas combustion",
    scope: "Scope 1",
    factor: 0.0561,
    unit: "tCO₂e/GJ",
    source: "Configured combustion factor registry",
    version: "2026.1",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    quality: "Regional average",
  },
  {
    id: "EF-REF-410A-2026",
    activity: "Refrigerant top-up — configured refrigerant type",
    scope: "Scope 1",
    factor: 2.088,
    unit: "tCO₂e/kg",
    source: "Configured refrigerant factor registry",
    version: "2026.1",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    quality: "Engineering estimate",
  },
];

const baseActivity = [
  [1850, 210, 4800, 1210, 1.1, 18.4],
  [1780, 226, 3400, 1180, 0.5, 17.9],
  [1925, 252, 5100, 1260, 0.0, 19.3],
  [2010, 284, 2800, 1295, 0.8, 20.1],
  [2095, 312, 2400, 1325, 0.0, 20.7],
  [2160, 338, 5900, 1360, 0.4, 21.0],
  [2225, 352, 4100, 1395, 0.0, 21.4],
  [2250, 346, 2600, 1410, 0.7, 21.7],
  [2180, 320, 2300, 1385, 0.0, 21.2],
  [2075, 285, 3000, 1340, 0.3, 20.5],
  [1980, 248, 3300, 1280, 0.0, 19.8],
  [1910, 220, 3700, 1235, 0.0, 19.0],
] as const;

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function round(value: number, digits = 1) {
  const power = 10 ** digits;
  return Math.round(value * power) / power;
}

export function getSustainabilityInventory(site: string, scale: number, scenarioId: DemoScenarioId): SustainabilityInventory {
  const scenarioMultiplier = scenarioId === "peak-demand" ? 1.035 : scenarioId === "efficiency-loss" ? 1.06 : 1;
  const qualityPenalty = scenarioId === "billing-exception" ? 0.942 : 0.991;
  const estimatedCoveragePct = scenarioId === "billing-exception" ? 5.8 : 0.9;
  const locationFactor = factorRegistry[0].factor;
  const marketFactor = factorRegistry[1].factor;

  const months = baseActivity.map((row, index) => {
    const [gridMWhBase, renewableMWhBase, dieselLitresBase, naturalGasGJBase, refrigerantKgBase, productionKtBase] = row;
    const future = index > 6;
    const forecastAdjustment = future ? 0.985 : 1;
    const gridMWh = gridMWhBase * scale * scenarioMultiplier * forecastAdjustment;
    const renewableMWh = renewableMWhBase * scale * (scenarioId === "peak-demand" ? 0.98 : 1);
    const dieselLitres = dieselLitresBase * scale * (scenarioId === "voltage-sag" && index === 6 ? 1.18 : 1);
    const naturalGasGJ = naturalGasGJBase * scale * (scenarioId === "efficiency-loss" ? 1.04 : 1);
    const refrigerantKg = refrigerantKgBase * scale;
    const productionKt = productionKtBase * scale * (scenarioId === "efficiency-loss" ? 0.985 : 1);
    const scope1Tco2e = dieselLitres * factorRegistry[2].factor + naturalGasGJ * factorRegistry[3].factor + refrigerantKg * factorRegistry[4].factor;
    const scope2LocationTco2e = gridMWh * locationFactor;
    const certificateAllocation = Math.min(renewableMWh * 0.58, gridMWh * 0.18);
    const scope2MarketTco2e = Math.max(0, gridMWh - certificateAllocation) * marketFactor;
    const targetTco2e = (1435 - index * 12) * scale;

    return {
      month: monthLabels[index],
      gridMWh: round(gridMWh),
      renewableMWh: round(renewableMWh),
      dieselLitres: round(dieselLitres, 0),
      naturalGasGJ: round(naturalGasGJ),
      refrigerantKg: round(refrigerantKg, 2),
      scope1Tco2e: round(scope1Tco2e),
      scope2LocationTco2e: round(scope2LocationTco2e),
      scope2MarketTco2e: round(scope2MarketTco2e),
      targetTco2e: round(targetTco2e),
      productionKt: round(productionKt),
      completenessPct: round(qualityPenalty * 100 - (scenarioId === "billing-exception" && index === 6 ? 2.4 : 0)),
    };
  });

  const ytdMonths = months.slice(0, 7);
  const sum = (selector: (point: MonthlyCarbonPoint) => number, data = ytdMonths) => data.reduce((total, point) => total + selector(point), 0);
  const scope1Tco2e = sum((point) => point.scope1Tco2e);
  const scope2LocationTco2e = sum((point) => point.scope2LocationTco2e);
  const scope2MarketTco2e = sum((point) => point.scope2MarketTco2e);
  const productionKt = sum((point) => point.productionKt);
  const energyMWh = sum((point) => point.gridMWh + point.renewableMWh);
  const renewableMWh = sum((point) => point.renewableMWh);
  const targetYtdTco2e = sum((point) => point.targetTco2e);
  const forecastYearEndTco2e = sum((point) => point.scope1Tco2e + point.scope2MarketTco2e, months);
  const dataCompletenessPct = round(sum((point) => point.completenessPct) / ytdMonths.length);

  const checks: AssuranceCheck[] = [
    {
      id: "ASR-01",
      label: "Organizational and operational boundary approved",
      detail: "Cikarang site boundary includes purchased electricity, stationary combustion, and recorded refrigerant additions.",
      passed: true,
      blocking: true,
      owner: "Sustainability Manager",
    },
    {
      id: "ASR-02",
      label: "Activity data completeness ≥95%",
      detail: `${dataCompletenessPct.toFixed(1)}% interval and monthly activity coverage`,
      passed: dataCompletenessPct >= 95,
      blocking: true,
      owner: "Energy Data Steward",
    },
    {
      id: "ASR-03",
      label: "Emission-factor versions within reporting period",
      detail: "Five configured factors are effective for the 2026 reporting year.",
      passed: true,
      blocking: true,
      owner: "Carbon Accounting Lead",
    },
    {
      id: "ASR-04",
      label: "Market-based instruments reconciled",
      detail: "Allocated renewable volume does not exceed eligible consumption and vintage.",
      passed: true,
      blocking: true,
      owner: "Procurement Sustainability Lead",
    },
    {
      id: "ASR-05",
      label: "Estimated activity below configured threshold",
      detail: `${estimatedCoveragePct.toFixed(1)}% of reported activity is estimated or substituted`,
      passed: estimatedCoveragePct <= 3,
      blocking: scenarioId === "billing-exception",
      owner: "Energy Data Steward",
    },
    {
      id: "ASR-06",
      label: "Independent management review assigned",
      detail: "Plant Engineering Manager is assigned as report approver.",
      passed: true,
      blocking: false,
      owner: "Sustainability Manager",
    },
  ];

  const blockingFailed = checks.some((check) => check.blocking && !check.passed);
  const nonBlockingFailed = checks.some((check) => !check.blocking && !check.passed);

  const instruments: RenewableInstrument[] = [
    {
      id: "REN-PV-CIK-2026",
      type: "On-site generation",
      vintage: "2026",
      volumeMWh: round(sum((point) => point.renewableMWh)),
      allocatedMWh: round(sum((point) => point.renewableMWh)),
      remainingMWh: 0,
      geography: "Cikarang site",
      evidence: "Inverter meters PV-01..06 · 15-minute aggregation",
      status: "Allocated",
    },
    {
      id: "EAC-ID-2026-0148",
      type: "Energy attribute certificate",
      vintage: "2026",
      volumeMWh: round(1850 * scale),
      allocatedMWh: round(1460 * scale),
      remainingMWh: round(390 * scale),
      geography: "Indonesia",
      evidence: "Configured certificate register · retirement pending",
      status: scenarioId === "billing-exception" ? "Review required" : "Available",
    },
    {
      id: "SUP-GREEN-2026-Q2",
      type: "Supplier product",
      vintage: "2026 Q2",
      volumeMWh: round(740 * scale),
      allocatedMWh: round(740 * scale),
      remainingMWh: 0,
      geography: "Contracted supply point",
      evidence: "Supplier statement and contract schedule",
      status: "Retired",
    },
  ];

  return {
    site,
    boundary: "Operational-control boundary · purchased electricity, stationary combustion, and recorded refrigerant additions",
    reportingYear: 2026,
    months,
    factors: factorRegistry,
    instruments,
    scope1Tco2e: round(scope1Tco2e),
    scope2LocationTco2e: round(scope2LocationTco2e),
    scope2MarketTco2e: round(scope2MarketTco2e),
    renewableSharePct: round((renewableMWh / Math.max(1, energyMWh)) * 100),
    intensityLocationTco2ePerKt: round((scope1Tco2e + scope2LocationTco2e) / Math.max(1, productionKt), 2),
    intensityMarketTco2ePerKt: round((scope1Tco2e + scope2MarketTco2e) / Math.max(1, productionKt), 2),
    targetYtdTco2e: round(targetYtdTco2e),
    forecastYearEndTco2e: round(forecastYearEndTco2e),
    baselineYearTco2e: round(18_940 * scale),
    dataCompletenessPct,
    estimatedCoveragePct,
    assuranceState: blockingFailed ? "Blocked" : nonBlockingFailed ? "Review" : "Ready",
    checks,
  };
}

export function getReportLibrary(inventory: SustainabilityInventory, scenarioId: DemoScenarioId): ReportDefinition[] {
  const carbonBlocked = inventory.assuranceState === "Blocked";
  const billingBlocked = scenarioId === "billing-exception";
  return [
    {
      id: "RPT-EXEC-2026-07",
      title: "Executive Energy & Carbon Performance",
      category: "Executive",
      audience: "Executive Committee",
      frequency: "Monthly",
      period: "July 2026",
      owner: "Energy & Sustainability Manager",
      reviewer: "Plant Engineering Manager",
      status: carbonBlocked ? "Review required" : "Approved",
      lastGenerated: "2026-07-25 07:30",
      nextRun: "2026-08-01 07:00",
      completenessPct: inventory.dataCompletenessPct,
      blockingIssues: carbonBlocked ? 1 : 0,
      sections: ["Executive summary", "Energy and cost", "Demand exposure", "Carbon inventory", "Verified savings", "Priority actions", "Data confidence"],
      sourceSystems: ["Interval energy", "Demand forecast", "Savings ledger", "Carbon inventory", "Data health"],
    },
    {
      id: "RPT-CARBON-2026-Q2",
      title: "Quarterly Scope 1 & Scope 2 Inventory",
      category: "Carbon",
      audience: "Sustainability Steering Committee",
      frequency: "Quarterly",
      period: "Q2 2026",
      owner: "Carbon Accounting Lead",
      reviewer: "Sustainability Manager",
      status: carbonBlocked ? "Review required" : "Approved",
      lastGenerated: "2026-07-18 15:10",
      nextRun: "2026-10-05 08:00",
      completenessPct: inventory.dataCompletenessPct,
      blockingIssues: carbonBlocked ? 1 : 0,
      sections: ["Boundary", "Activity data", "Factor registry", "Location-based results", "Market-based results", "Renewable instruments", "Assurance checks"],
      sourceSystems: ["Electricity meters", "Fuel records", "Refrigerant log", "Factor registry", "Certificate register"],
    },
    {
      id: "RPT-BILL-2026-07",
      title: "Tenant Billing Assurance Pack",
      category: "Billing",
      audience: "Finance and Property Operations",
      frequency: "Monthly",
      period: "July 2026",
      owner: "Billing Analyst",
      reviewer: "Finance Controller",
      status: billingBlocked ? "Review required" : "Published",
      lastGenerated: "2026-07-25 06:45",
      nextRun: "2026-08-01 06:30",
      completenessPct: billingBlocked ? 94.1 : 99.2,
      blockingIssues: billingBlocked ? 1 : 0,
      sections: ["Invoice register", "Tariff trace", "Meter completeness", "Exceptions", "Collection position"],
      sourceSystems: ["Revenue meters", "Tariff engine", "Invoice workflow", "Payment register"],
    },
    {
      id: "RPT-PQ-2026-1042",
      title: "Power Quality Incident Investigation",
      category: "Power quality",
      audience: "Electrical Reliability Review",
      frequency: "On demand",
      period: "Incident INC-PQ-1042",
      owner: "Power Quality Engineer",
      reviewer: "Electrical Reliability Manager",
      status: "Review required",
      lastGenerated: "2026-07-18 09:10",
      nextRun: "On workflow change",
      completenessPct: 98.8,
      blockingIssues: 0,
      sections: ["Event evidence", "Meter correlation", "Equipment response", "Probable origin", "Revision history"],
      sourceSystems: ["PQ meters", "Alarm chronology", "Electrical network", "Equipment response"],
    },
    {
      id: "RPT-MV-2026-07",
      title: "Verified Savings & Persistence Review",
      category: "Savings",
      audience: "Energy Performance Review",
      frequency: "Monthly",
      period: "July 2026",
      owner: "Energy Performance Engineer",
      reviewer: "Plant Energy Manager",
      status: "Approved",
      lastGenerated: "2026-07-24 16:30",
      nextRun: "2026-08-05 08:00",
      completenessPct: 98.7,
      blockingIssues: 0,
      sections: ["Verified ledger", "M&V calculation trace", "Persistence risk", "Corrective actions"],
      sourceSystems: ["Savings ledger", "M&V plans", "Interval meters", "Action workflow"],
    },
    {
      id: "RPT-DQ-2026-07",
      title: "Data Quality & Decision Confidence",
      category: "Data quality",
      audience: "Energy Data Governance Board",
      frequency: "Monthly",
      period: "July 2026",
      owner: "Energy Data Steward",
      reviewer: "Digital Operations Manager",
      status: billingBlocked ? "Review required" : "Approved",
      lastGenerated: "2026-07-25 05:50",
      nextRun: "2026-08-01 05:30",
      completenessPct: billingBlocked ? 96.4 : 99.1,
      blockingIssues: billingBlocked ? 1 : 0,
      sections: ["Portfolio trust", "Meter health", "Blocking issues", "Provenance", "Affected calculations"],
      sourceSystems: ["Meter registry", "Gateway health", "Historian completeness", "Calculation lineage"],
    },
  ];
}

export function evaluateReportGate(report: ReportDefinition, inventory: SustainabilityInventory) {
  const checks = [
    { label: "Reporting period and boundary assigned", passed: report.period.length > 0, detail: report.period },
    { label: "Source completeness ≥95%", passed: report.completenessPct >= 95, detail: `${report.completenessPct.toFixed(1)}% complete` },
    { label: "No unresolved blocking issue", passed: report.blockingIssues === 0, detail: `${report.blockingIssues} blocking issue(s)` },
    { label: "Accountable owner assigned", passed: report.owner.length > 0, detail: report.owner },
    { label: "Independent reviewer assigned", passed: report.reviewer.length > 0, detail: report.reviewer },
    {
      label: "Carbon assurance gate passed",
      passed: report.category !== "Carbon" && report.category !== "Executive" ? true : inventory.assuranceState !== "Blocked",
      detail: report.category !== "Carbon" && report.category !== "Executive" ? "Not applicable" : inventory.assuranceState,
    },
  ];
  return { eligible: checks.every((check) => check.passed), checks };
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCarbonTrendSvg(inventory: SustainabilityInventory) {
  const width = 920;
  const height = 280;
  const padX = 50;
  const padY = 30;
  const values = inventory.months.map((point) => point.scope1Tco2e + point.scope2MarketTco2e);
  const max = Math.max(...values, ...inventory.months.map((point) => point.targetTco2e)) * 1.08;
  const x = (index: number) => padX + (index / 11) * (width - padX * 2);
  const y = (value: number) => padY + (1 - value / max) * (height - padY * 2);
  const actual = inventory.months.map((point, index) => `${x(index).toFixed(1)},${y(point.scope1Tco2e + point.scope2MarketTco2e).toFixed(1)}`).join(" ");
  const target = inventory.months.map((point, index) => `${x(index).toFixed(1)},${y(point.targetTco2e).toFixed(1)}`).join(" ");
  const labels = inventory.months.map((point, index) => `<text x="${x(index)}" y="${height - 8}" text-anchor="middle" font-size="9" fill="#64748b">${point.month}</text>`).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Market-based emissions versus target">
    <rect width="${width}" height="${height}" fill="#f8fafc" />
    <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#94a3b8" />
    <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" stroke="#94a3b8" />
    <polyline points="${actual}" fill="none" stroke="#0891b2" stroke-width="2.4" />
    <polyline points="${target}" fill="none" stroke="#d97706" stroke-width="1.8" stroke-dasharray="6 5" />
    ${labels}
    <text x="${padX}" y="18" font-size="10" fill="#475569">MONTHLY SCOPE 1 + MARKET-BASED SCOPE 2 · tCO₂e</text>
    <text x="${width - 170}" y="18" font-size="9" fill="#0891b2">Actual / forecast</text>
    <text x="${width - 70}" y="18" font-size="9" fill="#d97706">Target</text>
  </svg>`;
}

export function buildExecutiveSustainabilityReport(report: ReportDefinition, inventory: SustainabilityInventory) {
  const gate = evaluateReportGate(report, inventory);
  const generatedAt = new Date().toLocaleString("en-US", { hour12: false });
  const totalMarket = inventory.scope1Tco2e + inventory.scope2MarketTco2e;
  const totalLocation = inventory.scope1Tco2e + inventory.scope2LocationTco2e;
  const factorRows = inventory.factors.map((factor) => `<tr><td>${escapeHtml(factor.id)}</td><td>${escapeHtml(factor.activity)}</td><td>${factor.factor}</td><td>${escapeHtml(factor.unit)}</td><td>${escapeHtml(factor.version)}</td><td>${escapeHtml(factor.quality)}</td></tr>`).join("");
  const checkRows = gate.checks.map((check) => `<tr><td>${check.passed ? "PASS" : "FAIL"}</td><td>${escapeHtml(check.label)}</td><td>${escapeHtml(check.detail)}</td></tr>`).join("");
  const instrumentRows = inventory.instruments.map((instrument) => `<tr><td>${escapeHtml(instrument.id)}</td><td>${escapeHtml(instrument.type)}</td><td>${instrument.vintage}</td><td>${instrument.volumeMWh.toLocaleString("en-US")}</td><td>${instrument.allocatedMWh.toLocaleString("en-US")}</td><td>${escapeHtml(instrument.status)}</td></tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(report.id)} — ${escapeHtml(report.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { max-width: 1120px; margin: 0 auto; padding: 32px; color: #17202a; font: 11px/1.45 Inter, Arial, sans-serif; }
    header { border-bottom: 3px solid #00a6c7; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { margin: 4px 0 0; font-size: 25px; } h2 { margin: 26px 0 10px; font-size: 16px; }
    .eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: 10px; color: #607080; }
    .meta { display: grid; grid-template-columns: repeat(4,1fr); border: 1px solid #cbd5e1; margin-top: 16px; }
    .meta div { padding: 9px 11px; border-right: 1px solid #cbd5e1; }
    .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
    .card { border: 1px solid #d7e0e7; border-radius: 6px; padding: 12px; background: #f7fafc; }
    .label { color: #607080; text-transform: uppercase; letter-spacing: .1em; font-size: 9px; }
    .value { margin-top: 4px; font-size: 15px; font-weight: 650; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th,td { border: 1px solid #d7e0e7; padding: 7px; text-align: left; vertical-align: top; }
    th { background: #edf3f6; text-transform: uppercase; letter-spacing: .08em; font-size: 8px; }
    .finding { border-left: 4px solid ${gate.eligible ? "#15803d" : "#d97706"}; background: ${gate.eligible ? "#f0fdf4" : "#fff8e7"}; padding: 14px; }
    .disclaimer { margin-top: 26px; border-top: 1px solid #cbd5e1; padding-top: 12px; color: #607080; font-size: 9px; }
    @media print { body { padding: 0; } .card, table, svg { break-inside: avoid; } }
  </style>
</head>
<body>
  <header><div class="eyebrow">ArGrid governed report · deterministic demonstration data</div><h1>${escapeHtml(report.title)}</h1><div class="meta"><div><div class="label">Report</div>${escapeHtml(report.id)}</div><div><div class="label">Period</div>${escapeHtml(report.period)}</div><div><div class="label">Status</div>${escapeHtml(report.status)}</div><div><div class="label">Generated</div>${escapeHtml(generatedAt)}</div></div></header>
  <section class="grid">
    <div class="card"><div class="label">Scope 1 YTD</div><div class="value">${inventory.scope1Tco2e.toLocaleString("en-US")} tCO₂e</div></div>
    <div class="card"><div class="label">Scope 2 location-based</div><div class="value">${inventory.scope2LocationTco2e.toLocaleString("en-US")} tCO₂e</div></div>
    <div class="card"><div class="label">Scope 2 market-based</div><div class="value">${inventory.scope2MarketTco2e.toLocaleString("en-US")} tCO₂e</div></div>
    <div class="card"><div class="label">Renewable share</div><div class="value">${inventory.renewableSharePct.toFixed(1)}%</div></div>
  </section>
  <p class="finding"><strong>Reporting conclusion:</strong> ${gate.eligible ? "The configured report gate passes for publication in this demonstration workflow." : "Publication remains blocked until failed completeness, factor, or exception checks are resolved."} Location-based total is ${totalLocation.toLocaleString("en-US")} tCO₂e and market-based total is ${totalMarket.toLocaleString("en-US")} tCO₂e.</p>
  <h2>Emissions trajectory</h2>${renderCarbonTrendSvg(inventory)}
  <h2>Emission-factor registry</h2><table><thead><tr><th>ID</th><th>Activity</th><th>Factor</th><th>Unit</th><th>Version</th><th>Quality</th></tr></thead><tbody>${factorRows}</tbody></table>
  <h2>Renewable-attribute register</h2><table><thead><tr><th>ID</th><th>Type</th><th>Vintage</th><th>Volume MWh</th><th>Allocated MWh</th><th>Status</th></tr></thead><tbody>${instrumentRows}</tbody></table>
  <h2>Report assurance gate</h2><table><thead><tr><th>State</th><th>Check</th><th>Evidence</th></tr></thead><tbody>${checkRows}</tbody></table>
  <h2>Management sign-off</h2><table><tbody><tr><td><strong>Prepared by</strong><br/>${escapeHtml(report.owner)}<br/>Electronic signature not implemented</td><td><strong>Reviewed by</strong><br/>${escapeHtml(report.reviewer)}<br/>${gate.eligible ? "Reviewer assigned" : "Pending gate resolution"}</td><td><strong>Publication state</strong><br/>${escapeHtml(report.status)}<br/>No external filing or statutory submission performed</td></tr></tbody></table>
  <div class="disclaimer">This report uses configured demonstration activity data, emission factors, renewable instruments, and workflow states. It is not a statutory greenhouse-gas inventory, external assurance opinion, certificate retirement record, regulatory filing, or supplier attestation. Confirm organizational boundaries, factor applicability, contractual instruments, data controls, and reporting requirements before real-world use.</div>
</body>
</html>`;
}

export function downloadReport(filename: string, html: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
