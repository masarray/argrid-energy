export const ACTION_STAGES = [
  "Validated",
  "Approved",
  "Assigned",
  "In Progress",
  "Implemented",
  "Verification",
  "Verified Saving",
  "Persistence Monitoring",
] as const;

export const BOARD_STAGES = ["Validated", "Approved", "In Progress", "Implemented", "Verification", "Verified"] as const;

export type ActionStage = (typeof ACTION_STAGES)[number];
export type BoardStage = (typeof BOARD_STAGES)[number];
export type DataQualityState = "GOOD" | "UNCERTAIN" | "STALE" | "BAD" | "SUBSTITUTED" | "ESTIMATED" | "MANUAL";
export type PersistenceState = "Stable" | "Watch" | "At risk";
export type MvOption = "Option A" | "Option B" | "Option C" | "Option D";

export type NormalizationVariable = {
  name: string;
  baselineValue: string;
  reportingValue: string;
  adjustmentKWh: number;
};

export type VerificationPlan = {
  option: MvOption;
  methodLabel: string;
  measurementBoundary: string;
  meter: string;
  baselinePeriod: string;
  reportingPeriod: string;
  baselineFrozen: boolean;
  reportingPeriodClosed: boolean;
  baselineModelKWh: number;
  routineAdjustmentKWh: number;
  nonRoutineAdjustmentKWh: number;
  adjustedBaselineKWh: number;
  actualKWh: number;
  annualizationFactor: number;
  tariffIDRPerKWh: number;
  emissionFactorKgPerKWh: number;
  dataCompletenessPct: number;
  estimatedIntervalPct: number;
  quality: DataQualityState;
  modelR2: number;
  cvRmsePct: number;
  nmbePct: number;
  calibrationDue: string;
  variables: NormalizationVariable[];
  evidence: string[];
  preparedBy: string;
  reviewedBy: string;
};

export type ActionRecord = {
  id: string;
  opportunityId: string;
  title: string;
  site: string;
  asset: string;
  problemStatement: string;
  correctiveAction: string;
  owner: string;
  supportingTeam: string;
  dueDate: string;
  stage: ActionStage;
  progressPct: number;
  currentRisk: "Low" | "Medium" | "High";
  estimatedSavingIDR: number;
  estimatedCapexIDR: number;
  actualImplementationCostIDR: number | null;
  workOrder: string | null;
  verification: VerificationPlan | null;
};

export type SavingsLedgerRecord = {
  id: string;
  initiative: string;
  site: string;
  savingType: "Energy" | "Demand charge" | "Power-factor penalty";
  verifiedEnergyKWh: number;
  verifiedCostIDR: number;
  avoidedEmissionsTco2e: number;
  implementationCostIDR: number;
  paybackYears: number;
  verificationConfidencePct: number;
  verificationMethod: string;
  persistenceState: PersistenceState;
  atRiskIDR: number;
};

export type PersistenceRecord = {
  id: string;
  initiative: string;
  owner: string;
  state: PersistenceState;
  expectedAnnualIDR: number;
  atRiskIDR: number;
  thresholdPct: number;
  monthlyPerformancePct: number[];
  months: string[];
  lastReview: string;
  nextReview: string;
  trigger: string;
  recommendedAction: string;
};

