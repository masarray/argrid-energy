import type { DemoScenarioId } from "./demo-simulation";

export type PowerQualityEventType = "Sag" | "Swell" | "Interruption" | "Transient" | "Harmonic";
export type EventSeverity = "Info" | "Warning" | "Critical";
export type InvestigationStatus = "New" | "Acknowledged" | "Investigating" | "Confirmed" | "Closed";
export type CorrelationDirection = "Upstream" | "Local" | "Downstream";

export type CorrelatedMeter = {
  meterId: string;
  location: string;
  direction: CorrelationDirection;
  minimumVoltagePct: number;
  durationMs: number;
  startOffsetMs: number;
  timeSyncErrorMs: number;
  quality: "GOOD" | "ESTIMATED";
  evidence: string;
};

export type EquipmentResponse = {
  assetId: string;
  assetName: string;
  response: string;
  stateAfterEvent: "Running" | "Recovered" | "Trip" | "No change";
  restartSeconds: number;
  productionConsequence: string;
};

export type PowerQualityEvent = {
  id: string;
  timestamp: string;
  type: PowerQualityEventType;
  severity: EventSeverity;
  status: InvestigationStatus;
  sourceMeter: string;
  feederId: string;
  feederName: string;
  voltageLevel: string;
  phases: string;
  minimumVoltagePct: number;
  maximumVoltagePct: number;
  durationMs: number;
  frequencyHz: number;
  waveformSampleRateHz: number;
  preEventMs: number;
  postEventMs: number;
  probableOrigin: string;
  confidencePct: number;
  operationalImpact: string;
  estimatedExposureIDR: number;
  downtimeMinutes: number;
  affectedAssets: string[];
  correlatedMeters: CorrelatedMeter[];
  equipmentResponses: EquipmentResponse[];
  investigationOwner: string;
  incidentGroupId: string;
  triggerThreshold: string;
  notes: string[];
};

export type RmsPoint = {
  timeMs: number;
  phaseA: number;
  phaseB: number;
  phaseC: number;
  frequencyHz: number;
};

export type WaveformPoint = {
  timeMs: number;
  phaseA: number;
  phaseB: number;
  phaseC: number;
};

export type IncidentAlarm = {
  id: string;
  incidentGroupId: string;
  timestamp: string;
  severity: EventSeverity;
  source: string;
  message: string;
  condition: string;
  acknowledged: boolean;
};

const primaryMeters: CorrelatedMeter[] = [
  {
    meterId: "PM-MAIN-01",
    location: "MSB-Main incomer",
    direction: "Upstream",
    minimumVoltagePct: 91.4,
    durationMs: 176,
    startOffsetMs: 4,
    timeSyncErrorMs: 1.7,
    quality: "GOOD",
    evidence: "A shallow upstream depression was recorded after the F-07 event trigger, indicating propagation from the downstream bus rather than a utility-origin event.",
  },
  {
    meterId: "PM-PQ-07",
    location: "F-07 Utility & Aux",
    direction: "Local",
    minimumVoltagePct: 82.0,
    durationMs: 240,
    startOffsetMs: 0,
    timeSyncErrorMs: 1.2,
    quality: "GOOD",
    evidence: "Deepest residual voltage and longest duration occurred at the source meter.",
  },
  {
    meterId: "PM-F06-01",
    location: "F-06 Warehouse",
    direction: "Upstream",
    minimumVoltagePct: 94.2,
    durationMs: 148,
    startOffsetMs: 6,
    timeSyncErrorMs: 2.0,
    quality: "GOOD",
    evidence: "Adjacent feeder experienced only a shallow propagated sag without equipment response.",
  },
  {
    meterId: "PM-AUX-071",
    location: "F-07 downstream MCC-AUX-07",
    direction: "Downstream",
    minimumVoltagePct: 76.8,
    durationMs: 255,
    startOffsetMs: 1,
    timeSyncErrorMs: 2.3,
    quality: "GOOD",
    evidence: "Residual voltage decreased further downstream, consistent with a local high-current disturbance on the auxiliary bus.",
  },
];

