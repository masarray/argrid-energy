import type { DemoScenarioId, MeterQuality } from "./demo-simulation";

export type SankeyMode = "power" | "cost" | "carbon";
export type HeatmapMode = "demand" | "cost" | "carbon";
export type ParetoMode = "energy" | "cost" | "carbon";

export type SankeyNode = {
  id: string;
  label: string;
  category: "source" | "distribution" | "consumer" | "loss";
  color: string;
};

export type SankeyLink = {
  source: string;
  target: string;
  valueKW: number;
  costPerHourIDR: number;
  carbonTPerHour: number;
  label: string;
  quality: string;
  color: string;
};

export type SankeyModel = {
  nodes: SankeyNode[];
  links: SankeyLink[];
  totalKW: number;
  supplyKW: number;
  distributionDifferenceKW: number;
  blendedRateIDR: number;
  blendedCarbonTPerMWh: number;
  meterQuality: MeterQuality;
  completenessPct: number;
};

export type HeatmapCell = {
  day: string;
  dayIndex: number;
  hour: number;
  demandMW: number;
  costM: number;
  carbonT: number;
};

export type ParetoRow = {
  id: string;
  name: string;
  energyKWh: number;
  costIDR: number;
  carbonT: number;
  sharePct: number;
  cumulativePct: number;
};

export type EnergySignaturePoint = {
  temperatureC: number;
  expectedKWh: number;
  actualKWh: number;
  variancePct: number;
  outlier: boolean;
  productionIndex: number;
};

type BuildSankeyInput = {
  currentPowerMW: number;
  gridImportMW: number;
  solarMW: number;
  generatorMW: number;
  energyRateIDR: number;
  meterQuality: MeterQuality;
  completenessPct: number;
  scenarioId: DemoScenarioId;
};

const sourceFactors = {
  grid: { rate: 1, carbonTPerKWh: 0.00076 },
  solar: { rate: 0.36, carbonTPerKWh: 0.00004 },
  generator: { rate: 1.68, carbonTPerKWh: 0.00092 },
} as const;

const consumerDefinitions = [
  { id: "production", label: "Production Lines", color: "var(--color-green)" },
  { id: "hvac", label: "HVAC & Cooling", color: "var(--color-cyan)" },
  { id: "compressed-air", label: "Compressed Air", color: "var(--color-violet)" },
  { id: "utilities", label: "Site Utilities", color: "var(--color-amber)" },
  { id: "tenant-support", label: "Tenant & Support", color: "var(--color-primary)" },
] as const;

