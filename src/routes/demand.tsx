import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Factory,
  Gauge,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import {
  DEMAND_CHARGE_RATE_IDR_PER_KW,
  buildDemandContributors,
  buildDemandForecast,
  calculateDemandExposure,
  getIntervalCountdown,
  simulateDemandResponse,
} from "@/lib/demand-cost";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/demand")({
  component: DemandAndCost,
  head: () => ({
    meta: [
      { title: "Demand & Cost — ArGrid" },
      {
        name: "description",
        content: "Live interval demand, contract-limit forecast, feeder contribution, and simulation-only response planning.",
      },
      { property: "og:title", content: "ArGrid Demand & Cost" },
      {
        property: "og:description",
        content: "Predictive demand control with financial exposure and operational constraints.",
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
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    color: "var(--color-foreground)",
    fontSize: 11,
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 10 },
};

function DemandAndCost() {
  const { telemetry, site, scenarioId, scenario, lastUpdated, setScenarioId } = useDemoSimulation();
  const [deferChiller, setDeferChiller] = useState(false);
  const [compressorReductionKW, setCompressorReductionKW] = useState(0);
  const [generatorSupport, setGeneratorSupport] = useState(false);
  const [bessDischargeKW, setBessDischargeKW] = useState(0);

  const contributors = useMemo(
    () =>
      buildDemandContributors({
        currentDemandMW: telemetry.currentPower,
        siteScale: site.powerScale,
        scenarioId,
      }),
    [scenarioId, site.powerScale, telemetry.currentPower],
  );

  const forecast = useMemo(
    () =>
      buildDemandForecast({
        anchor: lastUpdated,
        currentDemandMW: telemetry.currentPower,
        demandLimitMW: telemetry.demandLimit,
        siteScale: site.powerScale,
        scenarioId,
      }),
    [lastUpdated, scenarioId, site.powerScale, telemetry.currentPower, telemetry.demandLimit],
  );

  const projectedDemandMW =
    [...forecast].reverse().find((point) => typeof point.forecast === "number")?.forecast ?? telemetry.currentPower;
  const projectedUtilization = (projectedDemandMW / telemetry.demandLimit) * 100;
  const currentMarginMW = telemetry.demandLimit - telemetry.currentPower;
  const projectedMarginMW = telemetry.demandLimit - projectedDemandMW;
  const exposure = calculateDemandExposure(projectedDemandMW, telemetry.demandLimit);
  const countdown = getIntervalCountdown(lastUpdated);

  const response = simulateDemandResponse({
    projectedDemandMW,
    demandLimitMW: telemetry.demandLimit,
    siteScale: site.powerScale,
    deferChiller,
    compressorReductionKW,
    generatorSupport,
    bessDischargeKW,
  });

  const applyRecommendedResponse = () => {
    setDeferChiller(true);
    setCompressorReductionKW(Math.round(140 * site.powerScale));
    setGeneratorSupport(false);
    setBessDischargeKW(Math.round(220 * site.powerScale));
  };

  const resetSimulation = () => {
    setDeferChiller(false);
    setCompressorReductionKW(0);
    setGeneratorSupport(false);
    setBessDischargeKW(0);
  };

  const responseIsActive =
    deferChiller || compressorReductionKW > 0 || generatorSupport || bessDischargeKW > 0;
  const riskTone = projectedDemandMW > telemetry.demandLimit ? "critical" : projectedUtilization > 95 ? "warning" : "neutral";
  const topContributors = contributors.slice(0, 5);
  const maxContributorKW = Math.max(...topContributors.map((item) => item.currentKW), 1);

  return (
    <AppShell
      title="Demand & Cost"
      subtitle="Prevent peak-demand exposure while protecting production and electrical constraints"
      toolbar={
        <button
          type="button"
          onClick={() => setScenarioId(scenarioId === "peak-demand" ? "normal" : "peak-demand")}
          className={`h-8 rounded-md border px-3 text-[10.5px] font-medium ${
            scenarioId === "peak-demand"
              ? "border-amber/35 bg-amber/10 text-amber"
              : "border-border bg-surface hover:bg-surface-2"
          }`}
        >
          {scenarioId === "peak-demand" ? "Peak-demand scenario active" : "Trigger peak-demand scenario"}
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-3">
        <KpiTile
          label="Current Demand"
          value={telemetry.currentPower.toFixed(2)}
          unit="MW"
          hint={`${((telemetry.currentPower / telemetry.demandLimit) * 100).toFixed(1)}% utilization`}
        />
        <KpiTile
          label="Projected Interval"
          value={projectedDemandMW.toFixed(2)}
          unit="MW"
          hint={`${projectedUtilization.toFixed(1)}% at interval close`}
          tone={riskTone}
        />
        <KpiTile
          label="Contract Limit"
          value={telemetry.demandLimit.toFixed(2)}
          unit="MW"
          hint="configured utility threshold"
        />
        <KpiTile
          label="Remaining Margin"
          value={projectedMarginMW.toFixed(2)}
          unit="MW"
          hint={projectedMarginMW < 0 ? "projected exceedance" : "projected reserve"}
          tone={projectedMarginMW < 0 ? "critical" : projectedMarginMW < telemetry.demandLimit * 0.05 ? "warning" : "good"}
        />
        <KpiTile
          label="Interval Countdown"
          value={countdown.label}
          hint="15-minute demand interval"
          tone={countdown.remainingSeconds < 180 ? "warning" : "neutral"}
        />
        <KpiTile
          label="Demand Exposure"
          value={fmtIDR(exposure.exposureIDR)}
          hint={`${fmtNum(exposure.overrunKW)} kW projected overrun`}
          tone={exposure.exposureIDR > 0 ? "critical" : "good"}
        />
      </div>

      <section
        className={`mb-3 rounded-lg border px-4 py-3 ${
          exposure.exposureIDR > 0 ? "border-amber/40 bg-amber/8" : "border-border bg-surface"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div
            className={`size-8 rounded-md flex items-center justify-center shrink-0 ${
              exposure.exposureIDR > 0 ? "bg-amber/12 text-amber" : "bg-green/12 text-green"
            }`}
          >
            {exposure.exposureIDR > 0 ? <ShieldAlert className="size-4" /> : <CheckCircle2 className="size-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Predictive demand insight
              </span>
              <span className="rounded border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-[9.5px] text-primary">
                89% confidence
              </span>
              <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                {scenario.name}
              </span>
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed">
              At the current trajectory, interval demand will close at{" "}
              <strong className="font-medium tabular">{projectedDemandMW.toFixed(2)} MW</strong>.
              {exposure.exposureIDR > 0 ? (
                <>
                  {" "}
                  This exceeds the contract limit by{" "}
                  <strong className="font-medium text-amber tabular">{fmtNum(exposure.overrunKW)} kW</strong> and creates
                  an estimated <strong className="font-medium text-amber">{fmtIDR(exposure.exposureIDR)}</strong>{" "}
                  demand-charge exposure.
                </>
              ) : (
                <> The site remains within the configured contract limit, but reserve margin is narrowing.</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/electrical"
              className="h-8 px-3 rounded-md border border-border bg-surface flex items-center gap-1.5 text-[11px] font-medium hover:bg-surface-2"
            >
              Locate contributors <ArrowRight className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={applyRecommendedResponse}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium"
            >
              Simulate response
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel
          title="15-Minute Demand Forecast"
          className="xl:col-span-8 h-[390px]"
          actions={<span className="text-[10px] text-muted-foreground">MW · actual and projected trajectory</span>}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast} margin={{ top: 8, right: 18, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="demandForecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-amber)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--color-amber)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="time" {...chartAxis} />
              <YAxis
                {...chartAxis}
                width={44}
                domain={[
                  Math.max(0, Math.min(telemetry.currentPower, telemetry.demandLimit) - 0.8),
                  Math.max(telemetry.demandLimit + 0.35, projectedDemandMW + 0.25),
                ]}
                tickFormatter={(value) => `${Number(value).toFixed(1)}`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number | string, name: string) => [
                  `${Number(value).toFixed(3)} MW`,
                  name === "actual" ? "Actual demand" : name === "forecast" ? "Projected demand" : name,
                ]}
              />
              <ReferenceLine
                y={telemetry.demandLimit}
                stroke="var(--color-red)"
                strokeDasharray="6 4"
                label={{ value: "Contract limit", position: "insideTopRight", fill: "var(--color-red)", fontSize: 10 }}
              />
              <ReferenceLine
                y={telemetry.demandLimit * 0.95}
                stroke="var(--color-amber)"
                strokeDasharray="3 4"
                label={{ value: "Warning", position: "insideBottomRight", fill: "var(--color-amber)", fontSize: 9 }}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="forecast"
                stroke="var(--color-amber)"
                strokeWidth={1.8}
                fill="url(#demandForecastFill)"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="actual"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ r: 2, fill: "var(--color-primary)" }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Feeder Contribution"
          className="xl:col-span-4 h-[390px]"
          actions={<span className="text-[10px] text-muted-foreground">reconciled to live demand</span>}
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topContributors} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" horizontal={false} />
                <XAxis type="number" {...chartAxis} domain={[0, maxContributorKW * 1.12]} />
                <YAxis type="category" dataKey="name" {...chartAxis} width={88} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value: number | string) => [`${fmtNum(Number(value))} kW`, "Contribution"]}
                />
                <Bar dataKey="currentKW" radius={[0, 3, 3, 0]} barSize={11}>
                  {topContributors.map((item) => (
                    <Cell
                      key={item.id}
                      fill={
                        item.status === "critical"
                          ? "var(--color-red)"
                          : item.status === "warning"
                            ? "var(--color-amber)"
                            : "var(--color-primary)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {topContributors.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-[10.5px]">
                <span
                  className={`size-1.5 rounded-full ${
                    item.status === "critical" ? "bg-red" : item.status === "warning" ? "bg-amber" : "bg-primary"
                  }`}
                />
                <span className="min-w-0 flex-1 truncate">
                  {item.id} · {item.name}
                </span>
                <span className="tabular text-muted-foreground">{item.sharePct.toFixed(1)}%</span>
                <span className="tabular font-medium">{fmtNum(item.currentKW)} kW</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="What-If Response Simulator"
          className="xl:col-span-7"
          actions={
            <span className="rounded border border-violet/25 bg-violet/8 px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-violet">
              Simulation sandbox
            </span>
          }
        >
          <div className="mb-3 rounded-md border border-violet/25 bg-violet/6 px-3 py-2 text-[10.5px] text-muted-foreground">
            <strong className="font-medium text-foreground">Simulation Mode — No field command will be executed.</strong>{" "}
            Results estimate interval demand and commercial impact only.
          </div>

          <div className="grid md:grid-cols-2 gap-x-5 gap-y-4">
            <label className="rounded-md border border-border bg-surface-2 p-3 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deferChiller}
                onChange={(event) => setDeferChiller(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-[11.5px] font-medium">Defer Chiller 2 start</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">
                  Reduce approximately {fmtNum(180 * site.powerScale)} kW for one interval. Chilled-water reserve remains
                  above the simulated 9% minimum.
                </span>
              </span>
            </label>

            <label className="rounded-md border border-border bg-surface-2 p-3 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={generatorSupport}
                onChange={(event) => setGeneratorSupport(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-[11.5px] font-medium">Start generator support</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">
                  Displace {fmtNum(350 * site.powerScale)} kW utility import. Fuel and carbon impact are included.
                </span>
              </span>
            </label>

            <label className="rounded-md border border-border bg-surface-2 p-3">
              <span className="flex items-center justify-between text-[11.5px] font-medium">
                Compressor reduction
                <span className="tabular text-primary">{fmtNum(compressorReductionKW)} kW</span>
              </span>
              <input
                type="range"
                min="0"
                max={Math.round(200 * site.powerScale)}
                step="10"
                value={compressorReductionKW}
                onChange={(event) => setCompressorReductionKW(Number(event.target.value))}
                className="mt-3 w-full accent-[var(--color-primary)]"
              />
              <span className="mt-1 block text-[10px] text-muted-foreground">
                Maintain header pressure above 6.2 bar and preserve critical pneumatic loads.
              </span>
            </label>

            <label className="rounded-md border border-border bg-surface-2 p-3">
              <span className="flex items-center justify-between text-[11.5px] font-medium">
                BESS discharge
                <span className="tabular text-primary">{fmtNum(bessDischargeKW)} kW</span>
              </span>
              <input
                type="range"
                min="0"
                max={Math.round(500 * site.powerScale)}
                step="20"
                value={bessDischargeKW}
                onChange={(event) => setBessDischargeKW(Number(event.target.value))}
                className="mt-3 w-full accent-[var(--color-primary)]"
              />
              <span className="mt-1 block text-[10px] text-muted-foreground">
                Preserve at least 72% state of charge for reliability reserve.
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={applyRecommendedResponse}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium flex items-center gap-1.5"
            >
              <SlidersHorizontal className="size-3.5" /> Apply recommended plan
            </button>
            <button
              type="button"
              onClick={resetSimulation}
              className="h-8 px-3 rounded-md border border-border text-[11px] flex items-center gap-1.5 hover:bg-surface-2"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
            <span className="ml-auto text-[10px] text-muted-foreground">
              Tariff assumption: IDR {DEMAND_CHARGE_RATE_IDR_PER_KW.toLocaleString("en-US")}/kW-month
            </span>
          </div>
        </Panel>

        <div className="xl:col-span-5 space-y-3">
          <Panel
            title="Simulated Outcome"
            actions={
              <span className={`text-[10px] ${response.remainingMarginMW >= 0 ? "text-green" : "text-red"}`}>
                {responseIsActive ? `${response.confidencePct}% confidence` : "No response selected"}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <OutcomeStat
                icon={Gauge}
                label="New projected demand"
                value={`${response.adjustedDemandMW.toFixed(2)} MW`}
                tone={response.adjustedDemandMW > telemetry.demandLimit ? "critical" : "good"}
              />
              <OutcomeStat
                icon={ShieldAlert}
                label="Remaining margin"
                value={`${response.remainingMarginMW.toFixed(2)} MW`}
                tone={response.remainingMarginMW < 0 ? "critical" : "good"}
              />
              <OutcomeStat
                icon={Zap}
                label="Avoided demand"
                value={`${fmtNum(response.avoidedDemandKW)} kW`}
              />
              <OutcomeStat
                icon={Factory}
                label="Avoided charge"
                value={fmtIDR(response.avoidedDemandChargeIDR)}
                tone="good"
              />
              <OutcomeStat
                icon={BatteryCharging}
                label="Residual exposure"
                value={fmtIDR(response.residualExposureIDR)}
                tone={response.residualExposureIDR > 0 ? "critical" : "good"}
              />
              <OutcomeStat
                icon={AlertTriangle}
                label="Carbon delta"
                value={`${response.carbonDeltaTco2e >= 0 ? "+" : ""}${response.carbonDeltaTco2e.toFixed(2)} tCO₂e`}
                tone={response.carbonDeltaTco2e > 0 ? "warning" : "good"}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/opportunities"
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium flex items-center gap-1.5"
              >
                Create demand-response action <ArrowRight className="size-3.5" />
              </Link>
              <span className="text-[9.5px] text-muted-foreground">No live setpoint is transmitted.</span>
            </div>
          </Panel>

          <Panel title="Operational Constraints">
            <div className="space-y-2">
              {contributors
                .filter((item) => item.flexibleKW > 0)
                .slice(0, 4)
                .map((item) => (
                  <div key={item.id} className="rounded-md border border-border bg-surface-2 px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-[10.5px]">
                      <span className="font-medium">
                        {item.id} · {item.name}
                      </span>
                      <span className="tabular text-primary">up to {fmtNum(item.flexibleKW)} kW</span>
                    </div>
                    <p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">
                      {item.operationalConstraint}
                    </p>
                  </div>
                ))}
            </div>
          </Panel>
        </div>

        <Panel title="Commercial Context" className="xl:col-span-12">
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3 text-[11px]">
            <CommercialStat label="Energy cost today" value={fmtIDR(telemetry.todayCost)} detail="simulated tariff accumulation" />
            <CommercialStat
              label="Current demand margin"
              value={`${currentMarginMW.toFixed(2)} MW`}
              detail={`${((currentMarginMW / telemetry.demandLimit) * 100).toFixed(1)}% of contract limit`}
            />
            <CommercialStat
              label="Projected overrun"
              value={`${fmtNum(exposure.overrunKW)} kW`}
              detail={exposure.overrunKW > 0 ? "demand charge risk" : "within configured limit"}
              tone={exposure.overrunKW > 0 ? "warning" : "good"}
            />
            <CommercialStat
              label="Response value"
              value={fmtIDR(response.avoidedDemandChargeIDR)}
              detail="estimated avoided charge"
              tone="good"
            />
            <CommercialStat
              label="Data confidence"
              value={`${telemetry.dataHealth.toFixed(1)}%`}
              detail="GOOD · interval data complete"
              tone="good"
            />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function OutcomeStat({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "critical" | "good";
}) {
  const toneClass =
    tone === "critical"
      ? "text-red"
      : tone === "warning"
        ? "text-amber"
        : tone === "good"
          ? "text-green"
          : "text-foreground";

  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={`mt-1 text-[15px] font-medium tabular ${toneClass}`}>{value}</div>
    </div>
  );
}

function CommercialStat({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "warning" | "good";
}) {
  return (
    <div className="border-l-2 border-border pl-3">
      <div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-[15px] font-medium tabular ${tone === "warning" ? "text-amber" : tone === "good" ? "text-green" : ""}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[9.5px] text-muted-foreground">{detail}</div>
    </div>
  );
}