const primaryResponses: EquipmentResponse[] = [
  {
    assetId: "VFD-AUX-07",
    assetName: "Cooling-water pump VFD",
    response: "DC-bus undervoltage ride-through activated; no trip recorded.",
    stateAfterEvent: "Recovered",
    restartSeconds: 0.8,
    productionConsequence: "Pump torque dipped briefly but process flow remained above the minimum interlock threshold.",
  },
  {
    assetId: "MCC-AUX-07",
    assetName: "Auxiliary MCC contactor group",
    response: "One contactor dropout and automatic restart sequence recorded.",
    stateAfterEvent: "Recovered",
    restartSeconds: 11.4,
    productionConsequence: "Auxiliary ventilation was unavailable during the restart window.",
  },
  {
    assetId: "PLC-UTIL-07",
    assetName: "Utility PLC and 24 VDC supply",
    response: "DC supply remained above hold-up threshold; controller did not reboot.",
    stateAfterEvent: "No change",
    restartSeconds: 0,
    productionConsequence: "No sequence loss or controller restart occurred.",
  },
  {
    assetId: "UPS-AUX-07",
    assetName: "Auxiliary control UPS",
    response: "Input undervoltage logged; inverter remained online without static-bypass transfer.",
    stateAfterEvent: "Running",
    restartSeconds: 0,
    productionConsequence: "Protected control loads remained energized.",
  },
];

