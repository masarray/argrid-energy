import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { EnergySankey } from "@/components/energy-sankey";
import { Panel } from "@/components/argrid-ui";
import { fmtIDR, fmtNum, monthlyEnergy } from "@/lib/argrid-data";
import { useDemoSimulation } from "@/lib/demo-simulation";
import {
  buildEnergyHeatmap,
  buildEnergySankey,
  buildEnergySignature,
  buildLoadDurationCurve,
  buildTopConsumerPareto,
  heatmapUnit,
  heatmapValue,
  type HeatmapMode,
  type ParetoMode,
  type SankeyMode,
} from "@/lib/energy-visualization";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
  head: () => ({
    meta: [
      { title: "Energy Analytics — ArGrid" },
      {
        name: "description",
        content: "Graphical Sankey, heatmap, load-duration, Pareto, and normalized energy-signature analysis.",
      },
      { property: "og:title", content: "ArGrid Energy Analytics" },
      {
        property: "og:description",
        content: "Industrial energy-flow and pattern analytics for demand, consumers, cost, and carbon.",
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
    color: "var(--color-foreground)",
    fontSize: 11,
    padding: "7px 9px",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 10, marginBottom: 2 },
};

function ModeButtons<TMode extends string>({
  modes,
  value,
  onChange,
}: {
  modes: readonly TMode[];
  value: TMode;
  onChange: (mode: TMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={`h-6 rounded px-2 text-[9.5px] font-medium capitalize ${
            value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

function Analytics() {
  const { site, timeRange, scenarioId, scenario, telemetry } = useDemoSimulation();
  const [sankeyMode, setSankeyMode] = useState<SankeyMode>("power");
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("demand");
  const [paretoMode, setParetoMode] = useState<ParetoMode>("energy");
  const periodLabel = timeRange === "This month" ? "Month" : timeRange === "This week" ? "Week" : "Today";

  const sankey = useMemo(
    () =>
      buildEnergySankey({
        currentPowerMW: telemetry.currentPower,
        gridImportMW: telemetry.gridImportMW,
        solarMW: telemetry.solarMW,
        generatorMW: telemetry.generatorMW,
        energyRateIDR: telemetry.energyRateIDR,
        meterQuality: telemetry.meterQuality,
        completenessPct: telemetry.intervalCompletenessPct,
        scenarioId,
      }),
    [
      scenarioId,
      telemetry.currentPower,
      telemetry.energyRateIDR,
      telemetry.generatorMW,
      telemetry.gridImportMW,
      telemetry.intervalCompletenessPct,
      telemetry.meterQuality,
      telemetry.solarMW,
    ],
  );

  const heatmap = useMemo(
    () => buildEnergyHeatmap(site.powerScale, scenarioId),
    [scenarioId, site.powerScale],
  );
  const heatmapMax = Math.max(...heatmap.map((cell) => heatmapValue(cell, heatmapMode)));
  const duration = useMemo(
    () => buildLoadDurationCurve(site.powerScale, scenarioId),
    [scenarioId, site.powerScale],
  );
  const pareto = useMemo(
    () => buildTopConsumerPareto(telemetry.todayEnergy, telemetry.energyRateIDR, scenarioId),
    [scenarioId, telemetry.energyRateIDR, telemetry.todayEnergy],
  );
  const signature = useMemo(
    () => buildEnergySignature(site.powerScale, scenarioId, site.productionTarget),
    [scenarioId, site.powerScale, site.productionTarget],
  );
  const monthly = useMemo(
    () =>
      monthlyEnergy.map((point) => ({
        ...point,
        actual: Math.round(point.thisYear * site.powerScale),
        baseline: Math.round(point.lastYear * site.powerScale),
      })),
    [site.powerScale],
  );

  const paretoKey = paretoMode === "cost" ? "costIDR" : paretoMode === "carbon" ? "carbonT" : "energyKWh";
  const paretoValue = (value: number) => {
    if (paretoMode === "cost") return fmtIDR(value);
    if (paretoMode === "carbon") return `${value.toFixed(1)} tCO₂e`;
    return `${fmtNum(value)} kWh`;
  };

  return (
    <AppShell
      title="Energy Analytics"
      subtitle="Energy-flow, historical-pattern, concentration, and normalized-driver analysis"
      toolbar={
        <div className="flex h-8 items-center rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground">
          {scenario.name} · {telemetry.meterQuality} · {telemetry.intervalCompletenessPct.toFixed(1)}% complete
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          title="Energy Flow Sankey"
          className="xl:col-span-12"
          actions={
            <ModeButtons
              modes={["power", "cost", "carbon"] as const}
              value={sankeyMode}
              onChange={setSankeyMode}
            />
          }
        >
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
            <EnergySankey model={sankey} mode={sankeyMode} className="min-h-[470px]" />
            <div className="grid content-start gap-3">
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="text-[9px] font-medium uppercase tracking-[0.11em] text-muted-foreground">
                  Reconciled site flow
                </div>
                <div className="mt-1.5 text-[24px] font-medium tracking-[-0.03em] tabular">
                  {fmtNum(sankey.totalKW)} kW
                </div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  Source, distribution, consumer, and loss flows share one deterministic energy balance.
                </p>
              </div>

              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="text-[9px] font-medium uppercase tracking-[0.11em] text-muted-foreground">
                  Source mix
                </div>
                <div className="mt-2 space-y-2 text-[10.5px]">
                  {sankey.links
                    .filter((link) => link.target === "main-bus")
                    .map((link) => (
                      <div key={link.source}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{link.label}</span>
                          <span className="font-medium tabular">
                            {((link.valueKW / sankey.totalKW) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(link.valueKW / sankey.totalKW) * 100}%`,
                              background: link.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-md border border-border bg-surface-2 p-3 text-[10.5px]">
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-muted-foreground">Balance difference</span>
                  <span className="tabular">{sankey.distributionDifferenceKW.toFixed(1)} kW</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-muted-foreground">Blended rate</span>
                  <span className="tabular">{fmtIDR(sankey.blendedRateIDR)}/kWh</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-muted-foreground">Data quality</span>
                  <span className={telemetry.meterQuality === "GOOD" ? "text-green" : "text-amber"}>
                    {telemetry.meterQuality}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Monthly Energy — Actual vs Normalized Baseline" className="h-[330px] xl:col-span-7">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="m" {...chartAxis} />
              <YAxis {...chartAxis} width={55} tickFormatter={(value) => `${(Number(value) / 1_000_000).toFixed(1)}M`} />
              <Tooltip {...tooltipStyle} formatter={(value: number | string) => `${fmtNum(Number(value))} kWh`} />
              <Bar dataKey="baseline" name="Normalized baseline" fill="var(--color-surface-3)" radius={[3, 3, 0, 0]} barSize={18} />
              <Bar dataKey="actual" name="Actual" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={18} />
              <Line type="monotone" dataKey="actual" stroke="var(--color-amber)" strokeWidth={1.4} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Load Duration Curve"
          className="h-[330px] xl:col-span-5"
          actions={
            <span className="text-[9.5px] text-muted-foreground">
              {duration.durationAbove90Pct}% duration above 90% of peak
            </span>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={duration.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="duration-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="durationPct" {...chartAxis} tickFormatter={(value) => `${value}%`} />
              <YAxis {...chartAxis} width={42} />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number | string) => `${Number(value).toFixed(2)} MW`}
                labelFormatter={(value) => `${value}% of duration`}
              />
              <ReferenceLine
                y={duration.p90}
                stroke="var(--color-amber)"
                strokeDasharray="4 4"
                label={{ value: "P90", fill: "var(--color-amber)", fontSize: 9 }}
              />
              <Area
                type="monotone"
                dataKey="demandMW"
                name="Demand"
                stroke="var(--color-primary)"
                strokeWidth={1.8}
                fill="url(#duration-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Energy Heatmap — Last 7 Days × 24 Hours"
          className="h-[338px] xl:col-span-7"
          actions={
            <ModeButtons
              modes={["demand", "cost", "carbon"] as const}
              value={heatmapMode}
              onChange={setHeatmapMode}
            />
          }
        >
          <div
            className="h-full overflow-x-auto"
            role="region"
            aria-label="Energy heatmap"
            tabIndex={0}
          >
            <div className="grid min-w-[720px] grid-cols-[34px_1fr] gap-2">
              <div className="grid grid-rows-7 gap-[3px] py-1 text-[9px] text-muted-foreground">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="flex items-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-rows-7 gap-[3px]">
                {Array.from({ length: 7 }, (_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="grid gap-[3px]"
                    style={{ gridTemplateColumns: "repeat(24,minmax(0,1fr))" }}
                  >
                    {heatmap
                      .filter((cell) => cell.dayIndex === dayIndex)
                      .map((cell) => {
                        const value = heatmapValue(cell, heatmapMode);
                        const intensity = Math.max(7, (value / heatmapMax) * 100);
                        return (
                          <div
                            key={`${cell.day}-${cell.hour}`}
                            className="rounded-[2px] border border-transparent hover:border-primary/60"
                            style={{
                              background: `color-mix(in oklab, var(--color-primary) ${intensity}%, var(--color-surface-3))`,
                            }}
                            title={`${cell.day} ${String(cell.hour).padStart(2, "0")}:00 · ${value.toFixed(2)} ${heatmapUnit(heatmapMode)}`}
                          />
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
            <div
              className="mt-2 grid min-w-[720px] gap-[3px] pl-[42px] text-[8.5px] text-muted-foreground"
              style={{ gridTemplateColumns: "repeat(24,minmax(0,1fr))" }}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="text-center">{hour % 3 === 0 ? hour : ""}</div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Top Consumer Pareto"
          className="h-[338px] xl:col-span-5"
          actions={
            <ModeButtons
              modes={["energy", "cost", "carbon"] as const}
              value={paretoMode}
              onChange={setParetoMode}
            />
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={pareto} margin={{ top: 8, right: 5, left: -8, bottom: 4 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="name" {...chartAxis} interval={0} angle={-18} textAnchor="end" height={54} />
              <YAxis
                yAxisId="value"
                {...chartAxis}
                width={48}
                tickFormatter={(value) =>
                  paretoMode === "cost"
                    ? `${(Number(value) / 1_000_000).toFixed(0)}M`
                    : paretoMode === "carbon"
                      ? Number(value).toFixed(0)
                      : `${Math.round(Number(value) / 1000)}k`
                }
              />
              <YAxis yAxisId="share" orientation="right" {...chartAxis} width={38} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number | string, name: string) =>
                  name === "Cumulative" ? `${Number(value).toFixed(1)}%` : paretoValue(Number(value))
                }
              />
              <Bar yAxisId="value" dataKey={paretoKey} name={paretoMode} fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={16} />
              <Line yAxisId="share" type="monotone" dataKey="cumulativePct" name="Cumulative" stroke="var(--color-amber)" strokeWidth={1.8} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Energy Signature — Temperature vs Consumption" className="h-[330px] xl:col-span-5">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" />
              <XAxis type="number" dataKey="temperatureC" name="Outdoor temperature" unit="°C" domain={[20, 40]} {...chartAxis} />
              <YAxis type="number" dataKey="actualKWh" name="Energy" unit=" kWh" width={52} {...chartAxis} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
              <ZAxis range={[54, 54]} />
              <Tooltip
                {...tooltipStyle}
                cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "3 3" }}
                formatter={(value: number | string, name: string) =>
                  name === "Energy" ? `${fmtNum(Number(value))} kWh` : value
                }
              />
              <Scatter data={signature.filter((point) => !point.outlier)} name="Expected band" fill="var(--color-primary)" />
              <Scatter data={signature.filter((point) => point.outlier)} name="Outlier" fill="var(--color-red)" />
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Phase A Decision Summary" className="xl:col-span-7">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <div className="text-[9px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Heatmap</div>
              <div className="mt-1.5 text-[12px] font-medium">Night and weekend baseload remains visible.</div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Investigate standby schedules and auxiliary loads before pursuing small equipment savings.</p>
            </div>
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <div className="text-[9px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Duration curve</div>
              <div className="mt-1.5 text-[12px] font-medium">Peak {duration.peak.toFixed(2)} MW · base {duration.base.toFixed(2)} MW.</div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Separate persistent demand from short peaks for shaving and capacity decisions.</p>
            </div>
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <div className="text-[9px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Pareto</div>
              <div className="mt-1.5 text-[12px] font-medium">Top three consumers account for {pareto[2].cumulativePct.toFixed(1)}%.</div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Prioritize large systems before spreading engineering effort across small loads.</p>
            </div>
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <div className="text-[9px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Energy signature</div>
              <div className="mt-1.5 text-[12px] font-medium">{signature.filter((point) => point.outlier).length} normalized outliers require review.</div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">Distinguish operational waste from weather and production effects.</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[9.5px] text-muted-foreground">
            <span>{periodLabel} scope · {site.name} · {scenario.name}</span>
            <span>Simulation data only · no field or commercial command</span>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
