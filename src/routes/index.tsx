import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
  Building2,
  Clock3,
  Database,
  Factory,
  Gauge,
  Leaf,
  Sun,
  TrendingDown,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";
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
      { title: "Overview — ArGrid Energy Management" },
      { name: "description", content: "Operational, financial, and energy-performance overview for industrial sites." },
      { property: "og:title", content: "ArGrid Enterprise Overview" },
      { property: "og:description", content: "From electrical network conditions to prioritized and verified savings." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };
const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    fontSize: 11,
    padding: "6px 8px",
    color: "var(--color-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 10, marginBottom: 2 },
  cursor: { fill: "var(--color-surface-3)", opacity: 0.35 },
};

function FlowNode({
  icon: Icon,
  label,
  value,
  detail,
  tone = "normal",
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  detail: string;
  tone?: "normal" | "warning" | "good";
}) {
  const iconTone = tone === "warning" ? "text-amber" : tone === "good" ? "text-green" : "text-primary";
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5 min-w-0">
      <div className="flex items-start gap-2.5">
        <Icon className={`size-4 mt-0.5 shrink-0 ${iconTone}`} strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground truncate">{label}</div>
          <div className="mt-0.5 text-[16px] font-medium tabular tracking-tight">{value}</div>
          <div className="mt-0.5 text-[9.5px] text-muted-foreground truncate">{detail}</div>
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const { telemetry, timeRange, site, scenarioId, scenario } = useDemoSimulation();
  const periodLabel = timeRange === "This month" ? "Month" : timeRange === "This week" ? "Week" : "Today";
  const comparisonHint = timeRange === "This month" ? "vs previous month" : timeRange === "This week" ? "vs previous week" : "vs yesterday";
  const periodMultiplier = timeRange === "This month" ? 25 : timeRange === "This week" ? 7 : 1;
  const demandPct = (telemetry.peakDemand / telemetry.demandLimit) * 100;
  const projectedDemand = Math.max(telemetry.peakDemand * 1.025, telemetry.currentPower * (scenarioId === "peak-demand" ? 1.075 : 1.025));
  const projectedPct = (projectedDemand / telemetry.demandLimit) * 100;
  const minutesToLimit = scenarioId === "peak-demand" ? 18 : 46;
  const demandExposure = scenarioId === "peak-demand" ? 42_600_000 * site.powerScale : 8_400_000 * site.powerScale;
  const verifiedSavings = 1_120_000_000 * site.powerScale;
  const annualOpportunity = opportunities.reduce((sum, item) => sum + item.annualSaving, 0) * site.powerScale;
  const highConfidenceOpportunity = opportunities
    .filter((item) => item.confidence === "High")
    .reduce((sum, item) => sum + item.annualSaving, 0) * site.powerScale;
  const exportRef = useRef<HTMLDivElement>(null);

  const demandTrend = useMemo(
    () =>
      powerFlow24h.map((point, index) => ({
        ...point,
        load: +(point.load * site.powerScale).toFixed(2),
        forecast: +(point.load * site.powerScale * (index < 32 ? 1 : 1 + (index - 31) * (scenarioId === "peak-demand" ? 0.012 : 0.003))).toFixed(2),
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

  const totalFeederPower = feeders.reduce((sum, feeder) => sum + feeder.kw, 0);
  const abnormalConsumers = [...feeders]
    .sort((a, b) => {
      const aRisk = a.status === "critical" ? 2 : a.status === "warning" ? 1 : 0;
      const bRisk = b.status === "critical" ? 2 : b.status === "warning" ? 1 : 0;
      return bRisk - aRisk || b.kw - a.kw;
    })
    .slice(0, 5);

  const solarMW = telemetry.currentPower * 0.12;
  const generatorMW = scenarioId === "voltage-sag" ? telemetry.currentPower * 0.11 : telemetry.currentPower * 0.035;
  const utilityMW = Math.max(0, telemetry.currentPower - solarMW - generatorMW);

  return (
    <AppShell
      title="Enterprise Overview"
      subtitle="Electrical operation, energy performance, cost exposure, and verified value in one view"
      toolbar={
        <>
          <div className="h-8 px-2.5 rounded-md border border-border bg-surface text-[10.5px] text-muted-foreground flex items-center gap-1.5" title={scenario.description}>
            <Database className="size-3.5 text-green" /> {scenario.name}
          </div>
          <ExportPdfButton
            targetRef={exportRef}
            title="Enterprise Overview"
            subtitle="Electrical operation, energy performance, cost exposure, and verified value"
            filename={`argrid-overview-${new Date().toISOString().slice(0, 10)}.pdf`}
          />
        </>
      }
    >
      <div ref={exportRef}>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-3">
          <KpiTile label="Active Power" value={telemetry.currentPower.toFixed(2)} unit="MW" trend={kpis.currentPowerTrend} hint="live site load" />
          <KpiTile label={`${periodLabel} Energy`} value={fmtNum(telemetry.todayEnergy)} unit="kWh" trend={kpis.todayEnergyTrend} hint={comparisonHint} />
          <KpiTile label="MTD Cost" value={fmtIDR(telemetry.todayCost * (timeRange === "This month" ? 1 : 25 / periodMultiplier))} trend={kpis.todayCostTrend} hint="forecast-adjusted" />
          <KpiTile label="Demand Utilization" value={demandPct.toFixed(1)} unit="%" hint={`${telemetry.peakDemand.toFixed(2)} of ${telemetry.demandLimit.toFixed(1)} MW`} tone={demandPct > 92 ? "critical" : "warning"} />
          <KpiTile label="Verified Savings" value={fmtIDR(verifiedSavings)} trend={8.4} hint="year to date" tone="good" />
          <KpiTile label="Critical Alarms" value={kpis.criticalAlarms} hint={`${kpis.activeAlarms} active events`} tone={kpis.criticalAlarms > 0 ? "critical" : "neutral"} />
        </div>

        <section className={`mb-3 rounded-lg border px-4 py-3 ${scenarioId === "peak-demand" ? "border-amber/35 bg-amber/8" : "border-border bg-surface"}`}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className={`size-8 rounded-md flex items-center justify-center shrink-0 ${scenarioId === "peak-demand" ? "bg-amber/12 text-amber" : "bg-primary/10 text-primary"}`}>
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Primary operational insight</span>
                <span className="text-[9.5px] rounded border border-amber/30 bg-amber/10 px-1.5 py-0.5 text-amber">High confidence</span>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed">
                Contract demand is projected to reach <strong className="font-medium tabular">{projectedDemand.toFixed(2)} MW ({projectedPct.toFixed(0)}%)</strong> in approximately {minutesToLimit} minutes. Chiller Plant and Compressor Room contribute 41% of the increase, creating an estimated <strong className="font-medium text-amber">{fmtIDR(demandExposure)}</strong> demand-charge exposure.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/electrical" className="h-8 px-3 rounded-md border border-border bg-surface flex items-center gap-1.5 text-[11px] font-medium hover:bg-surface-2">
                Investigate <ArrowRight className="size-3.5" />
              </Link>
              <Link to="/opportunities" className="h-8 px-3 rounded-md bg-primary text-primary-foreground flex items-center gap-1.5 text-[11px] font-medium">
                Create action
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <Panel
            title="Live Energy Flow"
            className="xl:col-span-7"
            actions={<Link to="/electrical" className="text-[10.5px] text-primary hover:underline">Open electrical context →</Link>}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.2fr] gap-3 lg:items-center min-h-[250px]">
              <div className="grid gap-2">
                <FlowNode icon={Zap} label="Utility Grid" value={`${utilityMW.toFixed(2)} MW`} detail="20 kV utility incomer · healthy" />
                <FlowNode icon={Sun} label="Solar PV" value={`${solarMW.toFixed(2)} MW`} detail={`${((solarMW / telemetry.currentPower) * 100).toFixed(1)}% renewable contribution`} tone="good" />
                <FlowNode icon={Gauge} label="Generator" value={`${generatorMW.toFixed(2)} MW`} detail={scenarioId === "voltage-sag" ? "supporting voltage-event scenario" : "warm standby support"} tone={scenarioId === "voltage-sag" ? "warning" : "normal"} />
              </div>

              <div className="hidden lg:flex flex-col items-center gap-2 text-muted-foreground">
                <div className="h-16 w-px bg-border" />
                <div className="size-8 rounded-full border border-primary/30 bg-primary/8 flex items-center justify-center text-primary">
                  <ArrowRight className="size-4" />
                </div>
                <div className="h-16 w-px bg-border" />
              </div>

              <div>
                <div className="rounded-md border border-primary/25 bg-primary/7 px-3 py-3 mb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Main distribution bus</div>
                      <div className="mt-1 text-[18px] font-medium tabular">{telemetry.currentPower.toFixed(2)} MW</div>
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground">
                      <div>20 kV · 50.01 Hz</div>
                      <div className="mt-1">PF {telemetry.powerFactor.toFixed(3)}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-surface-3 overflow-hidden">
                    <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, demandPct)}%` }} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <FlowNode icon={Factory} label="Production" value={`${(telemetry.currentPower * 0.54).toFixed(2)} MW`} detail="3 process lines" />
                  <FlowNode icon={Gauge} label="Utilities" value={`${(telemetry.currentPower * 0.27).toFixed(2)} MW`} detail="chiller & compressed air" tone="warning" />
                  <FlowNode icon={Building2} label="Facilities" value={`${(telemetry.currentPower * 0.19).toFixed(2)} MW`} detail="buildings & services" />
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Demand & Cost Forecast"
            className="xl:col-span-5 h-[330px]"
            actions={<span className="text-[10px] text-muted-foreground tabular">Contract {telemetry.demandLimit.toFixed(1)} MW</span>}
          >
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="t" {...chartAxis} interval={7} />
                  <YAxis {...chartAxis} width={36} domain={[0, Math.ceil(telemetry.demandLimit + 1)]} />
                  <Tooltip {...tooltipStyle} />
                  <ReferenceLine y={telemetry.demandLimit} stroke="var(--color-red)" strokeDasharray="4 4" label={{ value: "Contract", fill: "var(--color-red)", fontSize: 9 }} />
                  <Area type="monotone" dataKey="load" name="Actual demand" stroke="var(--color-cyan)" strokeWidth={1.6} fill="url(#demandFill)" />
                  <Area type="monotone" dataKey="forecast" name="Projected" stroke="var(--color-amber)" strokeWidth={1.3} strokeDasharray="4 3" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
              <div>
                <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Remaining margin</div>
                <div className={`mt-1 text-[14px] font-medium tabular ${projectedPct >= 100 ? "text-red" : "text-amber"}`}>{Math.max(0, telemetry.demandLimit - projectedDemand).toFixed(2)} MW</div>
              </div>
              <div>
                <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Interval countdown</div>
                <div className="mt-1 text-[14px] font-medium tabular flex items-center gap-1.5"><Clock3 className="size-3.5 text-muted-foreground" /> {minutesToLimit} min</div>
              </div>
              <div>
                <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Cost exposure</div>
                <div className="mt-1 text-[14px] font-medium tabular text-amber">{fmtIDR(demandExposure)}</div>
              </div>
            </div>
          </Panel>

          <Panel title="Energy Performance vs Target" className="xl:col-span-7 h-[305px]" actions={<span className="text-[10px] text-muted-foreground">kWh · normalized daily</span>}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="day" {...chartAxis} />
                <YAxis {...chartAxis} width={46} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="target" name="Target" fill="var(--color-surface-3)" radius={[3, 3, 0, 0]} barSize={16} />
                <Bar dataKey="actual" name="Actual" fill="var(--color-cyan)" radius={[3, 3, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Opportunity & Savings Pipeline" className="xl:col-span-5">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5">
                <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Annual opportunity</div>
                <div className="mt-1 text-[18px] font-medium tabular">{fmtIDR(annualOpportunity)}</div>
              </div>
              <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5">
                <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">High confidence</div>
                <div className="mt-1 text-[18px] font-medium tabular text-green">{fmtIDR(highConfidenceOpportunity)}</div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Identified", value: annualOpportunity, pct: 100 },
                { label: "Validated", value: annualOpportunity * 0.72, pct: 72 },
                { label: "Implemented", value: annualOpportunity * 0.51, pct: 51 },
                { label: "Verified", value: verifiedSavings, pct: Math.min(100, (verifiedSavings / annualOpportunity) * 100) },
              ].map((stage, index) => (
                <div key={stage.label}>
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="flex items-center gap-2"><span className={`size-5 rounded-full border flex items-center justify-center text-[9px] ${index === 3 ? "border-green/35 bg-green/10 text-green" : "border-border bg-surface-2 text-muted-foreground"}`}>{index + 1}</span>{stage.label}</span>
                    <span className="tabular font-medium">{fmtIDR(stage.value)}</span>
                  </div>
                  <div className="mt-1.5 ml-7 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div className={`h-full rounded-full ${index === 3 ? "bg-green" : "bg-primary"}`} style={{ width: `${stage.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/opportunities" className="mt-4 h-8 w-full rounded-md border border-border flex items-center justify-center gap-1.5 text-[11px] font-medium hover:bg-surface-2">
              Open opportunity center <ArrowRight className="size-3.5" />
            </Link>
          </Panel>

          <Panel title="Top Abnormal Consumers" className="xl:col-span-7" actions={<Link to="/analytics" className="text-[10.5px] text-primary hover:underline">Explore analytics →</Link>}>
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="pb-2 font-normal">Asset</th>
                    <th className="pb-2 font-normal">Condition</th>
                    <th className="pb-2 font-normal text-right">Load</th>
                    <th className="pb-2 font-normal text-right">Contribution</th>
                    <th className="pb-2 font-normal text-right">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {abnormalConsumers.map((feeder) => {
                    const impact = feeder.status === "critical" ? "Production risk" : feeder.status === "warning" ? "Avoidable cost" : "Monitor";
                    return (
                      <tr key={feeder.id} className="hover:bg-surface-2/60">
                        <td className="py-2">
                          <div className="font-medium">{feeder.name}</div>
                          <div className="text-[9.5px] text-muted-foreground tabular">{feeder.id}</div>
                        </td>
                        <td className="py-2">
                          <span className={`inline-flex items-center gap-1.5 ${feeder.status === "critical" ? "text-red" : feeder.status === "warning" ? "text-amber" : "text-green"}`}>
                            <span className="size-1.5 rounded-full bg-current" /> {feeder.status}
                          </span>
                        </td>
                        <td className="py-2 text-right tabular">{fmtNum(feeder.kw * site.powerScale)} kW</td>
                        <td className="py-2 text-right tabular">{((feeder.kw / totalFeederPower) * 100).toFixed(1)}%</td>
                        <td className={`py-2 text-right ${feeder.status === "critical" ? "text-red" : feeder.status === "warning" ? "text-amber" : "text-muted-foreground"}`}>{impact}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Recent Operational Events" className="xl:col-span-5" actions={<Link to="/alarms" className="text-[10.5px] text-primary hover:underline">Open event timeline →</Link>}>
            <ul className="space-y-0.5">
              {alarms.slice(0, 5).map((alarm) => (
                <li key={alarm.id} className="flex items-start gap-2.5 py-2 border-b border-border last:border-0">
                  <SeverityDot level={alarm.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11.5px] leading-snug">{alarm.message}</div>
                    <div className="mt-1 text-[9.5px] text-muted-foreground tabular flex items-center gap-2">
                      <span>{alarm.source}</span>
                      <span>·</span>
                      <span>{alarm.ts.split(" ")[1]}</span>
                      {!alarm.ack && <span className="ml-auto text-amber uppercase tracking-wider">unacknowledged</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="xl:col-span-12 grid md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-center gap-3">
              <BadgeCheck className="size-5 text-green" />
              <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Data confidence</div><div className="mt-0.5 text-[13px] font-medium tabular">{telemetry.dataHealth.toFixed(1)}% trusted</div></div>
            </div>
            <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-center gap-3">
              <TrendingDown className="size-5 text-green" />
              <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Energy intensity</div><div className="mt-0.5 text-[13px] font-medium tabular">6.8% below baseline</div></div>
            </div>
            <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-center gap-3">
              <Leaf className="size-5 text-green" />
              <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avoided emissions</div><div className="mt-0.5 text-[13px] font-medium tabular">842 tCO₂e YTD</div></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
