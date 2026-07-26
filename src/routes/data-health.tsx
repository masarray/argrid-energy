import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Cable,
  CheckCircle2,
  Clock3,
  Database,
  FileWarning,
  Gauge,
  GitBranch,
  History,
  RadioTower,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { fmtIDR } from "@/lib/argrid-data";
import { useDemoSimulation } from "@/lib/demo-simulation";
import {
  buildDataIssues,
  buildMeterHealth,
  getDataHealthSummary,
  getFreshnessDistribution,
  getMissingDataCalendar,
  type DataIssueRecord,
  type MeterHealthRecord,
  type QualityState,
} from "@/lib/portfolio-health";

export const Route = createFileRoute("/data-health")({
  component: DataHealth,
  head: () => ({
    meta: [
      { title: "Data Health — ArGrid" },
      {
        name: "description",
        content: "Meter quality, completeness, freshness, time synchronization, issue workflow, and calculation provenance.",
      },
    ],
  }),
});

const tabs = ["Health Matrix", "Issue Workflow", "Provenance"] as const;
type Tab = (typeof tabs)[number];

const chartAxis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    color: "var(--color-foreground)",
    fontSize: 10,
  },
};

function qualityClass(quality: QualityState) {
  if (quality === "GOOD") return "border-green/30 bg-green/8 text-green";
  if (quality === "STALE" || quality === "BAD") return "border-red/30 bg-red/8 text-red";
  if (quality === "ESTIMATED" || quality === "SUBSTITUTED" || quality === "UNCERTAIN") return "border-amber/30 bg-amber/8 text-amber";
  return "border-violet/30 bg-violet/8 text-violet";
}

function severityClass(severity: DataIssueRecord["severity"]) {
  if (severity === "Critical") return "border-red/30 bg-red/8 text-red";
  if (severity === "Warning") return "border-amber/30 bg-amber/8 text-amber";
  return "border-primary/30 bg-primary/8 text-primary";
}

