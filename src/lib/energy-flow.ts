import type { DemoScenarioId, MeterQuality } from "./demo-simulation";

export type EnergyFlowNodeKind = "source" | "hub" | "consumer" | "loss";

export type EnergyFlowNode = {
  id: string;
  label: string;
  detail: string;
  valueMW: number;
  sharePct: number;
  color: string;
  kind: EnergyFlowNodeKind;
  state: "normal" | "good" | "warning" | "estimated";
};

export type EnergyFlowLink = {
  id: string;
  source: string;
  target: string;
  valueMW: number;
  sharePct: number;
  color: string;
};

export type EnergyFlowSnapshot = {
  totalMW: number;
  sources: EnergyFlowNode[];
  consumers: EnergyFlowNode[];
  links: EnergyFlowLink[];
  renewableSharePct: number;
  lossesMW: number;
  balanceErrorMW: number;
  dominantLoad: EnergyFlowNode;
  insight: string;
  meterQuality: MeterQuality;
};

type EnergyFlowInput = {
  currentPower: number;
  gridImportMW: number;
  solarMW: number;
  generatorMW: number;
  meterQuality: MeterQuality;
};

type ConsumerDefinition = {
  id: string;
  label: string;
  detail: string;
  color: string;
};

const consumerDefinitions: ConsumerDefinition[] = [
  { id: "production", label: "Production lines", detail: "Process lines 1–3", color: "var(--sankey-production)" },
  { id: "cooling", label: "Cooling & HVAC", detail: "Chillers, AHU, ventilation", color: "var(--sankey-cooling)" },
  { id: "compressed-air", label: "Compressed air", detail: "Compressors and dryers", color: "var(--sankey-air)" },
  { id: "facilities", label: "Facilities", detail: "Lighting and buildings", color: "var(--sankey-facilities)" },
  { id: "other", label: "Other services", detail: "Pumps, IT and auxiliaries", color: "var(--sankey-other)" },
  { id: "losses", label: "Distribution losses", detail: "Transformers and feeders", color: "var(--sankey-losses)" },
];

const scenarioShares: Record<DemoScenarioId, Record<string, number>> = {
  normal: {
    production: 0.5,
    cooling: 0.17,
    "compressed-air": 0.11,
    facilities: 0.12,
    other: 0.07,
    losses: 0.03,
  },
  "peak-demand": {
    production: 0.47,
    cooling: 0.21,
    "compressed-air": 0.12,
    facilities: 0.11,
    other: 0.06,
    losses: 0.03,
  },
  "voltage-sag": {
    production: 0.48,
    cooling: 0.18,
    "compressed-air": 0.11,
    facilities: 0.12,
    other: 0.07,
    losses: 0.04,
  },
  "efficiency-loss": {
    production: 0.45,
    cooling: 0.24,
    "compressed-air": 0.15,
    facilities: 0.08,
    other: 0.05,
    losses: 0.03,
  },
  "billing-exception": {
    production: 0.5,
    cooling: 0.17,
    "compressed-air": 0.11,
    facilities: 0.12,
    other: 0.07,
    losses: 0.03,
  },
};

function consumerState(id: string, scenarioId: DemoScenarioId, meterQuality: MeterQuality): EnergyFlowNode["state"] {
  if (meterQuality !== "GOOD" && (id === "facilities" || id === "other")) return "estimated";
  if (scenarioId === "efficiency-loss" && (id === "cooling" || id === "compressed-air")) return "warning";
  if (scenarioId === "peak-demand" && (id === "cooling" || id === "production")) return "warning";
  if (id === "losses" && scenarioId === "voltage-sag") return "warning";
  return id === "production" ? "good" : "normal";
}

export function buildEnergyFlowSnapshot(input: EnergyFlowInput, scenarioId: DemoScenarioId): EnergyFlowSnapshot {
  const totalMW = Math.max(0.01, input.currentPower);
  const sourceValues = [
    {
      id: "grid",
      label: "Utility grid",
      detail: "20 kV incomer",
      valueMW: Math.max(0, input.gridImportMW),
      color: "var(--sankey-grid)",
      state: "normal" as const,
    },
    {
      id: "solar",
      label: "Solar PV",
      detail: "On-site renewable",
      valueMW: Math.max(0, input.solarMW),
      color: "var(--sankey-solar)",
      state: "good" as const,
    },
    {
      id: "generator",
      label: "Generator",
      detail: scenarioId === "voltage-sag" ? "Event support" : "Warm standby",
      valueMW: Math.max(0, input.generatorMW),
      color: "var(--sankey-generator)",
      state: scenarioId === "voltage-sag" ? "warning" as const : "normal" as const,
    },
  ];

  const sources: EnergyFlowNode[] = sourceValues.map((source) => ({
    ...source,
    sharePct: (source.valueMW / totalMW) * 100,
    kind: "source",
  }));

  const consumers: EnergyFlowNode[] = consumerDefinitions.map((definition) => {
    const share = scenarioShares[scenarioId][definition.id] ?? 0;
    return {
      ...definition,
      valueMW: totalMW * share,
      sharePct: share * 100,
      kind: definition.id === "losses" ? "loss" : "consumer",
      state: consumerState(definition.id, scenarioId, input.meterQuality),
    };
  });

  const links: EnergyFlowLink[] = [
    ...sources.map((source) => ({
      id: `${source.id}-to-bus`,
      source: source.id,
      target: "site-bus",
      valueMW: source.valueMW,
      sharePct: source.sharePct,
      color: source.color,
    })),
    ...consumers.map((consumer) => ({
      id: `bus-to-${consumer.id}`,
      source: "site-bus",
      target: consumer.id,
      valueMW: consumer.valueMW,
      sharePct: consumer.sharePct,
      color: consumer.color,
    })),
  ];

  const sourceTotal = sources.reduce((sum, source) => sum + source.valueMW, 0);
  const consumerTotal = consumers.reduce((sum, consumer) => sum + consumer.valueMW, 0);
  const dominantLoad = consumers.filter((consumer) => consumer.kind === "consumer").sort((a, b) => b.valueMW - a.valueMW)[0];
  const cooling = consumers.find((consumer) => consumer.id === "cooling");
  const compressedAir = consumers.find((consumer) => consumer.id === "compressed-air");

  let insight = `${dominantLoad.label} is the largest end use at ${dominantLoad.sharePct.toFixed(0)}% of site demand.`;
  if (scenarioId === "peak-demand" && cooling) {
    insight = `Cooling and production combine for ${(cooling.sharePct + dominantLoad.sharePct).toFixed(0)}% of demand during the projected peak interval.`;
  }
  if (scenarioId === "efficiency-loss" && cooling && compressedAir) {
    insight = `Cooling and compressed air consume ${(cooling.sharePct + compressedAir.sharePct).toFixed(0)}% of site load and carry the active efficiency warning.`;
  }
  if (scenarioId === "voltage-sag") {
    insight = `Generator support is visible while distribution losses rise during the voltage-sag event replay.`;
  }
  if (input.meterQuality !== "GOOD") {
    insight = `Facilities and other-services allocation is estimated because interval completeness is below the trusted threshold.`;
  }

  return {
    totalMW,
    sources,
    consumers,
    links,
    renewableSharePct: (input.solarMW / totalMW) * 100,
    lossesMW: consumers.find((consumer) => consumer.id === "losses")?.valueMW ?? 0,
    balanceErrorMW: sourceTotal - consumerTotal,
    dominantLoad,
    insight,
    meterQuality: input.meterQuality,
  };
}
