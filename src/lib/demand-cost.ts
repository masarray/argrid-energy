import { feeders } from "./argrid-data";
import type { DemoScenarioId } from "./demo-simulation";

export const DEMAND_CHARGE_RATE_IDR_PER_KW = 355_000;

export type DemandContributor = {
  id: string;
  name: string;
  currentKW: number;
  sharePct: number;
  flexibleKW: number;
  operationalConstraint: string;
  status: "normal" | "warning" | "critical";
};

export type DemandResponseInput = {
  projectedDemandMW: number;
  demandLimitMW: number;
  siteScale: number;
  deferChiller: boolean;
  compressorReductionKW: number;
  generatorSupport: boolean;
  bessDischargeKW: number;
};

export type DemandResponseResult = {
  adjustedDemandMW: number;
  remainingMarginMW: number;
  avoidedDemandKW: number;
  avoidedDemandChargeIDR: number;
  residualExposureIDR: number;
  carbonDeltaTco2e: number;
  confidencePct: number;
};

function scenarioMultiplier(feederId: string, scenarioId: DemoScenarioId) {
  if (scenarioId === "peak-demand") {
    if (feederId === "F-04") return 1.18;
    if (feederId === "F-05") return 1.15;
    if (feederId === "F-01") return 1.05;
  }

  if (scenarioId === "efficiency-loss") {
    if (feederId === "F-04" || feederId === "F-05") return 1.12;
  }

  if (scenarioId === "voltage-sag" && feederId === "F-07") return 0.92;
  return 1;
}

function contributorConstraint(feederId: string) {
  const constraints: Record<string, { flexibleKW: number; text: string }> = {
    "F-01": { flexibleKW: 80, text: "Test-batch sequence may shift by 10 minutes with supervisor approval." },
    "F-04": { flexibleKW: 220, text: "Chiller 2 may defer up to 10 minutes while chilled-water margin remains above 9%." },
    "F-05": { flexibleKW: 160, text: "Compressor header pressure must remain above 6.2 bar." },
    "F-07": { flexibleKW: 40, text: "Utility and auxiliary loads are limited to non-critical ventilation and lighting." },
  };

  return constraints[feederId] ?? { flexibleKW: 0, text: "No automatic flexibility is assigned to this feeder." };
}

export function buildDemandContributors({
  currentDemandMW,
  siteScale,
  scenarioId,
}: {
  currentDemandMW: number;
  siteScale: number;
  scenarioId: DemoScenarioId;
}): DemandContributor[] {
  const weighted = feeders.map((feeder) => ({
    feeder,
    weightedKW: feeder.kw * siteScale * scenarioMultiplier(feeder.id, scenarioId),
  }));
  const weightedTotal = weighted.reduce((sum, item) => sum + item.weightedKW, 0);
  const targetKW = currentDemandMW * 1000;
  const normalization = weightedTotal > 0 ? targetKW / weightedTotal : 1;

  return weighted
    .map(({ feeder, weightedKW }) => {
      const currentKW = weightedKW * normalization;
      const constraint = contributorConstraint(feeder.id);
      const scenarioStatus: DemandContributor["status"] =
        scenarioId === "peak-demand" && (feeder.id === "F-04" || feeder.id === "F-05")
          ? "warning"
          : scenarioId === "voltage-sag" && feeder.id === "F-07"
            ? "critical"
            : feeder.status === "warning" || feeder.status === "critical"
              ? "warning"
              : "normal";

      return {
        id: feeder.id,
        name: feeder.name,
        currentKW,
        sharePct: targetKW > 0 ? (currentKW / targetKW) * 100 : 0,
        flexibleKW: constraint.flexibleKW * siteScale,
        operationalConstraint: constraint.text,
        status: scenarioStatus,
      } satisfies DemandContributor;
    })
    .sort((a, b) => b.currentKW - a.currentKW);
}

