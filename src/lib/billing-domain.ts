import type { DemoScenarioId } from "./demo-simulation";

export type InvoiceStatus =
  | "Draft"
  | "Review required"
  | "Approved"
  | "Issued"
  | "Partially paid"
  | "Paid"
  | "Overdue";

export type MeterQuality = "GOOD" | "ESTIMATED" | "SUBSTITUTED" | "STALE";

export type TariffVersion = {
  id: string;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  currency: "IDR";
  offPeakRate: number;
  shoulderRate: number;
  peakRate: number;
  demandRate: number;
  reactivePenaltyRate: number;
  fixedCharge: number;
  taxRate: number;
  powerFactorThreshold: number;
  billingDemandRule: string;
  timeBands: Array<{ name: string; window: string; rate: number }>;
};

export type MeterTrace = {
  meterId: string;
  sourcePath: string;
  meterClass: string;
  multiplier: number;
  openingReadingKWh: number;
  closingReadingKWh: number;
  totalKWh: number;
  offPeakKWh: number;
  shoulderKWh: number;
  peakKWh: number;
  billingDemandKW: number;
  powerFactor: number;
  reactiveExcessKvarh: number;
  completenessPct: number;
  estimatedPct: number;
  quality: MeterQuality;
  lastInterval: string;
  calibrationDue: string;
  allocationBasis: string;
};

export type InvoiceLine = {
  code: string;
  category: "Energy" | "Demand" | "Reactive" | "Fixed" | "Credit" | "Adjustment";
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  amount: number;
  source: string;
};

export type BillingException = {
  id: string;
  severity: "Warning" | "Critical";
  type: "Missing interval" | "Estimated interval" | "Meter reset" | "Tariff mismatch" | "Duplicate reading";
  description: string;
  blocking: boolean;
  status: "Open" | "Accepted" | "Resolved";
};

export type PaymentRecord = {
  date: string;
  reference: string;
  method: string;
  amount: number;
};

export type InvoiceRecord = {
  id: string;
  tenantId: string;
  tenantName: string;
  site: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string | null;
  dueDate: string;
  status: InvoiceStatus;
  tariff: TariffVersion;
  meter: MeterTrace;
  lines: InvoiceLine[];
  subtotal: number;
  tax: number;
  previousBalance: number;
  total: number;
  paid: number;
  balance: number;
  exceptions: BillingException[];
  preparedBy: string;
  approvedBy: string | null;
  auditTrail: Array<{ at: string; actor: string; action: string }>;
  payments: PaymentRecord[];
};

export const illustrativeTariff: TariffVersion = {
  id: "AR-TARIFF-COMM-2026-01",
  name: "Illustrative Commercial Time-of-Use Contract",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  currency: "IDR",
  offPeakRate: 1_120,
  shoulderRate: 1_380,
  peakRate: 1_680,
  demandRate: 94_500,
  reactivePenaltyRate: 185,
  fixedCharge: 850_000,
  taxRate: 0.11,
  powerFactorThreshold: 0.85,
  billingDemandRule: "Highest valid 15-minute interval demand in the closed billing period",
  timeBands: [
    { name: "Off-peak", window: "22:00–06:00", rate: 1_120 },
    { name: "Shoulder", window: "06:00–17:00", rate: 1_380 },
    { name: "Peak", window: "17:00–22:00", rate: 1_680 },
  ],
};

type TenantProfile = {
  tenantId: string;
  tenantName: string;
  meterId: string;
  offPeakKWh: number;
  shoulderKWh: number;
  peakKWh: number;
  billingDemandKW: number;
  powerFactor: number;
  reactiveExcessKvarh: number;
  completenessPct: number;
  estimatedPct: number;
  quality: MeterQuality;
  previousBalance: number;
  status: InvoiceStatus;
  payments: PaymentRecord[];
  exceptions: BillingException[];
};

