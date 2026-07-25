import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { kpis } from "./argrid-data";

export const demoSites = [
  {
    id: "cikarang",
    name: "Cikarang Manufacturing Complex",
    region: "West Java · Indonesia",
    capacityMW: 6,
    powerScale: 1,
    baseLoadMW: 4.62,
    solarCapacityMW: 0.88,
    productionTarget: 100,
  },
  {
    id: "batam",
    name: "Batam Electronics Campus",
    region: "Riau Islands · Indonesia",
    capacityMW: 4.5,
    powerScale: 0.72,
    baseLoadMW: 3.28,
    solarCapacityMW: 0.62,
    productionTarget: 92,
  },
  {
    id: "gresik",
    name: "Gresik Process Utilities",
    region: "East Java · Indonesia",
    capacityMW: 8,
    powerScale: 1.34,
    baseLoadMW: 6.1,
    solarCapacityMW: 1.15,
    productionTarget: 108,
  },
] as const;

export const timeRanges = ["Today", "This week", "This month"] as const;

export const demoScenarios = [
  { id: "normal", name: "Normal operation", description: "Stable production and normal demand margin" },
  { id: "peak-demand", name: "Peak demand risk", description: "Projected contract-demand exceedance" },
  { id: "voltage-sag", name: "Voltage sag event", description: "Feeder F-07 power-quality investigation" },
  { id: "efficiency-loss", name: "Efficiency degradation", description: "Chiller and compressed-air waste" },
  { id: "billing-exception", name: "Billing data exception", description: "Missing intervals and provisional tenant billing" },
] as const;

type DemoSite = (typeof demoSites)[number];
type TimeRange = (typeof timeRanges)[number];
export type DemoScenarioId = (typeof demoScenarios)[number]["id"];
export type TariffBand = "Off-peak" | "Shoulder" | "Peak";
export type MeterQuality = "GOOD" | "ESTIMATED" | "STALE";

type Telemetry = {
  currentPower: number;
  todayEnergy: number;
  todayCost: number;
  peakDemand: number;
  demandLimit: number;
  powerFactor: number;
  co2Today: number;
  dataHealth: number;
  gridImportMW: number;
  solarMW: number;
  generatorMW: number;
  renewableSharePct: number;
  productionIndex: number;
  outdoorTempC: number;
  occupancyPct: number;
  tariffBand: TariffBand;
  energyRateIDR: number;
  meterQuality: MeterQuality;
  intervalCompletenessPct: number;
};

type DemoSimulationContextValue = {
  site: DemoSite;
  siteId: DemoSite["id"];
  setSiteId: (siteId: DemoSite["id"]) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  scenarioId: DemoScenarioId;
  scenario: (typeof demoScenarios)[number];
  setScenarioId: (scenarioId: DemoScenarioId) => void;
  telemetry: Telemetry;
  lastUpdated: Date;
  running: boolean;
  setRunning: (running: boolean) => void;
};

const DemoSimulationContext = createContext<DemoSimulationContextValue | null>(null);

function tariffBandForHour(hour: number): TariffBand {
  if (hour >= 17 && hour < 22) return "Peak";
  if (hour >= 6 && hour < 17) return "Shoulder";
  return "Off-peak";
}

function tariffRateForBand(band: TariffBand) {
  if (band === "Peak") return 1_680;
  if (band === "Shoulder") return 1_380;
  return 1_120;
}

function industrialLoadFactor(hour: number) {
  if (hour < 5) return 0.72;
  if (hour < 7) return 0.86;
  if (hour < 16.5) return 1;
  if (hour < 21.5) return 1.075;
  return 0.82;
}

function solarAvailability(hour: number) {
  if (hour <= 6 || hour >= 18) return 0;
  return Math.sin(((hour - 6) / 12) * Math.PI);
}

function operatingDrivers(hour: number, site: DemoSite) {
  const loadFactor = industrialLoadFactor(hour);
  const productionIndex = site.productionTarget * (loadFactor >= 1 ? 1 : loadFactor * 0.94);
  const outdoorTempC = 29 + Math.sin(((hour - 8) / 24) * Math.PI * 2) * 4.2;
  const occupancyPct = hour >= 7 && hour < 18 ? 88 : hour >= 18 && hour < 22 ? 62 : 28;
  return { loadFactor, productionIndex, outdoorTempC, occupancyPct };
}

