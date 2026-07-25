import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  CircleAlert,
  FileCheck2,
  Leaf,
  ShieldCheck,
  SunMedium,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { fmtNum } from "@/lib/argrid-data";
import { useDemoSimulation } from "@/lib/demo-simulation";
import {
  getSustainabilityInventory,
  type AssuranceState,
  type CarbonMethod,
} from "@/lib/sustainability-reporting";

export const Route = createFileRoute("/sustainability")({
  component: Sustainability,
  head: () => ({
    meta: [
      { title: "Sustainability Assurance — ArGrid" },
      {
        name: "description",
        content: "Traceable Scope 1 and Scope 2 inventory, target trajectory, renewable attributes, factor registry, and assurance workflow.",
      },
      { property: "og:title", content: "ArGrid Sustainability Assurance" },
      {
        property: "og:description",
        content: "Location-based and market-based carbon accounting with evidence and reporting gates.",
      },
    ],
  }),
});

const tabs = ["Inventory", "Target & Forecast", "Renewable Attributes", "Assurance"] as const;
type Tab = (typeof tabs)[number];

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
    fontSize: 10,
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 9 },
};

function assuranceClass(state: AssuranceState) {
  if (state === "Blocked") return "border-red/30 bg-red/8 text-red";
  if (state === "Review") return "border-amber/30 bg-amber/8 text-amber";
  return "border-green/30 bg-green/8 text-green";
}