const chillerVerification: VerificationPlan = {
  option: "Option B",
  methodLabel: "Retrofit isolation · all relevant parameters measured",
  measurementBoundary: "CH-01/02 chillers, primary pumps, and cooling-tower fans downstream of meter PM-CHP-01",
  meter: "PM-CHP-01 · class 0.5S · 15-minute interval",
  baselinePeriod: "2026-04-01 → 2026-06-30",
  reportingPeriod: "2026-07-01 → 2026-07-31",
  baselineFrozen: true,
  reportingPeriodClosed: true,
  baselineModelKWh: 219_100,
  routineAdjustmentKWh: 10_553,
  nonRoutineAdjustmentKWh: -1_253,
  adjustedBaselineKWh: 228_400,
  actualKWh: 212_233,
  annualizationFactor: 12,
  tariffIDRPerKWh: 1_200,
  emissionFactorKgPerKWh: 0.75,
  dataCompletenessPct: 98.7,
  estimatedIntervalPct: 1.3,
  quality: "GOOD",
  modelR2: 0.91,
  cvRmsePct: 7.8,
  nmbePct: 0.9,
  calibrationDue: "2027-02-14",
  variables: [
    { name: "Cooling degree hours", baselineValue: "2,840 CDH", reportingValue: "3,042 CDH", adjustmentKWh: 6_410 },
    { name: "Production output", baselineValue: "18,420 t", reportingValue: "19,310 t", adjustmentKWh: 4_143 },
    { name: "Operating schedule", baselineValue: "3 shifts", reportingValue: "3 shifts", adjustmentKWh: 0 },
  ],
  evidence: [
    "Commissioning record: sequencing logic SAT completed 2026-06-30",
    "Meter completeness report: 98.7% GOOD intervals",
    "CH-01/02 kW/RT trend and chilled-water supply-temperature overlay",
    "Production tonnage and cooling-degree-hour source trace",
  ],
  preparedBy: "Energy Performance Engineer",
  reviewedBy: "Plant Energy Manager",
};

const compressorVerification: VerificationPlan = {
  option: "Option B",
  methodLabel: "Retrofit isolation · compressed-air system measurement",
  measurementBoundary: "COMP-04 package, header flow meter, pressure transmitter, and unload-state signal",
  meter: "PM-CA-04 + FT-CA-01 · 1-minute interval",
  baselinePeriod: "2026-05-01 → 2026-05-21",
  reportingPeriod: "2026-07-08 → 2026-07-21",
  baselineFrozen: true,
  reportingPeriodClosed: true,
  baselineModelKWh: 68_240,
  routineAdjustmentKWh: 2_810,
  nonRoutineAdjustmentKWh: 0,
  adjustedBaselineKWh: 71_050,
  actualKWh: 64_210,
  annualizationFactor: 17.14,
  tariffIDRPerKWh: 1_200,
  emissionFactorKgPerKWh: 0.75,
  dataCompletenessPct: 93.8,
  estimatedIntervalPct: 6.2,
  quality: "ESTIMATED",
  modelR2: 0.84,
  cvRmsePct: 11.4,
  nmbePct: -1.8,
  calibrationDue: "2026-12-08",
  variables: [
    { name: "Production hours", baselineValue: "336 h", reportingValue: "351 h", adjustmentKWh: 2_810 },
    { name: "Header pressure", baselineValue: "6.4 bar", reportingValue: "6.4 bar", adjustmentKWh: 0 },
  ],
  evidence: [
    "Ultrasonic leak survey and repaired-leak register",
    "COMP-04 load/unload state log",
    "Header-flow trend contains 6.2% estimated intervals",
  ],
  preparedBy: "Utility Engineer",
  reviewedBy: "Maintenance Manager",
};