const tenantProfiles: TenantProfile[] = [
  {
    tenantId: "T-001",
    tenantName: "Tenant A · Plastics Line",
    meterId: "PM-TNT-01",
    offPeakKWh: 84_200,
    shoulderKWh: 56_000,
    peakKWh: 44_000,
    billingDemandKW: 480,
    powerFactor: 0.96,
    reactiveExcessKvarh: 0,
    completenessPct: 99.9,
    estimatedPct: 0.1,
    quality: "GOOD",
    previousBalance: 0,
    status: "Paid",
    payments: [],
    exceptions: [],
  },
  {
    tenantId: "T-002",
    tenantName: "Tenant B · Metal Fabrication",
    meterId: "PM-TNT-02",
    offPeakKWh: 44_000,
    shoulderKWh: 30_000,
    peakKWh: 22_400,
    billingDemandKW: 260,
    powerFactor: 0.91,
    reactiveExcessKvarh: 6_200,
    completenessPct: 99.6,
    estimatedPct: 0.4,
    quality: "GOOD",
    previousBalance: 0,
    status: "Issued",
    payments: [],
    exceptions: [],
  },
  {
    tenantId: "T-003",
    tenantName: "Tenant C · Cold Storage",
    meterId: "PM-TNT-03",
    offPeakKWh: 98_000,
    shoulderKWh: 70_000,
    peakKWh: 52_600,
    billingDemandKW: 540,
    powerFactor: 0.88,
    reactiveExcessKvarh: 12_800,
    completenessPct: 94.1,
    estimatedPct: 5.9,
    quality: "ESTIMATED",
    previousBalance: 0,
    status: "Review required",
    payments: [],
    exceptions: [
      {
        id: "BEX-3061",
        severity: "Critical",
        type: "Missing interval",
        description: "17 hours of interval data were unavailable after gateway maintenance; provisional substitution remains unapproved.",
        blocking: true,
        status: "Open",
      },
      {
        id: "BEX-3062",
        severity: "Warning",
        type: "Estimated interval",
        description: "5.9% of the billing period is estimated from matched weekday and refrigeration-load profiles.",
        blocking: false,
        status: "Open",
      },
    ],
  },
  {
    tenantId: "T-004",
    tenantName: "Tenant D · Packaging",
    meterId: "PM-TNT-04",
    offPeakKWh: 28_000,
    shoulderKWh: 20_000,
    peakKWh: 14_100,
    billingDemandKW: 180,
    powerFactor: 0.95,
    reactiveExcessKvarh: 0,
    completenessPct: 99.8,
    estimatedPct: 0.2,
    quality: "GOOD",
    previousBalance: 0,
    status: "Approved",
    payments: [],
    exceptions: [],
  },
  {
    tenantId: "T-005",
    tenantName: "Tenant E · Assembly",
    meterId: "PM-TNT-05",
    offPeakKWh: 58_000,
    shoulderKWh: 41_000,
    peakKWh: 29_900,
    billingDemandKW: 340,
    powerFactor: 0.83,
    reactiveExcessKvarh: 18_000,
    completenessPct: 98.7,
    estimatedPct: 1.3,
    quality: "GOOD",
    previousBalance: 35_000_000,
    status: "Overdue",
    payments: [
      { date: "2026-07-11", reference: "TRX-776210", method: "Bank transfer", amount: 120_000_000 },
    ],
    exceptions: [
      {
        id: "BEX-3074",
        severity: "Warning",
        type: "Meter reset",
        description: "Register reset on 2026-06-14 was reconciled against the meter event log and signed field reading.",
        blocking: false,
        status: "Resolved",
      },
    ],
  },
];

function scenarioMultipliers(scenarioId: DemoScenarioId) {
  switch (scenarioId) {
    case "peak-demand":
      return { energy: 1.015, peakEnergy: 1.035, demand: 1.08, reactive: 1.05 };
    case "efficiency-loss":
      return { energy: 1.06, peakEnergy: 1.08, demand: 1.035, reactive: 1.12 };
    case "billing-exception":
      return { energy: 1, peakEnergy: 1, demand: 1, reactive: 1 };
    default:
      return { energy: 1, peakEnergy: 1, demand: 1, reactive: 1 };
  }
}