function freshnessLabel(seconds: number) {
  if (seconds <= 5) return `${seconds}s · live`;
  if (seconds <= 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)} min · stale`;
}

function DataHealth() {
  const { scenarioId, scenario, telemetry } = useDemoSimulation();
  const [activeTab, setActiveTab] = useState<Tab>("Health Matrix");
  const [selectedMeterId, setSelectedMeterId] = useState("PM-TNT-03");
  const [selectedIssueId, setSelectedIssueId] = useState("DQ-3061");
  const [message, setMessage] = useState("");
  const [issueOverrides, setIssueOverrides] = useState<Record<string, DataIssueRecord["status"]>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-data-issue-overrides") ?? "{}") as Record<string, DataIssueRecord["status"]>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    window.localStorage.setItem("argrid-data-issue-overrides", JSON.stringify(issueOverrides));
  }, [issueOverrides]);

  const meters = useMemo(() => buildMeterHealth(scenarioId), [scenarioId]);
  const issues = useMemo(
    () => buildDataIssues(scenarioId).map((issue) => ({ ...issue, status: issueOverrides[issue.id] ?? issue.status })),
    [issueOverrides, scenarioId],
  );
  const summary = useMemo(() => getDataHealthSummary(meters, issues), [issues, meters]);
  const freshness = useMemo(() => getFreshnessDistribution(meters), [meters]);
  const calendar = useMemo(() => getMissingDataCalendar(), []);
  const selectedMeter = meters.find((meter) => meter.id === selectedMeterId) ?? meters[0];
  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId) ?? issues[0];
  const relatedIssues = issues.filter((issue) => issue.meterId === selectedMeter.id);

  const changeIssueStatus = (status: DataIssueRecord["status"]) => {
    setIssueOverrides((current) => ({ ...current, [selectedIssue.id]: status }));
    setMessage(`${selectedIssue.id} moved to ${status}. Demo history is stored locally; production requires reason code and immutable audit history.`);
  };

  const cellClass = (value: number) => {
    if (value >= 3) return "bg-red text-white";
    if (value === 2) return "bg-amber/70 text-foreground";
    if (value === 1) return "bg-amber/20 text-amber";
    return "bg-green/8 text-green";
  };

  return (
    <AppShell
      title="Data Health & Provenance"
      subtitle="Trusted measurements, issue workflow, meter assurance, and calculation lineage"
      toolbar={
        <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground" title={scenario.description}>
          <ShieldCheck className={`size-3.5 ${telemetry.meterQuality === "GOOD" ? "text-green" : "text-amber"}`} /> {telemetry.meterQuality} · {telemetry.intervalCompletenessPct.toFixed(1)}% live completeness
        </div>
      }
    >
      <div className="space-y-3">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiTile label="Portfolio Completeness" value={summary.completeness.toFixed(1)} unit="%" hint="meter average" tone={summary.completeness >= 97 ? "good" : "warning"} />
          <KpiTile label="Trusted Meters" value={`${summary.trusted} / ${meters.length}`} hint="quality state GOOD" tone={summary.trusted === meters.length ? "good" : "warning"} />
          <KpiTile label="Estimated Coverage" value={summary.estimated.toFixed(1)} unit="%" hint="visible, not silently trusted" tone={summary.estimated > 2 ? "warning" : "neutral"} />
          <KpiTile label="Stale Sources" value={String(summary.stale)} hint="freshness > 5 min" tone={summary.stale > 0 ? "critical" : "good"} />
          <KpiTile label="Blocking Issues" value={String(summary.blocking)} hint="billing or decision gate" tone={summary.blocking > 0 ? "critical" : "good"} />
          <KpiTile label="Billing Exposure" value={fmtIDR(summary.billingExposure)} hint="affected invoice value" tone={summary.billingExposure > 0 ? "warning" : "neutral"} />
        </section>

        <section className={`rounded-lg border px-4 py-3 ${summary.blocking > 0 ? "border-amber/35 bg-amber/8" : "border-green/30 bg-green/8"}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${summary.blocking > 0 ? "bg-amber/12 text-amber" : "bg-green/12 text-green"}`}>
              {summary.blocking > 0 ? <ShieldAlert className="size-4" /> : <BadgeCheck className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Decision confidence</span><span className={`rounded border px-1.5 py-0.5 text-[9px] ${summary.blocking > 0 ? "border-amber/30 bg-surface text-amber" : "border-green/30 bg-surface text-green"}`}>{summary.blocking > 0 ? "conditional" : "trusted"}</span></div>
              <p className="mt-1 text-[12px] leading-relaxed">
                PM-TNT-03 has {selectedMeter.id === "PM-TNT-03" ? selectedMeter.completenessPct.toFixed(1) : meters.find((meter) => meter.id === "PM-TNT-03")?.completenessPct.toFixed(1)}% completeness and affects {fmtIDR(meters.find((meter) => meter.id === "PM-TNT-03")?.billingImpactIDR ?? 0)} of tenant billing. Estimated values remain visible but are not counted as trusted until reviewed.
              </p>
            </div>
            <button type="button" onClick={() => { setSelectedMeterId("PM-TNT-03"); setSelectedIssueId("DQ-3061"); setActiveTab("Issue Workflow"); }} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[10.5px] font-medium text-primary-foreground">Investigate blocking issue <ArrowRight className="size-3.5" /></button>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => { setActiveTab(tab); setMessage(""); }} className={`h-8 rounded-md px-3 text-[10.5px] font-medium ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}>{tab}</button>
          ))}
          <span className="ml-auto hidden pr-2 text-[9px] text-muted-foreground lg:inline">Quality state propagates into billing, M&V, opportunity, demand, and portfolio confidence.</span>
        </div>

        {message && <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/7 px-3 py-2 text-[10px]"><History className="size-3.5 text-primary" />{message}</div>}

        {activeTab === "Health Matrix" && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <Panel title="Meter Health Matrix" className="xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">quality · completeness · freshness · time sync</span>}>
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Meter health matrix">
                <table className="w-full min-w-[980px] text-[10.5px]">
                  <thead><tr className="border-b border-border text-left text-[9px] uppercase tracking-[0.11em] text-muted-foreground"><th className="py-2 font-normal">Meter / source</th><th className="py-2 font-normal">Role</th><th className="py-2 font-normal">Quality</th><th className="py-2 font-normal text-right">Completeness</th><th className="py-2 font-normal text-right">Estimated</th><th className="py-2 font-normal text-right">Freshness</th><th className="py-2 font-normal text-right">Time drift</th><th className="py-2 font-normal">Owner</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {meters.map((meter) => (
                      <tr key={meter.id} onClick={() => setSelectedMeterId(meter.id)} className={`cursor-pointer hover:bg-surface-2/70 ${selectedMeter.id === meter.id ? "bg-primary/5" : ""}`}>
                        <td className="py-2.5"><div className="font-semibold">{meter.name}</div><div className="text-[9px] text-muted-foreground tabular">{meter.id} · {meter.site}</div></td>
                        <td className="py-2.5">{meter.role}</td>
                        <td className="py-2.5"><span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] ${qualityClass(meter.quality)}`}>{meter.quality}</span></td>
                        <td className={`py-2.5 text-right font-medium tabular ${meter.completenessPct < 95 ? "text-red" : meter.completenessPct < 98 ? "text-amber" : "text-green"}`}>{meter.completenessPct.toFixed(1)}%</td>
                        <td className="py-2.5 text-right tabular">{meter.estimatedPct.toFixed(1)}%</td>
                        <td className={`py-2.5 text-right tabular ${meter.freshnessSeconds > 300 ? "text-red" : ""}`}>{freshnessLabel(meter.freshnessSeconds)}</td>
                        <td className={`py-2.5 text-right tabular ${Math.abs(meter.timeDriftSeconds) > 5 ? "text-amber" : ""}`}>{meter.timeDriftSeconds.toFixed(1)} s</td>
                        <td className="py-2.5 text-muted-foreground">{meter.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title={`${selectedMeter.id} · Trust Profile`} className="xl:col-span-4" actions={<span className={`rounded border px-1.5 py-0.5 text-[9px] ${qualityClass(selectedMeter.quality)}`}>{selectedMeter.quality}</span>}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2"><Metric icon={Database} label="Completeness" value={`${selectedMeter.completenessPct.toFixed(1)}%`} tone={selectedMeter.completenessPct >= 97 ? "good" : "warning"} /><Metric icon={RefreshCw} label="Estimated" value={`${selectedMeter.estimatedPct.toFixed(1)}%`} tone={selectedMeter.estimatedPct > 2 ? "warning" : "neutral"} /><Metric icon={Clock3} label="Freshness" value={freshnessLabel(selectedMeter.freshnessSeconds)} tone={selectedMeter.freshnessSeconds > 300 ? "critical" : "good"} /><Metric icon={Gauge} label="Time drift" value={`${selectedMeter.timeDriftSeconds.toFixed(1)} s`} tone={selectedMeter.timeDriftSeconds > 5 ? "warning" : "good"} /></div>
                <Info label="Source path" value={selectedMeter.sourcePath} />
                <div className="grid grid-cols-2 gap-3"><Info label="Calibration due" value={selectedMeter.calibrationDue} /><Info label="Last trusted interval" value={selectedMeter.lastInterval} /></div>
                <div className="rounded-md border border-border bg-surface-2 p-3"><div className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Affected calculations</div><div className="mt-2 flex flex-wrap gap-1.5">{selectedMeter.affectedCalculations.map((calculation) => <span key={calculation} className="rounded border border-border bg-surface px-1.5 py-1 text-[9px]">{calculation}</span>)}</div></div>
                {selectedMeter.billingImpactIDR > 0 && <Link to="/billing" className="flex items-center justify-between rounded-md border border-amber/30 bg-amber/8 px-3 py-2 text-[10px]"><span><span className="block font-semibold text-amber">Billing impact</span><span className="text-muted-foreground">{fmtIDR(selectedMeter.billingImpactIDR)} affected</span></span><ArrowRight className="size-3.5 text-amber" /></Link>}
                <button type="button" onClick={() => { const issue = relatedIssues[0]; if (issue) { setSelectedIssueId(issue.id); setActiveTab("Issue Workflow"); } }} disabled={relatedIssues.length === 0} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-border bg-surface text-[10px] font-medium hover:bg-surface-2 disabled:opacity-40"><FileWarning className="size-3.5" />Open related issue</button>
              </div>
            </Panel>

            <Panel title="Missing & Estimated Data Calendar" className="xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">June · interval exception density</span>}>
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Missing and estimated data calendar">
                <div className="min-w-[790px]">
                  <div className="grid grid-cols-[78px_repeat(30,minmax(14px,1fr))] gap-1 text-[8px] text-muted-foreground"><span />{Array.from({ length: 30 }, (_, day) => <span key={day} className="text-center tabular">{day + 1}</span>)}</div>
                  <div className="mt-1 space-y-1">{calendar.map((row) => <div key={row.meter} className="grid grid-cols-[78px_repeat(30,minmax(14px,1fr))] gap-1"><span className="pr-2 text-right text-[9px] font-medium tabular">{row.meter}</span>{row.days.map((value, day) => <span key={`${row.meter}-${day}`} title={`${row.meter} · day ${day + 1} · exception level ${value}`} className={`h-4 rounded-sm border border-border/50 ${cellClass(value)}`} />)}</div>)}</div>
                  <div className="mt-3 flex items-center gap-3 text-[9px] text-muted-foreground"><span className="flex items-center gap-1"><i className="size-2.5 rounded-sm bg-green/8 border border-border" />Trusted</span><span className="flex items-center gap-1"><i className="size-2.5 rounded-sm bg-amber/20" />Minor</span><span className="flex items-center gap-1"><i className="size-2.5 rounded-sm bg-amber/70" />Substituted</span><span className="flex items-center gap-1"><i className="size-2.5 rounded-sm bg-red" />Missing/blocking</span></div>
                </div>
              </div>
            </Panel>

            <Panel title="Source Freshness Distribution" className="h-[300px] xl:col-span-4" actions={<span className="text-[9.5px] text-muted-foreground">latest valid sample</span>}>
              <ResponsiveContainer width="100%" height="100%"><BarChart data={freshness} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="bucket" {...chartAxis} /><YAxis {...chartAxis} allowDecimals={false} width={28} /><Tooltip {...tooltipStyle} formatter={(value: number | string) => [`${Number(value)} meters`, "Sources"]} /><Bar dataKey="meters" fill="var(--color-primary)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
            </Panel>
          </div>
        )}

        {activeTab === "Issue Workflow" && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_390px]">
            <Panel title="Data Quality Issue Register" actions={<span className="text-[9.5px] text-muted-foreground">explicit taxonomy · consequence · accountable action</span>}>
              <div className="space-y-2">
                {issues.map((issue) => (
                  <button key={issue.id} type="button" onClick={() => { setSelectedIssueId(issue.id); setSelectedMeterId(issue.meterId); setMessage(""); }} className={`w-full rounded-md border p-3 text-left ${selectedIssue.id === issue.id ? "border-primary bg-primary/6" : "border-border bg-surface hover:bg-surface-2"}`}>
                    <div className="flex flex-wrap items-start gap-2"><span className={`rounded border px-1.5 py-0.5 text-[9px] ${severityClass(issue.severity)}`}>{issue.severity}</span><span className="text-[9.5px] font-semibold tabular">{issue.id}</span><span className="text-[9.5px] text-muted-foreground">{issue.type}</span><span className="ml-auto rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[9px]">{issue.status}</span></div>
                    <div className="mt-2 text-[11px] font-semibold">{issue.meterId} · {issue.site}</div>
                    <p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">{issue.description}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-muted-foreground"><span>Opened {issue.openedAt}</span><span>{issue.duration}</span><span>{issue.intervals} intervals</span>{issue.blocking && <span className="font-semibold text-red">BLOCKING</span>}</div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title={`${selectedIssue.id} · Issue Detail`} actions={<span className={`rounded border px-1.5 py-0.5 text-[9px] ${severityClass(selectedIssue.severity)}`}>{selectedIssue.severity}</span>}>
              <div className="space-y-4 text-[10.5px]">
                <div><div className="text-[9px] uppercase tracking-[0.11em] text-muted-foreground">Condition</div><p className="mt-1 leading-relaxed">{selectedIssue.description}</p></div>
                <div className="rounded-md border border-red/20 bg-red/5 p-3"><div className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-3.5 text-red" />Decision consequence</div><p className="mt-1.5 leading-relaxed text-muted-foreground">{selectedIssue.consequence}</p></div>
                <div><div className="text-[9px] uppercase tracking-[0.11em] text-muted-foreground">Recommended action</div><p className="mt-1 leading-relaxed text-muted-foreground">{selectedIssue.recommendedAction}</p></div>
                <div className="grid grid-cols-2 gap-3"><Info label="Meter" value={selectedIssue.meterId} /><Info label="Status" value={selectedIssue.status} /><Info label="Duration" value={selectedIssue.duration} /><Info label="Intervals" value={String(selectedIssue.intervals)} /></div>
                <div className="flex flex-wrap gap-2">
                  {selectedIssue.status === "Open" && <button type="button" onClick={() => changeIssueStatus("Investigating")} className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground"><Workflow className="size-3.5" />Start investigation</button>}
                  {(selectedIssue.status === "Open" || selectedIssue.status === "Investigating") && !selectedIssue.blocking && <button type="button" onClick={() => changeIssueStatus("Accepted")} className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[10px] font-medium hover:bg-surface-2"><BadgeCheck className="size-3.5 text-amber" />Accept with reason</button>}
                  {(selectedIssue.status === "Investigating" || selectedIssue.status === "Accepted") && <button type="button" onClick={() => changeIssueStatus("Resolved")} className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[10px] font-medium hover:bg-surface-2"><CheckCircle2 className="size-3.5 text-green" />Mark resolved</button>}
                </div>
                <div className="text-[9px] leading-relaxed text-muted-foreground">Demo actions are local only. A production system must retain original value, corrected value, method, reason code, approver, timestamp, and recalculation impact.</div>
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "Provenance" && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <Panel title={`${selectedMeter.id} · Measurement Provenance`} className="xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">source → transport → storage → calculation → decision</span>}>
              <div className="overflow-x-auto pb-2" tabIndex={0} role="region" aria-label="Measurement provenance chain">
                <div className="flex min-w-[860px] items-stretch gap-2">
                  <ProvenanceNode icon={Gauge} title="Measurement" value={selectedMeter.name} detail={`${selectedMeter.id} · ${selectedMeter.quality}`} state={selectedMeter.quality === "GOOD" ? "good" : "warning"} />
                  <ProvenanceArrow />
                  <ProvenanceNode icon={Cable} title="Field transport" value="Modbus TCP" detail="gateway channel · sequence checked" state="good" />
                  <ProvenanceArrow />
                  <ProvenanceNode icon={RadioTower} title="Gateway" value="GW-EMS-02" detail={`${freshnessLabel(selectedMeter.freshnessSeconds)} · drift ${selectedMeter.timeDriftSeconds.toFixed(1)} s`} state={selectedMeter.freshnessSeconds > 300 ? "critical" : "good"} />
                  <ProvenanceArrow />
                  <ProvenanceNode icon={Server} title="Historian" value="15-minute interval" detail={`${selectedMeter.completenessPct.toFixed(1)}% complete`} state={selectedMeter.completenessPct < 95 ? "critical" : selectedMeter.completenessPct < 98 ? "warning" : "good"} />
                  <ProvenanceArrow />
                  <ProvenanceNode icon={GitBranch} title="Calculation" value={selectedMeter.affectedCalculations[0]} detail={`${selectedMeter.estimatedPct.toFixed(1)}% estimated coverage`} state={selectedMeter.estimatedPct > 2 ? "warning" : "good"} />
                </div>
              </div>
              <div className="mt-4 rounded-md border border-border bg-surface-2 p-3"><div className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Lineage contract</div><p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">The displayed decision inherits meter quality, aggregation period, estimation status, tariff/model version, and source timestamp. Corrections must trigger dependent KPI, invoice, opportunity, and verification recalculation.</p></div>
            </Panel>

            <Panel title="Trust Gates" className="xl:col-span-4">
              <div className="space-y-2"><Gate label="Source identity" passed value={selectedMeter.id} /><Gate label="Freshness threshold" passed={selectedMeter.freshnessSeconds <= 300} value={freshnessLabel(selectedMeter.freshnessSeconds)} /><Gate label="Completeness ≥95%" passed={selectedMeter.completenessPct >= 95} value={`${selectedMeter.completenessPct.toFixed(1)}%`} /><Gate label="Estimated coverage reviewed" passed={selectedMeter.estimatedPct <= 2} value={`${selectedMeter.estimatedPct.toFixed(1)}%`} /><Gate label="Time synchronization" passed={Math.abs(selectedMeter.timeDriftSeconds) <= 5} value={`${selectedMeter.timeDriftSeconds.toFixed(1)} s`} /><Gate label="Calibration in date" passed value={selectedMeter.calibrationDue} /></div>
              <div className={`mt-3 rounded-md border p-3 ${selectedMeter.quality === "GOOD" && selectedMeter.completenessPct >= 95 ? "border-green/30 bg-green/8" : "border-amber/30 bg-amber/8"}`}><div className="flex items-center gap-2 text-[10.5px] font-semibold">{selectedMeter.quality === "GOOD" && selectedMeter.completenessPct >= 95 ? <ShieldCheck className="size-4 text-green" /> : <ShieldAlert className="size-4 text-amber" />}{selectedMeter.quality === "GOOD" && selectedMeter.completenessPct >= 95 ? "Trusted for configured calculations" : "Conditional use with visible limitation"}</div></div>
            </Panel>

            <Panel title="Dependent Decisions" className="xl:col-span-12">
              <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">{selectedMeter.affectedCalculations.map((calculation, index) => <div key={calculation} className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center justify-between"><span className="flex size-7 items-center justify-center rounded-md bg-primary/8"><Database className="size-3.5 text-primary" /></span><span className="text-[9px] text-muted-foreground">DEP-{String(index + 1).padStart(2, "0")}</span></div><div className="mt-2 text-[10.5px] font-semibold">{calculation}</div><div className="mt-1 text-[9px] text-muted-foreground">Inherits {selectedMeter.quality} · {selectedMeter.completenessPct.toFixed(1)}% completeness</div></div>)}</div>
            </Panel>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[9px] text-muted-foreground"><span>Data-quality policies shown here are explicit ArGrid demo configuration, not universal regulatory thresholds.</span><Link to="/portfolio" className="text-primary hover:underline">Return to portfolio confidence →</Link></div>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, tone = "neutral" }: { icon: typeof Database; label: string; value: string; tone?: "neutral" | "good" | "warning" | "critical" }) {
  const toneClass = tone === "good" ? "text-green" : tone === "warning" ? "text-amber" : tone === "critical" ? "text-red" : "text-foreground";
  return <div className="rounded-md border border-border bg-surface-2 p-2.5"><div className="flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground"><Icon className={`size-3.5 ${toneClass}`} />{label}</div><div className={`mt-1 text-[11px] font-semibold tabular ${toneClass}`}>{value}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-0.5 text-[10px] leading-relaxed">{value}</div></div>;
}

function ProvenanceNode({ icon: Icon, title, value, detail, state }: { icon: typeof Database; title: string; value: string; detail: string; state: "good" | "warning" | "critical" }) {
  const tone = state === "good" ? "text-green border-green/25 bg-green/6" : state === "warning" ? "text-amber border-amber/25 bg-amber/6" : "text-red border-red/25 bg-red/6";
  return <div className={`w-[150px] shrink-0 rounded-md border p-3 ${tone}`}><Icon className="size-4" /><div className="mt-3 text-[8.5px] uppercase tracking-[0.11em] text-muted-foreground">{title}</div><div className="mt-1 text-[10.5px] font-semibold text-foreground">{value}</div><div className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{detail}</div></div>;
}

function ProvenanceArrow() {
  return <div className="flex w-7 shrink-0 items-center justify-center"><span className="h-px flex-1 bg-border-strong" /><ArrowRight className="size-3.5 text-muted-foreground" /></div>;
}

function Gate({ label, passed, value }: { label: string; passed: boolean; value: string }) {
  return <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 p-2.5"><span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${passed ? "border-green/30 bg-green/8 text-green" : "border-red/30 bg-red/8 text-red"}`}>{passed ? "✓" : "!"}</span><div className="min-w-0 flex-1"><div className="text-[9.5px] font-semibold">{label}</div><div className="truncate text-[9px] text-muted-foreground">{value}</div></div></div>;
}
