import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  Bell,
  Check,
  Crosshair,
  FileCheck2,
  GitBranch,
  History,
  ShieldAlert,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { useDemoSimulation } from "@/lib/demo-simulation";
import {
  getIncidentDocumentControl,
  readIncidentContext,
  storeIncidentContext,
} from "@/lib/incident-context";
import {
  getIncidentAlarms,
  getIncidentTimeline,
  getIticScatter,
  getPowerQualityEvents,
  groupIncidentAlarms,
  type EventSeverity,
  type IncidentAlarm,
  type InvestigationStatus,
  type PowerQualityEvent,
} from "@/lib/power-quality";

export const Route = createFileRoute("/alarms")({
  component: AlarmsPage,
  head: () => ({
    meta: [
      { title: "Alarms & Incidents — ArGrid" },
      { name: "description", content: "Grouped incidents, alarm chronology, acknowledgement, document control, and correlated power-quality investigation." },
      { property: "og:title", content: "ArGrid Alarms & Incidents" },
      { property: "og:description", content: "Operational incident console with power-quality correlation and engineering governance." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 9, tickLine: false, axisLine: false };

function severityClass(severity: EventSeverity) {
  if (severity === "Critical") return "border-red/30 bg-red/10 text-red";
  if (severity === "Warning") return "border-amber/30 bg-amber/10 text-amber";
  return "border-primary/30 bg-primary/10 text-primary";
}

function AlarmsPage() {
  const { scenarioId, setScenarioId, scenario } = useDemoSimulation();
  const events = useMemo(() => getPowerQualityEvents(scenarioId), [scenarioId]);
  const baseAlarms = useMemo(() => getIncidentAlarms(), []);
  const [ackOverrides, setAckOverrides] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-alarm-ack-overrides") ?? "{}") as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const [selectedIncidentId, setSelectedIncidentId] = useState(() => readIncidentContext().incidentGroupId ?? "INC-PQ-1042");
  const [message, setMessage] = useState("");

  useEffect(() => {
    window.localStorage.setItem("argrid-alarm-ack-overrides", JSON.stringify(ackOverrides));
  }, [ackOverrides]);

  const investigationStatusOverrides = (() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-pq-status-overrides") ?? "{}") as Record<string, InvestigationStatus>;
    } catch {
      return {};
    }
  })();
  const resolvedStatus = (event: PowerQualityEvent) => investigationStatusOverrides[event.id] ?? event.status;
  const alarms = baseAlarms.map((alarm) => ({ ...alarm, acknowledged: ackOverrides[alarm.id] ?? alarm.acknowledged }));
  const groups = groupIncidentAlarms(alarms);
  const selectedGroup = groups.find((group) => group.incidentGroupId === selectedIncidentId) ?? groups[0];
  const selectedEvent = events.find((event) => event.incidentGroupId === selectedGroup.incidentGroupId) ?? null;
  const selectedStatus = selectedEvent ? resolvedStatus(selectedEvent) : null;
  const selectedAlarms = alarms.filter((alarm) => alarm.incidentGroupId === selectedGroup.incidentGroupId);
  const timeline = selectedEvent ? getIncidentTimeline(selectedEvent) : [];
  const scatter = getIticScatter(scenarioId);
  const documentControl = selectedEvent && selectedStatus ? getIncidentDocumentControl(selectedEvent, selectedStatus) : null;

  useEffect(() => {
    storeIncidentContext({
      incidentGroupId: selectedGroup.incidentGroupId,
      ...(selectedEvent ? { eventId: selectedEvent.id, feederId: selectedEvent.feederId } : {}),
    });
  }, [selectedEvent, selectedGroup.incidentGroupId]);

  const criticalIncidents = groups.filter((group) => group.highestSeverity === "Critical").length;
  const unacknowledgedGroups = groups.filter((group) => group.unacknowledged > 0).length;
  const activeInvestigations = events.filter((event) => {
    const status = resolvedStatus(event);
    return status === "Investigating" || status === "Confirmed";
  }).length;

  const acknowledgeAlarm = (id: string) => {
    setAckOverrides((current) => ({ ...current, [id]: true }));
    setMessage(`${id} acknowledged in the browser demo.`);
  };

  const acknowledgeIncident = () => {
    const updates = selectedAlarms.reduce<Record<string, boolean>>((current, alarm) => ({ ...current, [alarm.id]: true }), {});
    setAckOverrides((current) => ({ ...current, ...updates }));
    setMessage(`${selectedGroup.incidentGroupId} acknowledged as a grouped incident.`);
  };

  const activateSagIncident = () => {
    setScenarioId("voltage-sag");
    setSelectedIncidentId("INC-PQ-1042");
    storeIncidentContext({ eventId: "PQ-260715-143217", feederId: "F-07", incidentGroupId: "INC-PQ-1042" });
    setMessage("Voltage-sag incident selected and shared engineering context restored.");
  };

  const preserveSelectedContext = () => {
    if (!selectedEvent) return;
    storeIncidentContext({ eventId: selectedEvent.id, feederId: selectedEvent.feederId, incidentGroupId: selectedEvent.incidentGroupId });
  };

  return (
    <AppShell
      title="Alarms & Incidents"
      subtitle="Grouped operational incidents, acknowledgement, chronology, document control, and engineering investigation"
      toolbar={
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground"><Bell className="size-3.5 text-primary" />{groups.length} grouped incidents</div>
          <button type="button" onClick={activateSagIncident} className="h-8 rounded-md border border-primary/30 bg-primary/10 px-2.5 text-[10px] font-medium text-primary">Replay voltage sag</button>
        </div>
      }
    >
      <div className="space-y-3">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile label="Critical Incidents" value={String(criticalIncidents)} hint="grouped by common cause" tone={criticalIncidents > 0 ? "critical" : "good"} />
          <KpiTile label="Unacknowledged Groups" value={String(unacknowledgedGroups)} hint="not raw alarm count" tone={unacknowledgedGroups > 0 ? "warning" : "good"} />
          <KpiTile label="Active Investigations" value={String(activeInvestigations)} hint="engineering owner assigned" tone={activeInvestigations > 0 ? "warning" : "good"} />
          <KpiTile label="Report Revision" value={documentControl?.revision ?? "—"} hint={documentControl?.documentStatus ?? "no formal event package"} tone={documentControl?.reviewState === "Completed" ? "good" : "warning"} />
        </section>

        <section className="rounded-lg border border-red/30 bg-red/8 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-red/12 text-red"><ShieldAlert className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Priority incident</span><span className="rounded border border-red/30 bg-surface px-1.5 py-0.5 text-[9.5px] text-red">{selectedGroup.incidentGroupId}</span>{documentControl && <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-[9.5px] text-muted-foreground">{documentControl.documentNumber} · {documentControl.revision}</span>}</div>
              <p className="mt-1 text-[12px] leading-relaxed">{selectedEvent ? <><strong>{selectedEvent.minimumVoltagePct.toFixed(1)}% Un voltage sag for {selectedEvent.durationMs} ms on {selectedEvent.feederId}.</strong> Three alarms are grouped into one event chronology; probable origin is {selectedEvent.probableOrigin.toLowerCase()}.</> : <><strong>{selectedGroup.summary}.</strong> Review the member alarms and assign an accountable owner.</>}</p>
            </div>
            {selectedEvent && <Link to="/alarms/power-quality" onClick={preserveSelectedContext} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[10.5px] font-medium text-primary-foreground">Open PQ investigation <Waves className="size-3.5" /></Link>}
          </div>
        </section>

        {message && <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/8 px-3 py-2 text-[10px]"><History className="size-3.5 text-primary" />{message}</div>}

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel title="Incident Queue" className="xl:col-span-5" actions={<span className="text-[9.5px] text-muted-foreground">alarm flood reduced by grouping</span>}>
            <div className="space-y-2">
              {groups.map((group) => (
                <button key={group.incidentGroupId} type="button" onClick={() => { setSelectedIncidentId(group.incidentGroupId); setMessage(""); }} className={`w-full rounded-md border p-3 text-left ${selectedGroup.incidentGroupId === group.incidentGroupId ? "border-primary bg-primary/8" : "border-border bg-surface-2 hover:border-border-strong"}`}>
                  <div className="flex items-center justify-between gap-2"><span className="text-[9.5px] tabular text-muted-foreground">{group.incidentGroupId} · {group.firstTimestamp}</span><span className={`rounded border px-1.5 py-0.5 text-[9.5px] ${severityClass(group.highestSeverity)}`}>{group.highestSeverity}</span></div>
                  <div className="mt-1.5 text-[10.5px] font-semibold">{group.summary}</div>
                  <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted-foreground"><span>{group.primarySource} · {group.alarms.length} member alarms</span><span className={group.unacknowledged > 0 ? "text-amber" : "text-green"}>{group.unacknowledged > 0 ? `${group.unacknowledged} unacknowledged` : "acknowledged"}</span></div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title={`${selectedGroup.incidentGroupId} · Incident Context`} className="xl:col-span-7" actions={<span className={`rounded border px-1.5 py-0.5 text-[9.5px] ${severityClass(selectedGroup.highestSeverity)}`}>{selectedGroup.highestSeverity}</span>}>
            {selectedEvent ? (
              <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                <div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4"><Info label="Event" value={selectedEvent.id} /><Info label="Source" value={selectedEvent.sourceMeter} /><Info label="Feeder" value={`${selectedEvent.feederId} · ${selectedEvent.feederName}`} /><Info label="Status" value={selectedStatus ?? selectedEvent.status} /></div>
                  <div className="mt-3 rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2 text-[10.5px] font-semibold"><Crosshair className="size-3.5 text-primary" />{selectedEvent.probableOrigin}</div><p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">{selectedEvent.operationalImpact} Correlation confidence is {selectedEvent.confidencePct}%.</p></div>
                  <div className="mt-3 grid grid-cols-2 gap-2"><Info label="Minimum RMS" value={`${selectedEvent.minimumVoltagePct.toFixed(1)}% Un`} /><Info label="Duration" value={`${selectedEvent.durationMs} ms`} /><Info label="Affected assets" value={String(selectedEvent.affectedAssets.length)} /><Info label="Investigation owner" value={selectedEvent.investigationOwner} /></div>
                  {documentControl && <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-border bg-surface-2 p-3"><Info label="Document" value={documentControl.documentNumber} /><Info label="Revision / state" value={`${documentControl.revision} · ${documentControl.documentStatus}`} /><Info label="Technical review" value={`${documentControl.reviewState} · ${documentControl.reviewedBy}`} /><Info label="Final approval" value={`${documentControl.approvalState} · ${documentControl.approvedBy}`} /></div>}
                </div>
                <div className="rounded-md border border-border bg-background/30 p-2">
                  <svg viewBox="0 0 240 180" className="h-[175px] w-full" role="img" aria-label="Incident mini one-line">
                    <rect x="72" y="8" width="96" height="28" rx="3" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" /><text x="120" y="19" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="7">MSB-MAIN</text><text x="120" y="30" textAnchor="middle" fill="var(--color-foreground)" fontSize="8">91.4% Un</text>
                    <line x1="120" y1="36" x2="120" y2="76" stroke="var(--color-cyan)" strokeWidth="2" /><line x1="30" y1="76" x2="210" y2="76" stroke="var(--color-cyan)" strokeWidth="3" />
                    {[54, 98, 142, 186].map((x, index) => <g key={x}><line x1={x} y1="76" x2={x} y2="112" stroke={index === 3 ? "var(--color-red)" : "var(--color-cyan)"} strokeWidth={index === 3 ? 3 : 1.5} /><rect x={x - 18} y="112" width="36" height="34" rx="3" fill="var(--color-surface-2)" stroke={index === 3 ? "var(--color-red)" : "var(--color-border-strong)"} /><text x={x} y="126" textAnchor="middle" fill="var(--color-foreground)" fontSize="7">F-0{index + 4}</text><text x={x} y="138" textAnchor="middle" fill={index === 3 ? "var(--color-red)" : "var(--color-green)"} fontSize="6.5">{index === 3 ? "82%" : "OK"}</text></g>)}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface-2 p-4 text-[10px] text-muted-foreground">This operational incident has no high-resolution power-quality record. Review member alarms, process context, and assigned owner.</div>
            )}
            <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={acknowledgeIncident} disabled={selectedGroup.unacknowledged === 0} className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[10px] font-medium disabled:opacity-40"><Check className="size-3.5 text-green" />Acknowledge group</button>{selectedEvent && <><Link to="/electrical" onClick={preserveSelectedContext} className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[10px] font-medium hover:bg-surface-2"><GitBranch className="size-3.5" />Electrical context</Link><Link to="/alarms/power-quality" onClick={preserveSelectedContext} className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[10px] font-medium hover:bg-surface-2"><FileCheck2 className="size-3.5" />Report & evidence</Link></>}</div>
          </Panel>

          <Panel title="Member Alarm Chronology" className="xl:col-span-7" actions={<span className="text-[9.5px] text-muted-foreground">one incident · multiple device conditions</span>}>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-[10.5px]"><thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.11em] text-muted-foreground"><th className="py-2 font-normal">Severity</th><th className="py-2 font-normal">Time</th><th className="py-2 font-normal">Source</th><th className="py-2 font-normal">Condition</th><th className="py-2 font-normal">Acknowledgement</th></tr></thead><tbody className="divide-y divide-border">{selectedAlarms.map((alarm: IncidentAlarm) => <tr key={alarm.id} className="hover:bg-surface-2/60"><td className="py-2.5"><span className={`rounded border px-1.5 py-0.5 text-[9.5px] ${severityClass(alarm.severity)}`}>{alarm.severity}</span></td><td className="py-2.5 tabular text-muted-foreground">{alarm.timestamp}</td><td className="py-2.5"><div className="font-semibold">{alarm.source}</div><div className="text-[9.5px] text-muted-foreground tabular">{alarm.id}</div></td><td className="py-2.5"><div>{alarm.message}</div><div className="text-[9.5px] text-muted-foreground">{alarm.condition}</div></td><td className="py-2.5">{alarm.acknowledged ? <span className="flex items-center gap-1 text-[9.5px] text-green"><Check className="size-3" />Acknowledged</span> : <button type="button" onClick={() => acknowledgeAlarm(alarm.id)} className="h-7 rounded-md border border-amber/30 bg-amber/10 px-2 text-[9.5px] text-amber">Acknowledge</button>}</td></tr>)}</tbody></table></div>
          </Panel>

          <Panel title="Power Quality Event Envelope" className="h-[390px] xl:col-span-5" actions={<span className="text-[9.5px] text-muted-foreground">30-day retained events</span>}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -4, bottom: 12 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" />
                <ReferenceLine y={90} stroke="var(--color-amber)" strokeDasharray="4 4" />
                <ReferenceLine y={110} stroke="var(--color-amber)" strokeDasharray="4 4" />
                <XAxis type="number" dataKey="durationSeconds" name="Duration" scale="log" domain={[0.001, 1]} {...chartAxis} tickFormatter={(value: number) => value < 1 ? `${Math.round(value * 1000)}ms` : `${value}s`} />
                <YAxis type="number" dataKey="magnitudePct" name="Magnitude" domain={[0, 135]} {...chartAxis} tickFormatter={(value: number) => `${value}%`} />
                <ZAxis range={[52, 52]} />
                <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 10 }} formatter={(value: number | string, name: string) => [name === "Magnitude" ? `${value}%` : `${value}s`, name]} />
                <Scatter data={scatter.filter((event) => event.severity === "Critical")} fill="var(--color-red)" />
                <Scatter data={scatter.filter((event) => event.severity === "Warning")} fill="var(--color-amber)" />
                <Scatter data={scatter.filter((event) => event.severity === "Info")} fill="var(--color-cyan)" />
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Priority Incident Timeline" className="xl:col-span-12" actions={<span className="text-[9.5px] text-muted-foreground">{scenario.name}</span>}>
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
              {(timeline.length > 0 ? timeline : selectedAlarms.map((alarm, index) => ({ timestamp: alarm.timestamp, title: alarm.message, detail: alarm.condition, tone: index === 0 ? "warning" as const : "normal" as const }))).map((item) => (
                <div key={`${item.timestamp}-${item.title}`} className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${item.tone === "critical" ? "bg-red" : item.tone === "warning" ? "bg-amber" : item.tone === "good" ? "bg-green" : "bg-muted-foreground"}`} /><span className="text-[9.5px] tabular text-muted-foreground">{item.timestamp}</span></div><div className="mt-2 text-[10px] font-semibold">{item.title}</div><p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">{item.detail}</p></div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[9.5px] text-muted-foreground"><span>Alarm acknowledgement confirms operator awareness; it does not resolve the underlying condition, approve the report, or close an investigation.</span><Link to="/alarms/power-quality" onClick={preserveSelectedContext} className="text-primary hover:underline">Open full power-quality workspace →</Link></div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-0.5 text-[10px] font-medium leading-relaxed tabular">{value}</div></div>;
}
