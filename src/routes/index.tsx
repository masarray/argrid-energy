import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Panel, KpiTile, SeverityDot } from "@/components/argrid-ui";
import { ExportPdfButton } from "@/components/export-pdf-button";
import {
  kpis, powerFlow24h, usageByType, consumptionByLocation, weekComparison,
  alarms, opportunities, fmtIDR, fmtNum,
} from "@/lib/argrid-data";
import { Database } from "lucide-react";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/")({
  component: Overview,
  head: () => ({
    meta: [
      { title: "Overview — ArGrid Energy Management" },
      { name: "description", content: "Real-time energy, cost, and demand overview for enterprise industrial sites." },
      { property: "og:title", content: "ArGrid Overview" },
      { property: "og:description", content: "Enterprise energy command center — live consumption, cost, demand, and opportunities." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };
const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    fontSize: 11,
    padding: "6px 8px",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 10, marginBottom: 2 },
  cursor: { fill: "var(--color-surface-3)", opacity: 0.4 },
};

function Overview() {
  const { telemetry, timeRange, site } = useDemoSimulation();
  const periodLabel = timeRange === "This month" ? "Month" : timeRange === "This week" ? "Week" : "Today";
  const comparisonHint = timeRange === "This month" ? "vs previous month" : timeRange === "This week" ? "vs previous week" : "vs yesterday";
  const periodMultiplier = timeRange === "This month" ? 25 : timeRange === "This week" ? 7 : 1;
  const scaledPowerFlow = useMemo(
    () => powerFlow24h.map((point) => ({ ...point, grid: point.grid * site.powerScale, solar: point.solar * site.powerScale, load: point.load * site.powerScale })),
    [site.powerScale],
  );
  const scaledLocations = useMemo(
    () => consumptionByLocation.map((location) => ({ ...location, kwh: Math.round(location.kwh * site.powerScale * periodMultiplier) })),
    [periodMultiplier, site.powerScale],
  );
  const scaledWeekComparison = useMemo(
    () => weekComparison.map((day) => ({ ...day, thisWeek: Math.round(day.thisWeek * site.powerScale), lastWeek: Math.round(day.lastWeek * site.powerScale) })),
    [site.powerScale],
  );
  const demandPct = (telemetry.peakDemand / telemetry.demandLimit) * 100;
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <AppShell
      title="Enterprise Overview"
      subtitle="Live view across all sites — cost, demand, and abnormal signals"
      toolbar={
        <>
          <div className="h-8 px-2.5 rounded-md border border-border bg-surface text-[11px] text-muted-foreground flex items-center gap-1.5" title="Values are generated locally for demonstration">
            <Database className="size-3.5 text-green" /> Simulated telemetry
          </div>
          <ExportPdfButton
            targetRef={exportRef}
            title="Enterprise Overview"
            subtitle="Live view across all sites — cost, demand, and abnormal signals"
            filename={`argrid-overview-${new Date().toISOString().slice(0, 10)}.pdf`}
          />
        </>
      }
    >
      <div ref={exportRef}>
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        <KpiTile label="Current Power" value={telemetry.currentPower.toFixed(2)} unit="MW" trend={kpis.currentPowerTrend} hint="vs 1h avg" />
        <KpiTile label={`${periodLabel} Energy`} value={fmtNum(telemetry.todayEnergy)} unit="kWh" trend={kpis.todayEnergyTrend} hint={comparisonHint} />
        <KpiTile label={`${periodLabel} Cost`} value={fmtIDR(telemetry.todayCost)} trend={kpis.todayCostTrend} hint={comparisonHint} tone="good" />
        <KpiTile label="Peak Demand" value={telemetry.peakDemand.toFixed(2)} unit="MW" hint={`${demandPct.toFixed(0)}% of ${telemetry.demandLimit} MW limit`} tone="warning" />
        <KpiTile label="Power Factor" value={telemetry.powerFactor.toFixed(2)} hint="target ≥ 0.95" tone="warning" />
        <KpiTile label={`CO₂ ${periodLabel}`} value={telemetry.co2Today.toFixed(1)} unit="tCO₂e" trend={kpis.co2Trend} hint="scope 2" tone="good" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* Live power flow */}
        <Panel
          title="Live Power & Solar Contribution — Last 24h"
          className="col-span-1 xl:col-span-8 h-[340px]"
          actions={<span className="text-[10.5px] text-muted-foreground tabular">MW · 30-min interval</span>}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scaledPowerFlow} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="gLoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-amber)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-amber)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="t" {...chartAxis} interval={5} />
              <YAxis {...chartAxis} width={40} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="load" name="Total load" stroke="var(--color-cyan)" strokeWidth={1.6} fill="url(#gLoad)" />
              <Area type="monotone" dataKey="solar" name="Solar PV" stroke="var(--color-amber)" strokeWidth={1.4} fill="url(#gSolar)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* Usage by type */}
        <Panel title="Consumption by Usage Type" className="col-span-1 xl:col-span-4 h-[340px]">
          <div className="flex items-center gap-4 h-full">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={usageByType} dataKey="value" innerRadius={48} outerRadius={78} stroke="var(--color-surface)" strokeWidth={2}>
                  {usageByType.map((u, i) => <Cell key={i} fill={u.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 text-[12px]">
              {usageByType.map((u) => (
                <li key={u.name} className="flex items-center gap-2">
                  <span className="size-2 rounded-sm" style={{ background: u.color }} />
                  <span className="flex-1 text-muted-foreground">{u.name}</span>
                  <span className="tabular font-medium">{u.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        {/* Consumption by location */}
        <Panel title={`${periodLabel} Consumption by Location`} className="col-span-1 xl:col-span-5 h-[320px]" actions={<span className="text-[10.5px] text-muted-foreground">{`kWh · ${periodLabel.toLowerCase()}`}</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scaledLocations} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" horizontal={false} />
              <XAxis type="number" {...chartAxis} />
              <YAxis type="category" dataKey="name" {...chartAxis} width={80} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmtNum(v)} kWh`, ""]} />
              <Bar dataKey="kwh" fill="var(--color-cyan)" radius={[0, 3, 3, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Week vs week */}
        <Panel title="Period Comparison — This Week vs Last Week" className="col-span-1 xl:col-span-7 h-[320px]" actions={<span className="text-[10.5px] text-muted-foreground">kWh · daily</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scaledWeekComparison} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="day" {...chartAxis} />
              <YAxis {...chartAxis} width={48} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} iconType="circle" iconSize={7} />
              <Bar dataKey="lastWeek" name="Last week" fill="var(--color-surface-3)" radius={[3, 3, 0, 0]} barSize={16} />
              <Bar dataKey="thisWeek" name="This week" fill="var(--color-cyan)" radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Top opportunities */}
        <Panel title="Top Opportunities" className="col-span-1 xl:col-span-7" actions={<Link to="/opportunities" className="text-[11px] text-primary hover:underline">View all →</Link>}>
          <div className="overflow-x-auto"><table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-normal">Opportunity</th>
                <th className="pb-2 font-normal">Asset</th>
                <th className="pb-2 font-normal text-right">Annual saving</th>
                <th className="pb-2 font-normal text-right">Payback (yr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opportunities.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-surface-2/50">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${o.urgency === "P1" ? "bg-red" : o.urgency === "P2" ? "bg-amber" : "bg-primary"}`} />
                      <span className="font-medium">{o.title}</span>
                    </div>
                  </td>
                  <td className="py-2 text-muted-foreground tabular">{o.asset}</td>
                  <td className="py-2 text-right tabular text-green">{fmtIDR(o.annualSaving)}</td>
                  <td className="py-2 text-right tabular">{o.payback.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Panel>

        {/* Recent alarms */}
        <Panel title="Recent Alarms" className="col-span-1 xl:col-span-5" actions={<Link to="/alarms" className="text-[11px] text-primary hover:underline">All events →</Link>}>
          <ul className="space-y-1">
            {alarms.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-start gap-2.5 py-1.5 border-b border-border/60 last:border-0">
                <SeverityDot level={a.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] leading-snug">{a.message}</div>
                  <div className="mt-0.5 text-[10.5px] text-muted-foreground tabular flex items-center gap-2">
                    <span>{a.source}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span>{a.ts.split(" ")[1]}</span>
                    {!a.ack && <span className="ml-auto text-amber uppercase tracking-wider">unack</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      </div>
    </AppShell>
  );
}