const baseActions: ActionRecord[] = [
  {
    id: "ACT-2036",
    opportunityId: "OPP-2036",
    title: "Chiller sequencing optimization",
    site: "",
    asset: "CH-01/02",
    problemStatement: "Parallel chiller operation remained active below the efficient loading band, increasing kW/RT during partial load.",
    correctiveAction: "Deploy lead-lag sequencing, minimum-run timers, and chilled-water reset logic; complete functional performance testing.",
    owner: "Utility Supervisor",
    supportingTeam: "Facilities Controls + Production Planning",
    dueDate: "2026-07-24",
    stage: "Verification",
    progressPct: 94,
    currentRisk: "Low",
    estimatedSavingIDR: 240_000_000,
    estimatedCapexIDR: 100_000_000,
    actualImplementationCostIDR: 95_000_000,
    workOrder: "WO-2606-184",
    verification: chillerVerification,
  },
  {
    id: "ACT-2039",
    opportunityId: "OPP-2039",
    title: "Compressed-air leak repair — Line 4 header",
    site: "",
    asset: "COMP-04 / CA-HDR-04",
    problemStatement: "Night pressure decay and unload runtime indicate persistent distribution leakage.",
    correctiveAction: "Repair tagged leaks, verify pressure stability, and repeat flow survey under matched production hours.",
    owner: "Maintenance Planner",
    supportingTeam: "Utilities + Line 4 Maintenance",
    dueDate: "2026-07-28",
    stage: "Verification",
    progressPct: 88,
    currentRisk: "Medium",
    estimatedSavingIDR: 96_400_000,
    estimatedCapexIDR: 22_000_000,
    actualImplementationCostIDR: 18_500_000,
    workOrder: "WO-2607-042",
    verification: compressorVerification,
  },
  {
    id: "ACT-2041",
    opportunityId: "OPP-2041",
    title: "HVAC nighttime setback in Heavy Lab",
    site: "",
    asset: "AHU-HL-03",
    problemStatement: "AHU-HL-03 operated continuously outside occupancy and environmental-control windows.",
    correctiveAction: "Implement occupied/unoccupied schedules with humidity override and morning warm-up logic.",
    owner: "Facility Engineer",
    supportingTeam: "Laboratory Operations",
    dueDate: "2026-08-02",
    stage: "In Progress",
    progressPct: 62,
    currentRisk: "Medium",
    estimatedSavingIDR: 184_000_000,
    estimatedCapexIDR: 52_000_000,
    actualImplementationCostIDR: null,
    workOrder: "WO-2607-091",
    verification: null,
  },
  {
    id: "ACT-2031",
    opportunityId: "OPP-2031",
    title: "Peak-demand operating sequence",
    site: "",
    asset: "FURN-A2 / CH-02 / BESS-01",
    problemStatement: "Coincident furnace and chiller starts create repeatable 15-minute contract-demand exposure.",
    correctiveAction: "Approve production-aware start sequencing and BESS support rules with operator confirmation.",
    owner: "Energy Manager",
    supportingTeam: "Production + Electrical Operations",
    dueDate: "2026-08-05",
    stage: "Approved",
    progressPct: 28,
    currentRisk: "High",
    estimatedSavingIDR: 312_500_000,
    estimatedCapexIDR: 18_000_000,
    actualImplementationCostIDR: null,
    workOrder: null,
    verification: null,
  },
  {
    id: "ACT-2028",
    opportunityId: "OPP-2028",
    title: "Warehouse lighting occupancy control",
    site: "",
    asset: "LTG-WH",
    problemStatement: "Lighting remained energized during unoccupied loading-bay periods.",
    correctiveAction: "Install zoned occupancy control with safety egress override and commissioning test.",
    owner: "Warehouse Engineer",
    supportingTeam: "EHS + Electrical Maintenance",
    dueDate: "2026-07-18",
    stage: "Implemented",
    progressPct: 82,
    currentRisk: "Low",
    estimatedSavingIDR: 42_800_000,
    estimatedCapexIDR: 36_000_000,
    actualImplementationCostIDR: 32_000_000,
    workOrder: "WO-2606-129",
    verification: null,
  },
  {
    id: "ACT-2024",
    opportunityId: "OPP-2024",
    title: "Power-factor correction — MSB-02",
    site: "",
    asset: "MSB-02 / CAP-02",
    problemStatement: "Reactive-energy penalty was observed during low-load production periods.",
    correctiveAction: "Retune capacitor-bank staging and verify harmonic compatibility across operating states.",
    owner: "Electrical Engineer",
    supportingTeam: "Power Quality + Maintenance",
    dueDate: "2026-06-28",
    stage: "Persistence Monitoring",
    progressPct: 100,
    currentRisk: "Low",
    estimatedSavingIDR: 68_200_000,
    estimatedCapexIDR: 34_000_000,
    actualImplementationCostIDR: 32_000_000,
    workOrder: "WO-2605-218",
    verification: null,
  },
  {
    id: "ACT-2022",
    opportunityId: "OPP-2022",
    title: "Weekend baseload reduction",
    site: "",
    asset: "Utilities portfolio",
    problemStatement: "Weekend baseload exceeded the normalized shutdown profile for four consecutive weeks.",
    correctiveAction: "Implement shutdown checklist, exception ownership, and Monday variance review.",
    owner: "Plant Energy Manager",
    supportingTeam: "All Area Owners",
    dueDate: "2026-06-21",
    stage: "Verified Saving",
    progressPct: 100,
    currentRisk: "Medium",
    estimatedSavingIDR: 340_000_000,
    estimatedCapexIDR: 80_000_000,
    actualImplementationCostIDR: 72_000_000,
    workOrder: "WO-2605-176",
    verification: null,
  },
  {
    id: "ACT-2044",
    opportunityId: "OPP-2044",
    title: "Transformer cooling control review",
    site: "",
    asset: "TR-01",
    problemStatement: "Cooling fans run continuously below the preferred loading and winding-temperature thresholds.",
    correctiveAction: "Validate temperature sensors and revise fan staging only after transformer specialist review.",
    owner: "Electrical Maintenance Lead",
    supportingTeam: "Reliability Engineering",
    dueDate: "2026-08-12",
    stage: "Validated",
    progressPct: 12,
    currentRisk: "Low",
    estimatedSavingIDR: 58_000_000,
    estimatedCapexIDR: 24_000_000,
    actualImplementationCostIDR: null,
    workOrder: null,
    verification: null,
  },
];

