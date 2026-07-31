import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  Database,
  Leaf,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChartLegend, KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";
import { EnergyFlowSankey } from "@/components/energy-flow-sankey";
import { ExportPdfButton } from "@/components/export-pdf-button";
import {
  alarms,
  feeders,
  fmtIDR,
  fmtNum,
  kpis,
  opportunities,
  powerFlow24h,
  weekComparison,
} from "@/lib/argrid-data";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/")({
  component: Overview,
  head: () => ({
    meta: [
      { title: "Overview | ArGrid Energy Management" },
      {
        name: "description",
        content: "Operational, financial, and energy-performance overview for industrial sites.",
      },
      { property: "og:title", content: "ArGrid Enterprise Overview" },
      {
        property: "og:description",
        content: "From electrical network conditions to prioritized and verified savings.",
      },
    ],
  }),
});

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
    fontSize: 11,
    padding: "7px 9px",
    color: "var(--color-foreground)",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 10, marginBottom: 2 },
  cursor: { fill: "var(--color-surface-3)", opacity: 0.28 },
};

function Overview() {
  const { telemetry, timeRange, site, scenarioId, scenario } = useDemoSimulation();
  const exportRef = useRef<HTMLDivElement>(null);
  const periodLabel = timeRange === "This month" ? "Month" : timeRange === "This week" ? "Week" : "Today";
  const comparisonHint = timeRange === "This month" ? "vs previous month" : timeRange === "This week" ? "vs previous week" : "vs yesterday";
  const periodMultiplier = timeRange === "This month" ? 25 : timeRange === "This week" ? 7 : 1;
  const demandPct = (telemetry.peakDemand / telemetry.demandLimit) * 100;
  const projectedDemand = Math.max(
    telemetry.peakDemand * 1.025,
    telemetry.currentPower * (scenarioId === "peak-demand" ? 1.075 : 1.025),
  );
  const projectedPct = (projectedDemand / telemetry.demandLimit) * 100;
  const minutesToLimit = scenarioId === "peak-demand" ? 18 : 46;
  const demandExposure = scenarioId === "peak-demand" ? 42_600_000 * site.powerScale : 8_400_000 * site.powerScale;
  const verifiedSavings = 1_120_000_000 * site.powerScale;
  const annualOpportunity = opportunities.reduce((sum, item) => sum + item.annualSaving, 0) * site.powerScale;
  const highConfidenceOpportunity =
    opportunities
      .filter((item) => item.confidence === "High")
      .reduce((sum, item) => sum + item.annualSaving, 0) * site.powerScale;

  const demandTrend = useMemo(
    () =>
      powerFlow24h.map((point, index) => ({
        ...point,
        load: +(point.load * site.powerScale).toFixed(2),
        forecast: +(
          point.load *
          site.powerScale *
          (index < 32 ? 1 : 1 + (index - 31) * (scenarioId === "peak-demand" ? 0.012 : 0.003))
        ).toFixed(2),
      })),
    [scenarioId, site.powerScale],
  );

  const performanceTrend = useMemo(
    () =>
      weekComparison.map((day) => ({
        ...day,
        actual: Math.round(day.thisWeek * site.powerScale),
        target: Math.round(day.lastWeek * site.powerScale * 0.96),
      })),
    [site.powerScale],
  );
  const latestDemandPoint = demandTrend[demandTrend.length - 1];

  const totalFeederPower = feeders.reduce((sum, feeder) => sum + feeder.kw, 0);
  const abnormalConsumers = [...feeders]
    .sort((a, b) => {
      const aRisk = a.status === "critical" ? 2 : a.status === "warning" ? 1 : 0;
      const bRisk = b.status === "critical" ? 2 : b.status === "warning" ? 1 : 0;
      return bRisk - aRisk || b.kw - a.kw;
    })
    .slice(0, 5);

  const projectedMargin = telemetry.demandLimit - projectedDemand;

  const pipeline = [
    { label: "Identified", value: annualOpportunity, pct: 100 },
    { label: "Validated", value: annualOpportunity * 0.72, pct: 72 },
    { label: "Implemented", value: annualOpportunity * 0.51, pct: 51 },
    { label: "Verified", value: verifiedSavings, pct: Math.min(100, (verifiedSavings / annualOpportunity) * 100) },
  ];

  return (
    <AppShell
      title="Enterprise Overview"
      subtitle="Electrical condition, energy performance, financial exposure, and realized value"
      toolbar={
        <>
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground" title={scenario.description}>
            <Database className="size-3.5 text-primary" /> {scenario.name}
          </div>
          <ExportPdfButton
            targetRef={exportRef}
            title="Enterprise Overview"
            subtitle="Electrical condition, energy performance, financial exposure, and realized value"
            filename={`argrid-overview-${new Date().toISOString().slice(0, 10)}.pdf`}
          />
        </>
      }
    >
      <div ref={exportRef} className="space-y-3">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiTile label="Active Power" value={telemetry.currentPower.toFixed(2)} unit="MW" trend={kpis.currentPowerTrend} hint="live site load" emphasis="primary" progress={(telemetry.currentPower / telemetry.demandLimit) * 100} />
          <KpiTile label="Demand Utilization" value={demandPct.toFixed(1)} unit="%" hint={`${telemetry.peakDemand.toFixed(2)} / ${telemetry.demandLimit.toFixed(1)} MW`} tone={demandPct > 92 ? "critical" : "warning"} emphasis="primary" progress={demandPct} />
          <KpiTile label="Verified Savings" value={fmtIDR(verifiedSavings)} trend={8.4} hint="year to date" tone="good" emphasis="primary" progress={(verifiedSavings / annualOpportunity) * 100} />
          <KpiTile label={`${periodLabel} Energy`} value={fmtNum(telemetry.todayEnergy)} unit="kWh" trend={kpis.todayEnergyTrend} hint={comparisonHint} />
          <KpiTile label="MTD Cost" value={fmtIDR(telemetry.todayCost * (timeRange === "This month" ? 1 : 25 / periodMultiplier))} trend={kpis.todayCostTrend} hint="forecast adjusted" />
          <KpiTile label="Critical Alarms" value={kpis.criticalAlarms} hint={`${kpis.activeAlarms} active events`} tone={kpis.criticalAlarms > 0 ? "critical" : "neutral"} />
        </section>

        <section className={`rounded-lg border px-4 py-3 ${scenarioId === "peak-demand" ? "border-amber/35 bg-amber/8" : "border-border bg-surface"}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${scenarioId === "peak-demand" ? "bg-amber/12 text-amber" : "bg-primary/10 text-primary"}`}>
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Priority decision</span>
                <span className="rounded border border-amber/30 bg-amber/10 px-1.5 py-0.5 text-[9.5px] font-medium text-amber">89% confidence</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed">
                Contract demand is projected to reach <strong className="font-medium tabular">{projectedDemand.toFixed(2)} MW ({projectedPct.toFixed(0)}%)</strong> in {minutesToLimit} minutes. Chiller Plant and Compressor Room contribute 41% of the increase, creating an estimated <strong className="font-medium text-amber">{fmtIDR(demandExposure)}</strong> exposure.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link to="/demand" className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[10.5px] font-medium hover:bg-surface-2">
                Review forecast <ArrowRight className="size-3.5" />
              </Link>
              <Link to="/opportunities" className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[10.5px] font-medium text-primary-foreground">
                Create action
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel
            variant="primary"
            title="Energy Flow Sankey"
            description="Live source, distribution, end-use, cost, and carbon reconciliation"
            className="xl:col-span-12"
            actions={<Link to="/electrical" className="text-[10px] text-primary hover:underline">Electrical context →</Link>}
          >
            <EnergyFlowSankey currentPower={telemetry.currentPower} scenarioId={scenarioId} dataHealth={telemetry.dataHealth} />
          </Panel>

          <Panel
            title="Demand & Cost Outlook"
            className="h-[315px] xl:col-span-4"
            actions={
              <ChartLegend
                unit="MW"
                items={[
                  { label: "Actual", color: "var(--color-primary)" },
                  { label: "Forecast", color: "var(--color-amber)", dashed: true },
                  { label: "Limit", color: "var(--color-red)", dashed: true },
                ]}
              />
            }
          >
            <div className="h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="t" {...chartAxis} interval={7} />
                  <YAxis {...chartAxis} width={36} domain={[0, Math.ceil(telemetry.demandLimit + 1)]} />
                  <Tooltip {...tooltipStyle} formatter={(value: number | string) => [`${Number(value).toFixed(2)} MW`]} />
                  <ReferenceArea y1={telemetry.demandLimit * 0.94} y2={telemetry.demandLimit} fill="var(--color-amber)" fillOpacity={0.07} ifOverflow="extendDomain" />
                  <ReferenceLine y={telemetry.demandLimit} stroke="var(--color-red)" strokeDasharray="5 4" label={{ value: "Contract", fill: "var(--color-red)", fontSize: 9, position: "insideTopRight" }} />
                  <Area type="monotone" dataKey="load" name="Actual demand" stroke="var(--color-primary)" strokeWidth={1.8} fill="url(#demandFill)" />
                  <Line type="monotone" dataKey="forecast" name="Projected" stroke="var(--color-amber)" strokeWidth={1.6} strokeDasharray="5 3" dot={false} />
                  <ReferenceDot x={latestDemandPoint.t} y={latestDemandPoint.load} r={3.4} fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
              <div>
                <div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Projected margin</div>
                <div className={`mt-1 text-[13px] font-medium tabular ${projectedMargin < 0 ? "text-red" : "text-amber"}`}>{projectedMargin.toFixed(2)} MW</div>
              </div>
              <div>
                <div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Time to limit</div>
                <div className="mt-1 flex items-center gap-1 text-[13px] font-medium tabular"><Clock3 className="size-3.5 text-muted-foreground" />{minutesToLimit} min</div>
              </div>
              <div>
                <div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Exposure</div>
                <div className="mt-1 text-[13px] font-medium text-amber tabular">{fmtIDR(demandExposure)}</div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Energy Performance vs Normalized Target"
            className="h-[315px] xl:col-span-8"
            actions={
              <ChartLegend
                unit="kWh"
                items={[
                  { label: "Actual", color: "var(--color-primary)" },
                  { label: "Normalized target", color: "var(--color-surface-3)", muted: true },
                ]}
                note="weather + production adjusted"
              />
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceTrend} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="day" {...chartAxis} />
                <YAxis {...chartAxis} width={48} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string) => [`${fmtNum(Number(value))} kWh`]} />
                <Bar dataKey="target" name="Normalized target" fill="var(--color-surface-3)" radius={[3, 3, 0, 0]} barSize={18} />
                <Bar dataKey="actual" name="Actual" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel variant="quiet" title="Value Realization" className="xl:col-span-4" actions={<Link to="/savings" className="text-[10px] text-primary hover:underline">Savings ledger →</Link>}>
            <div className="grid grid-cols-2 gap-3 border-b border-border pb-3">
              <div>
                <div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Annual opportunity</div>
                <div className="mt-1 text-[16px] font-medium tabular">{fmtIDR(annualOpportunity)}</div>
              </div>
              <div>
                <div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">High confidence</div>
                <div className="mt-1 text-[16px] font-medium text-green tabular">{fmtIDR(highConfidenceOpportunity)}</div>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {pipeline.map((stage, index) => (
                <div key={stage.label}>
                  <div className="flex items-center justify-between gap-3 text-[10.5px]">
                    <span className="flex items-center gap-2"><span className={`flex size-4 items-center justify-center rounded-full border text-[8px] ${index === pipeline.length - 1 ? "border-green/35 bg-green/10 text-green" : "border-border bg-surface-2 text-muted-foreground"}`}>{index + 1}</span>{stage.label}</span>
                    <span className="font-medium tabular">{fmtIDR(stage.value)}</span>
                  </div>
                  <div className="ml-6 mt-1.5 h-1 rounded-full bg-surface-3"><div className={`h-full rounded-full ${index === pipeline.length - 1 ? "bg-green" : "bg-primary"}`} style={{ width: `${stage.pct}%` }} /></div>
                </div>
              ))}
            </div>
            <Link to="/opportunities" className="mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-border text-[10.5px] font-medium hover:bg-surface-2">Open opportunity center <ArrowRight className="size-3.5" /></Link>
          </Panel>

          <Panel title="Priority Exceptions" className="xl:col-span-8" actions={<Link to="/analytics" className="text-[10px] text-primary hover:underline">Full analysis →</Link>}>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border text-left text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium">State</th>
                    <th className="pb-2 text-right font-medium">Load</th>
                    <th className="pb-2 text-right font-medium">Share</th>
                    <th className="pb-2 text-right font-medium">Business consequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {abnormalConsumers.map((feeder) => {
                    const impact = feeder.status === "critical" ? "Production risk" : feeder.status === "warning" ? "Avoidable cost" : "Monitor";
                    return (
                      <tr key={feeder.id} className="hover:bg-surface-2/65">
                        <td className="py-2.5"><div className="font-medium">{feeder.name}</div><div className="text-[9.5px] text-muted-foreground tabular">{feeder.id}</div></td>
                        <td className="py-2.5"><span className={`inline-flex items-center gap-1.5 ${feeder.status === "critical" ? "text-red" : feeder.status === "warning" ? "text-amber" : "text-green"}`}><span className="size-1.5 rounded-full bg-current" />{feeder.status}</span></td>
                        <td className="py-2.5 text-right tabular">{fmtNum(feeder.kw * site.powerScale)} kW</td>
                        <td className="py-2.5 text-right tabular">{((feeder.kw / totalFeederPower) * 100).toFixed(1)}%</td>
                        <td className={`py-2.5 text-right ${feeder.status === "critical" ? "text-red" : feeder.status === "warning" ? "text-amber" : "text-muted-foreground"}`}>{impact}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel variant="quiet" title="Recent Operational Events" className="xl:col-span-4" actions={<Link to="/alarms" className="text-[10px] text-primary hover:underline">Event timeline →</Link>}>
            <ul>
              {alarms.slice(0, 5).map((alarm) => (
                <li key={alarm.id} className="flex items-start gap-2.5 border-b border-border py-2.5 first:pt-0 last:border-0 last:pb-0">
                  <SeverityDot level={alarm.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] leading-snug">{alarm.message}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-muted-foreground tabular">
                      <span>{alarm.source}</span><span>·</span><span>{alarm.ts.split(" ")[1]}</span>
                      {!alarm.ack && <span className="ml-auto font-medium uppercase tracking-[0.08em] text-amber">Unacknowledged</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <BadgeCheck className="size-4 text-green" />
            <div><div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Data confidence</div><div className="mt-0.5 text-[12px] font-medium tabular">{telemetry.dataHealth.toFixed(1)}% trusted</div></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <TrendingDown className="size-4 text-green" />
            <div><div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Energy intensity</div><div className="mt-0.5 text-[12px] font-medium tabular">6.8% below baseline</div></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            <Leaf className="size-4 text-green" />
            <div><div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Avoided emissions</div><div className="mt-0.5 text-[12px] font-medium tabular">842 tCO₂e YTD</div></div>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[9.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-green" />Values are simulated but internally reconciled for the active site and scenario.</span>
          <span className="tabular">Management workspace · {site.name}</span>
        </section>
      </div>
    </AppShell>
  );
}
