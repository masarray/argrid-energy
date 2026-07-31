from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"{label} anchor not found in {path}")
    path.write_text(text.replace(old, new, 1))


ui = Path("src/components/argrid-ui.tsx")
replace_once(
    ui,
    '''export function KpiTile({''',
    '''export function ChartLegend({
  items,
  unit,
  note,
}: {
  items: Array<{ label: string; color: string; dashed?: boolean; muted?: boolean }>;
  unit?: string;
  note?: string;
}) {
  const accessibleLabel = [unit ? `Unit ${unit}` : "", ...items.map((item) => item.label), note ?? ""].filter(Boolean).join(", ");
  return (
    <div className="chart-legend" aria-label={accessibleLabel}>
      {unit && <span className="chart-legend-unit">{unit}</span>}
      {items.map((item) => (
        <span key={item.label} className={`chart-legend-item ${item.muted ? "is-muted" : ""}`}>
          <span
            className={`chart-legend-swatch ${item.dashed ? "is-dashed" : ""}`}
            style={{ backgroundColor: item.dashed ? "transparent" : item.color, borderTopColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
      {note && <span className="chart-legend-note">{note}</span>}
    </div>
  );
}

export function KpiTile({''',
    "ChartLegend component",
)

overview = Path("src/routes/index.tsx")
replace_once(
    overview,
    '''  Line,
  ReferenceLine,
  ResponsiveContainer,''',
    '''  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,''',
    "Overview Recharts imports",
)
replace_once(
    overview,
    '''import { KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";''',
    '''import { ChartLegend, KpiTile, Panel, SeverityDot } from "@/components/argrid-ui";''',
    "Overview ChartLegend import",
)
replace_once(
    overview,
    '''  const performanceTrend = useMemo(
    () =>
      weekComparison.map((day) => ({
        ...day,
        actual: Math.round(day.thisWeek * site.powerScale),
        target: Math.round(day.lastWeek * site.powerScale * 0.96),
      })),
    [site.powerScale],
  );

  const totalFeederPower''',
    '''  const performanceTrend = useMemo(
    () =>
      weekComparison.map((day) => ({
        ...day,
        actual: Math.round(day.thisWeek * site.powerScale),
        target: Math.round(day.lastWeek * site.powerScale * 0.96),
      })),
    [site.powerScale],
  );
  const latestDemandPoint = demandTrend[demandTrend.length - 1];

  const totalFeederPower''',
    "Overview latest demand point",
)
replace_once(
    overview,
    '''          <Panel title="Demand & Cost Outlook" className="h-[315px] xl:col-span-4" actions={<span className="text-[9.5px] text-muted-foreground tabular">Limit {telemetry.demandLimit.toFixed(1)} MW</span>}>''',
    '''          <Panel
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
          >''',
    "Overview demand legend",
)
replace_once(
    overview,
    '''                  <Tooltip {...tooltipStyle} formatter={(value: number | string) => [`${Number(value).toFixed(2)} MW`]} />
                  <ReferenceLine y={telemetry.demandLimit} stroke="var(--color-red)" strokeDasharray="5 4" label={{ value: "Contract", fill: "var(--color-red)", fontSize: 9, position: "insideTopRight" }} />
                  <Area type="monotone" dataKey="load" name="Actual demand" stroke="var(--color-primary)" strokeWidth={1.8} fill="url(#demandFill)" />
                  <Line type="monotone" dataKey="forecast" name="Projected" stroke="var(--color-amber)" strokeWidth={1.6} strokeDasharray="5 3" dot={false} />''',
    '''                  <Tooltip {...tooltipStyle} formatter={(value: number | string) => [`${Number(value).toFixed(2)} MW`]} />
                  <ReferenceArea y1={telemetry.demandLimit * 0.94} y2={telemetry.demandLimit} fill="var(--color-amber)" fillOpacity={0.07} ifOverflow="extendDomain" />
                  <ReferenceLine y={telemetry.demandLimit} stroke="var(--color-red)" strokeDasharray="5 4" label={{ value: "Contract", fill: "var(--color-red)", fontSize: 9, position: "insideTopRight" }} />
                  <Area type="monotone" dataKey="load" name="Actual demand" stroke="var(--color-primary)" strokeWidth={1.8} fill="url(#demandFill)" />
                  <Line type="monotone" dataKey="forecast" name="Projected" stroke="var(--color-amber)" strokeWidth={1.6} strokeDasharray="5 3" dot={false} />
                  <ReferenceDot x={latestDemandPoint.t} y={latestDemandPoint.load} r={3.4} fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth={1.5} />''',
    "Overview demand target band and marker",
)
replace_once(
    overview,
    '''          <Panel title="Energy Performance vs Normalized Target" className="h-[315px] xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">daily kWh · weather and production adjusted</span>}>''',
    '''          <Panel
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
          >''',
    "Overview performance legend",
)