const baseLedger: SavingsLedgerRecord[] = [
  {
    id: "SVG-1987",
    initiative: "Compressed-air pressure-band optimization",
    site: "",
    savingType: "Energy",
    verifiedEnergyKWh: 80_333,
    verifiedCostIDR: 96_400_000,
    avoidedEmissionsTco2e: 60.2,
    implementationCostIDR: 18_500_000,
    paybackYears: 0.19,
    verificationConfidencePct: 88,
    verificationMethod: "Option B · flow and power measurement",
    persistenceState: "Watch",
    atRiskIDR: 0,
  },
  {
    id: "SVG-1994",
    initiative: "Administration AHU schedule optimization",
    site: "",
    savingType: "Energy",
    verifiedEnergyKWh: 153_333,
    verifiedCostIDR: 184_000_000,
    avoidedEmissionsTco2e: 115.0,
    implementationCostIDR: 46_000_000,
    paybackYears: 0.25,
    verificationConfidencePct: 90,
    verificationMethod: "Option A · runtime and measured kW",
    persistenceState: "Stable",
    atRiskIDR: 0,
  },
  {
    id: "SVG-2024",
    initiative: "Power-factor correction — MSB-02",
    site: "",
    savingType: "Power-factor penalty",
    verifiedEnergyKWh: 0,
    verifiedCostIDR: 68_200_000,
    avoidedEmissionsTco2e: 0,
    implementationCostIDR: 32_000_000,
    paybackYears: 0.47,
    verificationConfidencePct: 94,
    verificationMethod: "Tariff trace + interval kvarh",
    persistenceState: "Stable",
    atRiskIDR: 0,
  },
  {
    id: "SVG-2022",
    initiative: "Weekend baseload reduction",
    site: "",
    savingType: "Energy",
    verifiedEnergyKWh: 265_500,
    verifiedCostIDR: 318_600_000,
    avoidedEmissionsTco2e: 199.1,
    implementationCostIDR: 72_000_000,
    paybackYears: 0.23,
    verificationConfidencePct: 86,
    verificationMethod: "Option C · normalized facility model",
    persistenceState: "At risk",
    atRiskIDR: 120_000_000,
  },
  {
    id: "SVG-1978",
    initiative: "Furnace staggered-start program — Phase 1",
    site: "",
    savingType: "Demand charge",
    verifiedEnergyKWh: 0,
    verifiedCostIDR: 220_000_000,
    avoidedEmissionsTco2e: 0,
    implementationCostIDR: 12_000_000,
    paybackYears: 0.05,
    verificationConfidencePct: 89,
    verificationMethod: "Interval peak comparison + operating log",
    persistenceState: "Stable",
    atRiskIDR: 0,
  },
];