function makeLines(meter: MeterTrace, tariff: TariffVersion): InvoiceLine[] {
  const lines: InvoiceLine[] = [
    {
      code: "ENE-OFF",
      category: "Energy",
      description: "Off-peak active energy",
      quantity: meter.offPeakKWh,
      unit: "kWh",
      unitRate: tariff.offPeakRate,
      amount: meter.offPeakKWh * tariff.offPeakRate,
      source: `${meter.meterId} · intervals 22:00–06:00`,
    },
    {
      code: "ENE-SHD",
      category: "Energy",
      description: "Shoulder active energy",
      quantity: meter.shoulderKWh,
      unit: "kWh",
      unitRate: tariff.shoulderRate,
      amount: meter.shoulderKWh * tariff.shoulderRate,
      source: `${meter.meterId} · intervals 06:00–17:00`,
    },
    {
      code: "ENE-PEAK",
      category: "Energy",
      description: "Peak active energy",
      quantity: meter.peakKWh,
      unit: "kWh",
      unitRate: tariff.peakRate,
      amount: meter.peakKWh * tariff.peakRate,
      source: `${meter.meterId} · intervals 17:00–22:00`,
    },
    {
      code: "DMD-15M",
      category: "Demand",
      description: "Billing demand charge",
      quantity: meter.billingDemandKW,
      unit: "kW",
      unitRate: tariff.demandRate,
      amount: meter.billingDemandKW * tariff.demandRate,
      source: tariff.billingDemandRule,
    },
  ];

  if (meter.reactiveExcessKvarh > 0) {
    lines.push({
      code: "REACTIVE",
      category: "Reactive",
      description: `Reactive-energy penalty below PF ${tariff.powerFactorThreshold.toFixed(2)}`,
      quantity: meter.reactiveExcessKvarh,
      unit: "kvarh",
      unitRate: tariff.reactivePenaltyRate,
      amount: meter.reactiveExcessKvarh * tariff.reactivePenaltyRate,
      source: `${meter.meterId} · period PF ${meter.powerFactor.toFixed(3)}`,
    });
  }

  lines.push({
    code: "FIXED",
    category: "Fixed",
    description: "Metering, data service, and billing administration",
    quantity: 1,
    unit: "period",
    unitRate: tariff.fixedCharge,
    amount: tariff.fixedCharge,
    source: tariff.id,
  });

  return lines;
}

export function buildInvoices(site: string, scale: number, scenarioId: DemoScenarioId): InvoiceRecord[] {
  const multiplier = scenarioMultipliers(scenarioId);

  return tenantProfiles.map((profile, index) => {
    const anomalyBoost = scenarioId === "billing-exception" && profile.tenantId === "T-003";
    const offPeakKWh = Math.round(profile.offPeakKWh * scale * multiplier.energy);
    const shoulderKWh = Math.round(profile.shoulderKWh * scale * multiplier.energy);
    const peakKWh = Math.round(profile.peakKWh * scale * multiplier.peakEnergy);
    const totalKWh = offPeakKWh + shoulderKWh + peakKWh;
    const billingDemandKW = Math.round(profile.billingDemandKW * scale * multiplier.demand);
    const reactiveExcessKvarh = Math.round(profile.reactiveExcessKvarh * scale * multiplier.reactive);
    const completenessPct = anomalyBoost ? 91.8 : profile.completenessPct;
    const estimatedPct = anomalyBoost ? 8.2 : profile.estimatedPct;
    const quality: MeterQuality = anomalyBoost ? "ESTIMATED" : profile.quality;
    const openingReadingKWh = 2_400_000 + index * 1_075_000;
    const meter: MeterTrace = {
      meterId: profile.meterId,
      sourcePath: `${site} / Tenant Distribution / ${profile.meterId}`,
      meterClass: "Class 0.5S · revenue-grade demo",
      multiplier: 1,
      openingReadingKWh,
      closingReadingKWh: openingReadingKWh + totalKWh,
      totalKWh,
      offPeakKWh,
      shoulderKWh,
      peakKWh,
      billingDemandKW,
      powerFactor: profile.powerFactor,
      reactiveExcessKvarh,
      completenessPct,
      estimatedPct,
      quality,
      lastInterval: "2026-06-30 23:45",
      calibrationDue: `2027-0${(index % 8) + 1}-15`,
      allocationBasis: "Dedicated tenant submeter; no area-based allocation",
    };

    const lines = makeLines(meter, illustrativeTariff);
    const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
    const tax = subtotal * illustrativeTariff.taxRate;
    const previousBalance = profile.previousBalance * scale;
    const total = subtotal + tax + previousBalance;
    const seedPaid = profile.status === "Paid" ? total : profile.payments.reduce((sum, payment) => sum + payment.amount * scale, 0);
    const payments =
      profile.status === "Paid"
        ? [{ date: "2026-07-09", reference: `TRX-PAID-${index + 1}`, method: "Bank transfer", amount: total }]
        : profile.payments.map((payment) => ({ ...payment, amount: payment.amount * scale }));
    const paid = payments.reduce((sum, payment) => sum + payment.amount, 0) || seedPaid;
    const balance = Math.max(0, total - paid);
    const exceptions = anomalyBoost
      ? profile.exceptions.map((exception) => ({ ...exception, description: `${exception.description} Billing-exception scenario increases the provisional interval share to 8.2%.` }))
      : profile.exceptions;

    return {
      id: `INV-2026-06-${String(index + 1).padStart(3, "0")}`,
      tenantId: profile.tenantId,
      tenantName: profile.tenantName,
      site,
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      issueDate: profile.status === "Draft" || profile.status === "Review required" ? null : "2026-07-03",
      dueDate: "2026-07-17",
      status: anomalyBoost ? "Review required" : profile.status,
      tariff: illustrativeTariff,
      meter,
      lines,
      subtotal,
      tax,
      previousBalance,
      total,
      paid,
      balance,
      exceptions,
      preparedBy: "Billing Analyst",
      approvedBy: profile.status === "Approved" || profile.status === "Issued" || profile.status === "Paid" || profile.status === "Overdue" ? "Finance Controller" : null,
      auditTrail: [
        { at: "2026-07-01 06:10", actor: "ArGrid Billing Engine", action: "Billing period closed and interval completeness evaluated" },
        { at: "2026-07-01 06:12", actor: "ArGrid Tariff Engine", action: `Applied tariff version ${illustrativeTariff.id}` },
        { at: "2026-07-02 10:25", actor: "Billing Analyst", action: exceptions.some((exception) => exception.blocking && exception.status === "Open") ? "Submitted for data-quality review" : "Calculation trace reviewed" },
      ],
      payments,
    };
  });
}