function scenarioFactors(scenarioId: DemoScenarioId) {
  switch (scenarioId) {
    case "peak-demand":
      return {
        power: 1.145,
        energy: 1.035,
        cost: 1.12,
        powerFactor: 0.935,
        health: 98.2,
        production: 1.07,
        generatorMW: 0.08,
        meterQuality: "GOOD" as MeterQuality,
        completeness: 98.7,
      };
    case "voltage-sag":
      return {
        power: 0.975,
        energy: 1,
        cost: 1,
        powerFactor: 0.918,
        health: 97.9,
        production: 0.96,
        generatorMW: 0.42,
        meterQuality: "GOOD" as MeterQuality,
        completeness: 98.4,
      };
    case "efficiency-loss":
      return {
        power: 1.075,
        energy: 1.055,
        cost: 1.08,
        powerFactor: 0.94,
        health: 98.4,
        production: 1,
        generatorMW: 0.05,
        meterQuality: "GOOD" as MeterQuality,
        completeness: 98.9,
      };
    case "billing-exception":
      return {
        power: 1.01,
        energy: 1,
        cost: 1,
        powerFactor: 0.942,
        health: 94.2,
        production: 0.99,
        generatorMW: 0.05,
        meterQuality: "ESTIMATED" as MeterQuality,
        completeness: 91.8,
      };
    default:
      return {
        power: 1,
        energy: 1,
        cost: 1,
        powerFactor: kpis.powerFactor,
        health: kpis.dataHealth,
        production: 1,
        generatorMW: 0.05,
        meterQuality: "GOOD" as MeterQuality,
        completeness: 99.2,
      };
  }
}

function buildOperationalState(site: DemoSite, scenarioId: DemoScenarioId, date: Date) {
  const hour = date.getHours() + date.getMinutes() / 60;
  const drivers = operatingDrivers(hour, site);
  const factors = scenarioFactors(scenarioId);
  const tariffBand = tariffBandForHour(hour);
  const currentPower = site.baseLoadMW * drivers.loadFactor * factors.power;
  const solarMW = site.solarCapacityMW * solarAvailability(hour) * (scenarioId === "voltage-sag" ? 0.88 : 1);
  const generatorMW = factors.generatorMW * site.powerScale;
  const gridImportMW = Math.max(0, currentPower - solarMW - generatorMW);
  const renewableSharePct = currentPower > 0 ? (solarMW / currentPower) * 100 : 0;

  return {
    currentPower,
    gridImportMW,
    solarMW,
    generatorMW,
    renewableSharePct,
    productionIndex: drivers.productionIndex * factors.production,
    outdoorTempC: drivers.outdoorTempC,
    occupancyPct: drivers.occupancyPct,
    tariffBand,
    energyRateIDR: tariffRateForBand(tariffBand),
    meterQuality: factors.meterQuality,
    intervalCompletenessPct: factors.completeness,
  };
}

function baseTelemetry(site: DemoSite, range: TimeRange, scenarioId: DemoScenarioId): Telemetry {
  const scale = site.powerScale;
  const periodMultiplier = range === "This month" ? 25 : range === "This week" ? 7 : 1;
  const factors = scenarioFactors(scenarioId);
  const operational = buildOperationalState(site, scenarioId, new Date());
  const demandLimit = site.capacityMW;

  return {
    ...operational,
    todayEnergy: kpis.todayEnergy * scale * periodMultiplier * factors.energy,
    todayCost: kpis.todayCost * scale * periodMultiplier * factors.cost,
    peakDemand: scenarioId === "peak-demand" ? Math.max(kpis.peakDemand * scale, demandLimit * 0.965) : Math.max(kpis.peakDemand * scale, operational.currentPower),
    demandLimit,
    powerFactor: factors.powerFactor,
    co2Today: kpis.co2Today * scale * periodMultiplier * factors.energy,
    dataHealth: factors.health,
  };
}