const basePersistence: PersistenceRecord[] = [
  {
    id: "PER-2022",
    initiative: "Weekend baseload reduction",
    owner: "Plant Energy Manager",
    state: "At risk",
    expectedAnnualIDR: 318_600_000,
    atRiskIDR: 120_000_000,
    thresholdPct: 90,
    monthlyPerformancePct: [101, 98, 93, 88, 84, 82],
    months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    lastReview: "2026-07-22",
    nextReview: "2026-08-05",
    trigger: "Realized saving remained below 90% of the normalized expectation for two consecutive review periods.",
    recommendedAction: "Re-open shutdown exceptions for Compressor C-03 and warehouse ventilation; assign area-owner closure dates.",
  },
  {
    id: "PER-2024",
    initiative: "Power-factor correction — MSB-02",
    owner: "Electrical Engineer",
    state: "Stable",
    expectedAnnualIDR: 68_200_000,
    atRiskIDR: 0,
    thresholdPct: 90,
    monthlyPerformancePct: [96, 99, 101, 103, 100, 102],
    months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    lastReview: "2026-07-24",
    nextReview: "2026-08-24",
    trigger: "Monthly normalized savings remain within the accepted persistence band.",
    recommendedAction: "Continue monthly kvarh and harmonic review after major production-load changes.",
  },
  {
    id: "PER-1994",
    initiative: "Administration AHU schedule optimization",
    owner: "Facility Engineer",
    state: "Watch",
    expectedAnnualIDR: 184_000_000,
    atRiskIDR: 0,
    thresholdPct: 90,
    monthlyPerformancePct: [100, 99, 97, 96, 92, 91],
    months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    lastReview: "2026-07-20",
    nextReview: "2026-08-03",
    trigger: "Humidity overrides increased during the last two weeks but remain above the persistence threshold.",
    recommendedAction: "Review override reasons and confirm laboratory environmental constraints before changing schedules.",
  },
];

export function getActionRecords(site: string, scale: number): ActionRecord[] {
  return baseActions.map((action) => ({
    ...action,
    site,
    estimatedSavingIDR: action.estimatedSavingIDR * scale,
    estimatedCapexIDR: action.estimatedCapexIDR * scale,
    actualImplementationCostIDR:
      action.actualImplementationCostIDR === null ? null : action.actualImplementationCostIDR * scale,
    verification:
      action.verification === null
        ? null
        : {
            ...action.verification,
            baselineModelKWh: action.verification.baselineModelKWh * scale,
            routineAdjustmentKWh: action.verification.routineAdjustmentKWh * scale,
            nonRoutineAdjustmentKWh: action.verification.nonRoutineAdjustmentKWh * scale,
            adjustedBaselineKWh: action.verification.adjustedBaselineKWh * scale,
            actualKWh: action.verification.actualKWh * scale,
            variables: action.verification.variables.map((variable) => ({
              ...variable,
              adjustmentKWh: variable.adjustmentKWh * scale,
            })),
          },
  }));
}

export function getSavingsLedger(site: string, scale: number): SavingsLedgerRecord[] {
  return baseLedger.map((record) => ({
    ...record,
    site,
    verifiedEnergyKWh: record.verifiedEnergyKWh * scale,
    verifiedCostIDR: record.verifiedCostIDR * scale,
    avoidedEmissionsTco2e: record.avoidedEmissionsTco2e * scale,
    implementationCostIDR: record.implementationCostIDR * scale,
    atRiskIDR: record.atRiskIDR * scale,
  }));
}

export function getPersistenceRecords(scale: number): PersistenceRecord[] {
  return basePersistence.map((record) => ({
    ...record,
    expectedAnnualIDR: record.expectedAnnualIDR * scale,
    atRiskIDR: record.atRiskIDR * scale,
  }));
}