function normalizeShares(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

function scenarioConsumerShares(scenarioId: DemoScenarioId) {
  if (scenarioId === "peak-demand") return normalizeShares([0.37, 0.25, 0.13, 0.13, 0.12]);
  if (scenarioId === "efficiency-loss") return normalizeShares([0.30, 0.28, 0.17, 0.14, 0.11]);
  if (scenarioId === "voltage-sag") return normalizeShares([0.32, 0.21, 0.11, 0.21, 0.15]);
  return normalizeShares([0.34, 0.22, 0.12, 0.15, 0.17]);
}

function scenarioLossShare(scenarioId: DemoScenarioId) {
  if (scenarioId === "efficiency-loss") return 0.057;
  if (scenarioId === "voltage-sag") return 0.043;
  if (scenarioId === "peak-demand") return 0.041;
  return 0.034;
}

export function buildEnergySankey(input: BuildSankeyInput): SankeyModel {
  const totalKW = Math.max(1, input.currentPowerMW * 1000);
  const rawSupply = [
    { id: "grid", valueKW: Math.max(0, input.gridImportMW * 1000), color: "var(--color-cyan)", label: "Utility Grid" },
    { id: "solar", valueKW: Math.max(0, input.solarMW * 1000), color: "var(--color-green)", label: "Solar PV" },
    { id: "generator", valueKW: Math.max(0, input.generatorMW * 1000), color: "var(--color-amber)", label: "Generator" },
  ];
  const rawSupplyTotal = rawSupply.reduce((sum, source) => sum + source.valueKW, 0);
  const supplyScale = rawSupplyTotal > 0 ? totalKW / rawSupplyTotal : 1;
  const supply = rawSupply.map((source) => ({ ...source, valueKW: source.valueKW * supplyScale }));

  const lossKW = totalKW * scenarioLossShare(input.scenarioId);
  const usefulKW = totalKW - lossKW;
  const consumerShares = scenarioConsumerShares(input.scenarioId);

  const weightedRate = supply.reduce((sum, source) => {
    const factor = sourceFactors[source.id as keyof typeof sourceFactors];
    return sum + source.valueKW * input.energyRateIDR * factor.rate;
  }, 0) / totalKW;
  const weightedCarbonPerKWh = supply.reduce((sum, source) => {
    const factor = sourceFactors[source.id as keyof typeof sourceFactors];
    return sum + source.valueKW * factor.carbonTPerKWh;
  }, 0) / totalKW;

  const nodes: SankeyNode[] = [
    ...supply.map((source) => ({ id: source.id, label: source.label, category: "source" as const, color: source.color })),
    { id: "main-bus", label: "Main Distribution Bus", category: "distribution", color: "var(--color-primary)" },
    ...consumerDefinitions.map((consumer) => ({ ...consumer, category: "consumer" as const })),
    { id: "losses", label: "Distribution Losses", category: "loss", color: "var(--color-red)" },
  ];

  const links: SankeyLink[] = [
    ...supply.map((source) => {
      const factor = sourceFactors[source.id as keyof typeof sourceFactors];
      return {
        source: source.id,
        target: "main-bus",
        valueKW: source.valueKW,
        costPerHourIDR: source.valueKW * input.energyRateIDR * factor.rate,
        carbonTPerHour: source.valueKW * factor.carbonTPerKWh,
        label: source.label,
        quality: input.meterQuality === "GOOD" ? "Measured" : input.meterQuality,
        color: source.color,
      };
    }),
    ...consumerDefinitions.map((consumer, index) => {
      const valueKW = usefulKW * consumerShares[index];
      return {
        source: "main-bus",
        target: consumer.id,
        valueKW,
        costPerHourIDR: valueKW * weightedRate,
        carbonTPerHour: valueKW * weightedCarbonPerKWh,
        label: consumer.label,
        quality: input.meterQuality === "GOOD" ? "Reconciled" : input.meterQuality,
        color: consumer.color,
      };
    }),
    {
      source: "main-bus",
      target: "losses",
      valueKW: lossKW,
      costPerHourIDR: lossKW * weightedRate,
      carbonTPerHour: lossKW * weightedCarbonPerKWh,
      label: "Distribution Losses",
      quality: lossKW / totalKW > 0.05 ? "Investigate" : "Expected range",
      color: "var(--color-red)",
    },
  ];

  return {
    nodes,
    links,
    totalKW,
    supplyKW: supply.reduce((sum, source) => sum + source.valueKW, 0),
    distributionDifferenceKW: supply.reduce((sum, source) => sum + source.valueKW, 0) - totalKW,
    blendedRateIDR: weightedRate,
    blendedCarbonTPerMWh: weightedCarbonPerKWh * 1000,
    meterQuality: input.meterQuality,
    completenessPct: input.completenessPct,
  };
}

export function buildEnergyHeatmap(siteScale: number, scenarioId: DemoScenarioId): HeatmapCell[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.flatMap((day, dayIndex) =>
    Array.from({ length: 24 }, (_, hour) => {
      const workday = dayIndex < 5;
      const occupied = hour >= 7 && hour < 19;
      const nightBase = scenarioId === "efficiency-loss" ? 2.05 : 1.68;
      const workdayBase = occupied && workday ? 3.95 : nightBase;
      const peakAdder = scenarioId === "peak-demand" && hour >= 17 && hour < 21 ? 1.05 : 0;
      const processWave = Math.sin((hour - 6) / 3.2) * 0.48;
      const deterministicNoise = Math.sin(dayIndex * 8.3 + hour * 1.17) * 0.24 + Math.cos(hour * 0.51) * 0.18;
      const demandMW = Math.max(0.9, (workdayBase + peakAdder + processWave + deterministicNoise) * siteScale);
      const rate = hour >= 17 && hour < 22 ? 1680 : hour >= 6 && hour < 17 ? 1380 : 1120;
      return {
        day,
        dayIndex,
        hour,
        demandMW: +demandMW.toFixed(2),
        costM: +((demandMW * 1000 * rate) / 1_000_000).toFixed(2),
        carbonT: +(demandMW * 0.76).toFixed(2),
      };
    }),
  );
}

export function buildLoadDurationCurve(siteScale: number, scenarioId: DemoScenarioId) {
  const heatmap = buildEnergyHeatmap(siteScale, scenarioId);
  const sorted = heatmap.map((cell) => cell.demandMW).sort((a, b) => b - a);
  const peak = sorted[0];
  const base = sorted[sorted.length - 1];
  const p90 = sorted[Math.floor(sorted.length * 0.1)];
  const median = sorted[Math.floor(sorted.length * 0.5)];
  return {
    series: sorted.map((demandMW, index) => ({
      durationPct: +(((index + 1) / sorted.length) * 100).toFixed(1),
      demandMW,
      contractLimitMW: +(6 * siteScale).toFixed(2),
      thresholdMW: +(peak * 0.9).toFixed(2),
    })),
    peak,
    p90,
    median,
    base,
    durationAbove90Pct: +(sorted.filter((value) => value >= peak * 0.9).length / sorted.length * 100).toFixed(1),
  };
}

export function buildTopConsumerPareto(
  periodEnergyKWh: number,
  energyRateIDR: number,
  scenarioId: DemoScenarioId,
): ParetoRow[] {
  const shares = scenarioConsumerShares(scenarioId);
  const labels = [...consumerDefinitions, { id: "losses", label: "Distribution Losses", color: "var(--color-red)" }];
  const lossShare = scenarioLossShare(scenarioId);
  const usefulShare = 1 - lossShare;
  const finalShares = [...shares.map((share) => share * usefulShare), lossShare];
  const sorted = labels.map((item, index) => ({ ...item, share: finalShares[index] })).sort((a, b) => b.share - a.share);
  let cumulative = 0;
  return sorted.map((item) => {
    cumulative += item.share * 100;
    const energyKWh = Math.round(periodEnergyKWh * item.share);
    return {
      id: item.id,
      name: item.label,
      energyKWh,
      costIDR: energyKWh * energyRateIDR,
      carbonT: energyKWh * 0.00076,
      sharePct: +(item.share * 100).toFixed(1),
      cumulativePct: +Math.min(100, cumulative).toFixed(1),
    };
  });
}

export function buildEnergySignature(
  siteScale: number,
  scenarioId: DemoScenarioId,
  productionTarget: number,
): EnergySignaturePoint[] {
  return Array.from({ length: 20 }, (_, index) => {
    const temperatureC = 21 + index * 0.9;
    const productionIndex = productionTarget * (0.91 + (index % 6) * 0.018);
    const expected = (1650 + temperatureC * 72 + Math.max(0, temperatureC - 28) * 78 + productionIndex * 11) * siteScale;
    const inefficiency = scenarioId === "efficiency-loss" && index >= 10 ? expected * 0.12 : 0;
    const deterministicVariance = Math.sin(index * 1.31) * 125 + (index % 7 === 0 ? 175 : -45);
    const actual = expected + inefficiency + deterministicVariance;
    const variancePct = ((actual - expected) / expected) * 100;
    return {
      temperatureC: +temperatureC.toFixed(1),
      expectedKWh: Math.round(expected),
      actualKWh: Math.round(actual),
      variancePct: +variancePct.toFixed(1),
      outlier: Math.abs(variancePct) >= 8,
      productionIndex: +productionIndex.toFixed(1),
    };
  });
}

export function heatmapValue(cell: HeatmapCell, mode: HeatmapMode) {
  if (mode === "cost") return cell.costM;
  if (mode === "carbon") return cell.carbonT;
  return cell.demandMW;
}

export function heatmapUnit(mode: HeatmapMode) {
  if (mode === "cost") return "IDR M/h";
  if (mode === "carbon") return "tCO₂e/h";
  return "MW";
}
