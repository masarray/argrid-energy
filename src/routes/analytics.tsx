import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AlertTriangle, ArrowRight, CloudSun, Gauge, Target, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/argrid-ui";
import { feeders, fmtNum, monthlyEnergy, powerFlow24h } from "@/lib/argrid-data";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
  head: () => ({
    meta: [
      { title: "Energy Analytics | ArGrid" },
      { name: "description", content: "Energy heatmap, load duration, Pareto, signature, baseline, and EnPI analysis." },
      { property: "og:title", content: "ArGrid Energy Analytics" },
      { property: "og:description", content: "Decision-ready load, concentration, and energy-signature analysis." },
    ],
  }),
});

const chartAxis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 9.5,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    color: "var(--color-foreground)",
    fontSize: 10.5,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 9.5, marginBottom: 2 },
  cursor: { fill: "var(--color-surface-3)", opacity: 0.22 },
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function InsightItem({
  icon: Icon,
  title,
  value,
  detail,
  tone = "normal",
  to,
}: {
  icon: typeof Gauge;
  title: string;
  value: string;
  detail: string;
  tone?: "normal" | "warning" | "good";
  to: "/demand" | "/opportunities" | "/data-health";
}) {
  const toneClass = tone === "warning" ? "text-amber" : tone === "good" ? "text-green" : "text-primary";
  return (
    <article className="flex min-w-0 gap-3 border-b border-border pb-3 last:border-0 last:pb-0 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-4 xl:last:border-r-0 xl:last:pr-0">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2 ${toneClass}`}>
        <Icon className="size-4" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{title}</div>
        <div className="mt-0.5 text-[14px] font-medium tracking-[-0.02em] tabular">{value}</div>
        <p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">{detail}</p>
        <Link to={to} className="mt-1.5 inline-flex items-center gap-1 text-[9.5px] font-medium text-primary hover:underline">
          Review evidence <ArrowRight className="size-3" />
        </Link>
      </div>
    </article>
  );
}

function Analytics() {
  const { site, scenarioId, telemetry } = useDemoSimulation();

  const heatmap = useMemo(
    () =>
      Array.from({ length: 7 }, (_, day) =>
        Array.from({ length: 24 }, (_, hour) => {
          const workday = day < 5;
          const productionWindow = hour >= 7 && hour <= 18;
          const secondShift = hour >= 19 && hour <= 22;
          const operatingLoad = workday && productionWindow ? 3.8 : workday && secondShift ? 2.45 : 1.58;
          const scenarioLift = scenarioId === "peak-demand" && hour >= 14 && hour <= 18 ? 0.72 : 0;
          const cycling = Math.sin(day * 7 + hour * 1.3) * 0.31 + Math.cos(hour * 0.7) * 0.24;
          return Math.max(0.8, (operatingLoad + Math.sin(hour / 3) * 0.56 + cycling + scenarioLift) * site.powerScale);
        }),
      ),
    [scenarioId, site.powerScale],
  );

  const flatLoads = useMemo(() => heatmap.flat(), [heatmap]);
  const peakLoad = Math.max(...flatLoads);
  const baseload = [...flatLoads].sort((a, b) => a - b)[Math.floor(flatLoads.length * 0.12)];
  const durationCurve = useMemo(
    () =>
      [...flatLoads]
        .sort((a, b) => b - a)
        .map((load, index, values) => ({ duration: +((index / (values.length - 1)) * 100).toFixed(1), load: +load.toFixed(2) })),
    [flatLoads],
  );
  const highDemandDuration = (durationCurve.filter((point) => point.load >= peakLoad * 0.85).length / durationCurve.length) * 100;

  const pareto = useMemo(() => {
    const sorted = feeders
      .map((feeder) => ({ name: feeder.name, energy: feeder.kw * site.powerScale * 24 }))
      .sort((a, b) => b.energy - a.energy);
    const total = sorted.reduce((sum, item) => sum + item.energy, 0);
    let running = 0;
    return sorted.map((item) => {
      running += item.energy;
      return { ...item, cumulative: +((running / total) * 100).toFixed(1) };
    });
  }, [site.powerScale]);

  const topThreeShare = pareto[2]?.cumulative ?? 0;

  const signature = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => {
        const temperature = 23 + ((index * 7) % 25) * 0.48;
        const expected = (43 + Math.max(0, temperature - 26) * 2.65) * site.powerScale;
        const productionEffect = Math.sin(index * 1.71) * 4.2 + Math.cos(index * 0.51) * 2.3;
        const outlier = index === 13 || index === 34 || (scenarioId === "peak-demand" && index === 29);
        const energy = expected + productionEffect + (outlier ? 15.5 * site.powerScale : 0);
        return {
          temperature: +temperature.toFixed(1),
          energy: +energy.toFixed(1),
          outlier,
          label: `Day ${index + 1}`,
        };
      }),
    [scenarioId, site.powerScale],
  );
  const signatureNormal = signature.filter((point) => !point.outlier);
  const signatureOutliers = signature.filter((point) => point.outlier);
  const trendSegment = [
    { x: 23, y: 43 * site.powerScale },
    { x: 35, y: (43 + 9 * 2.65) * site.powerScale },
  ];

  const maxHeat = Math.max(...flatLoads);
  const minHeat = Math.min(...flatLoads);
  const scaledMonthly = monthlyEnergy.map((month) => ({
    ...month,
    thisYear: Math.round(month.thisYear * site.powerScale),
    lastYear: Math.round(month.lastYear * site.powerScale),
  }));
  const enpiTrend = powerFlow24h.map((point, index) => ({
    ...point,
    enpi: +(0.67 + point.load * 0.042 + Math.sin(index / 3.2) * 0.018).toFixed(3),
  }));

  return (
    <AppShell title="Energy Analytics" subtitle={`Load behavior, drivers, concentration, and baseline performance for ${site.name}`}>
      <div className="space-y-3">
        <Panel title="Insight Summary" description="Interpreted findings from the active site, scenario, and trusted measurement set">
          <div className="grid gap-3 xl:grid-cols-4">
            <InsightItem
              icon={Gauge}
              title="Peak exposure"
              value={`${highDemandDuration.toFixed(1)}% of hours`}
              detail={`Demand stays above 85% of the ${peakLoad.toFixed(2)} MW peak. Baseload is ${baseload.toFixed(2)} MW.`}
              tone={highDemandDuration > 12 ? "warning" : "normal"}
              to="/demand"
            />
            <InsightItem
              icon={Target}
              title="Consumer concentration"
              value={`${topThreeShare.toFixed(1)}% in top 3`}
              detail="Heavy Lab, Chiller Plant, and Building A dominate daily energy and should lead optimization work."
              to="/opportunities"
            />
            <InsightItem
              icon={CloudSun}
              title="Weather signature"
              value={`${signatureOutliers.length} outliers`}
              detail="Cooling sensitivity is visible above 26°C. Outliers indicate schedule or control effects beyond weather."
              tone={signatureOutliers.length > 2 ? "warning" : "normal"}
              to="/opportunities"
            />
            <InsightItem
              icon={TrendingDown}
              title="Data confidence"
              value={`${telemetry.dataHealth.toFixed(1)}% trusted`}
              detail="Heatmap and derived curves use complete, reconciled intervals at the active site scale."
              tone="good"
              to="/data-health"
            />
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel
            title="Energy Heatmap"
            description="Seven-day operating pattern scaled to the active site"
            className="h-[360px] xl:col-span-7"
            actions={<span className="text-[9.5px] text-muted-foreground">MW | darker means higher load</span>}
          >
            <div className="flex h-full flex-col">
              <div className="grid flex-1 grid-cols-[34px_1fr] gap-2" role="img" aria-label={`Seven-day hourly energy heatmap from ${minHeat.toFixed(2)} to ${maxHeat.toFixed(2)} megawatts`}>
                <div className="flex flex-col justify-between py-1 text-[9.5px] text-muted-foreground tabular">
                  {days.map((day) => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-rows-7 gap-[3px]">
                  {heatmap.map((row, dayIndex) => (
                    <div key={days[dayIndex]} className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                      {row.map((value, hour) => {
                        const intensity = (value - minHeat) / Math.max(0.01, maxHeat - minHeat);
                        return (
                          <div
                            key={`${days[dayIndex]}-${hour}`}
                            className="min-h-5 rounded-[2px] border border-primary/8"
                            style={{ background: `color-mix(in oklch, var(--color-primary) ${18 + intensity * 78}%, var(--color-surface-2))` }}
                            title={`${days[dayIndex]} ${String(hour).padStart(2, "0")}:00 | ${value.toFixed(2)} MW`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 grid gap-[3px] pl-[42px] text-[8.5px] text-muted-foreground tabular" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                {Array.from({ length: 24 }, (_, hour) => <div key={hour} className="text-center">{hour % 3 === 0 ? hour : ""}</div>)}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[9px] text-muted-foreground">
                <span>Lowest interval <strong className="font-medium text-foreground tabular">{minHeat.toFixed(2)} MW</strong></span>
                <span>Peak interval <strong className="font-medium text-foreground tabular">{maxHeat.toFixed(2)} MW</strong></span>
              </div>
            </div>
          </Panel>

          <Panel
            title="Load Duration Curve"
            description="Peak, shoulder, and baseload persistence across 168 hourly intervals"
            className="h-[360px] xl:col-span-5"
            actions={<span className="text-[9.5px] text-muted-foreground">Sorted demand</span>}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={durationCurve} margin={{ top: 12, right: 10, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="loadDurationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.015} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="duration" {...chartAxis} unit="%" ticks={[0, 20, 40, 60, 80, 100]} />
                <YAxis {...chartAxis} width={42} unit=" MW" domain={[0, Math.ceil(peakLoad + 0.5)]} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string) => [`${Number(value).toFixed(2)} MW`, "Demand"]} labelFormatter={(value) => `Exceeds for ${Number(value).toFixed(1)}% of intervals`} />
                <ReferenceLine y={baseload} stroke="var(--color-green)" strokeDasharray="4 3" label={{ value: `Baseload ${baseload.toFixed(2)} MW`, position: "insideBottomRight", fill: "var(--color-green)", fontSize: 9 }} />
                <Area type="monotone" dataKey="load" stroke="var(--color-primary)" strokeWidth={1.8} fill="url(#loadDurationFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel
            title="Top Consumer Pareto"
            description="Daily energy concentration and cumulative contribution by feeder"
            className="h-[360px] xl:col-span-7"
            actions={<span className="text-[9.5px] text-muted-foreground tabular">Top 3 = {topThreeShare.toFixed(1)}%</span>}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pareto} margin={{ top: 8, right: 4, left: -2, bottom: 28 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="name" {...chartAxis} angle={-22} textAnchor="end" interval={0} height={52} />
                <YAxis yAxisId="energy" {...chartAxis} width={52} tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="share" orientation="right" {...chartAxis} width={36} domain={[0, 100]} unit="%" />
                <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => name === "Cumulative share" ? [`${Number(value).toFixed(1)}%`, name] : [`${fmtNum(Number(value))} kWh/day`, name]} />
                <Legend wrapperStyle={{ fontSize: 9.5 }} iconSize={7} />
                <Bar yAxisId="energy" dataKey="energy" name="Daily energy" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={24}>
                  {pareto.map((item, index) => <Cell key={item.name} fill={index < 3 ? "var(--color-primary)" : "var(--color-surface-3)"} />)}
                </Bar>
                <Line yAxisId="share" type="monotone" dataKey="cumulative" name="Cumulative share" stroke="var(--color-amber)" strokeWidth={1.8} dot={{ r: 2.5, fill: "var(--color-amber)" }} isAnimationActive={false} />
                <ReferenceLine yAxisId="share" y={80} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel
            title="Energy Signature"
            description="Daily energy response to outdoor temperature with operational outliers"
            className="h-[360px] xl:col-span-5"
            actions={<span className="inline-flex items-center gap-1 text-[9.5px] text-amber"><AlertTriangle className="size-3" />{signatureOutliers.length} outliers</span>}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 12, right: 8, left: -4, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" />
                <XAxis type="number" dataKey="temperature" name="Temperature" domain={[22, 36]} {...chartAxis} unit="°C" />
                <YAxis type="number" dataKey="energy" name="Energy" {...chartAxis} width={45} unit=" MWh" />
                <ZAxis range={[34, 34]} />
                <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "3 3" }} formatter={(value: number | string, name: string) => [name === "Temperature" ? `${Number(value).toFixed(1)}°C` : `${Number(value).toFixed(1)} MWh`, name]} />
                <ReferenceLine segment={trendSegment} stroke="var(--color-muted-foreground)" strokeDasharray="5 4" strokeWidth={1.3} />
                <Scatter data={signatureNormal} name="Expected days" fill="var(--color-primary)" fillOpacity={0.68} isAnimationActive={false} />
                <Scatter data={signatureOutliers} name="Operational outlier" fill="var(--color-amber)" stroke="var(--color-surface)" strokeWidth={1.5} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Monthly Energy vs Normalized Baseline" description="Weather and production adjusted year-on-year comparison" className="h-[330px] xl:col-span-8">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={scaledMonthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="m" {...chartAxis} />
                <YAxis {...chartAxis} width={56} tickFormatter={(value) => `${(Number(value) / 1_000_000).toFixed(1)}M`} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string) => `${fmtNum(Number(value))} kWh`} />
                <Legend wrapperStyle={{ fontSize: 9.5 }} iconType="circle" iconSize={7} />
                <Bar dataKey="lastYear" name="Normalized baseline" fill="var(--color-surface-3)" radius={[3, 3, 0, 0]} barSize={18} />
                <Bar dataKey="thisYear" name="Actual" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={18} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Energy Performance Indicator" description="Specific energy use per production unit" className="h-[330px] xl:col-span-4" actions={<span className="text-[9.5px] text-muted-foreground">kWh / unit</span>}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enpiTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="enpiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-green)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-green)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="t" {...chartAxis} interval={7} />
                <YAxis {...chartAxis} width={42} domain={[0.75, 1]} tickFormatter={(value) => Number(value).toFixed(2)} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string) => `${Number(value).toFixed(3)} kWh/unit`} />
                <ReferenceLine y={0.88} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="enpi" name="EnPI" stroke="var(--color-green)" strokeWidth={1.7} fill="url(#enpiFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[9.5px] text-muted-foreground">
          <span>Analytics are simulated and internally reconciled. Weather and production normalization are illustrative.</span>
          <span className="tabular">{site.name} | {telemetry.dataHealth.toFixed(1)}% confidence</span>
        </section>
      </div>
    </AppShell>
  );
}