portfolio = Path("src/routes/portfolio.tsx")
replace_once(
    portfolio,
    '''  Cell,
  ReferenceLine,
  ResponsiveContainer,''',
    '''  Cell,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,''',
    "Portfolio Recharts imports",
)
replace_once(
    portfolio,
    '''import { KpiTile, Panel } from "@/components/argrid-ui";''',
    '''import { ChartLegend, KpiTile, Panel } from "@/components/argrid-ui";''',
    "Portfolio ChartLegend import",
)
replace_once(
    portfolio,
    '''function Portfolio() {''',
    '''type ScatterHaloProps = { cx?: number; cy?: number; size?: number };

function SelectedSiteHalo({ cx, cy, size }: ScatterHaloProps) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;
  const radius = Math.sqrt(Math.max(size ?? 90, 1) / Math.PI) + 5;
  return <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--color-primary)" strokeWidth={2} opacity={0.78} />;
}

function Portfolio() {''',
    "Portfolio selected halo",
)
replace_once(
    portfolio,
    '''  const selected = sites.find((site) => site.id === selectedId) ?? sites[0];
  const trend = useMemo(() => getPortfolioTrend(), []);

  const totals''',
    '''  const selected = sites.find((site) => site.id === selectedId) ?? sites[0];
  const trend = useMemo(() => getPortfolioTrend(), []);
  const latestPortfolioPoint = trend[trend.length - 1];
  const regionGroups = useMemo(() => {
    const groups = new Map<string, PortfolioSite[]>();
    sites.forEach((site) => groups.set(site.region, [...(groups.get(site.region) ?? []), site]));
    return Array.from(groups.entries());
  }, [sites]);

  const totals''',
    "Portfolio region groups",
)
replace_once(
    portfolio,
    '''        </section>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel variant="primary" title="Performance Constellation"''',
    '''        </section>

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
          <Panel variant="primary" title="Performance Constellation"''',
    "Portfolio geographic strip",
)
replace_once(
    portfolio,
    '''          <Panel variant="primary" title="Performance Constellation" className="h-[390px] xl:col-span-7" actions={<span className="text-[9.5px] text-muted-foreground">bubble size = annual opportunity</span>}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 18, bottom: 12, left: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" />
                <XAxis type="number" dataKey="energyIntensityIndex" name="Intensity" domain={[78, 118]} {...chartAxis} label={{ value: "Energy intensity index · lower is better", position: "insideBottom", offset: -4, fill: "var(--color-muted-foreground)", fontSize: 9 }} />
                <YAxis type="number" dataKey="budgetVariancePct" name="Budget variance" domain={[-8, 12]} width={48} {...chartAxis} tickFormatter={(value: number) => `${value}%`} />
                <ZAxis type="number" dataKey="opportunityValueIDR" range={[90, 520]} />
                <ReferenceLine x={100} stroke="var(--color-border-strong)" strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke="var(--color-border-strong)" strokeDasharray="4 4" />
                <Tooltip content={<PortfolioTooltip />} />
                <Scatter data={sites} onClick={(point: PortfolioSite) => setSelectedId(point.id)}>
                  {sites.map((site) => <Cell key={site.id} fill={statusColor(site.status)} stroke={site.selected || selected.id === site.id ? "var(--color-foreground)" : "var(--color-surface)"} strokeWidth={site.selected || selected.id === site.id ? 2 : 1} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>''',
    '''          <Panel
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
          </Panel>''',
    "Portfolio constellation showcase",
)
replace_once(
    portfolio,
    '''          <Panel title="Cost, Budget & Verified Value" className="h-[390px] xl:col-span-5" actions={<span className="text-[9.5px] text-muted-foreground">IDR billions · monthly</span>}>''',
    '''          <Panel
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
          >''',
    "Portfolio cost legend",
)
replace_once(
    portfolio,
    '''                <Area type="monotone" dataKey="verified" name="Verified savings" stroke="var(--color-green)" strokeWidth={1.8} fill="transparent" />''',
    '''                <Area type="monotone" dataKey="verified" name="Verified savings" stroke="var(--color-green)" strokeWidth={1.8} fill="transparent" />
                <ReferenceDot x={latestPortfolioPoint.month} y={latestPortfolioPoint.actual} r={3.4} fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth={1.5} />''',
    "Portfolio latest cost marker",
)
replace_once(
    portfolio,
    '''                    <tr key={site.id} onClick={() => setSelectedId(site.id)} className={`cursor-pointer hover:bg-surface-2/70 ${selected.id === site.id ? "bg-primary/5" : ""}`}>
                      <td className="py-2.5"><div className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded border border-border bg-surface-2 text-[9px] tabular">{index + 1}</span><div><div className="font-semibold">{site.name}</div><div className="text-[9px] text-muted-foreground">{site.type} · {site.region}</div></div></div></td>
                      <td className="py-2.5"><span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] ${statusClass(site.status)}`}>{site.status}</span></td>
                      <td className="py-2.5 text-right tabular"><span className={site.energyIntensityIndex <= site.targetIntensityIndex ? "text-green" : "text-amber"}>{site.energyIntensityIndex}</span><span className="text-muted-foreground"> / {site.targetIntensityIndex}</span></td>
                      <td className="py-2.5 text-right tabular">{site.demandUtilizationPct.toFixed(1)}%</td>
                      <td className={`py-2.5 text-right tabular ${site.budgetVariancePct > 2 ? "text-red" : site.budgetVariancePct < 0 ? "text-green" : ""}`}>{site.budgetVariancePct >= 0 ? "+" : ""}{site.budgetVariancePct.toFixed(1)}%</td>
                      <td className="py-2.5 text-right tabular">{site.renewableSharePct.toFixed(1)}%</td>
                      <td className="py-2.5 text-right tabular">{site.dataConfidencePct.toFixed(1)}%</td>
                      <td className="py-2.5 text-right font-semibold tabular">{fmtIDR(site.opportunityValueIDR)}</td>
                    </tr>''',
    '''                    <tr key={site.id} onClick={() => setSelectedId(site.id)} aria-selected={selected.id === site.id} className={`portfolio-benchmark-row cursor-pointer hover:bg-surface-2/70 ${selected.id === site.id ? "portfolio-benchmark-row-selected bg-primary/5" : ""}`}>
                      <td className="py-2.5"><div className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded border border-border bg-surface-2 text-[9px] tabular">{index + 1}</span><div><div className="font-semibold">{site.name}</div><div className="text-[9px] text-muted-foreground">{site.type} · {site.region}</div></div></div></td>
                      <td className="py-2.5"><span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] ${statusClass(site.status)}`}>{site.status}</span></td>
                      <td className="py-2.5 text-right"><div className="benchmark-cell"><div className="tabular"><span className={site.energyIntensityIndex <= site.targetIntensityIndex ? "text-green" : "text-amber"}>{site.energyIntensityIndex}</span><span className="text-muted-foreground"> / {site.targetIntensityIndex}</span></div><MiniBar value={(site.energyIntensityIndex / 120) * 100} tone={site.energyIntensityIndex <= site.targetIntensityIndex ? "good" : "warning"} /></div></td>
                      <td className="py-2.5 text-right"><div className="benchmark-cell"><div className="tabular">{site.demandUtilizationPct.toFixed(1)}%</div><MiniBar value={site.demandUtilizationPct} tone={site.demandUtilizationPct >= 95 ? "critical" : site.demandUtilizationPct >= 85 ? "warning" : "primary"} /></div></td>
                      <td className={`py-2.5 text-right tabular ${site.budgetVariancePct > 2 ? "text-red" : site.budgetVariancePct < 0 ? "text-green" : ""}`}>{site.budgetVariancePct >= 0 ? "+" : ""}{site.budgetVariancePct.toFixed(1)}%</td>
                      <td className="py-2.5 text-right tabular">{site.renewableSharePct.toFixed(1)}%</td>
                      <td className="py-2.5 text-right"><div className="benchmark-cell"><div className="tabular">{site.dataConfidencePct.toFixed(1)}%</div><MiniBar value={site.dataConfidencePct} tone={site.dataConfidencePct >= 97 ? "good" : "warning"} /></div></td>
                      <td className="py-2.5 text-right font-semibold tabular">{fmtIDR(site.opportunityValueIDR)}</td>
                    </tr>''',
    "Portfolio benchmark mini bars",
)
replace_once(
    portfolio,
    '''          <Panel variant="quiet" title={`${selected.name} · Management Profile`} className="xl:col-span-4" actions={<span className={`rounded border px-1.5 py-0.5 text-[9px] ${statusClass(selected.status)}`}>{selected.status}</span>}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">''',
    '''          <Panel variant="quiet" title="Management Profile" className="xl:col-span-4" actions={<span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Selected site</span>}>
            <div className="space-y-3">
              <div className="portfolio-identity">
                <span className="portfolio-identity-mark"><Building2 className="size-4" /></span>
                <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold">{selected.name}</div><div className="mt-0.5 truncate text-[9.5px] text-muted-foreground">{selected.type} · {selected.region}</div></div>
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] ${statusClass(selected.status)}`}>{selected.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">''',
    "Portfolio identity header",
)
replace_once(
    portfolio,
    '''function Metric({ icon: Icon, label, value, tone = "neutral" }:''',
    '''function MiniBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "good" | "warning" | "critical" }) {
  return <span className={`benchmark-mini-bar benchmark-mini-bar-${tone}`} aria-hidden="true"><span style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></span>;
}

function Metric({ icon: Icon, label, value, tone = "neutral" }:''',
    "Portfolio MiniBar helper",
)

