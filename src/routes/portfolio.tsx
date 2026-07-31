import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ReferenceDot,
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
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Database,
  Gauge,
  Leaf,
  MapPinned,
  ShieldCheck,
  TrendingDown,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChartLegend, KpiTile, Panel } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import { demoSites, useDemoSimulation } from "@/lib/demo-simulation";
import { buildPortfolioSites, getPortfolioTrend, type PortfolioSite, type PortfolioSiteStatus } from "@/lib/portfolio-health";

export const Route = createFileRoute("/portfolio")({
  component: Portfolio,
  head: () => ({
    meta: [
      { title: "Portfolio — ArGrid" },
      {
        name: "description",
        content: "Multi-site energy, cost, demand, savings, opportunity, and data-confidence benchmarking.",
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
    fontSize: 10,
  },
};

function statusClass(status: PortfolioSiteStatus) {
  if (status === "Critical") return "border-red/30 bg-red/8 text-red";
  if (status === "Watch") return "border-amber/30 bg-amber/8 text-amber";
  return "border-green/30 bg-green/8 text-green";
}

function statusColor(status: PortfolioSiteStatus) {
  if (status === "Critical") return "var(--color-red)";
  if (status === "Watch") return "var(--color-amber)";
  return "var(--color-green)";
}

function PortfolioTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PortfolioSite }> }) {
  const site = payload?.[0]?.payload;
  if (!active || !site) return null;
  return (
    <div className="rounded-md border border-border-strong bg-surface p-2.5 text-[10px] shadow-lg">
      <div className="font-semibold">{site.name}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
        <span>Intensity index</span><span className="text-right tabular text-foreground">{site.energyIntensityIndex}</span>
        <span>Budget variance</span><span className="text-right tabular text-foreground">{site.budgetVariancePct.toFixed(1)}%</span>
        <span>Opportunity</span><span className="text-right tabular text-foreground">{fmtIDR(site.opportunityValueIDR)}</span>
        <span>Data confidence</span><span className="text-right tabular text-foreground">{site.dataConfidencePct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

type ScatterHaloProps = { cx?: number; cy?: number; size?: number };

function SelectedSiteHalo({ cx, cy, size }: ScatterHaloProps) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;
  const radius = Math.sqrt(Math.max(size ?? 90, 1) / Math.PI) + 5;
  return <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--color-primary)" strokeWidth={2} opacity={0.78} />;
}

function Portfolio() {
  const navigate = useNavigate();
  const { siteId, setSiteId, scenarioId, scenario } = useDemoSimulation();
  const sites = useMemo(() => buildPortfolioSites(siteId, scenarioId), [scenarioId, siteId]);
  const [selectedId, setSelectedId] = useState<PortfolioSite["id"]>(siteId);
  const selected = sites.find((site) => site.id === selectedId) ?? sites[0];
  const trend = useMemo(() => getPortfolioTrend(), []);
  const latestPortfolioPoint = trend[trend.length - 1];
  const regionGroups = useMemo(() => {
    const groups = new Map<string, PortfolioSite[]>();
    sites.forEach((site) => groups.set(site.region, [...(groups.get(site.region) ?? []), site]));
    return Array.from(groups.entries());
  }, [sites]);

  const totals = sites.reduce(
    (sum, site) => ({
      energyMWh: sum.energyMWh + site.energyMWh,
      costIDR: sum.costIDR + site.mtdCostIDR,
      verifiedIDR: sum.verifiedIDR + site.verifiedSavingsIDR,
      opportunityIDR: sum.opportunityIDR + site.opportunityValueIDR,
      alarms: sum.alarms + site.criticalAlarms,
      confidenceWeight: sum.confidenceWeight + site.dataConfidencePct * site.energyMWh,
    }),
    { energyMWh: 0, costIDR: 0, verifiedIDR: 0, opportunityIDR: 0, alarms: 0, confidenceWeight: 0 },
  );
  const portfolioConfidence = totals.confidenceWeight / Math.max(1, totals.energyMWh);
  const criticalSites = sites.filter((site) => site.status === "Critical");
  const weightedBudgetVariance = sites.reduce((sum, site) => sum + site.budgetVariancePct * site.mtdCostIDR, 0) / totals.costIDR;
  const bestSite = [...sites].sort((a, b) => a.energyIntensityIndex - b.energyIntensityIndex)[0];
  const prioritySite = [...sites].sort((a, b) => b.opportunityValueIDR + b.mtdCostIDR * Math.max(0, b.budgetVariancePct) / 100 - (a.opportunityValueIDR + a.mtdCostIDR * Math.max(0, a.budgetVariancePct) / 100))[0];

  const openSelectedSite = () => {
    const interactiveSite = demoSites.find((candidate) => candidate.id === selected.id);
    if (interactiveSite) {
      setSiteId(interactiveSite.id);
      void navigate({ to: "/" });
    }
  };

  return (
    <AppShell
      title="Enterprise Portfolio"
      subtitle="Multi-site energy, cost, demand, opportunity, savings, and data-confidence benchmarking"
      toolbar={
        <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground" title={scenario.description}>
          <MapPinned className="size-3.5 text-primary" /> 6 sites · {scenario.name}
        </div>
      }
    >
      <div className="space-y-3">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiTile label="Portfolio Energy" value={fmtNum(totals.energyMWh)} unit="MWh" hint="month to date" />
          <KpiTile label="MTD Cost" value={fmtIDR(totals.costIDR)} hint={`${weightedBudgetVariance >= 0 ? "+" : ""}${weightedBudgetVariance.toFixed(1)}% vs budget`} tone={weightedBudgetVariance > 2 ? "warning" : "good"} />
          <KpiTile label="Verified Savings" value={fmtIDR(totals.verifiedIDR)} hint="approved ledger value" tone="good" />
          <KpiTile label="Opportunity Value" value={fmtIDR(totals.opportunityIDR)} hint="identified annual value" />
          <KpiTile label="Critical Sites" value={String(criticalSites.length)} hint={`${totals.alarms} critical alarms`} tone={criticalSites.length > 0 ? "critical" : "good"} />
          <KpiTile label="Data Confidence" value={portfolioConfidence.toFixed(1)} unit="%" hint="energy-weighted" tone={portfolioConfidence >= 97 ? "good" : "warning"} />
        </section>

        <section className="rounded-lg border border-primary/25 bg-primary/6 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><AlertTriangle className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Portfolio decision</span><span className="rounded border border-primary/25 bg-surface px-1.5 py-0.5 text-[9.5px] text-primary">ranked by value and consequence</span></div>
              <p className="mt-1 text-[12px] leading-relaxed">
                <strong className="font-semibold">{prioritySite.name}</strong> carries {fmtIDR(prioritySite.opportunityValueIDR)} annual opportunity and a {prioritySite.budgetVariancePct.toFixed(1)}% cost variance. {bestSite.name} is the current intensity benchmark at index {bestSite.energyIntensityIndex}.
              </p>
            </div>
            <button type="button" onClick={() => setSelectedId(prioritySite.id)} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[10.5px] font-medium text-primary-foreground">Review priority site <ArrowRight className="size-3.5" /></button>
          </div>
        </section>

        <section className="portfolio-geo-strip" aria-label="Portfolio geographic footprint">
          <div className="portfolio-geo-heading">
            <span className="portfolio-geo-icon"><MapPinned className="size-3.5" /></span>
            <div><div className="portfolio-geo-eyebrow">Portfolio footprint</div><div className="portfolio-geo-summary">{sites.length} connected sites across {regionGroups.length} operating regions</div></div>
          </div>
          <div className="portfolio-geo-regions">
            {regionGroups.map(([region, regionSites]) => (
              <div key={region} className="portfolio-region-group">
                <div className="portfolio-region-label"><span>{region}</span><span className="tabular">{regionSites.length}</span></div>
                <div className="portfolio-region-sites">
                  {regionSites.map((site) => (
                    <button key={site.id} type="button" onClick={() => setSelectedId(site.id)} className={`portfolio-region-site ${selected.id === site.id ? "is-selected" : ""}`} aria-pressed={selected.id === site.id} title={`${site.name} · ${site.status}`}>
                      <span className="portfolio-region-dot" style={{ backgroundColor: statusColor(site.status) }} />
                      <span>{site.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel
            variant="primary"
            title="Performance Constellation"
            className="h-[390px] xl:col-span-7"
            actions={
              <ChartLegend
                items={[
                  { label: "On target", color: "var(--color-green)" },
                  { label: "Watch", color: "var(--color-amber)" },
                  { label: "Critical", color: "var(--color-red)" },
                ]}
                note="bubble = annual opportunity"
              />
            }
          >
            <div className="portfolio-constellation">
              <span className="portfolio-quadrant-label is-leading">Leading benchmark</span>
              <span className="portfolio-quadrant-label is-cost-risk">Efficient · cost risk</span>
              <span className="portfolio-quadrant-label is-opportunity">Efficiency opportunity</span>
              <span className="portfolio-quadrant-label is-priority">Priority intervention</span>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 18, bottom: 12, left: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" />
                  <XAxis type="number" dataKey="energyIntensityIndex" name="Intensity" domain={[78, 118]} {...chartAxis} label={{ value: "Energy intensity index · lower is better", position: "insideBottom", offset: -4, fill: "var(--color-muted-foreground)", fontSize: 9 }} />
                  <YAxis type="number" dataKey="budgetVariancePct" name="Budget variance" domain={[-8, 12]} width={48} {...chartAxis} tickFormatter={(value: number) => `${value}%`} />
                  <ZAxis type="number" dataKey="opportunityValueIDR" range={[90, 520]} />
                  <ReferenceLine x={100} stroke="var(--color-border-strong)" strokeDasharray="4 4" />
                  <ReferenceLine y={0} stroke="var(--color-border-strong)" strokeDasharray="4 4" />
                  <Tooltip content={<PortfolioTooltip />} />
                  <Scatter data={sites} onClick={(point: PortfolioSite) => setSelectedId(point.id)} isAnimationActive={false}>
                    {sites.map((site) => <Cell key={site.id} fill={statusColor(site.status)} stroke={selected.id === site.id ? "var(--color-foreground)" : "var(--color-surface)"} strokeWidth={selected.id === site.id ? 2.4 : 1} />)}
                  </Scatter>
                  <Scatter data={[selected]} shape={<SelectedSiteHalo />} isAnimationActive={false} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Cost, Budget & Verified Value"
            className="h-[390px] xl:col-span-5"
            actions={
              <ChartLegend
                unit="IDR B"
                items={[
                  { label: "Actual", color: "var(--color-primary)" },
                  { label: "Budget", color: "var(--color-muted-foreground)", dashed: true },
                  { label: "Verified", color: "var(--color-green)" },
                ]}
              />
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs><linearGradient id="portfolioActual" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.01} /></linearGradient></defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis {...chartAxis} width={38} domain={[0, 13]} tickFormatter={(value: number) => `${value}B`} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [`IDR ${Number(value).toFixed(2)}B`, name]} />
                <Area type="monotone" dataKey="actual" name="Actual cost" stroke="var(--color-primary)" strokeWidth={1.8} fill="url(#portfolioActual)" />
                <Area type="monotone" dataKey="budget" name="Budget" stroke="var(--color-muted-foreground)" strokeDasharray="4 4" fill="transparent" />
                <Area type="monotone" dataKey="verified" name="Verified savings" stroke="var(--color-green)" strokeWidth={1.8} fill="transparent" />
                <ReferenceDot x={latestPortfolioPoint.month} y={latestPortfolioPoint.actual} r={3.4} fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Site Benchmark Matrix" className="xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">normalized for production, weather, and site type</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-[10.5px]">
                <thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.11em] text-muted-foreground"><th className="py-2 font-normal">Site</th><th className="py-2 font-normal">Status</th><th className="py-2 font-normal text-right">Intensity</th><th className="py-2 font-normal text-right">Demand</th><th className="py-2 font-normal text-right">Budget</th><th className="py-2 font-normal text-right">Renewable</th><th className="py-2 font-normal text-right">Data confidence</th><th className="py-2 font-normal text-right">Opportunity</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {[...sites].sort((a, b) => a.energyIntensityIndex - b.energyIntensityIndex).map((site, index) => (
                    <tr
                      key={site.id}
                      tabIndex={0}
                      aria-label={`Select ${site.name}`}
                      aria-selected={selected.id === site.id}
                      onClick={() => setSelectedId(site.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(site.id);
                        }
                      }}
                      className={`portfolio-benchmark-row cursor-pointer hover:bg-surface-2/70 ${selected.id === site.id ? "portfolio-benchmark-row-selected bg-primary/5" : ""}`}
                    >
                      <td className="py-2.5"><div className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded border border-border bg-surface-2 text-[9.5px] tabular">{index + 1}</span><div><div className="font-semibold">{site.name}</div><div className="text-[9.5px] text-muted-foreground">{site.type} · {site.region}</div></div></div></td>
                      <td className="py-2.5"><span className={`inline-flex rounded border px-1.5 py-0.5 text-[9.5px] ${statusClass(site.status)}`}>{site.status}</span></td>
                      <td className="py-2.5 text-right"><div className="benchmark-cell"><div className="tabular"><span className={site.energyIntensityIndex <= site.targetIntensityIndex ? "text-green" : "text-amber"}>{site.energyIntensityIndex}</span><span className="text-muted-foreground"> / {site.targetIntensityIndex}</span></div><MiniBar value={(site.energyIntensityIndex / 120) * 100} tone={site.energyIntensityIndex <= site.targetIntensityIndex ? "good" : "warning"} /></div></td>
                      <td className="py-2.5 text-right"><div className="benchmark-cell"><div className="tabular">{site.demandUtilizationPct.toFixed(1)}%</div><MiniBar value={site.demandUtilizationPct} tone={site.demandUtilizationPct >= 95 ? "critical" : site.demandUtilizationPct >= 85 ? "warning" : "primary"} /></div></td>
                      <td className={`py-2.5 text-right tabular ${site.budgetVariancePct > 2 ? "text-red" : site.budgetVariancePct < 0 ? "text-green" : ""}`}>{site.budgetVariancePct >= 0 ? "+" : ""}{site.budgetVariancePct.toFixed(1)}%</td>
                      <td className="py-2.5 text-right tabular">{site.renewableSharePct.toFixed(1)}%</td>
                      <td className="py-2.5 text-right"><div className="benchmark-cell"><div className="tabular">{site.dataConfidencePct.toFixed(1)}%</div><MiniBar value={site.dataConfidencePct} tone={site.dataConfidencePct >= 97 ? "good" : "warning"} /></div></td>
                      <td className="py-2.5 text-right font-semibold tabular">{fmtIDR(site.opportunityValueIDR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel variant="quiet" title="Management Profile" className="xl:col-span-4" actions={<span className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">Selected site</span>}>
            <div className="space-y-3">
              <div className="portfolio-identity">
                <span className="portfolio-identity-mark"><Building2 className="size-4" /></span>
                <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold">{selected.name}</div><div className="mt-0.5 truncate text-[9.5px] text-muted-foreground">{selected.type} · {selected.region}</div></div>
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9.5px] ${statusClass(selected.status)}`}>{selected.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Metric icon={Zap} label="MTD energy" value={`${fmtNum(selected.energyMWh)} MWh`} />
                <Metric icon={CircleDollarSign} label="MTD cost" value={fmtIDR(selected.mtdCostIDR)} />
                <Metric icon={Gauge} label="Demand utilization" value={`${selected.demandUtilizationPct.toFixed(1)}%`} tone={selected.demandUtilizationPct >= 95 ? "critical" : "neutral"} />
                <Metric icon={Leaf} label="Renewable share" value={`${selected.renewableSharePct.toFixed(1)}%`} tone="good" />
                <Metric icon={TrendingDown} label="Verified savings" value={fmtIDR(selected.verifiedSavingsIDR)} tone="good" />
                <Metric icon={Database} label="Data confidence" value={`${selected.dataConfidencePct.toFixed(1)}%`} tone={selected.dataConfidencePct < 97 ? "warning" : "good"} />
              </div>

              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between text-[9.5px]"><span className="font-semibold uppercase tracking-[0.11em] text-muted-foreground">Normalized intensity</span><span className="tabular">{selected.energyIntensityIndex} / target {selected.targetIntensityIndex}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3"><div className={`h-full ${selected.energyIntensityIndex <= selected.targetIntensityIndex ? "bg-green" : "bg-amber"}`} style={{ width: `${Math.min(100, (selected.energyIntensityIndex / 120) * 100)}%` }} /></div>
                <div className="mt-2 text-[9.5px] text-muted-foreground">Basis: {selected.outputUnit} · production index {selected.productionIndex}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]"><Info label="Annual opportunity" value={fmtIDR(selected.opportunityValueIDR)} /><Info label="Critical alarms" value={String(selected.criticalAlarms)} /><Info label="Floor area" value={`${fmtNum(selected.floorAreaM2)} m²`} /><Info label="Budget variance" value={`${selected.budgetVariancePct >= 0 ? "+" : ""}${selected.budgetVariancePct.toFixed(1)}%`} /></div>

              {demoSites.some((candidate) => candidate.id === selected.id) ? (
                <button type="button" onClick={openSelectedSite} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-[10.5px] font-medium text-primary-foreground">Open live site overview <ArrowRight className="size-3.5" /></button>
              ) : (
                <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-[9.5px] text-muted-foreground">Static portfolio profile in this browser demo. Live drill-down is enabled for Cikarang, Batam, and Gresik.</div>
              )}
              <Link to="/data-health" className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-surface text-[10px] font-medium hover:bg-surface-2"><ShieldCheck className="size-3.5 text-green" />Review portfolio data confidence</Link>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function MiniBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "good" | "warning" | "critical" }) {
  return <span className={`benchmark-mini-bar benchmark-mini-bar-${tone}`} aria-hidden="true"><span style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></span>;
}

function Metric({ icon: Icon, label, value, tone = "neutral" }: { icon: typeof Building2; label: string; value: string; tone?: "neutral" | "good" | "warning" | "critical" }) {
  const toneClass = tone === "good" ? "text-green" : tone === "warning" ? "text-amber" : tone === "critical" ? "text-red" : "text-foreground";
  return <div className="rounded-md border border-border bg-surface-2 p-2.5"><div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground"><Icon className={`size-3.5 ${toneClass}`} />{label}</div><div className={`mt-1 text-[11.5px] font-semibold tabular ${toneClass}`}>{value}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-0.5 font-medium tabular">{value}</div></div>;
}
