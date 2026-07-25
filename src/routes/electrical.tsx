import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  ChevronRight,
  Clock3,
  Gauge,
  History,
  Maximize2,
  Play,
  Search,
  ShieldAlert,
  Wrench,
  Zap,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusPill } from "@/components/argrid-ui";
import { feeders, powerFlow24h, fmtNum } from "@/lib/argrid-data";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/electrical")({
  component: ElectricalNetwork,
  head: () => ({
    meta: [
      { title: "Electrical Network — ArGrid" },
      { name: "description", content: "Interactive one-line, contextual measurements, event evidence, and electrical investigation." },
      { property: "og:title", content: "ArGrid Electrical Network" },
      { property: "og:description", content: "Industrial electrical situational awareness with engineering context." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };
const baseTotalKW = feeders.reduce((sum, feeder) => sum + feeder.kw, 0);
const viewModes = ["Operations", "Energy", "Power Quality", "Maintenance"] as const;
const drawerTabs = ["Overview", "Measurements", "Trends", "Events", "Asset", "Actions"] as const;
type ViewMode = (typeof viewModes)[number];
type DrawerTab = (typeof drawerTabs)[number];

function ElectricalNetwork() {
  const { telemetry, lastUpdated, site, scenarioId, scenario } = useDemoSimulation();
  const [selectedId, setSelectedId] = useState("F-07");
  const [viewMode, setViewMode] = useState<ViewMode>("Operations");
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("Overview");
  const [replayOpen, setReplayOpen] = useState(false);
  const [replayPosition, setReplayPosition] = useState(64);
  const [search, setSearch] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const operationalFeeders = useMemo(
    () =>
      feeders.map((feeder) => {
        if (scenarioId === "voltage-sag") {
          return { ...feeder, status: feeder.id === "F-07" ? "critical" : feeder.id === "F-04" ? "warning" : "normal" };
        }
        if (scenarioId === "peak-demand") {
          return { ...feeder, status: feeder.id === "F-04" || feeder.id === "F-05" ? "warning" : "normal" };
        }
        if (scenarioId === "efficiency-loss") {
          return { ...feeder, status: feeder.id === "F-04" || feeder.id === "F-05" ? "warning" : "normal" };
        }
        return { ...feeder, status: feeder.id === "F-07" ? "warning" : feeder.status === "critical" ? "normal" : feeder.status };
      }),
    [scenarioId],
  );

  const selected = operationalFeeders.find((feeder) => feeder.id === selectedId) ?? operationalFeeders[0];
  const totalKW = baseTotalKW * site.powerScale;
  const selectedKW = selected.kw * site.powerScale * (scenarioId === "peak-demand" && selected.id === "F-04" ? 1.12 : 1);
  const selectedPf = selected.status === "critical" ? 0.88 : selected.status === "warning" ? 0.92 : 0.96;
  const selectedVoltage = selected.status === "critical" ? 328 : selected.status === "warning" ? 396 : 400;
  const selectedCurrent = Math.round((selectedKW * 1000) / (Math.sqrt(3) * Math.max(1, selectedVoltage) * selectedPf));
  const selectedThd = selected.status === "critical" ? 4.8 : selected.status === "warning" ? 3.7 : 2.2;
  const filteredFeeders = operationalFeeders.filter((feeder) => `${feeder.id} ${feeder.name}`.toLowerCase().includes(search.trim().toLowerCase()));
  const selectedTrend = useMemo(
    () =>
      powerFlow24h.map((point, index) => ({
        ...point,
        feederKW: Math.round(point.load * site.powerScale * 1000 * (selected.kw / baseTotalKW) * (scenarioId === "peak-demand" && index > 31 ? 1.08 : 1)),
      })),
    [scenarioId, selected.kw, site.powerScale],
  );

  const displayedValue = (feeder: (typeof operationalFeeders)[number]) => {
    if (viewMode === "Energy") return `${Math.round(feeder.kw * site.powerScale)} kW`;
    if (viewMode === "Power Quality") return `${feeder.status === "critical" ? "4.8" : feeder.status === "warning" ? "3.7" : "2.2"}% THD`;
    if (viewMode === "Maintenance") return feeder.status === "critical" ? "3 trips" : feeder.status === "warning" ? "Due 14d" : "Healthy";
    return feeder.status === "critical" ? "CLOSED · EVENT" : feeder.status === "warning" ? "CLOSED · WARN" : "CLOSED";
  };

  return (
    <AppShell title="Electrical Network" subtitle="Situational awareness, event investigation, and engineering evidence · MSB-Main">
      <div className="mb-3 min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground mr-1">
          <span>{site.name}</span><ChevronRight className="size-3" /><span>20 kV</span><ChevronRight className="size-3" /><span className="text-foreground">MSB-Main</span>
        </div>
        <div className="hidden lg:block h-4 w-px bg-border" />
        <select className="h-7 rounded-md border border-border bg-surface-2 px-2 text-[10.5px]" aria-label="Select voltage level">
          <option>20 kV / 400 V</option>
          <option>20 kV</option>
          <option>400 V</option>
        </select>
        <div className="flex rounded-md border border-border bg-surface-2 p-0.5">
          {viewModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`h-6 rounded px-2 text-[9.5px] ${viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[190px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search feeder…"
            className="h-7 w-full rounded-md border border-border bg-surface-2 pl-7 pr-2 text-[10.5px] focus:outline-none focus:border-primary/50"
          />
        </div>
        <button type="button" onClick={() => setSelectedId("F-07")} className="h-7 rounded-md border border-border px-2 text-[10px] flex items-center gap-1.5 hover:bg-surface-2">
          <Maximize2 className="size-3" /> Fit
        </button>
        <button
          type="button"
          onClick={() => setReplayOpen((value) => !value)}
          className={`h-7 rounded-md border px-2 text-[10px] flex items-center gap-1.5 ${replayOpen ? "border-primary/30 bg-primary/10 text-primary" : "border-border hover:bg-surface-2"}`}
        >
          <History className="size-3" /> Replay
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel
          title="Interactive One-Line — MSB-Main"
          className="xl:col-span-8 h-[610px]"
          actions={<span className="text-[10px] text-muted-foreground tabular">{scenario.name} · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
        >
          <div className="relative w-full h-full grid-bg rounded-md overflow-hidden">
            <svg viewBox="0 0 900 520" className="w-full h-full" role="img" aria-label="Interactive electrical single-line diagram for MSB-Main">
              <rect x="365" y="14" width="170" height="48" rx="4" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" />
              <text x="450" y="33" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="9.5">UTILITY SOURCE · 20 kV</text>
              <text x="450" y="50" textAnchor="middle" fill="var(--color-foreground)" fontSize="12" fontWeight="600">{telemetry.currentPower.toFixed(2)} MW · {telemetry.powerFactor.toFixed(3)} PF</text>

              <line x1="450" y1="62" x2="450" y2="88" stroke="var(--color-cyan)" strokeWidth="2" />
              <circle cx="450" cy="99" r="11" fill="none" stroke="var(--color-cyan)" strokeWidth="1.5" />
              <circle cx="450" cy="112" r="11" fill="none" stroke="var(--color-cyan)" strokeWidth="1.5" />
              <line x1="450" y1="123" x2="450" y2="145" stroke="var(--color-cyan)" strokeWidth="2" />
              <text x="470" y="105" fill="var(--color-muted-foreground)" fontSize="9">TR-01/02 · 2 × 4 MVA</text>
              <text x="470" y="118" fill="var(--color-muted-foreground)" fontSize="8.5">84% loading · 31% capacity margin</text>

              <circle cx="450" cy="151" r="3" fill="var(--color-foreground)" />
              <circle cx="450" cy="174" r="3" fill="var(--color-foreground)" />
              <line x1="450" y1="154" x2="450" y2="171" stroke="var(--color-green)" strokeWidth="3" />
              <text x="466" y="167" fill="var(--color-green)" fontSize="8.5">52-MAIN · CLOSED</text>
              <line x1="450" y1="177" x2="450" y2="196" stroke="var(--color-cyan)" strokeWidth="2" />

              <line x1="62" y1="196" x2="838" y2="196" stroke="var(--color-cyan)" strokeWidth="4" />
              <text x="64" y="187" fill="var(--color-muted-foreground)" fontSize="9">BUS A · 400 V · ENERGIZED</text>

              <line x1="450" y1="62" x2="450" y2="196" stroke="var(--color-primary)" strokeWidth="5" opacity="0.11" />

              {operationalFeeders.map((feeder, index) => {
                const x = 80 + index * 105;
                const selectedNow = selected.id === feeder.id;
                const color = feeder.status === "critical" ? "var(--color-red)" : feeder.status === "warning" ? "var(--color-amber)" : "var(--color-cyan)";
                const stateColor = feeder.status === "critical" ? "var(--color-red)" : feeder.status === "warning" ? "var(--color-amber)" : "var(--color-green)";
                return (
                  <g key={feeder.id} onClick={() => setSelectedId(feeder.id)} className="cursor-pointer" role="button" aria-label={`Select ${feeder.id} ${feeder.name}`}>
                    {selectedNow && <line x1={x} y1="196" x2={x} y2="365" stroke="var(--color-primary)" strokeWidth="8" opacity="0.1" />}
                    <line x1={x} y1="196" x2={x} y2="226" stroke={color} strokeWidth={selectedNow ? 2.4 : 1.6} />
                    <circle cx={x} cy="230" r="3" fill="var(--color-foreground)" />
                    <circle cx={x} cy="252" r="3" fill="var(--color-foreground)" />
                    <line x1={x} y1="233" x2={x} y2="249" stroke={stateColor} strokeWidth="3" />
                    <text x={x + 8} y="244" fill={stateColor} fontSize="7.5">CLOSED</text>
                    <line x1={x} y1="255" x2={x} y2="278" stroke={color} strokeWidth={selectedNow ? 2.4 : 1.6} />
                    <rect x={x - 42} y="278" width="84" height="112" rx="4" fill="var(--color-surface-2)" stroke={selectedNow ? "var(--color-primary)" : feeder.status === "critical" ? "var(--color-red)" : "var(--color-border-strong)"} strokeWidth={selectedNow ? 2 : 1} />
                    <text x={x} y="294" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8.5">{feeder.id}</text>
                    <text x={x} y="310" textAnchor="middle" fill="var(--color-foreground)" fontSize="9.5" fontWeight="600">{feeder.name}</text>
                    <text x={x} y="334" textAnchor="middle" fill={color} fontSize="12" fontWeight="600">{displayedValue(feeder)}</text>
                    <rect x={x - 31} y="350" width="62" height="5" rx="1" fill="var(--color-surface-3)" />
                    <rect x={x - 31} y="350" width={62 * (feeder.load / 100)} height="5" rx="1" fill={color} />
                    <text x={x} y="369" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8">{feeder.load}% loading</text>
                    <text x={x} y="381" textAnchor="middle" fill={stateColor} fontSize="7.5">{feeder.status.toUpperCase()}</text>
                  </g>
                );
              })}

              <g transform="translate(24, 472)">
                <line x1="0" y1="4" x2="22" y2="4" stroke="var(--color-cyan)" strokeWidth="3" /><text x="30" y="8" fill="var(--color-muted-foreground)" fontSize="8.5">Energized</text>
                <circle cx="116" cy="4" r="3" fill="var(--color-foreground)" /><line x1="119" y1="4" x2="135" y2="4" stroke="var(--color-green)" strokeWidth="3" /><circle cx="138" cy="4" r="3" fill="var(--color-foreground)" /><text x="148" y="8" fill="var(--color-muted-foreground)" fontSize="8.5">Closed breaker</text>
                <rect x="252" y="0" width="9" height="8" fill="none" stroke="var(--color-amber)" /><text x="270" y="8" fill="var(--color-muted-foreground)" fontSize="8.5">Warning</text>
                <rect x="350" y="0" width="9" height="8" fill="none" stroke="var(--color-red)" /><text x="368" y="8" fill="var(--color-muted-foreground)" fontSize="8.5">Critical event</text>
              </g>
            </svg>

            {replayOpen && (
              <div className="absolute left-3 right-3 bottom-3 rounded-md border border-border-strong bg-surface/95 px-3 py-2">
                <div className="flex items-center gap-3">
                  <button type="button" className="size-7 rounded-md border border-border bg-surface-2 flex items-center justify-center" aria-label="Play event replay"><Play className="size-3" /></button>
                  <div className="text-[9.5px] text-muted-foreground tabular shrink-0">14:32:17.640</div>
                  <input type="range" min="0" max="100" value={replayPosition} onChange={(event) => setReplayPosition(Number(event.target.value))} className="flex-1" aria-label="Event replay position" />
                  <div className="text-[9.5px] text-amber tabular shrink-0">Voltage sag · {replayPosition}%</div>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel title={`${selected.id} · ${selected.name}`} className="xl:col-span-4 h-[610px]" actions={<StatusPill status={selected.status} />} padded={false}>
          <div className="h-10 border-b border-border px-2 flex items-center overflow-x-auto">
            {drawerTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setDrawerTab(tab)}
                className={`h-10 px-2 text-[9.5px] whitespace-nowrap border-b-2 ${drawerTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-4 h-[calc(100%-40px)] overflow-auto">
            {drawerTab === "Overview" && (
              <div>
                <div className="grid grid-cols-2 gap-3 text-[11.5px]">
                  <Stat label="Active Power" value={`${fmtNum(selectedKW)} kW`} />
                  <Stat label="Current" value={`${fmtNum(selectedCurrent)} A`} />
                  <Stat label="Voltage L-L" value={`${selectedVoltage} V`} tone={selected.status !== "normal" ? "warn" : undefined} />
                  <Stat label="THD-V" value={`${selectedThd.toFixed(1)}%`} tone={selectedThd > 4 ? "warn" : undefined} />
                  <Stat label="Power Factor" value={selectedPf.toFixed(3)} tone={selectedPf < 0.95 ? "warn" : undefined} />
                  <Stat label="Frequency" value="49.98 Hz" />
                </div>
                <div className={`mt-4 text-[10.5px] flex items-start gap-2 border rounded-md px-3 py-2.5 ${selected.status === "critical" ? "text-red border-red/25 bg-red/10" : selected.status === "warning" ? "text-amber border-amber/25 bg-amber/10" : "text-green border-green/25 bg-green/10"}`}>
                  <ShieldAlert className="size-3.5 mt-0.5 shrink-0" />
                  <span>{selected.status === "critical" ? "Voltage sag reached 82% Un for 240 ms. Event correlation indicates a downstream origin; investigation remains open." : selected.status === "warning" ? "The feeder is outside its preferred operating band. Review loading, schedule, and correlated equipment conditions." : "Feeder state, measurements, and communication quality are within configured limits."}</span>
                </div>
                <div className="mt-4">
                  <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Context path</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="rounded border border-border bg-surface-2 px-2 py-1">Utility 20 kV</span><ChevronRight className="size-3 text-muted-foreground" /><span className="rounded border border-border bg-surface-2 px-2 py-1">TR-01/02</span><ChevronRight className="size-3 text-muted-foreground" /><span className="rounded border border-primary/30 bg-primary/10 px-2 py-1 text-primary">{selected.id}</span>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === "Measurements" && (
              <div className="space-y-1">
                {[
                  ["Voltage AB", `${selectedVoltage} V`, selected.status !== "normal"],
                  ["Voltage BC", `${selectedVoltage + 2} V`, false],
                  ["Voltage CA", `${selectedVoltage - 1} V`, false],
                  ["Current A", `${selectedCurrent} A`, false],
                  ["Current B", `${selectedCurrent - 8} A`, false],
                  ["Current C", `${selectedCurrent + 11} A`, false],
                  ["Reactive power", `${Math.round(selectedKW * 0.23)} kvar`, false],
                  ["Voltage unbalance", selected.status === "critical" ? "2.8%" : "0.7%", selected.status === "critical"],
                  ["Data quality", "GOOD · 1.2 s", false],
                ].map(([label, value, warning]) => (
                  <div key={String(label)} className="flex items-center justify-between border-b border-border py-2 text-[10.5px]">
                    <span className="text-muted-foreground">{label}</span><span className={`tabular font-medium ${warning ? "text-amber" : ""}`}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {drawerTab === "Trends" && (
              <div className="h-[430px]">
                <div className="mb-3 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Feeder load · last 24 hours</span><span className="text-[10px] tabular">kW</span></div>
                <ResponsiveContainer width="100%" height="92%">
                  <LineChart data={selectedTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="t" {...chartAxis} interval={7} />
                    <YAxis {...chartAxis} width={44} />
                    <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }} formatter={(value: number) => [`${fmtNum(value)} kW`, selected.id]} />
                    <Line type="monotone" dataKey="feederKW" name={selected.id} stroke="var(--color-cyan)" strokeWidth={1.6} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {drawerTab === "Events" && (
              <div className="space-y-2">
                {[
                  { time: "14:32:18.040", title: "Voltage recovered", detail: "0.99 Un · phase ABC", tone: "text-green" },
                  { time: "14:32:17.800", title: "Minimum RMS voltage", detail: "0.82 Un · 240 ms", tone: "text-red" },
                  { time: "14:32:17.640", title: "Event triggered", detail: "Sag threshold crossed", tone: "text-amber" },
                  { time: "14:31:58.120", title: "Pre-event state", detail: "Breaker closed · 320 kW", tone: "text-muted-foreground" },
                ].map((event) => (
                  <div key={event.time} className="rounded-md border border-border bg-surface-2 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2"><span className={`text-[10.5px] font-medium ${event.tone}`}>{event.title}</span><span className="text-[9.5px] tabular text-muted-foreground">{event.time}</span></div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{event.detail}</div>
                  </div>
                ))}
              </div>
            )}

            {drawerTab === "Asset" && (
              <div className="space-y-1">
                {[
                  ["Asset ID", `${selected.id}-CB-MTR`],
                  ["Parent board", "MSB-Main"],
                  ["Device", "Power meter + breaker IED"],
                  ["Protocol", "IEC 61850 / Modbus TCP"],
                  ["CT ratio", "1600/5 A"],
                  ["Accuracy", "Class 0.5S"],
                  ["Last calibration", "18 Mar 2026"],
                  ["Time synchronization", "PTP · ±2.1 ms"],
                  ["Criticality", selected.id === "F-07" ? "High" : "Medium"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-border py-2 text-[10.5px]"><span className="text-muted-foreground">{label}</span><span className="tabular text-right">{value}</span></div>
                ))}
              </div>
            )}

            {drawerTab === "Actions" && (
              <div>
                <div className="rounded-md border border-border bg-surface-2 p-3 text-[10.5px] text-muted-foreground">Actions remain in simulation mode. No switching command or field-device write will be executed.</div>
                <div className="mt-3 grid gap-2">
                  <button type="button" onClick={() => setActionMessage("Investigation AG-INV-1042 created and linked to the event.")} className="h-9 rounded-md bg-primary text-primary-foreground text-[11px] font-medium flex items-center justify-center gap-2"><Activity className="size-3.5" /> Create investigation</button>
                  <button type="button" onClick={() => setActionMessage("Trend and event evidence added to Opportunity OPP-2041.")} className="h-9 rounded-md border border-border text-[11px] font-medium flex items-center justify-center gap-2 hover:bg-surface-2"><Gauge className="size-3.5" /> Link to opportunity</button>
                  <button type="button" onClick={() => setActionMessage("Maintenance inspection request prepared for review.")} className="h-9 rounded-md border border-border text-[11px] font-medium flex items-center justify-center gap-2 hover:bg-surface-2"><Wrench className="size-3.5" /> Prepare inspection</button>
                </div>
                {actionMessage && <div className="mt-3 rounded-md border border-green/25 bg-green/10 px-3 py-2.5 text-[10.5px] text-green">{actionMessage}</div>}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Feeder Operations Matrix" className="xl:col-span-12" actions={<span className="text-[10px] text-muted-foreground">Select a row to preserve context in the one-line and drawer</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
                  <th className="py-2 font-normal">Feeder</th>
                  <th className="py-2 font-normal">Name</th>
                  <th className="py-2 font-normal text-right">Active Power</th>
                  <th className="py-2 font-normal text-right">Loading</th>
                  <th className="py-2 font-normal text-right">PF</th>
                  <th className="py-2 font-normal text-right">THD-V</th>
                  <th className="py-2 font-normal">Breaker</th>
                  <th className="py-2 font-normal">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFeeders.map((feeder) => (
                  <tr key={feeder.id} onClick={() => setSelectedId(feeder.id)} className={`cursor-pointer hover:bg-surface-2/60 ${selected.id === feeder.id ? "bg-primary/7" : ""}`}>
                    <td className="py-2 tabular text-muted-foreground">{feeder.id}</td>
                    <td className="py-2 font-medium">{feeder.name}</td>
                    <td className="py-2 text-right tabular">{fmtNum(feeder.kw * site.powerScale)} kW</td>
                    <td className="py-2 text-right tabular">{feeder.load}%</td>
                    <td className="py-2 text-right tabular">{feeder.status === "critical" ? "0.88" : feeder.status === "warning" ? "0.92" : "0.96"}</td>
                    <td className="py-2 text-right tabular">{feeder.status === "critical" ? "4.8%" : feeder.status === "warning" ? "3.7%" : "2.2%"}</td>
                    <td className="py-2"><span className="inline-flex items-center gap-1.5 text-green"><span className="inline-block h-3 w-[2px] bg-current" /> CLOSED</span></td>
                    <td className="py-2"><StatusPill status={feeder.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[9.5px] text-muted-foreground"><Clock3 className="size-3" /> Data source timestamp {lastUpdated.toLocaleString()} · quality GOOD · simulated engineering demo</div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5">
      <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 tabular text-[13px] font-medium ${tone === "warn" ? "text-amber" : ""}`}>{value}</div>
    </div>
  );
}