function formatQuarterHour(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function buildDemandForecast({
  anchor,
  currentDemandMW,
  demandLimitMW,
  siteScale,
  scenarioId,
}: {
  anchor: Date;
  currentDemandMW: number;
  demandLimitMW: number;
  siteScale: number;
  scenarioId: DemoScenarioId;
}) {
  const warningMW = demandLimitMW * 0.95;
  const riskOverrunMW = 0.12 * siteScale;
  const projectedEndMW =
    scenarioId === "peak-demand"
      ? demandLimitMW + riskOverrunMW
      : scenarioId === "efficiency-loss"
        ? Math.min(demandLimitMW * 0.985, currentDemandMW * 1.055)
        : Math.min(demandLimitMW * 0.94, currentDemandMW * 1.025);

  const start = new Date(anchor);
  start.setMinutes(Math.floor(start.getMinutes() / 15) * 15 - 60, 0, 0);

  return Array.from({ length: 9 }, (_, index) => {
    const pointTime = new Date(start.getTime() + index * 15 * 60_000);
    const relative = index - 4;
    const historicShape = Math.sin(index * 0.78) * 0.045 + relative * 0.018;
    const actual = index <= 4 ? Math.max(0, currentDemandMW * (1 + historicShape)) : null;
    const forecastProgress = Math.max(0, index - 4) / 4;
    const forecast =
      index >= 4
        ? currentDemandMW + (projectedEndMW - currentDemandMW) * forecastProgress + Math.sin(index * 0.9) * 0.018
        : null;

    return {
      time: formatQuarterHour(pointTime),
      actual: actual === null ? null : +actual.toFixed(3),
      forecast: forecast === null ? null : +forecast.toFixed(3),
      warning: +warningMW.toFixed(3),
      contract: +demandLimitMW.toFixed(3),
    };
  });
}

export function calculateDemandExposure(projectedDemandMW: number, demandLimitMW: number) {
  const overrunKW = Math.max(0, (projectedDemandMW - demandLimitMW) * 1000);
  return {
    overrunKW,
    exposureIDR: overrunKW * DEMAND_CHARGE_RATE_IDR_PER_KW,
  };
}

export function simulateDemandResponse(input: DemandResponseInput): DemandResponseResult {
  const chillerReductionKW = input.deferChiller ? 180 * input.siteScale : 0;
  const compressorReductionKW = Math.max(0, input.compressorReductionKW);
  const generatorReductionKW = input.generatorSupport ? 350 * input.siteScale : 0;
  const bessReductionKW = Math.max(0, input.bessDischargeKW);
  const avoidedDemandKW = chillerReductionKW + compressorReductionKW + generatorReductionKW + bessReductionKW;
  const adjustedDemandMW = Math.max(0, input.projectedDemandMW - avoidedDemandKW / 1000);
  const remainingMarginMW = input.demandLimitMW - adjustedDemandMW;
  const originalExposure = calculateDemandExposure(input.projectedDemandMW, input.demandLimitMW).exposureIDR;
  const residualExposureIDR = calculateDemandExposure(adjustedDemandMW, input.demandLimitMW).exposureIDR;
  const avoidedDemandChargeIDR = Math.max(0, originalExposure - residualExposureIDR);

  const loadReductionMWh = (chillerReductionKW + compressorReductionKW) * 0.25 / 1000;
  const generatorEmission = input.generatorSupport ? 0.21 * input.siteScale : 0;
  const bessDisplacement = bessReductionKW * 0.25 / 1000 * 0.75;
  const carbonDeltaTco2e = generatorEmission - loadReductionMWh * 0.75 - bessDisplacement;

  const activeMeasures = [
    input.deferChiller,
    compressorReductionKW > 0,
    input.generatorSupport,
    bessReductionKW > 0,
  ].filter(Boolean).length;

  return {
    adjustedDemandMW,
    remainingMarginMW,
    avoidedDemandKW,
    avoidedDemandChargeIDR,
    residualExposureIDR,
    carbonDeltaTco2e,
    confidencePct: Math.min(94, 82 + activeMeasures * 3),
  };
}

export function getIntervalCountdown(now: Date) {
  const elapsedSeconds = (now.getMinutes() % 15) * 60 + now.getSeconds();
  const remainingSeconds = Math.max(0, 15 * 60 - elapsedSeconds);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return {
    remainingSeconds,
    label: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
}