const baseEvents: PowerQualityEvent[] = [
  {
    id: "PQ-260715-143217",
    timestamp: "2026-07-15 14:32:17.640",
    type: "Sag",
    severity: "Critical",
    status: "Investigating",
    sourceMeter: "PM-PQ-07",
    feederId: "F-07",
    feederName: "Utility & Aux",
    voltageLevel: "400 V",
    phases: "ABC",
    minimumVoltagePct: 82.0,
    maximumVoltagePct: 100.4,
    durationMs: 240,
    frequencyHz: 49.98,
    waveformSampleRateHz: 12_800,
    preEventMs: 500,
    postEventMs: 1_000,
    probableOrigin: "Local downstream high-current disturbance on MCC-AUX-07",
    confidencePct: 86,
    operationalImpact: "One auxiliary contactor group dropped out and recovered automatically. No main breaker trip occurred.",
    estimatedExposureIDR: 12_800_000,
    downtimeMinutes: 0.2,
    affectedAssets: ["MCC-AUX-07", "VFD-AUX-07", "PLC-UTIL-07", "UPS-AUX-07"],
    correlatedMeters: primaryMeters,
    equipmentResponses: primaryResponses,
    investigationOwner: "Power Quality Engineer",
    incidentGroupId: "INC-PQ-1042",
    triggerThreshold: "RMS voltage < 90% Un for ≥ 20 ms",
    notes: [
      "Source and adjacent meters are synchronized within 2.3 ms.",
      "The deepest depression occurs downstream of F-07 rather than at the incomer.",
      "No protection trip or upstream utility interruption was recorded.",
    ],
  },
  {
    id: "PQ-260710-091404",
    timestamp: "2026-07-10 09:14:04.120",
    type: "Sag",
    severity: "Warning",
    status: "Closed",
    sourceMeter: "PM-CH-02",
    feederId: "F-04",
    feederName: "Chiller Plant",
    voltageLevel: "400 V",
    phases: "AB",
    minimumVoltagePct: 89.6,
    maximumVoltagePct: 100.1,
    durationMs: 620,
    frequencyHz: 49.99,
    waveformSampleRateHz: 6_400,
    preEventMs: 500,
    postEventMs: 1_000,
    probableOrigin: "Chiller compressor start with insufficient stagger interval",
    confidencePct: 91,
    operationalImpact: "No equipment trip; VFD current limit briefly active.",
    estimatedExposureIDR: 0,
    downtimeMinutes: 0,
    affectedAssets: ["CH-02", "P-CHW-02"],
    correlatedMeters: [],
    equipmentResponses: [],
    investigationOwner: "Utility Engineer",
    incidentGroupId: "INC-PQ-1038",
    triggerThreshold: "RMS voltage < 90% Un for ≥ 20 ms",
    notes: ["Closed after chiller-start sequence was revised."],
  },
  {
    id: "PQ-260704-184112",
    timestamp: "2026-07-04 18:41:12.088",
    type: "Swell",
    severity: "Warning",
    status: "Confirmed",
    sourceMeter: "PM-MAIN-01",
    feederId: "MSB-Main",
    feederName: "Main Distribution",
    voltageLevel: "400 V",
    phases: "ABC",
    minimumVoltagePct: 99.8,
    maximumVoltagePct: 112.4,
    durationMs: 94,
    frequencyHz: 50.03,
    waveformSampleRateHz: 6_400,
    preEventMs: 500,
    postEventMs: 1_000,
    probableOrigin: "Generator unloading during utility resynchronization",
    confidencePct: 78,
    operationalImpact: "No downstream protection operation.",
    estimatedExposureIDR: 0,
    downtimeMinutes: 0,
    affectedAssets: ["GEN-01", "SYNC-01"],
    correlatedMeters: [],
    equipmentResponses: [],
    investigationOwner: "Electrical Operations",
    incidentGroupId: "INC-PQ-1032",
    triggerThreshold: "RMS voltage > 110% Un for ≥ 20 ms",
    notes: ["Operational procedure review remains open."],
  },
  {
    id: "PQ-260628-020812",
    timestamp: "2026-06-28 02:08:12.004",
    type: "Interruption",
    severity: "Critical",
    status: "Closed",
    sourceMeter: "PM-F03-01",
    feederId: "F-03",
    feederName: "Building B",
    voltageLevel: "400 V",
    phases: "ABC",
    minimumVoltagePct: 2.0,
    maximumVoltagePct: 100.0,
    durationMs: 18,
    frequencyHz: 49.97,
    waveformSampleRateHz: 12_800,
    preEventMs: 500,
    postEventMs: 1_000,
    probableOrigin: "Local breaker test during approved maintenance window",
    confidencePct: 99,
    operationalImpact: "UPS-supported loads remained energized; non-critical lighting restarted.",
    estimatedExposureIDR: 0,
    downtimeMinutes: 0.3,
    affectedAssets: ["F-03-CB", "UPS-BLD-B"],
    correlatedMeters: [],
    equipmentResponses: [],
    investigationOwner: "Maintenance Supervisor",
    incidentGroupId: "INC-PQ-1024",
    triggerThreshold: "RMS voltage < 10% Un for ≥ 10 ms",
    notes: ["Matched approved switching permit and closed automatically."],
  },
  {
    id: "PQ-260621-112543",
    timestamp: "2026-06-21 11:25:43.032",
    type: "Transient",
    severity: "Info",
    status: "Acknowledged",
    sourceMeter: "PM-F05-01",
    feederId: "F-05",
    feederName: "Compressor Room",
    voltageLevel: "400 V",
    phases: "C",
    minimumVoltagePct: 98.7,
    maximumVoltagePct: 128.0,
    durationMs: 1.2,
    frequencyHz: 50.01,
    waveformSampleRateHz: 25_600,
    preEventMs: 100,
    postEventMs: 250,
    probableOrigin: "Capacitor-bank switching transient",
    confidencePct: 74,
    operationalImpact: "No equipment response recorded.",
    estimatedExposureIDR: 0,
    downtimeMinutes: 0,
    affectedAssets: ["CAP-02", "COMP-04"],
    correlatedMeters: [],
    equipmentResponses: [],
    investigationOwner: "Power Quality Engineer",
    incidentGroupId: "INC-PQ-1019",
    triggerThreshold: "Instantaneous voltage > 120% peak",
    notes: ["Retained for trend monitoring."],
  },
];

