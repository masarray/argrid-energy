import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  Clock3,
  FileDown,
  FileText,
  History,
  Send,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { useDemoSimulation } from "@/lib/demo-simulation";
import {
  buildExecutiveSustainabilityReport,
  downloadReport,
  evaluateReportGate,
  getReportLibrary,
  getSustainabilityInventory,
  type ReportDefinition,
  type ReportStatus,
} from "@/lib/sustainability-reporting";

export const Route = createFileRoute("/reports")({
  component: ReportCenter,
  head: () => ({
    meta: [
      { title: "Report Center — ArGrid" },
      {
        name: "description",
        content: "Governed energy, carbon, billing, power-quality, savings, and data-quality reporting workflow.",
      },
      { property: "og:title", content: "ArGrid Report Center" },
      {
        property: "og:description",
        content: "Traceable report generation, review, approval, publication, and source-workspace drill-down.",
      },
    ],
  }),
});

const tabs = ["Report Preview", "Data Coverage", "Approval & Publication"] as const;
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
};

const categoryRoutes: Record<ReportDefinition["category"], "/" | "/sustainability" | "/billing" | "/alarms/power-quality" | "/savings" | "/data-health" | "/analytics"> = {
  Executive: "/",
  Energy: "/analytics",
  Carbon: "/sustainability",
  Billing: "/billing",
  "Power quality": "/alarms/power-quality",
  Savings: "/savings",
  "Data quality": "/data-health",
};

function statusClass(status: ReportStatus) {
  if (status === "Review required") return "border-amber/30 bg-amber/8 text-amber";
  if (status === "Published") return "border-green/30 bg-green/8 text-green";
  if (status === "Approved") return "border-primary/30 bg-primary/8 text-primary";
  return "border-border bg-surface-2 text-muted-foreground";
}

function nextStatus(status: ReportStatus): ReportStatus | null {
  if (status === "Draft") return "Review required";
  if (status === "Review required") return "Approved";
  if (status === "Approved") return "Published";
  return null;
}

function nextStatusLabel(status: ReportStatus) {
  if (status === "Draft") return "Submit for review";
  if (status === "Review required") return "Approve report";
  if (status === "Approved") return "Publish internally";
  return "Published";
}