styles = Path("src/styles.css")
css = styles.read_text()
marker = '''.workspace-management main {
  background:'''
if marker not in css:
    raise SystemExit("P2 CSS insertion marker not found")
if "portfolio-geo-strip" in css:
    raise SystemExit("P2 CSS already exists")

p2_css = '''/* Public-launch P2: coherent chart chrome and portfolio showcase details. */
.chart-legend {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px 9px;
  color: var(--muted-foreground);
  font-size: 8.8px;
  line-height: 1;
}

.chart-legend-unit {
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface-2);
  padding: 3px 5px;
  color: var(--foreground);
  font-size: 8px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chart-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.chart-legend-item.is-muted {
  opacity: 0.72;
}

.chart-legend-swatch {
  width: 12px;
  height: 2px;
  flex: none;
  border-radius: 999px;
}

.chart-legend-swatch.is-dashed {
  height: 0;
  border-top-width: 1.5px;
  border-top-style: dashed;
  border-radius: 0;
}

.chart-legend-note {
  white-space: nowrap;
  color: color-mix(in oklab, var(--muted-foreground) 76%, transparent);
  font-size: 8.4px;
}

.portfolio-geo-strip {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid color-mix(in oklab, var(--border) 80%, transparent);
  border-radius: 8px;
  background: color-mix(in oklab, var(--surface) 76%, var(--surface-2));
  padding: 9px 12px;
}

.portfolio-geo-heading {
  display: flex;
  min-width: 180px;
  align-items: center;
  gap: 9px;
}

.portfolio-geo-icon,
.portfolio-identity-mark {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in oklab, var(--primary) 18%, var(--border));
  border-radius: 6px;
  background: color-mix(in oklab, var(--primary) 7%, var(--surface));
  color: var(--primary);
}

.portfolio-geo-eyebrow {
  font-size: 8.5px;
  font-weight: 650;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}

.portfolio-geo-summary {
  margin-top: 2px;
  font-size: 10px;
  color: var(--foreground);
}

.portfolio-geo-regions {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: stretch;
  justify-content: flex-end;
  gap: 8px;
}

.portfolio-region-group {
  min-width: 0;
  border-left: 1px solid var(--border);
  padding-left: 10px;
}

.portfolio-region-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted-foreground);
  font-size: 8.5px;
  font-weight: 600;
}

.portfolio-region-sites {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}

.portfolio-region-site {
  display: inline-flex;
  height: 22px;
  align-items: center;
  gap: 4px;
  border: 1px solid transparent;
  border-radius: 5px;
  padding: 0 6px;
  color: var(--muted-foreground);
  font-size: 8.8px;
  transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
}

.portfolio-region-site:hover,
.portfolio-region-site.is-selected {
  border-color: var(--border);
  background: var(--surface);
  color: var(--foreground);
}

.portfolio-region-site.is-selected {
  border-color: color-mix(in oklab, var(--primary) 28%, var(--border));
  box-shadow: inset 0 -1px 0 color-mix(in oklab, var(--primary) 54%, transparent);
}

.portfolio-region-dot {
  width: 5px;
  height: 5px;
  flex: none;
  border-radius: 999px;
}

.portfolio-constellation {
  position: relative;
  height: 100%;
}

.portfolio-quadrant-label {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  border: 1px solid color-mix(in oklab, var(--border) 72%, transparent);
  border-radius: 4px;
  background: color-mix(in oklab, var(--surface) 88%, transparent);
  padding: 3px 5px;
  color: color-mix(in oklab, var(--muted-foreground) 84%, transparent);
  font-size: 7.8px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  backdrop-filter: blur(2px);
}

.portfolio-quadrant-label.is-cost-risk { left: 12%; top: 7%; }
.portfolio-quadrant-label.is-priority { right: 4%; top: 7%; color: color-mix(in oklab, var(--red) 74%, var(--muted-foreground)); }
.portfolio-quadrant-label.is-leading { left: 12%; bottom: 12%; color: color-mix(in oklab, var(--green) 70%, var(--muted-foreground)); }
.portfolio-quadrant-label.is-opportunity { right: 4%; bottom: 12%; color: color-mix(in oklab, var(--amber) 72%, var(--muted-foreground)); }

.portfolio-benchmark-row {
  transition: background-color 120ms ease;
}

.portfolio-benchmark-row-selected td:first-child {
  box-shadow: inset 2px 0 0 var(--primary);
}

.benchmark-cell {
  display: inline-flex;
  min-width: 72px;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.benchmark-mini-bar {
  display: block;
  width: 58px;
  height: 2px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-3);
}

.benchmark-mini-bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}

.benchmark-mini-bar-good > span { background: var(--green); }
.benchmark-mini-bar-warning > span { background: var(--amber); }
.benchmark-mini-bar-critical > span { background: var(--red); }

.portfolio-identity {
  display: flex;
  align-items: center;
  gap: 9px;
  border-bottom: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  padding-bottom: 10px;
}

@media (max-width: 1023px) {
  .portfolio-geo-strip {
    align-items: flex-start;
    flex-direction: column;
  }

  .portfolio-geo-regions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .chart-legend-note {
    display: none;
  }

  .portfolio-geo-regions {
    flex-direction: column;
  }

  .portfolio-region-group {
    border-left: 0;
    border-top: 1px solid var(--border);
    padding-top: 6px;
    padding-left: 0;
  }
}

'''
styles.write_text(css.replace(marker, p2_css + marker, 1))