export function getBillingSummary(invoices: InvoiceRecord[]) {
  const billed = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const collected = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const overdue = invoices.filter((invoice) => invoice.status === "Overdue").reduce((sum, invoice) => sum + invoice.balance, 0);
  const blockingExceptions = invoices.reduce(
    (count, invoice) => count + invoice.exceptions.filter((exception) => exception.blocking && exception.status === "Open").length,
    0,
  );
  const weightedCompleteness =
    invoices.reduce((sum, invoice) => sum + invoice.meter.completenessPct * invoice.meter.totalKWh, 0) /
    Math.max(1, invoices.reduce((sum, invoice) => sum + invoice.meter.totalKWh, 0));

  return {
    billed,
    collected,
    outstanding,
    overdue,
    collectionPct: billed > 0 ? (collected / billed) * 100 : 0,
    blockingExceptions,
    weightedCompleteness,
  };
}

export function getChargeComposition(invoices: InvoiceRecord[]) {
  const categories: InvoiceLine["category"][] = ["Energy", "Demand", "Reactive", "Fixed", "Credit", "Adjustment"];
  return categories
    .map((category) => ({
      name: category,
      value: invoices.reduce(
        (sum, invoice) => sum + invoice.lines.filter((line) => line.category === category).reduce((lineSum, line) => lineSum + line.amount, 0),
        0,
      ),
    }))
    .filter((item) => Math.abs(item.value) > 0);
}

export function getCollectionHistory(scale: number) {
  return [
    { month: "Jan", billed: 1_120_000_000 * scale, collected: 1_095_000_000 * scale },
    { month: "Feb", billed: 1_085_000_000 * scale, collected: 1_070_000_000 * scale },
    { month: "Mar", billed: 1_166_000_000 * scale, collected: 1_128_000_000 * scale },
    { month: "Apr", billed: 1_142_000_000 * scale, collected: 1_104_000_000 * scale },
    { month: "May", billed: 1_205_000_000 * scale, collected: 1_154_000_000 * scale },
    { month: "Jun", billed: 1_268_000_000 * scale, collected: 1_032_000_000 * scale },
  ];
}

export function getDailyCostProfile(invoice: InvoiceRecord) {
  const dailyBase = invoice.subtotal / 30;
  return Array.from({ length: 30 }, (_, index) => {
    const weekday = index % 7 < 5;
    const productionFactor = weekday ? 1.08 : 0.72;
    const weatherFactor = 1 + Math.sin(index / 4.1) * 0.06;
    const total = dailyBase * productionFactor * weatherFactor;
    return {
      day: String(index + 1).padStart(2, "0"),
      offPeak: total * 0.34,
      shoulder: total * 0.38,
      peak: total * 0.28,
    };
  });
}
