import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Cable,
  CheckCircle2,
  Clock3,
  Crosshair,
  FileCheck2,
  Gauge,
  GitBranch,
  History,
  Play,
  RadioTower,
  ShieldAlert,
  ShieldCheck,
  Waves,
  Wrench,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { fmtIDR } from "@/lib/argrid-data";
import { useDemoSimulation } from "@/lib/demo-simulation";
import {
  getIncidentTimeline,
  getIticScatter,
  getPowerQualityEvents,
  getRmsSeries,
  getWaveformSeries,
  type CorrelatedMeter,
  type EquipmentResponse,
  type InvestigationStatus,
  type PowerQualityEvent,
} from "@/lib/power-quality";

export const Route = createFileRoute("/alarms/power-quality")({
  component: PowerQualityInvestigation,
  head: () => ({
    meta: [
      { title: "Power Quality Investigation — ArGrid" },
      {
        name: "description",
        content: "Correlated RMS, waveform, electrical context, equipment response, and investigation evidence for power-quality events.",
      },
    ],
  }),
});

const tabs = ["Event Evidence", "Meter Correlation", "Equipment Response", "Investigation"] as const;
type Tab = (typeof tabs)[number];

const chartAxis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 9,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    color: "var(--color-foreground)",
    fontSize: 10,
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

function statusClass(status: InvestigationStatus) {
  if (status === "New") return "border-red/30 bg-red/10 text-red";
  if (status === "Acknowledged") return "border-amber/30 bg-amber/10 text-amber";
  if (status === "Investigating") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "Confirmed") return "border-violet/30 bg-violet/10 text-violet";
  return "border-green/30 bg-green/10 text-green";
}

function severityClass(severity: PowerQualityEvent["severity"]) {
  if (severity === "Critical") return "border-red/30 bg-red/10 text-red";
  if (severity === "Warning") return "border-amber/30 bg-amber/10 text-amber";
  return "border-primary/30 bg-primary/10 text-primary";
}

function directionClass(direction: CorrelatedMeter["direction"]) {
  if (direction === "Local") return "border-primary/30 bg-primary/10 text-primary";
  if (direction === "Downstream") return "border-amber/30 bg-amber/10 text-amber";
  return "border-border bg-surface-2 text-muted-foreground";
}

function responseClass(state: EquipmentResponse["stateAfterEvent"]) {
  if (state === "Trip") return "border-red/30 bg-red/10 text-red";
  if (state === "Recovered") return "border-amber/30 bg-amber/10 text-amber";
  return "border-green/30 bg-green/10 text-green";
}