export function DemoSimulationProvider({ children }: { children: ReactNode }) {
  const [siteId, setSiteIdState] = useState<DemoSite["id"]>(() => {
    const saved = window.localStorage.getItem("argrid-demo-site");
    return demoSites.some((candidate) => candidate.id === saved) ? (saved as DemoSite["id"]) : "cikarang";
  });
  const [timeRange, setTimeRangeState] = useState<TimeRange>(() => {
    const saved = window.localStorage.getItem("argrid-demo-range");
    return timeRanges.includes(saved as TimeRange) ? (saved as TimeRange) : "Today";
  });
  const [scenarioId, setScenarioIdState] = useState<DemoScenarioId>(() => {
    const saved = window.localStorage.getItem("argrid-demo-scenario");
    return demoScenarios.some((candidate) => candidate.id === saved) ? (saved as DemoScenarioId) : "peak-demand";
  });
  const [running, setRunning] = useState(true);
  const site = demoSites.find((candidate) => candidate.id === siteId) ?? demoSites[0];
  const scenario = demoScenarios.find((candidate) => candidate.id === scenarioId) ?? demoScenarios[0];
  const [telemetry, setTelemetry] = useState<Telemetry>(() => baseTelemetry(site, timeRange, scenarioId));
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const setSiteId = useCallback((nextSiteId: DemoSite["id"]) => {
    setSiteIdState(nextSiteId);
    window.localStorage.setItem("argrid-demo-site", nextSiteId);
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    setTimeRangeState(range);
    window.localStorage.setItem("argrid-demo-range", range);
  }, []);

  const setScenarioId = useCallback((nextScenarioId: DemoScenarioId) => {
    setScenarioIdState(nextScenarioId);
    window.localStorage.setItem("argrid-demo-scenario", nextScenarioId);
  }, []);

  useEffect(() => {
    setTelemetry(baseTelemetry(site, timeRange, scenarioId));
    setLastUpdated(new Date());
  }, [site, timeRange, scenarioId]);

  useEffect(() => {
    if (!running) return undefined;

    let sequence = 0;
    const interval = window.setInterval(() => {
      sequence += 1;
      setTelemetry((previous) => {
        const now = new Date();
        const operational = buildOperationalState(site, scenarioId, now);
        const factors = scenarioFactors(scenarioId);
        const processCycle = Math.sin(sequence / 2.4) * 0.022;
        const compressorPulse = Math.sin(sequence * 1.73) * 0.008;
        const targetPower = operational.currentPower * (1 + processCycle + compressorPulse);
        const nextPower = previous.currentPower * 0.5 + targetPower * 0.5;
        const solarMW = Math.max(0, previous.solarMW * 0.72 + operational.solarMW * 0.28);
        const generatorMW = operational.generatorMW;
        const gridImportMW = Math.max(0, nextPower - solarMW - generatorMW);
        const energyIncrement = (nextPower * 1000 * 2.5) / 3600;
        const costIncrement = energyIncrement * operational.energyRateIDR;
        const pfWave = Math.sin(sequence / 3.2) * 0.004;
        const gridShare = nextPower > 0 ? gridImportMW / nextPower : 0;

        return {
          ...previous,
          ...operational,
          currentPower: nextPower,
          gridImportMW,
          solarMW,
          generatorMW,
          renewableSharePct: nextPower > 0 ? (solarMW / nextPower) * 100 : 0,
          todayEnergy: previous.todayEnergy + energyIncrement,
          todayCost: previous.todayCost + costIncrement,
          peakDemand: Math.max(previous.peakDemand, gridImportMW),
          powerFactor: Math.min(0.99, Math.max(0.89, factors.powerFactor + pfWave)),
          co2Today: previous.co2Today + energyIncrement * gridShare * 0.00075,
          dataHealth: Math.min(99.9, Math.max(90, factors.health + Math.sin(sequence / 4.8) * 0.28)),
          productionIndex: operational.productionIndex * (1 + Math.sin(sequence / 5.7) * 0.012),
          outdoorTempC: operational.outdoorTempC + Math.sin(sequence / 7.1) * 0.12,
          intervalCompletenessPct: factors.completeness,
        };
      });
      setLastUpdated(new Date());
    }, 2500);

    return () => window.clearInterval(interval);
  }, [running, scenarioId, site]);

  const value = useMemo<DemoSimulationContextValue>(
    () => ({
      site,
      siteId,
      setSiteId,
      timeRange,
      setTimeRange,
      scenarioId,
      scenario,
      setScenarioId,
      telemetry,
      lastUpdated,
      running,
      setRunning,
    }),
    [site, siteId, setSiteId, timeRange, setTimeRange, scenarioId, scenario, setScenarioId, telemetry, lastUpdated, running],
  );

  return <DemoSimulationContext.Provider value={value}>{children}</DemoSimulationContext.Provider>;
}

export function useDemoSimulation() {
  const context = useContext(DemoSimulationContext);
  if (!context) throw new Error("useDemoSimulation must be used inside DemoSimulationProvider");
  return context;
}
