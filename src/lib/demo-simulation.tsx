import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { kpis } from "./argrid-data";

export const demoSites = [
  {
    id: "cikarang",
    name: "Cikarang Manufacturing Complex",
    region: "West Java · Indonesia",
    capacityMW: 6,
    powerScale: 1,
  },
  {
    id: "batam",
    name: "Batam Electronics Campus",
    region: "Riau Islands · Indonesia",
    capacityMW: 4.5,
    powerScale: 0.72,
  },
  {
    id: "gresik",
    name: "Gresik Process Utilities",
    region: "East Java · Indonesia",
    capacityMW: 8,
    powerScale: 1.34,
  },
] as const;

export const timeRanges = ["Today", "This week", "This month"] as const;

export const demoScenarios = [
  { id: "normal", name: "Normal operation", description: "Stable production and normal demand margin" },
  { id: "peak-demand", name: "Peak demand risk", description: "Projected contract-demand exceedance" },
  { id: "voltage-sag", name: "Voltage sag event", description: "Feeder F-07 power-quality investigation" },
  { id: "efficiency-loss", name: "Efficiency degradation", description: "Chiller and compressed-air waste" },
] as const;

type DemoSite = (typeof demoSites)[number];
type TimeRange = (typeof timeRanges)[number];
export type DemoScenarioId = (typeof demoScenarios)[number]["id"];

type Telemetry = {
  currentPower: number;
  todayEnergy: number;
  todayCost: number;
  peakDemand: number;
  demandLimit: number;
  powerFactor: number;
  co2Today: number;
  dataHealth: number;
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

function scenarioFactors(scenarioId: DemoScenarioId) {
  switch (scenarioId) {
    case "peak-demand":
      return { power: 1.145, energy: 1.035, cost: 1.12, powerFactor: 0.935, health: 98.2 };
    case "voltage-sag":
      return { power: 0.975, energy: 1, cost: 1, powerFactor: 0.918, health: 97.9 };
    case "efficiency-loss":
      return { power: 1.075, energy: 1.055, cost: 1.08, powerFactor: 0.94, health: 98.4 };
    default:
      return { power: 1, energy: 1, cost: 1, powerFactor: kpis.powerFactor, health: kpis.dataHealth };
  }
}

function baseTelemetry(site: DemoSite, range: TimeRange, scenarioId: DemoScenarioId): Telemetry {
  const scale = site.powerScale;
  const periodMultiplier = range === "This month" ? 25 : range === "This week" ? 7 : 1;
  const factors = scenarioFactors(scenarioId);
  const currentPower = kpis.currentPower * scale * factors.power;
  const demandLimit = site.capacityMW;

  return {
    currentPower,
    todayEnergy: kpis.todayEnergy * scale * periodMultiplier * factors.energy,
    todayCost: kpis.todayCost * scale * periodMultiplier * factors.cost,
    peakDemand: scenarioId === "peak-demand" ? Math.max(kpis.peakDemand * scale, demandLimit * 0.965) : kpis.peakDemand * scale,
    demandLimit,
    powerFactor: factors.powerFactor,
    co2Today: kpis.co2Today * scale * periodMultiplier * factors.energy,
    dataHealth: factors.health,
  };
}

export function DemoSimulationProvider({ children }: { children: ReactNode }) {
  const [siteId, setSiteIdState] = useState<DemoSite["id"]>(() => {
    const saved = window.localStorage.getItem("argrid-demo-site");
    return demoSites.some((candidate) => candidate.id === saved)
      ? (saved as DemoSite["id"])
      : "cikarang";
  });
  const [timeRange, setTimeRangeState] = useState<TimeRange>(() => {
    const saved = window.localStorage.getItem("argrid-demo-range");
    return timeRanges.includes(saved as TimeRange) ? (saved as TimeRange) : "Today";
  });
  const [scenarioId, setScenarioIdState] = useState<DemoScenarioId>(() => {
    const saved = window.localStorage.getItem("argrid-demo-scenario");
    return demoScenarios.some((candidate) => candidate.id === saved)
      ? (saved as DemoScenarioId)
      : "peak-demand";
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
        const factors = scenarioFactors(scenarioId);
        const wave = Math.sin(sequence / 2.4) * 0.028;
        const fine = Math.sin(sequence * 1.91) * 0.009;
        const targetPower = kpis.currentPower * site.powerScale * factors.power * (1 + wave + fine);
        const nextPower = previous.currentPower * 0.45 + targetPower * 0.55;
        const energyIncrement = (nextPower * 1000 * 2.5) / 3600;
        const costIncrement = energyIncrement * 1200 * factors.cost;
        const pfWave = Math.sin(sequence / 3.2) * 0.006;
        return {
          ...previous,
          currentPower: nextPower,
          todayEnergy: previous.todayEnergy + energyIncrement,
          todayCost: previous.todayCost + costIncrement,
          peakDemand: Math.max(previous.peakDemand, nextPower),
          powerFactor: Math.min(0.99, Math.max(0.89, factors.powerFactor + pfWave)),
          co2Today: previous.co2Today + energyIncrement * 0.00075,
          dataHealth: Math.min(99.9, Math.max(97.2, factors.health + Math.sin(sequence / 4.8) * 0.35)),
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