function PowerQualityInvestigation() {
  const { scenarioId, setScenarioId, scenario } = useDemoSimulation();
  const events = useMemo(() => getPowerQualityEvents(scenarioId), [scenarioId]);
  const [selectedId, setSelectedId] = useState(events[0].id);
  const [activeTab, setActiveTab] = useState<Tab>("Event Evidence");
  const [cursorMs, setCursorMs] = useState(160);
  const [message, setMessage] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, InvestigationStatus>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-pq-status-overrides") ?? "{}") as Record<string, InvestigationStatus>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    window.localStorage.setItem("argrid-pq-status-overrides", JSON.stringify(statusOverrides));
  }, [statusOverrides]);

  const selectedBase = events.find((event) => event.id === selectedId) ?? events[0];
  const selected = { ...selectedBase, status: statusOverrides[selectedBase.id] ?? selectedBase.status };
  const rmsSeries = useMemo(() => getRmsSeries(selected), [selected]);
  const waveformSeries = useMemo(() => getWaveformSeries(selected), [selected]);
  const timeline = useMemo(() => getIncidentTimeline(selected), [selected]);
  const scatter = useMemo(() => getIticScatter(scenarioId), [scenarioId]);
  const correlationChart = selected.correlatedMeters.map((meter) => ({
    meter: meter.meterId,
    residual: meter.minimumVoltagePct,
    duration: meter.durationMs,
    offset: meter.startOffsetMs,
  }));

  const advanceStatus = () => {
    const order: InvestigationStatus[] = ["New", "Acknowledged", "Investigating", "Confirmed", "Closed"];
    const next = order[Math.min(order.length - 1, order.indexOf(selected.status) + 1)];
    setStatusOverrides((current) => ({ ...current, [selected.id]: next }));
    setMessage(`${selected.id} moved to ${next}. This browser demo stores the workflow state locally.`);
  };

  const openVoltageSagScenario = () => {
    setScenarioId("voltage-sag");
    setSelectedId("PQ-260715-143217");
    setMessage("Voltage-sag scenario activated. Historical event evidence remains deterministic for replay.");
  };

  return (
    <AppShell
      title="Power Quality Investigation"
      subtitle="Synchronized RMS, waveform, electrical context, equipment response, and engineering evidence"
      toolbar={
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground">
            <RadioTower className="size-3.5 text-primary" /> {selected.sourceMeter} · sync ±2.3 ms
          </div>
          <button type="button" onClick={openVoltageSagScenario} className="h-8 rounded-md border border-primary/30 bg-primary/10 px-2.5 text-[10px] font-medium text-primary">
            Activate sag scenario
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Link to="/alarms" className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-[10px] hover:bg-surface-2">
            <ArrowLeft className="size-3" /> Incidents
          </Link>
          <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
            Event
            <select
              value={selectedId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                setSelectedId(event.target.value);
                setCursorMs(160);
                setMessage("");
              }}
              className="h-7 min-w-[270px] rounded-md border border-border bg-surface-2 px-2 text-[10px] text-foreground"
            >
              {events.map((event) => <option key={event.id} value={event.id}>{event.id} · {event.type} · {event.feederId}</option>)}
            </select>
          </label>
          <span className={`rounded border px-2 py-1 text-[9px] ${severityClass(selected.severity)}`}>{selected.severity}</span>
          <span className={`rounded border px-2 py-1 text-[9px] ${statusClass(selected.status)}`}>{selected.status}</span>
          <span className="ml-auto text-[9.5px] text-muted-foreground">{selected.timestamp} · {scenario.name}</span>
        </div>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiTile label="Minimum RMS" value={selected.minimumVoltagePct.toFixed(1)} unit="% Un" hint={`${selected.phases} phases`} tone="critical" />
          <KpiTile label="Duration" value={String(selected.durationMs)} unit="ms" hint={selected.triggerThreshold} tone="warning" />
          <KpiTile label="Affected Assets" value={String(selected.affectedAssets.length)} hint="response evidence linked" />
          <KpiTile label="Origin Confidence" value={String(selected.confidencePct)} unit="%" hint="correlation-based" tone={selected.confidencePct >= 85 ? "good" : "warning"} />
          <KpiTile label="Estimated Exposure" value={fmtIDR(selected.estimatedExposureIDR)} hint="operational estimate, not verified loss" tone={selected.estimatedExposureIDR > 0 ? "warning" : "neutral"} />
          <KpiTile label="Time Sync" value="2.3" unit="ms" hint="maximum correlated-meter error" tone="good" />
        </section>

        <section className="rounded-lg border border-amber/35 bg-amber/8 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber/12 text-amber"><ShieldAlert className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Probable origin</span>
                <span className="rounded border border-amber/30 bg-surface px-1.5 py-0.5 text-[9px] text-amber">{selected.confidencePct}% confidence</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed"><strong>{selected.probableOrigin}.</strong> {selected.operationalImpact}</p>
            </div>
            <Link to="/electrical" className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[10.5px] font-medium text-primary-foreground">
              Open electrical context <GitBranch className="size-3.5" />
            </Link>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => { setActiveTab(tab); setMessage(""); }} className={`h-8 rounded-md px-3 text-[10.5px] font-medium ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
          <span className="ml-auto hidden pr-2 text-[9px] text-muted-foreground lg:inline">Cursor and event selection remain synchronized across evidence panels.</span>
        </div>

        {message && <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/8 px-3 py-2 text-[10px]"><History className="size-3.5 text-primary" />{message}</div>}

        {activeTab === "Event Evidence" && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <Panel title="RMS Voltage Envelope" className="h-[360px] xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">% Un · pre-event / event / recovery</span>}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rmsSeries} syncId="pq-evidence" margin={{ top: 8, right: 12, left: -2, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <ReferenceArea x1={0} x2={selected.durationMs} fill="var(--color-red)" fillOpacity={0.08} />
                  <ReferenceLine y={90} stroke="var(--color-amber)" strokeDasharray="4 4" label={{ value: "90% threshold", position: "insideTopRight", fill: "var(--color-amber)", fontSize: 8 }} />
                  <ReferenceLine y={110} stroke="var(--color-muted-foreground)" strokeDasharray="3 5" />
                  <ReferenceLine x={cursorMs} stroke="var(--color-primary)" strokeDasharray="3 3" />
                  <XAxis dataKey="timeMs" {...chartAxis} tickFormatter={(value: number) => `${value} ms`} />
                  <YAxis {...chartAxis} width={42} domain={[70, 112]} tickFormatter={(value: number) => `${value}%`} />
                  <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [`${Number(value).toFixed(2)}% Un`, name]} labelFormatter={(label) => `${label} ms`} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Line type="monotone" dataKey="phaseA" name="Phase A" stroke="var(--color-cyan)" strokeWidth={1.8} dot={false} />
                  <Line type="monotone" dataKey="phaseB" name="Phase B" stroke="var(--color-amber)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="phaseC" name="Phase C" stroke="var(--color-violet)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Electrical Context" className="xl:col-span-4" actions={<span className="text-[9.5px] text-muted-foreground">selected path</span>}>
              <div className="rounded-md border border-border bg-background/30 p-3">
                <svg viewBox="0 0 360 230" className="h-[210px] w-full" role="img" aria-label="Mini one-line showing F-07 event location">
                  <rect x="118" y="8" width="124" height="34" rx="4" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" />
                  <text x="180" y="22" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8">UTILITY 20 kV</text>
                  <text x="180" y="35" textAnchor="middle" fill="var(--color-foreground)" fontSize="10">PM-MAIN-01 · 91.4% Un</text>
                  <line x1="180" y1="42" x2="180" y2="78" stroke="var(--color-cyan)" strokeWidth="2" />
                  <circle cx="180" cy="87" r="9" fill="none" stroke="var(--color-cyan)" />
                  <circle cx="180" cy="98" r="9" fill="none" stroke="var(--color-cyan)" />
                  <line x1="180" y1="107" x2="180" y2="126" stroke="var(--color-cyan)" strokeWidth="2" />
                  <line x1="44" y1="126" x2="316" y2="126" stroke="var(--color-cyan)" strokeWidth="3" />
                  <text x="46" y="118" fill="var(--color-muted-foreground)" fontSize="8">MSB-MAIN · PROPAGATED SAG</text>
                  {[75, 145, 215, 285].map((x, index) => {
                    const selectedFeeder = index === 3;
                    return <g key={x}><line x1={x} y1="126" x2={x} y2="168" stroke={selectedFeeder ? "var(--color-red)" : "var(--color-cyan)"} strokeWidth={selectedFeeder ? 3 : 1.5} /><rect x={x - 28} y="168" width="56" height="40" rx="3" fill="var(--color-surface-2)" stroke={selectedFeeder ? "var(--color-red)" : "var(--color-border-strong)"} /><text x={x} y="183" textAnchor="middle" fill="var(--color-foreground)" fontSize="8">{selectedFeeder ? "F-07" : `F-0${index + 4}`}</text><text x={x} y="197" textAnchor="middle" fill={selectedFeeder ? "var(--color-red)" : "var(--color-green)"} fontSize="7.5">{selectedFeeder ? "82% Un" : "NORMAL"}</text></g>;
                  })}
                </svg>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <Info label="Incident group" value={selected.incidentGroupId} />
                <Info label="Source meter" value={selected.sourceMeter} />
                <Info label="Feeder" value={`${selected.feederId} · ${selected.feederName}`} />
                <Info label="Sample rate" value={`${selected.waveformSampleRateHz.toLocaleString("en-US")} Hz`} />
              </div>
            </Panel>

            <Panel title="Instantaneous Waveform" className="h-[330px] xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">V peak · synchronized cursor</span>}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waveformSeries} syncId="pq-evidence" margin={{ top: 8, right: 12, left: -2, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <ReferenceArea x1={0} x2={selected.durationMs} fill="var(--color-red)" fillOpacity={0.07} />
                  <ReferenceLine x={cursorMs} stroke="var(--color-primary)" strokeDasharray="3 3" />
                  <XAxis dataKey="timeMs" {...chartAxis} tickFormatter={(value: number) => `${value} ms`} interval={39} />
                  <YAxis {...chartAxis} width={44} domain={[-360, 360]} tickFormatter={(value: number) => `${value}V`} />
                  <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [`${Number(value).toFixed(1)} V`, name]} labelFormatter={(label) => `${label} ms`} />
                  <Line type="linear" dataKey="phaseA" name="Phase A" stroke="var(--color-cyan)" strokeWidth={1.25} dot={false} />
                  <Line type="linear" dataKey="phaseB" name="Phase B" stroke="var(--color-amber)" strokeWidth={1.1} dot={false} />
                  <Line type="linear" dataKey="phaseC" name="Phase C" stroke="var(--color-violet)" strokeWidth={1.1} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Event Replay & Chronology" className="xl:col-span-4">
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="flex items-center gap-3">
                  <button type="button" className="flex size-7 items-center justify-center rounded-md border border-border bg-surface" aria-label="Play deterministic event replay"><Play className="size-3" /></button>
                  <input type="range" min="-40" max="320" value={cursorMs} onChange={(event) => setCursorMs(Number(event.target.value))} className="flex-1" aria-label="Power-quality replay cursor" />
                  <span className="w-14 text-right text-[9.5px] tabular text-primary">{cursorMs} ms</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {timeline.map((item) => (
                  <div key={item.timestamp} className="flex gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${item.tone === "critical" ? "bg-red" : item.tone === "warning" ? "bg-amber" : item.tone === "good" ? "bg-green" : "bg-muted-foreground"}`} />
                    <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-medium">{item.title}</span><span className="text-[8.5px] tabular text-muted-foreground">{item.timestamp}</span></div><p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{item.detail}</p></div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "Meter Correlation" && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <Panel title="Correlated Meter Residual Voltage" className="h-[370px] xl:col-span-7" actions={<span className="text-[9.5px] text-muted-foreground">lower residual = deeper event</span>}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={correlationChart} margin={{ top: 12, right: 10, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <ReferenceLine y={90} stroke="var(--color-amber)" strokeDasharray="4 4" label={{ value: "Sag threshold", position: "insideTopRight", fill: "var(--color-amber)", fontSize: 8 }} />
                  <XAxis dataKey="meter" {...chartAxis} />
                  <YAxis {...chartAxis} width={42} domain={[70, 100]} tickFormatter={(value: number) => `${value}%`} />
                  <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [name === "residual" ? `${Number(value).toFixed(1)}% Un` : `${value} ms`, name]} />
                  <Bar dataKey="residual" name="Residual voltage" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Correlation Conclusion" className="xl:col-span-5">
              <div className="rounded-md border border-primary/30 bg-primary/8 p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium"><Crosshair className="size-4 text-primary" />Downstream origin is most probable</div>
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">PM-PQ-07 triggers first, PM-AUX-071 records a deeper residual, while the main incomer and adjacent F-06 see shallower propagation. This pattern is inconsistent with a site-wide utility-origin sag.</p>
              </div>
              <div className="mt-3 space-y-2">
                {selected.notes.map((note) => <div key={note} className="flex items-start gap-2 text-[10px]"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green" /><span>{note}</span></div>)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2"><Info label="Confidence" value={`${selected.confidencePct}%`} /><Info label="Owner" value={selected.investigationOwner} /><Info label="Source quality" value="GOOD" /><Info label="Max sync error" value="2.3 ms" /></div>
            </Panel>

            <Panel title="Synchronized Meter Evidence" className="xl:col-span-12">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-[10.5px]">
                  <thead><tr className="border-b border-border text-left text-[9px] uppercase tracking-[0.11em] text-muted-foreground"><th className="py-2 font-normal">Meter / location</th><th className="py-2 font-normal">Direction</th><th className="py-2 font-normal text-right">Minimum RMS</th><th className="py-2 font-normal text-right">Duration</th><th className="py-2 font-normal text-right">Start offset</th><th className="py-2 font-normal text-right">Sync error</th><th className="py-2 font-normal">Evidence</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {selected.correlatedMeters.map((meter) => (
                      <tr key={meter.meterId} className="hover:bg-surface-2/60"><td className="py-2.5"><div className="font-semibold tabular">{meter.meterId}</div><div className="text-[9px] text-muted-foreground">{meter.location}</div></td><td className="py-2.5"><span className={`rounded border px-1.5 py-0.5 text-[9px] ${directionClass(meter.direction)}`}>{meter.direction}</span></td><td className={`py-2.5 text-right font-semibold tabular ${meter.minimumVoltagePct < 90 ? "text-red" : "text-amber"}`}>{meter.minimumVoltagePct.toFixed(1)}% Un</td><td className="py-2.5 text-right tabular">{meter.durationMs} ms</td><td className="py-2.5 text-right tabular">+{meter.startOffsetMs} ms</td><td className="py-2.5 text-right tabular">±{meter.timeSyncErrorMs.toFixed(1)} ms</td><td className="max-w-[390px] py-2.5 text-[9.5px] leading-relaxed text-muted-foreground">{meter.evidence}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "Equipment Response" && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <Panel title="Equipment Ride-Through and Recovery" className="xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">response evidence linked by timestamp</span>}>
              <div className="grid gap-2 md:grid-cols-2">
                {selected.equipmentResponses.length > 0 ? selected.equipmentResponses.map((equipment) => (
                  <article key={equipment.assetId} className="rounded-md border border-border bg-surface-2 p-3">
                    <div className="flex items-start justify-between gap-2"><div><div className="text-[9px] tabular text-muted-foreground">{equipment.assetId}</div><div className="mt-0.5 text-[11px] font-semibold">{equipment.assetName}</div></div><span className={`rounded border px-1.5 py-0.5 text-[9px] ${responseClass(equipment.stateAfterEvent)}`}>{equipment.stateAfterEvent}</span></div>
                    <p className="mt-2 text-[10px] leading-relaxed">{equipment.response}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2"><Info label="Restart time" value={equipment.restartSeconds > 0 ? `${equipment.restartSeconds.toFixed(1)} s` : "None"} /><Info label="Consequence" value={equipment.productionConsequence} /></div>
                  </article>
                )) : <div className="col-span-2 rounded-md border border-border bg-surface-2 p-4 text-[10px] text-muted-foreground">No equipment response records are attached to this historical event.</div>}
              </div>
            </Panel>

            <Panel title="Operational Impact" className="xl:col-span-4">
              <div className="grid grid-cols-2 gap-2"><Metric icon={Clock3} label="Downtime" value={`${selected.downtimeMinutes.toFixed(1)} min`} /><Metric icon={Gauge} label="Exposure" value={fmtIDR(selected.estimatedExposureIDR)} tone={selected.estimatedExposureIDR > 0 ? "warning" : "good"} /><Metric icon={Zap} label="Breaker trips" value="0" tone="good" /><Metric icon={ShieldCheck} label="Control continuity" value="Maintained" tone="good" /></div>
              <div className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-[10px] leading-relaxed text-muted-foreground">Exposure is an operational estimate based on affected asset criticality and recovery time. It is not a verified production-loss or insurance value.</div>
              <button type="button" onClick={() => setMessage("Equipment response package attached to investigation AG-INV-1042.")} className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-border bg-surface text-[10.5px] font-medium hover:bg-surface-2"><FileCheck2 className="size-3.5" />Attach response evidence</button>
            </Panel>
          </div>
        )}

        {activeTab === "Investigation" && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <Panel title="Investigation Hypotheses" className="xl:col-span-7">
              <div className="space-y-2">
                {[
                  { rank: 1, title: "Local high-current disturbance on MCC-AUX-07", confidence: 86, evidence: "First trigger and deepest residual occur at F-07/downstream meters; adjacent feeders see shallow propagation." },
                  { rank: 2, title: "Large motor or contactor-group restart", confidence: 67, evidence: "Contactor dropout and automatic restart coincide with the recovery window." },
                  { rank: 3, title: "Utility-origin upstream sag", confidence: 18, evidence: "Incomer residual remains above 91% and starts after the F-07 trigger, weakening an upstream-origin hypothesis." },
                ].map((hypothesis) => (
                  <div key={hypothesis.rank} className={`rounded-md border p-3 ${hypothesis.rank === 1 ? "border-primary/30 bg-primary/8" : "border-border bg-surface-2"}`}>
                    <div className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded-full border border-border bg-surface text-[9px] tabular">{hypothesis.rank}</span><span className="flex-1 text-[10.5px] font-semibold">{hypothesis.title}</span><span className="text-[10px] tabular text-primary">{hypothesis.confidence}%</span></div>
                    <p className="mt-2 pl-7 text-[9.5px] leading-relaxed text-muted-foreground">{hypothesis.evidence}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Engineering Review Gate" className="xl:col-span-5">
              <div className="space-y-2">
                {[
                  ["Source waveform captured", true, `${selected.waveformSampleRateHz.toLocaleString("en-US")} Hz sample rate`],
                  ["Correlated meters synchronized", selected.correlatedMeters.length >= 3, `${selected.correlatedMeters.length} meters · max ±2.3 ms`],
                  ["Equipment response linked", selected.equipmentResponses.length > 0, `${selected.equipmentResponses.length} affected assets`],
                  ["Electrical path reviewed", true, `${selected.feederId} selected in one-line context`],
                  ["Field inspection completed", selected.status === "Confirmed" || selected.status === "Closed", selected.status === "Confirmed" || selected.status === "Closed" ? "Inspection evidence accepted" : "Pending physical inspection"],
                ].map(([label, passed, detail]) => (
                  <div key={String(label)} className="flex items-start gap-2 text-[10px]"><span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${passed ? "border-green/30 bg-green/10 text-green" : "border-amber/30 bg-amber/10 text-amber"}`}>{passed ? "✓" : "!"}</span><div><div className="font-medium">{label}</div><div className="text-[9px] text-muted-foreground">{detail}</div></div></div>
                ))}
              </div>
              <button type="button" onClick={advanceStatus} disabled={selected.status === "Closed"} className="mt-4 h-9 w-full rounded-md bg-primary text-[10.5px] font-medium text-primary-foreground disabled:opacity-40">Advance investigation status</button>
            </Panel>

            <Panel title="Recommended Engineering Actions" className="xl:col-span-12">
              <div className="grid gap-2 md:grid-cols-3">
                <ActionCard icon={Wrench} title="Inspect MCC-AUX-07 contactor group" body="Review coil voltage, dropout records, mechanical condition, and restart-sequence logs before changing settings." onClick={() => setMessage("Inspection draft prepared for MCC-AUX-07. No work order was issued.")} />
                <ActionCard icon={Waves} title="Repeat event correlation" body="Capture high-resolution current and voltage during a controlled auxiliary restart to validate the origin hypothesis." onClick={() => setMessage("Controlled measurement plan added to AG-INV-1042.")} />
                <ActionCard icon={Cable} title="Review ride-through coordination" body="Compare VFD, PLC power supply, contactor, and UPS ride-through limits against the measured residual and duration." onClick={() => setMessage("Ride-through coordination review added to AG-INV-1042.")} />
              </div>
              <div className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-[9.5px] text-muted-foreground">All controls are demonstration workflow actions. No protection setting, switching command, or field-device write is executed.</div>
            </Panel>
          </div>
        )}

        <Panel title="30-Day Event Envelope" className="h-[250px]" actions={<span className="text-[9.5px] text-muted-foreground">duration vs residual/maximum voltage</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scatter} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" />
              <ReferenceLine y={90} stroke="var(--color-amber)" strokeDasharray="4 4" />
              <ReferenceLine y={110} stroke="var(--color-amber)" strokeDasharray="4 4" />
              <XAxis dataKey="durationSeconds" {...chartAxis} tickFormatter={(value: number) => `${value}s`} />
              <YAxis dataKey="magnitudePct" {...chartAxis} width={42} domain={[0, 135]} tickFormatter={(value: number) => `${value}%`} />
              <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [name === "magnitudePct" ? `${value}%` : value, name]} />
              <Line type="monotone" dataKey="magnitudePct" name="Event magnitude" stroke="var(--color-cyan)" strokeWidth={1.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-0.5 text-[10px] font-medium leading-relaxed tabular">{value}</div></div>;
}

function Metric({ icon: Icon, label, value, tone = "neutral" }: { icon: typeof Activity; label: string; value: string; tone?: "neutral" | "good" | "warning" }) {
  const toneClass = tone === "good" ? "text-green" : tone === "warning" ? "text-amber" : "text-foreground";
  return <div className="rounded-md border border-border bg-surface-2 p-2.5"><div className="flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground"><Icon className={`size-3.5 ${toneClass}`} />{label}</div><div className={`mt-1 text-[11px] font-semibold tabular ${toneClass}`}>{value}</div></div>;
}

function ActionCard({ icon: Icon, title, body, onClick }: { icon: typeof Activity; title: string; body: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-md border border-border bg-surface-2 p-3 text-left hover:border-primary/35 hover:bg-primary/5"><div className="flex items-center gap-2 text-[10.5px] font-semibold"><Icon className="size-4 text-primary" />{title}</div><p className="mt-2 text-[9.5px] leading-relaxed text-muted-foreground">{body}</p></button>;
}