const baseIncidentAlarms: IncidentAlarm[] = [
  {
    id: "ALM-8821",
    incidentGroupId: "INC-PQ-1042",
    timestamp: "14:32:17.640",
    severity: "Critical",
    source: "PM-PQ-07",
    message: "RMS voltage sag below 90% Un",
    condition: "82% Un · phase ABC · 240 ms",
    acknowledged: false,
  },
  {
    id: "ALM-8822",
    incidentGroupId: "INC-PQ-1042",
    timestamp: "14:32:17.805",
    severity: "Warning",
    source: "MCC-AUX-07",
    message: "Auxiliary contactor group dropout",
    condition: "Automatic restart initiated",
    acknowledged: false,
  },
  {
    id: "ALM-8823",
    incidentGroupId: "INC-PQ-1042",
    timestamp: "14:32:18.612",
    severity: "Info",
    source: "VFD-AUX-07",
    message: "Undervoltage ride-through recovered",
    condition: "No trip · DC bus restored",
    acknowledged: true,
  },
  {
    id: "ALM-8791",
    incidentGroupId: "INC-OPS-1039",
    timestamp: "13:58:04.220",
    severity: "Warning",
    source: "AHU-HL-03",
    message: "Continuous operation outside occupancy window",
    condition: "Runtime exception · 46 min",
    acknowledged: false,
  },
  {
    id: "ALM-8774",
    incidentGroupId: "INC-UTIL-1036",
    timestamp: "12:41:52.044",
    severity: "Warning",
    source: "COMP-04",
    message: "Pressure decay above preferred rate",
    condition: "Suspected compressed-air leak",
    acknowledged: false,
  },
  {
    id: "ALM-8750",
    incidentGroupId: "INC-DATA-1031",
    timestamp: "09:12:07.111",
    severity: "Info",
    source: "PM-MAIN-01",
    message: "Meter completeness recovered",
    condition: "99.8% interval completeness",
    acknowledged: true,
  },
];

export function getPowerQualityEvents(scenarioId: DemoScenarioId): PowerQualityEvent[] {
  return baseEvents.map((event) => {
    if (event.id !== "PQ-260715-143217") return event;
    if (scenarioId === "voltage-sag") return { ...event, status: "Investigating" as const };
    return { ...event, status: event.status === "Investigating" ? "Acknowledged" as const : event.status };
  });
}

export function getIncidentAlarms() {
  return baseIncidentAlarms.map((alarm) => ({ ...alarm }));
}

export function getPrimaryPowerQualityEvent(scenarioId: DemoScenarioId) {
  return getPowerQualityEvents(scenarioId)[0];
}

export function getRmsSeries(event: PowerQualityEvent): RmsPoint[] {
  const points: RmsPoint[] = [];
  for (let timeMs = -500; timeMs <= 1_000; timeMs += 20) {
    const inEvent = timeMs >= 0 && timeMs <= event.durationMs;
    const recovery = timeMs > event.durationMs && timeMs <= event.durationMs + 180;
    const recoveryFactor = recovery ? (timeMs - event.durationMs) / 180 : 1;
    const base = inEvent ? event.minimumVoltagePct : recovery ? event.minimumVoltagePct + (100 - event.minimumVoltagePct) * recoveryFactor : 100;
    const ripple = Math.sin(timeMs / 63) * 0.35;
    points.push({
      timeMs,
      phaseA: Number((base + ripple).toFixed(2)),
      phaseB: Number((base + 1.4 + Math.sin(timeMs / 71) * 0.3).toFixed(2)),
      phaseC: Number((base - 0.9 + Math.sin(timeMs / 57) * 0.25).toFixed(2)),
      frequencyHz: Number((event.frequencyHz + Math.sin(timeMs / 220) * 0.015).toFixed(3)),
    });
  }
  return points;
}