export function getExecutiveFunnel(scale: number) {
  return [
    { stage: "Identified", count: 18, valueIDR: 2_800_000_000 * scale, averageDays: 0 },
    { stage: "Validated", count: 13, valueIDR: 2_350_000_000 * scale, averageDays: 5 },
    { stage: "Approved", count: 9, valueIDR: 1_900_000_000 * scale, averageDays: 12 },
    { stage: "Implemented", count: 7, valueIDR: 1_400_000_000 * scale, averageDays: 34 },
    { stage: "Verified", count: 6, valueIDR: 1_120_000_000 * scale, averageDays: 61 },
  ];
}

export function boardStage(stage: ActionStage): BoardStage {
  if (stage === "Assigned") return "Approved";
  if (stage === "Verified Saving" || stage === "Persistence Monitoring") return "Verified";
  return stage as BoardStage;
}

export function getNextStage(stage: ActionStage): ActionStage | null {
  const index = ACTION_STAGES.indexOf(stage);
  if (index < 0 || index === ACTION_STAGES.length - 1) return null;
  return ACTION_STAGES[index + 1];
}

export function calculateVerification(plan: VerificationPlan) {
  const verifiedPeriodKWh = Math.max(0, plan.adjustedBaselineKWh - plan.actualKWh);
  const annualizedEnergyKWh = verifiedPeriodKWh * plan.annualizationFactor;
  const annualizedCostIDR = annualizedEnergyKWh * plan.tariffIDRPerKWh;
  const avoidedEmissionsTco2e = (annualizedEnergyKWh * plan.emissionFactorKgPerKWh) / 1000;
  return {
    verifiedPeriodKWh,
    annualizedEnergyKWh,
    annualizedCostIDR,
    avoidedEmissionsTco2e,
  };
}

export function evaluateVerificationGate(plan: VerificationPlan | null) {
  if (!plan) {
    return { eligible: false, checks: [{ label: "M&V plan assigned", passed: false, detail: "No verification plan is attached." }] };
  }

  const checks = [
    { label: "Baseline frozen", passed: plan.baselineFrozen, detail: plan.baselineFrozen ? plan.baselinePeriod : "Baseline approval missing." },
    { label: "Reporting period closed", passed: plan.reportingPeriodClosed, detail: plan.reportingPeriodClosed ? plan.reportingPeriod : "Reporting period remains open." },
    { label: "Data completeness ≥95%", passed: plan.dataCompletenessPct >= 95, detail: `${plan.dataCompletenessPct.toFixed(1)}% complete` },
    { label: "Meter data quality GOOD", passed: plan.quality === "GOOD", detail: `${plan.quality} · ${plan.estimatedIntervalPct.toFixed(1)}% estimated intervals` },
    { label: "Model fit accepted", passed: plan.modelR2 >= 0.75 && plan.cvRmsePct <= 20, detail: `R² ${plan.modelR2.toFixed(2)} · CV(RMSE) ${plan.cvRmsePct.toFixed(1)}%` },
    { label: "Independent reviewer assigned", passed: plan.reviewedBy.trim().length > 0, detail: plan.reviewedBy || "Reviewer missing" },
  ];

  return { eligible: checks.every((check) => check.passed), checks };
}

export function getVerificationSeries(actionId: string, scale: number) {
  const baselineShape = [7_410, 7_280, 7_520, 7_660, 7_340, 7_790, 7_880, 7_450, 7_610, 7_820, 7_560, 7_740, 7_910, 7_680];
  const chillerSaving = [520, 490, 610, 560, 530, 620, 590, 550, 580, 640, 570, 610, 650, 600];
  const compressorSaving = [420, 390, 460, 440, 410, 470, 450, 430, 445, 480, 420, 455, 490, 460];
  const saving = actionId === "ACT-2039" ? compressorSaving : chillerSaving;

  return baselineShape.map((baseline, index) => ({
    day: `D${String(index + 1).padStart(2, "0")}`,
    adjustedBaseline: Math.round(baseline * scale),
    actual: Math.round((baseline - saving[index]) * scale),
  }));
}
