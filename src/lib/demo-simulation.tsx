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

type DemoSite = (typeof demoSites)[number];
type TimeRange = (typeof timeRanges)[number];

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
  telemetry: Telemetry;
  lastUpdated: Date;
  running: boolean;
  setRunning: (running: boolean) => void;
};

const DemoSimulationContext = createContext<DemoSimulationContextValue | null>(null);

function baseTelemetry(site: DemoSite, range: TimeRange): Telemetry {
  const scale = site.powerScale;
  const periodMultiplier = range === "This month" ? 25 : range === "This week" ? 7 : 1;
  return {
    currentPower: kpis.currentPower * scale,
    todayEnergy: kpis.todayEnergy * scale * periodMultiplier,
    todayCost: kpis.todayCost * scale * periodMultiplier,
    peakDemand: kpis.peakDemand * scale,
    demandLimit: site.capacityMW,
    powerFactor: kpis.powerFactor,
    co2Today: kpis.co2Today * scale * periodMultiplier,
    dataHealth: kpis.dataHealth,
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
  const [running, setRunning] = useState(true);
  const site = demoSites.find((candidate) => candidate.id === siteId) ?? demoSites[0];
  const [telemetry, setTelemetry] = useState<Telemetry>(() => baseTelemetry(site, timeRange));
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const setSiteId = useCallback((nextSiteId: DemoSite["id"]) => {
    setSiteIdState(nextSiteId);
    window.localStorage.setItem("argrid-demo-site", nextSiteId);
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    setTimeRangeState(range);
    window.localStorage.setItem("argrid-demo-range", range);
  }, []);

  useEffect(() => {
    setTelemetry(baseTelemetry(site, timeRange));
    setLastUpdated(new Date());
  }, [site, timeRange]);

  useEffect(() => {
    if (!running) return undefined;

    let sequence = 0;
    const interval = window.setInterval(() => {
      sequence += 1;
      setTelemetry((previous) => {
        const wave = Math.sin(sequence / 2.4) * 0.028;
        const fine = Math.sin(sequence * 1.91) * 0.009;
        const targetPower = kpis.currentPower * site.powerScale * (1 + wave + fine);
        const nextPower = previous.currentPower * 0.45 + targetPower * 0.55;
        const energyIncrement = (nextPower * 1000 * 2.5) / 3600;
        const costIncrement = energyIncrement * 1200;
        return {
          ...previous,
          currentPower: nextPower,
          todayEnergy: previous.todayEnergy + energyIncrement,
          todayCost: previous.todayCost + costIncrement,
          peakDemand: Math.max(previous.peakDemand, nextPower),
          powerFactor: Math.min(0.99, Math.max(0.9, 0.945 + Math.sin(sequence / 3.2) * 0.008)),
          co2Today: previous.co2Today + energyIncrement * 0.00075,
          dataHealth: Math.min(99.9, Math.max(97.7, 98.6 + Math.sin(sequence / 4.8) * 0.45)),
        };
      });
      setLastUpdated(new Date());
    }, 2500);

    return () => window.clearInterval(interval);
  }, [running, site]);

  const value = useMemo<DemoSimulationContextValue>(
    () => ({
      site,
      siteId,
      setSiteId,
      timeRange,
      setTimeRange,
      telemetry,
      lastUpdated,
      running,
      setRunning,
    }),
    [site, siteId, setSiteId, timeRange, setTimeRange, telemetry, lastUpdated, running],
  );

  return <DemoSimulationContext.Provider value={value}>{children}</DemoSimulationContext.Provider>;
}

export function useDemoSimulation() {
  const context = useContext(DemoSimulationContext);
  if (!context) throw new Error("useDemoSimulation must be used inside DemoSimulationProvider");
  return context;
}