function Sustainability() {
  const { site, scenarioId, scenario } = useDemoSimulation();
  const [activeTab, setActiveTab] = useState<Tab>("Inventory");
  const [method, setMethod] = useState<CarbonMethod>("Market-based");
  const [message, setMessage] = useState("");
  const inventory = useMemo(
    () => getSustainabilityInventory(site.name, site.powerScale, scenarioId),
    [scenarioId, site.name, site.powerScale],
  );

  const ytdTotal =
    inventory.scope1Tco2e +
    (method === "Location-based" ? inventory.scope2LocationTco2e : inventory.scope2MarketTco2e);
  const targetGap = inventory.targetYtdTco2e - ytdTotal;
  const reductionVsBaseline =
    ((inventory.baselineYearTco2e - inventory.forecastYearEndTco2e) /
      inventory.baselineYearTco2e) *
    100;
  const sourceMix = [
    { name: "Scope 1", value: inventory.scope1Tco2e, fill: "var(--color-amber)" },
    {
      name: method === "Location-based" ? "Scope 2 location" : "Scope 2 market",
      value:
        method === "Location-based"
          ? inventory.scope2LocationTco2e
          : inventory.scope2MarketTco2e,
      fill: "var(--color-cyan)",
    },
  ];
  const trajectory = inventory.months.map((point, index) => ({
    ...point,
    actual: point.scope1Tco2e +
      (method === "Location-based"
        ? point.scope2LocationTco2e
        : point.scope2MarketTco2e),
    isForecast: index > 6,
  }));
  const cumulative = trajectory.map((point, index) => ({
    month: point.month,
    actual: trajectory
      .slice(0, index + 1)
      .reduce((total, item) => total + item.actual, 0),
    target: trajectory
      .slice(0, index + 1)
      .reduce((total, item) => total + item.targetTco2e, 0),
  }));

  return (
    <AppShell
      title="Sustainability Assurance"
      subtitle="Traceable energy, Scope 1/2 inventory, targets, renewable attributes, and reporting confidence"
      toolbar={
        <div className="flex items-center gap-2">
          <div className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[10px] ${assuranceClass(inventory.assuranceState)}`}>
            <ShieldCheck className="size-3.5" /> {inventory.assuranceState} for reporting
          </div>
          <label className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground">
            Scope 2 method
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as CarbonMethod)}
              className="bg-transparent font-medium text-foreground focus:outline-none"
            >
              <option>Market-based</option>
              <option>Location-based</option>
            </select>
          </label>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile label="Scope 1 YTD" value={fmtNum(inventory.scope1Tco2e)} unit="tCO₂e" hint="fuel and refrigerant activity" />
        <KpiTile label="Scope 2 Location" value={fmtNum(inventory.scope2LocationTco2e)} unit="tCO₂e" hint="regional grid factor" />
        <KpiTile label="Scope 2 Market" value={fmtNum(inventory.scope2MarketTco2e)} unit="tCO₂e" hint="supplier mix and attributes" tone="good" />
        <KpiTile label={`${method} Intensity`} value={(method === "Location-based" ? inventory.intensityLocationTco2ePerKt : inventory.intensityMarketTco2ePerKt).toFixed(2)} unit="t/kt" hint="normalized by production" />
        <KpiTile label="Renewable Share" value={inventory.renewableSharePct.toFixed(1)} unit="%" hint="on-site and allocated" tone="good" />
        <KpiTile label="Target Margin" value={fmtNum(Math.abs(targetGap))} unit="tCO₂e" hint={targetGap >= 0 ? "below YTD target" : "above YTD target"} tone={targetGap >= 0 ? "good" : "critical"} />
      </div>

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
          <span className="ml-auto hidden pr-2 text-[9.5px] text-muted-foreground lg:inline">
            {inventory.boundary}
          </span>
        </div>
      </section>

      {message && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-primary/25 bg-primary/8 px-3 py-2 text-[10px]">
          <FileCheck2 className="size-3.5 text-primary" /> {message}
        </div>
      )}

      {activeTab === "Inventory" && (
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel
            title="Monthly Emissions by Scope"
            className="h-[390px] xl:col-span-8"
            actions={<span className="text-[9.5px] text-muted-foreground">actual through Jul · deterministic forecast Aug–Dec</span>}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trajectory} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis {...chartAxis} width={52} tickFormatter={(value: number) => fmtNum(value)} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [`${fmtNum(Number(value))} tCO₂e`, name]} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="scope1Tco2e" name="Scope 1" stackId="carbon" fill="var(--color-amber)" radius={[2, 2, 0, 0]} />
                <Bar dataKey={method === "Location-based" ? "scope2LocationTco2e" : "scope2MarketTco2e"} name={method === "Location-based" ? "Scope 2 location" : "Scope 2 market"} stackId="carbon" fill="var(--color-cyan)" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="targetTco2e" name="Target" stroke="var(--color-green)" strokeWidth={1.8} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Inventory Reconciliation" className="xl:col-span-4">
            <div className="grid gap-4 lg:grid-cols-[170px_1fr] xl:grid-cols-1 2xl:grid-cols-[170px_1fr]">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="var(--color-surface)">
                      {sourceMix.map((item) => <Cell key={item.name} fill={item.fill} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(value: number | string) => `${fmtNum(Number(value))} tCO₂e`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 text-[10.5px]">
                <Info label="Reporting boundary" value={inventory.boundary} />
                <Info label="Reporting year" value={String(inventory.reportingYear)} />
                <Info label="Location-based total" value={`${fmtNum(inventory.scope1Tco2e + inventory.scope2LocationTco2e)} tCO₂e`} />
                <Info label="Market-based total" value={`${fmtNum(inventory.scope1Tco2e + inventory.scope2MarketTco2e)} tCO₂e`} />
                <Info label="Method difference" value={`${fmtNum(inventory.scope2LocationTco2e - inventory.scope2MarketTco2e)} tCO₂e`} />
              </div>
            </div>
            <div className="mt-4 rounded-md border border-border bg-surface-2 p-3 text-[10px] leading-relaxed text-muted-foreground">
              Location-based and market-based Scope 2 values remain separate. Renewable attributes reduce only the configured market-based result; they do not rewrite physical grid consumption.
            </div>
          </Panel>

          <Panel title="Emission-factor Registry" className="xl:col-span-12" actions={<span className="text-[9.5px] text-muted-foreground">configured factors · version and applicability retained</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-[10.5px]">
                <thead><tr className="border-b border-border text-left text-[9px] uppercase tracking-[0.11em] text-muted-foreground"><th className="py-2 font-normal">Factor ID</th><th className="py-2 font-normal">Activity</th><th className="py-2 font-normal">Scope</th><th className="py-2 font-normal text-right">Factor</th><th className="py-2 font-normal">Unit</th><th className="py-2 font-normal">Version</th><th className="py-2 font-normal">Effective period</th><th className="py-2 font-normal">Quality</th></tr></thead>
                <tbody className="divide-y divide-border">{inventory.factors.map((factor) => <tr key={factor.id} className="hover:bg-surface-2/60"><td className="py-2.5 tabular text-muted-foreground">{factor.id}</td><td className="py-2.5 font-medium">{factor.activity}<div className="text-[9px] font-normal text-muted-foreground">{factor.source}</div></td><td className="py-2.5">{factor.scope}</td><td className="py-2.5 text-right tabular">{factor.factor}</td><td className="py-2.5">{factor.unit}</td><td className="py-2.5 tabular">{factor.version}</td><td className="py-2.5 tabular">{factor.effectiveFrom} → {factor.effectiveTo}</td><td className="py-2.5"><span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[9px]">{factor.quality}</span></td></tr>)}</tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "Target & Forecast" && (
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel title="Cumulative Carbon Trajectory" className="h-[420px] xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">YTD actual plus year-end forecast</span>}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulative} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs><linearGradient id="carbonArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis {...chartAxis} width={62} tickFormatter={(value: number) => fmtNum(value)} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [`${fmtNum(Number(value))} tCO₂e`, name]} />
                <Area type="monotone" dataKey="actual" name="Actual / forecast" stroke="var(--color-cyan)" strokeWidth={2.2} fill="url(#carbonArea)" />
                <Line type="monotone" dataKey="target" name="Target" stroke="var(--color-green)" strokeWidth={1.8} strokeDasharray="5 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Management Outlook" className="xl:col-span-4">
            <div className="space-y-3">
              <Metric label="2025 baseline" value={`${fmtNum(inventory.baselineYearTco2e)} tCO₂e`} />
              <Metric label="2026 forecast" value={`${fmtNum(inventory.forecastYearEndTco2e)} tCO₂e`} tone={reductionVsBaseline >= 0 ? "good" : "warn"} />
              <Metric label="Forecast reduction" value={`${reductionVsBaseline.toFixed(1)}%`} tone={reductionVsBaseline >= 5 ? "good" : "warn"} />
              <Metric label="YTD target margin" value={`${targetGap >= 0 ? "+" : "−"}${fmtNum(Math.abs(targetGap))} tCO₂e`} tone={targetGap >= 0 ? "good" : "warn"} />
            </div>
            <div className={`mt-4 rounded-md border p-3 ${targetGap >= 0 ? "border-green/25 bg-green/8" : "border-amber/30 bg-amber/8"}`}>
              <div className="flex items-center gap-2 text-[11px] font-medium">{targetGap >= 0 ? <BadgeCheck className="size-4 text-green" /> : <CircleAlert className="size-4 text-amber" />}{targetGap >= 0 ? "Trajectory remains below configured YTD target" : "Corrective action required"}</div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">The forecast inherits the selected simulation scenario. It is a management-planning estimate, not an externally assured forecast.</p>
            </div>
          </Panel>

          <Panel title="Reduction Levers" className="xl:col-span-12">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: SunMedium, title: "On-site renewable generation", value: `${fmtNum(inventory.months.slice(0, 7).reduce((total, point) => total + point.renewableMWh, 0))} MWh YTD`, detail: "Physical generation measured at inverter meters." },
                { icon: Target, title: "Verified efficiency savings", value: "194,004 kWh/yr", detail: "Chiller sequencing result from the verified-savings ledger." },
                { icon: Leaf, title: "Market-based instruments", value: `${fmtNum(inventory.instruments.reduce((total, item) => total + item.allocatedMWh, 0))} MWh`, detail: "Allocated volume remains separate from physical energy reduction." },
                { icon: ShieldCheck, title: "Data and factor assurance", value: `${inventory.dataCompletenessPct.toFixed(1)}% complete`, detail: `${inventory.estimatedCoveragePct.toFixed(1)}% estimated or substituted activity.` },
              ].map(({ icon: Icon, title, value, detail }) => <div key={title} className="rounded-md border border-border bg-surface-2 p-3"><Icon className="size-4 text-primary" /><div className="mt-3 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{title}</div><div className="mt-1 text-[14px] font-medium tabular">{value}</div><p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">{detail}</p></div>)}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "Renewable Attributes" && (
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel title="Renewable Energy Balance" className="h-[380px] xl:col-span-7" actions={<span className="text-[9.5px] text-muted-foreground">physical generation and contractual allocation</span>}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventory.months} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis {...chartAxis} width={52} tickFormatter={(value: number) => fmtNum(value)} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [`${fmtNum(Number(value))} MWh`, name]} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="renewableMWh" name="On-site renewable" fill="var(--color-green)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="gridMWh" name="Grid electricity" fill="var(--color-cyan)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Attribute Reconciliation" className="xl:col-span-5">
            <div className="space-y-3">
              {inventory.instruments.map((instrument) => (
                <div key={instrument.id} className="rounded-md border border-border bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-3"><div><div className="text-[9px] tabular text-muted-foreground">{instrument.id}</div><div className="mt-0.5 text-[11px] font-medium">{instrument.type}</div></div><span className={`rounded border px-1.5 py-0.5 text-[9px] ${instrument.status === "Review required" ? "border-amber/30 bg-amber/8 text-amber" : instrument.status === "Retired" ? "border-green/30 bg-green/8 text-green" : "border-border bg-surface text-muted-foreground"}`}>{instrument.status}</span></div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[9.5px]"><Info label="Volume" value={`${fmtNum(instrument.volumeMWh)} MWh`} /><Info label="Allocated" value={`${fmtNum(instrument.allocatedMWh)} MWh`} /><Info label="Remaining" value={`${fmtNum(instrument.remainingMWh)} MWh`} /></div>
                  <div className="mt-2 text-[9.5px] leading-relaxed text-muted-foreground">{instrument.vintage} · {instrument.geography}<br />{instrument.evidence}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Renewable-attribute Register" className="xl:col-span-12">
            <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-[10.5px]"><thead><tr className="border-b border-border text-left text-[9px] uppercase tracking-[0.11em] text-muted-foreground"><th className="py-2 font-normal">Instrument</th><th className="py-2 font-normal">Type</th><th className="py-2 font-normal">Vintage / geography</th><th className="py-2 text-right font-normal">Volume</th><th className="py-2 text-right font-normal">Allocated</th><th className="py-2 text-right font-normal">Remaining</th><th className="py-2 font-normal">Evidence</th><th className="py-2 font-normal">Status</th></tr></thead><tbody className="divide-y divide-border">{inventory.instruments.map((instrument) => <tr key={instrument.id}><td className="py-2.5 tabular text-muted-foreground">{instrument.id}</td><td className="py-2.5 font-medium">{instrument.type}</td><td className="py-2.5">{instrument.vintage}<div className="text-[9px] text-muted-foreground">{instrument.geography}</div></td><td className="py-2.5 text-right tabular">{fmtNum(instrument.volumeMWh)} MWh</td><td className="py-2.5 text-right tabular">{fmtNum(instrument.allocatedMWh)} MWh</td><td className="py-2.5 text-right tabular">{fmtNum(instrument.remainingMWh)} MWh</td><td className="py-2.5 text-[9.5px] text-muted-foreground">{instrument.evidence}</td><td className="py-2.5">{instrument.status}</td></tr>)}</tbody></table></div>
          </Panel>
        </div>
      )}

      {activeTab === "Assurance" && (
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel title="Inventory Assurance Gate" className="xl:col-span-7" actions={<span className={`rounded border px-1.5 py-0.5 text-[9px] ${assuranceClass(inventory.assuranceState)}`}>{inventory.assuranceState}</span>}>
            <div className="space-y-2">
              {inventory.checks.map((check) => (
                <div key={check.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-md border border-border bg-surface-2 p-3">
                  <span className={`mt-0.5 flex size-5 items-center justify-center rounded-full border text-[10px] ${check.passed ? "border-green/30 bg-green/8 text-green" : "border-red/30 bg-red/8 text-red"}`}>{check.passed ? "✓" : "!"}</span>
                  <div><div className="text-[10.5px] font-medium">{check.label}</div><div className="mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground">{check.detail}</div><div className="mt-1 text-[9px] text-muted-foreground">Owner: {check.owner}</div></div>
                  <span className={`rounded border px-1.5 py-0.5 text-[8.5px] ${check.blocking ? "border-amber/30 text-amber" : "border-border text-muted-foreground"}`}>{check.blocking ? "Blocking" : "Review"}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Reporting Readiness" className="xl:col-span-5">
            <div className={`rounded-md border p-3 ${assuranceClass(inventory.assuranceState)}`}>
              <div className="flex items-center gap-2 text-[11.5px] font-medium">{inventory.assuranceState === "Ready" ? <BadgeCheck className="size-4" /> : <CircleAlert className="size-4" />}{inventory.assuranceState === "Ready" ? "Inventory is ready for internal report approval" : "Report approval remains restricted"}</div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">The open-source demo records configured evidence and workflow gates. It does not perform external assurance or statutory filing.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3"><Info label="Completeness" value={`${inventory.dataCompletenessPct.toFixed(1)}%`} /><Info label="Estimated coverage" value={`${inventory.estimatedCoveragePct.toFixed(1)}%`} /><Info label="Factor records" value={String(inventory.factors.length)} /><Info label="Renewable instruments" value={String(inventory.instruments.length)} /></div>
            <button type="button" onClick={() => setMessage(inventory.assuranceState === "Ready" ? "Internal report-approval task prepared. No external submission was made." : "Assurance remediation task prepared for the failed blocking check.")} className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-[11px] font-medium text-primary-foreground"><FileCheck2 className="size-3.5" />{inventory.assuranceState === "Ready" ? "Prepare approval task" : "Prepare remediation task"}</button>
          </Panel>

          <Panel title="Scenario and Data Consequence" className="xl:col-span-12">
            <div className="grid gap-3 md:grid-cols-3"><Metric label="Active simulation" value={scenario.name} /><Metric label="Inventory confidence" value={`${inventory.dataCompletenessPct.toFixed(1)}% complete`} tone={inventory.dataCompletenessPct >= 95 ? "good" : "warn"} /><Metric label="Reporting state" value={inventory.assuranceState} tone={inventory.assuranceState === "Ready" ? "good" : "warn"} /></div>
            <p className="mt-3 text-[9.5px] leading-relaxed text-muted-foreground">A billing-data exception also lowers carbon activity confidence because the same interval and allocation chain can feed energy, billing, and sustainability calculations. The consequence is surfaced rather than silently hidden.</p>
          </Panel>
        </div>
      )}

      <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-[9.5px] text-muted-foreground">
        Demonstration boundary: configured activity data, factor versions, and renewable instruments are illustrative. The workspace is not an externally assured greenhouse-gas statement, statutory filing, or certificate-retirement registry.
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-0.5 text-[10px] font-medium leading-relaxed tabular">{value}</div></div>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="text-[9px] uppercase tracking-[0.11em] text-muted-foreground">{label}</div><div className={`mt-1 text-[14px] font-medium tabular ${tone === "good" ? "text-green" : tone === "warn" ? "text-amber" : ""}`}>{value}</div></div>;
}