function ReportCenter() {
  const { site, scenarioId, scenario } = useDemoSimulation();
  const inventory = useMemo(
    () => getSustainabilityInventory(site.name, site.powerScale, scenarioId),
    [scenarioId, site.name, site.powerScale],
  );
  const baseReports = useMemo(
    () => getReportLibrary(inventory, scenarioId),
    [inventory, scenarioId],
  );
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ReportStatus>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-report-status-overrides") ?? "{}") as Record<string, ReportStatus>;
    } catch {
      return {};
    }
  });
  const [selectedId, setSelectedId] = useState("RPT-EXEC-2026-07");
  const [activeTab, setActiveTab] = useState<Tab>("Report Preview");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    window.localStorage.setItem("argrid-report-status-overrides", JSON.stringify(statusOverrides));
  }, [statusOverrides]);

  const reports = baseReports.map((report) => ({
    ...report,
    status: statusOverrides[report.id] ?? report.status,
  }));
  const selected = reports.find((report) => report.id === selectedId) ?? reports[0];
  const gate = evaluateReportGate(selected, inventory);
  const reportSummary = ["Draft", "Review required", "Approved", "Published"].map((status) => ({
    status,
    count: reports.filter((report) => report.status === status).length,
  }));
  const averageCompleteness = reports.reduce((total, report) => total + report.completenessPct, 0) / reports.length;
  const blockedReports = reports.filter((report) => report.blockingIssues > 0).length;
  const publishedReports = reports.filter((report) => report.status === "Published").length;
  const coverageChart = selected.sourceSystems.map((source, index) => ({
    source,
    coverage: Math.max(82, selected.completenessPct - index * 0.7),
    threshold: 95,
  }));
  const statusPie = reportSummary.filter((item) => item.count > 0).map((item) => ({
    ...item,
    fill: item.status === "Published" ? "var(--color-green)" : item.status === "Approved" ? "var(--color-primary)" : item.status === "Review required" ? "var(--color-amber)" : "var(--color-muted-foreground)",
  }));
  const directlyExportable = selected.category === "Executive" || selected.category === "Carbon";

  const advanceWorkflow = () => {
    const next = nextStatus(selected.status);
    if (!next) return;
    if ((next === "Approved" || next === "Published") && !gate.eligible) {
      setMessage("Workflow blocked: resolve failed completeness, assurance, or blocking-issue checks first.");
      return;
    }
    if ((next === "Approved" || next === "Published") && !reviewConfirmed) {
      setMessage("Reviewer confirmation is required before approval or publication.");
      return;
    }
    setStatusOverrides((current) => ({ ...current, [selected.id]: next }));
    setMessage(`${selected.id} moved to ${next}. Demo workflow state is stored locally; no external distribution occurred.`);
  };

  const exportSelected = () => {
    if (!directlyExportable) {
      setMessage(`Open the ${selected.category} source workspace to export its domain-specific evidence package.`);
      return;
    }
    const html = buildExecutiveSustainabilityReport(selected, inventory);
    downloadReport(`${selected.id}-${selected.title.replaceAll(" ", "-")}.html`, html);
    setMessage(`${selected.id} exported as a printable governed HTML report.`);
  };

  return (
    <AppShell
      title="Report Center"
      subtitle="Governed energy, carbon, billing, PQ, savings, and data-quality reporting"
      toolbar={
        <div className="flex items-center gap-2">
          <div className="hidden h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground xl:flex">
            <CalendarClock className="size-3.5 text-primary" /> {reports.length} report definitions · {scenario.name}
          </div>
          <button
            type="button"
            onClick={exportSelected}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] font-medium hover:bg-surface-2"
          >
            <FileDown className="size-3.5" /> {directlyExportable ? "Export report" : "Open export source"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Report Definitions" value={String(reports.length)} hint="governed templates" />
        <KpiTile label="Published" value={String(publishedReports)} hint="internal publication state" tone="good" />
        <KpiTile label="Blocked" value={String(blockedReports)} hint="unresolved source issues" tone={blockedReports > 0 ? "critical" : "good"} />
        <KpiTile label="Average Coverage" value={averageCompleteness.toFixed(1)} unit="%" hint="across report sources" tone={averageCompleteness >= 95 ? "good" : "warning"} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel title="Report Library" actions={<span className="text-[9.5px] text-muted-foreground">select a governed report package</span>}>
          <div className="space-y-2">
            {reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => {
                  setSelectedId(report.id);
                  setReviewConfirmed(false);
                  setMessage("");
                }}
                className={`w-full rounded-md border p-3 text-left ${selected.id === report.id ? "border-primary bg-primary/8" : "border-border bg-surface-2 hover:border-border-strong"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9.5px] tabular text-muted-foreground">{report.id}</span>
                  <span className={`rounded border px-1.5 py-0.5 text-[9.5px] ${statusClass(report.status)}`}>{report.status}</span>
                </div>
                <div className="mt-1.5 text-[11px] font-medium leading-snug">{report.title}</div>
                <div className="mt-1 text-[9.5px] text-muted-foreground">{report.category} · {report.period} · {report.frequency}</div>
                <div className="mt-2 flex items-center justify-between text-[9.5px]">
                  <span className="text-muted-foreground">Coverage</span>
                  <span className={`tabular ${report.completenessPct >= 95 ? "text-green" : "text-amber"}`}>{report.completenessPct.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3"><div className={report.completenessPct >= 95 ? "h-full bg-green" : "h-full bg-amber"} style={{ width: `${report.completenessPct}%` }} /></div>
              </button>
            ))}
          </div>
        </Panel>

        <div className="min-w-0">
          <Panel
            title={`${selected.id} · ${selected.title}`}
            actions={<span className={`rounded border px-1.5 py-0.5 text-[9.5px] ${statusClass(selected.status)}`}>{selected.status}</span>}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Info label="Audience" value={selected.audience} />
              <Info label="Period / frequency" value={`${selected.period} · ${selected.frequency}`} />
              <Info label="Owner" value={selected.owner} />
              <Info label="Reviewer" value={selected.reviewer} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <Metric label="Last generated" value={selected.lastGenerated} />
              <Metric label="Next run" value={selected.nextRun} />
              <Metric label="Blocking issues" value={String(selected.blockingIssues)} tone={selected.blockingIssues > 0 ? "warn" : "good"} />
            </div>
          </Panel>

          <section className="mt-3 rounded-lg border border-border bg-surface p-1">
            <div className="flex flex-wrap items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setMessage("");
                  }}
                  className={`h-8 rounded-md px-3 text-[11px] font-medium ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}
                >
                  {tab}
                </button>
              ))}
              <Link to={categoryRoutes[selected.category]} className="ml-auto flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-medium text-primary hover:bg-primary/8">
                Open source workspace →
              </Link>
            </div>
          </section>

          {message && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-primary/25 bg-primary/8 px-3 py-2 text-[10px]">
              <History className="size-3.5 text-primary" /> {message}
            </div>
          )}

          {activeTab === "Report Preview" && (
            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
              <Panel title="Report Structure" className="xl:col-span-7">
                <div className="space-y-2">
                  {selected.sections.map((section, index) => (
                    <div key={section} className="grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5">
                      <span className="flex size-7 items-center justify-center rounded-md bg-primary/8 text-[9.5px] font-medium text-primary">{String(index + 1).padStart(2, "0")}</span>
                      <div><div className="text-[10.5px] font-medium">{section}</div><div className="mt-0.5 text-[9.5px] text-muted-foreground">Source-linked section · period {selected.period}</div></div>
                      <FileText className="size-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Portfolio Report Status" className="h-[360px] xl:col-span-5" actions={<span className="text-[9.5px] text-muted-foreground">all definitions</span>}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} dataKey="count" nameKey="status" innerRadius={64} outerRadius={98} paddingAngle={3} stroke="var(--color-surface)">
                      {statusPie.map((item) => <Cell key={item.status} fill={item.fill} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(value: number | string) => [`${value} reports`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Management Summary" className="xl:col-span-12">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2 text-[10px] font-medium"><ShieldCheck className="size-3.5 text-primary" />Data confidence</div><p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">{selected.completenessPct.toFixed(1)}% source coverage with {selected.blockingIssues} unresolved blocking issue(s).</p></div>
                  <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2 text-[10px] font-medium"><Clock3 className="size-3.5 text-primary" />Generation schedule</div><p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">{selected.frequency} generation. Next configured run: {selected.nextRun}.</p></div>
                  <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2 text-[10px] font-medium"><Send className="size-3.5 text-primary" />Distribution boundary</div><p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">Publication is internal demo state only. No email, regulatory filing, customer portal, or document-management system is contacted.</p></div>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "Data Coverage" && (
            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
              <Panel title="Source-system Coverage" className="h-[390px] xl:col-span-7" actions={<span className="text-[9.5px] text-muted-foreground">configured approval threshold 95%</span>}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coverageChart} layout="vertical" margin={{ top: 8, right: 20, left: 18, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} {...chartAxis} tickFormatter={(value: number) => `${value}%`} />
                    <YAxis type="category" dataKey="source" width={130} {...chartAxis} />
                    <Tooltip {...tooltipStyle} formatter={(value: number | string) => `${Number(value).toFixed(1)}%`} />
                    <Bar dataKey="coverage" radius={[0, 3, 3, 0]}>{coverageChart.map((item) => <Cell key={item.source} fill={item.coverage >= 95 ? "var(--color-green)" : "var(--color-amber)"} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Source Register" className="xl:col-span-5">
                <div className="space-y-2">
                  {selected.sourceSystems.map((source, index) => {
                    const coverage = coverageChart[index].coverage;
                    return <div key={source} className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center justify-between gap-2"><div className="text-[10.5px] font-medium">{source}</div><span className={`text-[10px] tabular ${coverage >= 95 ? "text-green" : "text-amber"}`}>{coverage.toFixed(1)}%</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3"><div className={coverage >= 95 ? "h-full bg-green" : "h-full bg-amber"} style={{ width: `${coverage}%` }} /></div><div className="mt-1.5 text-[9.5px] text-muted-foreground">Inherited by {selected.id} · period {selected.period}</div></div>;
                  })}
                </div>
              </Panel>

              <Panel title="Coverage Consequence" className="xl:col-span-12">
                <div className={`rounded-md border p-3 ${gate.eligible ? "border-green/25 bg-green/8" : "border-amber/30 bg-amber/8"}`}>
                  <div className="flex items-center gap-2 text-[11px] font-medium">{gate.eligible ? <BadgeCheck className="size-4 text-green" /> : <CircleAlert className="size-4 text-amber" />}{gate.eligible ? "Source coverage supports the configured approval gate" : "Publication is blocked by source coverage or assurance exceptions"}</div>
                  <p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">Completeness is evaluated at report level and does not overwrite the source quality state. Estimated, substituted, or missing data remain visible in the source workspace.</p>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "Approval & Publication" && (
            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
              <Panel title="Report Gate" className="xl:col-span-7">
                <div className="space-y-2">
                  {gate.checks.map((check) => (
                    <div key={check.label} className="grid grid-cols-[auto_1fr] gap-3 rounded-md border border-border bg-surface-2 p-3">
                      <span className={`mt-0.5 flex size-5 items-center justify-center rounded-full border text-[10px] ${check.passed ? "border-green/30 bg-green/8 text-green" : "border-red/30 bg-red/8 text-red"}`}>{check.passed ? "✓" : "!"}</span>
                      <div><div className="text-[10.5px] font-medium">{check.label}</div><div className="mt-0.5 text-[9.5px] text-muted-foreground">{check.detail}</div></div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Workflow Control" className="xl:col-span-5">
                <div className={`rounded-md border p-3 ${gate.eligible ? "border-green/25 bg-green/8" : "border-amber/30 bg-amber/8"}`}>
                  <div className="flex items-center gap-2 text-[11px] font-medium">{gate.eligible ? <BadgeCheck className="size-4 text-green" /> : <CircleAlert className="size-4 text-amber" />}{gate.eligible ? "Eligible for controlled workflow transition" : "Workflow transition blocked"}</div>
                  <p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">Approval confirms internal review of configured demonstration evidence. Publication does not send, file, certify, or externally distribute the report.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3"><Info label="Current state" value={selected.status} /><Info label="Next state" value={nextStatus(selected.status) ?? "Complete"} /><Info label="Owner" value={selected.owner} /><Info label="Reviewer" value={selected.reviewer} /></div>
                <label className="mt-4 flex items-start gap-2 text-[10px]"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} disabled={!gate.eligible || selected.status === "Published"} className="mt-0.5" /><span>I reviewed the source coverage, report sections, exceptions, reporting boundary, and publication limitations.</span></label>
                <button type="button" onClick={advanceWorkflow} disabled={selected.status === "Published"} className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-[11px] font-medium text-primary-foreground disabled:opacity-40"><Send className="size-3.5" />{nextStatusLabel(selected.status)}</button>
              </Panel>

              <Panel title="Publication History" className="xl:col-span-12">
                <div className="grid gap-2 md:grid-cols-3">
                  {[
                    { title: "Generated", time: selected.lastGenerated, detail: "Deterministic source snapshot created." },
                    { title: selected.status === "Draft" ? "Review pending" : "Review workflow", time: selected.status === "Draft" ? "Not submitted" : "Browser demo state", detail: `${selected.reviewer} assigned as independent reviewer.` },
                    { title: "Next scheduled run", time: selected.nextRun, detail: "Schedule shown for product demonstration; no background scheduler is invoked." },
                  ].map((item) => <div key={item.title} className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2 text-[10px] font-medium"><History className="size-3.5 text-primary" />{item.title}</div><div className="mt-2 text-[10px] tabular">{item.time}</div><p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">{item.detail}</p></div>)}
                </div>
              </Panel>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-[9.5px] text-muted-foreground">
        Demonstration boundary: report states and schedules are browser-local. ArGrid does not send email, file regulatory submissions, publish customer documents, or contact an external document-management system.
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-0.5 text-[10px] font-medium leading-relaxed tabular">{value}</div></div>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="text-[9.5px] uppercase tracking-[0.11em] text-muted-foreground">{label}</div><div className={`mt-1 text-[12px] font-medium tabular ${tone === "good" ? "text-green" : tone === "warn" ? "text-amber" : ""}`}>{value}</div></div>;
}