export function getWaveformSeries(event: PowerQualityEvent): WaveformPoint[] {
  const points: WaveformPoint[] = [];
  const frequency = event.frequencyHz;
  for (let timeMs = -40; timeMs <= 320; timeMs += 1) {
    const angle = 2 * Math.PI * frequency * (timeMs / 1_000);
    const inEvent = timeMs >= 0 && timeMs <= event.durationMs;
    const residual = inEvent ? event.minimumVoltagePct / 100 : 1;
    const recoveryOvershoot = timeMs > event.durationMs && timeMs < event.durationMs + 20 ? 1.025 : 1;
    const amplitude = 325 * residual * recoveryOvershoot;
    points.push({
      timeMs,
      phaseA: Number((amplitude * Math.sin(angle)).toFixed(1)),
      phaseB: Number((amplitude * Math.sin(angle - (2 * Math.PI) / 3)).toFixed(1)),
      phaseC: Number((amplitude * Math.sin(angle + (2 * Math.PI) / 3)).toFixed(1)),
    });
  }
  return points;
}

export function getIncidentTimeline(event: PowerQualityEvent) {
  return [
    { offsetMs: -19_520, timestamp: "14:31:58.120", title: "Pre-event state captured", detail: `${event.feederId} breaker closed · normal RMS voltage`, tone: "normal" as const },
    { offsetMs: 0, timestamp: "14:32:17.640", title: "Sag threshold crossed", detail: `${event.sourceMeter} triggered at ${event.minimumVoltagePct.toFixed(1)}% Un`, tone: "warning" as const },
    { offsetMs: 160, timestamp: "14:32:17.800", title: "Minimum RMS recorded", detail: `${event.phases} phases · ${event.durationMs} ms event window`, tone: "critical" as const },
    { offsetMs: 405, timestamp: "14:32:18.045", title: "Voltage recovered", detail: "RMS voltage returned above 99% Un", tone: "good" as const },
    { offsetMs: 972, timestamp: "14:32:18.612", title: "Equipment ride-through confirmed", detail: "VFD recovered without trip; contactor restart active", tone: "good" as const },
    { offsetMs: 12_840, timestamp: "14:32:30.480", title: "Auxiliary sequence restored", detail: "All affected equipment returned to expected state", tone: "good" as const },
  ];
}

export function getIticScatter(scenarioId: DemoScenarioId) {
  return getPowerQualityEvents(scenarioId).map((event) => ({
    id: event.id,
    type: event.type,
    durationSeconds: Math.max(0.001, event.durationMs / 1_000),
    magnitudePct: event.type === "Swell" || event.type === "Transient" ? event.maximumVoltagePct : event.minimumVoltagePct,
    severity: event.severity,
    source: event.sourceMeter,
  }));
}

export function groupIncidentAlarms(alarms: IncidentAlarm[]) {
  const groups = new Map<string, IncidentAlarm[]>();
  alarms.forEach((alarm) => {
    const current = groups.get(alarm.incidentGroupId) ?? [];
    groups.set(alarm.incidentGroupId, [...current, alarm]);
  });
  return [...groups.entries()].map(([incidentGroupId, grouped]) => ({
    incidentGroupId,
    alarms: grouped,
    firstTimestamp: grouped[0]?.timestamp ?? "",
    highestSeverity: grouped.some((alarm) => alarm.severity === "Critical") ? "Critical" as const : grouped.some((alarm) => alarm.severity === "Warning") ? "Warning" as const : "Info" as const,
    unacknowledged: grouped.filter((alarm) => !alarm.acknowledged).length,
    primarySource: grouped[0]?.source ?? "",
    summary: grouped[0]?.message ?? "",
  }));
}
