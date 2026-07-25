// Deterministic industrial sample data for the ArGrid browser demo
export const kpis = {
  currentPower: 4.82, // MW
  currentPowerTrend: -3.2,
  todayEnergy: 68420, // kWh
  todayEnergyTrend: 1.8,
  todayCost: 82_104_000, // IDR
  todayCostTrend: -4.5,
  peakDemand: 5.31, // MW
  demandLimit: 6.0,
  powerFactor: 0.94,
  co2Today: 51.2, // tCO2e
  co2Trend: -2.1,
  activeAlarms: 3,
  criticalAlarms: 1,
  dataHealth: 98.4,
};

export const powerFlow24h = Array.from({ length: 48 }, (_, i) => {
  const h = i / 2;
  const base = 3.5 + Math.sin((h - 6) / 4) * 0.9;
  const noise = (Math.sin(i * 1.7) + Math.cos(i * 2.3)) * 0.13;
  const load = Math.max(1.9, base + noise + (h > 8 && h < 17 ? 0.75 : 0));
  const solar = h > 6 && h < 18 ? Math.max(0, Math.sin(((h - 6) / 12) * Math.PI) * 1.6) : 0;
  return {
    t: `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 === 0 ? "00" : "30"}`,
    grid: +(load - solar).toFixed(2),
    solar: +solar.toFixed(2),
    load: +load.toFixed(2),
  };
});

export const usageByType = [
  { name: "HVAC", value: 42, color: "var(--color-cyan)" },
  { name: "Process", value: 28, color: "var(--color-green)" },
  { name: "Lighting", value: 12, color: "var(--color-amber)" },
  { name: "Compressed Air", value: 10, color: "var(--color-violet)" },
  { name: "Other", value: 8, color: "var(--color-muted-foreground)" },
];

export const consumptionByLocation = [
  { name: "Heavy Lab", kwh: 18420 },
  { name: "Building A", kwh: 12840 },
  { name: "Building B", kwh: 11200 },
  { name: "Atrium", kwh: 8640 },
  { name: "Restaurant", kwh: 5210 },
  { name: "Warehouse", kwh: 4980 },
  { name: "Guesthouse", kwh: 3720 },
];

export const weekComparison = Array.from({ length: 7 }, (_, i) => {
  const d = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];
  return {
    day: d,
    thisWeek: 58000 + Math.round(Math.sin(i) * 6000 + i * 1200),
    lastWeek: 62000 + Math.round(Math.cos(i) * 5000 + i * 900),
  };
});

export const opportunities = [
  {
    id: "OPP-2041",
    title: "HVAC nighttime setback in Heavy Lab",
    asset: "AHU-HL-03",
    annualSaving: 184_000_000,
    payback: 2.4,
    confidence: "High",
    urgency: "P1",
    status: "Open",
  },
  {
    id: "OPP-2039",
    title: "Compressed air leak — Line 4 header",
    asset: "COMP-04",
    annualSaving: 96_400_000,
    payback: 0.8,
    confidence: "High",
    urgency: "P1",
    status: "Assigned",
  },
  {
    id: "OPP-2036",
    title: "Chiller sequencing optimization",
    asset: "CH-01/02",
    annualSaving: 240_000_000,
    payback: 3.6,
    confidence: "Medium",
    urgency: "P2",
    status: "Open",
  },
  {
    id: "OPP-2031",
    title: "Peak demand shave — furnace scheduling",
    asset: "FURN-A2",
    annualSaving: 312_500_000,
    payback: 5.1,
    confidence: "Medium",
    urgency: "P2",
    status: "In review",
  },
  {
    id: "OPP-2028",
    title: "Lighting occupancy control — Warehouse",
    asset: "LTG-WH",
    annualSaving: 42_800_000,
    payback: 1.6,
    confidence: "High",
    urgency: "P3",
    status: "Open",
  },
  {
    id: "OPP-2024",
    title: "Power factor correction — MSB-2",
    asset: "MSB-02",
    annualSaving: 68_200_000,
    payback: 2.9,
    confidence: "High",
    urgency: "P2",
    status: "Converted",
  },
];

export const alarms = [
  {
    id: "ALM-8821",
    ts: "2026-07-25 14:32:18",
    severity: "Critical",
    source: "MSB-02 / Feeder F-07",
    message: "Voltage sag 82% Un for 240 ms",
    ack: false,
  },
  {
    id: "ALM-8817",
    ts: "2026-07-25 13:58:04",
    severity: "Warning",
    source: "AHU-HL-03",
    message: "Continuous operation outside occupancy window",
    ack: false,
  },
  {
    id: "ALM-8814",
    ts: "2026-07-25 12:41:52",
    severity: "Warning",
    source: "COMP-04",
    message: "Pressure drop >0.6 bar in 15 min — suspected leak",
    ack: true,
  },
  {
    id: "ALM-8802",
    ts: "2026-07-25 09:12:07",
    severity: "Info",
    source: "PM-Main",
    message: "Power factor recovered above 0.92 threshold",
    ack: true,
  },
  {
    id: "ALM-8798",
    ts: "2026-07-25 08:04:31",
    severity: "Warning",
    source: "CH-02",
    message: "Efficiency 0.71 kW/RT above baseline (+8%)",
    ack: true,
  },
];

export const feeders = [
  { id: "F-01", name: "Heavy Lab", load: 78, status: "normal", kw: 1190 },
  { id: "F-02", name: "Building A", load: 62, status: "normal", kw: 820 },
  { id: "F-03", name: "Building B", load: 55, status: "normal", kw: 610 },
  { id: "F-04", name: "Chiller Plant", load: 84, status: "warning", kw: 990 },
  { id: "F-05", name: "Compressor Room", load: 71, status: "normal", kw: 540 },
  { id: "F-06", name: "Warehouse", load: 34, status: "normal", kw: 235 },
  { id: "F-07", name: "Utility & Aux", load: 46, status: "critical", kw: 320 },
  { id: "F-08", name: "Guesthouse", load: 22, status: "normal", kw: 115 },
];

export const powerQualityEvents = Array.from({ length: 40 }, (_, i) => {
  const r1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  const r2 = Math.abs(Math.sin(i * 78.233) * 12345.678) % 1;
  const duration = Math.pow(10, -1 + r1 * 3);
  const magnitude = 20 + r2 * 130;
  return {
    id: i,
    duration: +duration.toFixed(3),
    magnitude: +magnitude.toFixed(0),
    type: magnitude < 90 ? "sag" : magnitude > 110 ? "swell" : "normal",
  };
});

export const monthlyEnergy = Array.from({ length: 12 }, (_, i) => {
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i];
  return {
    m,
    thisYear: 1_900_000 + Math.round(Math.sin(i / 2) * 220_000 + i * 12_000),
    lastYear: 2_050_000 + Math.round(Math.cos(i / 2) * 180_000 + i * 8_000),
  };
});

export const co2Trend = Array.from({ length: 12 }, (_, i) => {
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i];
  return {
    m,
    actual: 1650 - i * 22 + Math.round(Math.sin(i) * 40),
    target: 1600 - i * 30,
  };
});

export function fmtIDR(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} B`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} K`;
  return `Rp ${n}`;
}

export function fmtNum(n: number, digits = 0) {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
