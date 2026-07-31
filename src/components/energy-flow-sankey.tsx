import { useMemo, useState } from "react";

type SankeyMode = "power" | "cost" | "carbon";

type FlowItem = {
  name: string;
  value: number;
  color: string;
};

const consumers = [
  { name: "Production Lines", share: 0.44, color: "var(--color-primary)" },
  { name: "HVAC & Cooling", share: 0.19, color: "var(--color-cyan)" },
  { name: "Compressed Air", share: 0.13, color: "var(--color-amber)" },
  { name: "Site Utilities", share: 0.1, color: "var(--color-chart-4)" },
  { name: "Tenant & Support", share: 0.1, color: "var(--color-violet)" },
  { name: "Distribution Losses", share: 0.04, color: "var(--color-muted-foreground)" },
] as const;

const sourceColors = ["var(--color-primary)", "var(--color-green)", "var(--color-amber)"];

const modeLabels: Record<SankeyMode, string> = {
  power: "Power",
  cost: "Cost",
  carbon: "Carbon",
};

function formatFlowValue(value: number, mode: SankeyMode) {
  if (mode === "power") return `${value.toFixed(2)} MW`;
  if (mode === "cost") return `Rp ${value.toFixed(2)} M/h`;
  return `${value.toFixed(2)} tCO2e/h`;
}

function ribbonPath(x0: number, y0: number, x1: number, y1: number, width: number) {
  const half = Math.max(1.25, width / 2);
  const curve = x0 + (x1 - x0) * 0.5;
  return [
    `M ${x0} ${y0 - half}`,
    `C ${curve} ${y0 - half}, ${curve} ${y1 - half}, ${x1} ${y1 - half}`,
    `L ${x1} ${y1 + half}`,
    `C ${curve} ${y1 + half}, ${curve} ${y0 + half}, ${x0} ${y0 + half}`,
    "Z",
  ].join(" ");
}

function stackCenters(items: FlowItem[], top: number, height: number) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = top;
  return items.map((item) => {
    const width = total > 0 ? (item.value / total) * height : 0;
    const center = cursor + width / 2;
    cursor += width;
    return { center, width };
  });
}

export function EnergyFlowSankey({
  currentPower,
  scenarioId,
  dataHealth,
}: {
  currentPower: number;
  scenarioId: string;
  dataHealth: number;
}) {
  const [mode, setMode] = useState<SankeyMode>("power");

  const model = useMemo(() => {
    const solarShare = scenarioId === "peak-demand" ? 0.09 : 0.12;
    const generatorShare = scenarioId === "voltage-sag" ? 0.11 : 0.035;
    const utilityShare = 1 - solarShare - generatorShare;
    const sourcePower = [
      { name: "Utility Grid", mw: currentPower * utilityShare, rate: 1685, factor: 0.82 },
      { name: "Solar PV", mw: currentPower * solarShare, rate: 620, factor: 0.045 },
      { name: "Generator", mw: currentPower * generatorShare, rate: 2850, factor: 0.69 },
    ];

    const powerItems: FlowItem[] = sourcePower.map((source, index) => ({
      name: source.name,
      value: source.mw,
      color: sourceColors[index],
    }));
    const costItems: FlowItem[] = sourcePower.map((source, index) => ({
      name: source.name,
      value: (source.mw * 1000 * source.rate) / 1_000_000,
      color: sourceColors[index],
    }));
    const carbonItems: FlowItem[] = sourcePower.map((source, index) => ({
      name: source.name,
      value: source.mw * source.factor,
      color: sourceColors[index],
    }));
    const sourceSets: Record<SankeyMode, FlowItem[]> = {
      power: powerItems,
      cost: costItems,
      carbon: carbonItems,
    };
    const sourceItems = sourceSets[mode];
    const total = sourceItems.reduce((sum, item) => sum + item.value, 0);
    const consumerItems: FlowItem[] = consumers.map((consumer) => ({
      name: consumer.name,
      value: total * consumer.share,
      color: consumer.color,
    }));
    const totalCost = costItems.reduce((sum, item) => sum + item.value, 0);
    const totalCarbon = carbonItems.reduce((sum, item) => sum + item.value, 0);

    return {
      sourceItems,
      consumerItems,
      total,
      blendedRate: (totalCost * 1_000_000) / (currentPower * 1000),
      carbonFactor: totalCarbon / currentPower,
      shares: sourcePower.map((source) => ({ name: source.name, share: (source.mw / currentPower) * 100 })),
    };
  }, [currentPower, mode, scenarioId]);

  const sourceNodes = [76, 190, 304];
  const consumerNodes = [38, 101, 164, 227, 290, 353];
  const sourceStack = stackCenters(model.sourceItems, 141, 98);
  const consumerStack = stackCenters(model.consumerItems, 141, 98);
  const busLabel = mode === "power" ? "MAIN DISTRIBUTION BUS" : mode === "cost" ? "BLENDED ENERGY VALUE" : "ATTRIBUTED EMISSIONS";

  return (
    <div className="grid min-h-[382px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Source to bus to consumer reconciliation. Flow width follows the selected measure.
          </p>
          <div className="flex rounded-md border border-border bg-surface-2 p-0.5" role="tablist" aria-label="Energy flow measure">
            {(Object.keys(modeLabels) as SankeyMode[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => setMode(key)}
                className={`h-7 rounded px-3 text-[10px] font-medium transition-colors ${
                  mode === key ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {modeLabels[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-border bg-surface-2/45" tabIndex={0} role="region" aria-label={`${modeLabels[mode]} energy flow Sankey diagram`}>
          <svg viewBox="0 0 920 390" className="block min-w-[720px]" role="img" aria-labelledby="sankey-title sankey-description">
            <title id="sankey-title">{modeLabels[mode]} energy flow</title>
            <desc id="sankey-description">Utility grid, solar PV, and generator supply the main distribution bus, which serves five consumer groups and distribution losses.</desc>
            <g opacity="0.72">
              {model.sourceItems.map((item, index) => (
                <path
                  key={`source-${item.name}`}
                  d={ribbonPath(166, sourceNodes[index], 405, sourceStack[index].center, sourceStack[index].width)}
                  fill={item.color}
                  fillOpacity={0.38}
                  stroke={item.color}
                  strokeOpacity={0.46}
                  strokeWidth={0.8}
                >
                  <title>{`${item.name}: ${formatFlowValue(item.value, mode)}`}</title>
                </path>
              ))}
              {model.consumerItems.map((item, index) => (
                <path
                  key={`consumer-${item.name}`}
                  d={ribbonPath(535, consumerStack[index].center, 744, consumerNodes[index], consumerStack[index].width)}
                  fill={item.color}
                  fillOpacity={index === model.consumerItems.length - 1 ? 0.22 : 0.34}
                  stroke={item.color}
                  strokeOpacity={0.42}
                  strokeWidth={0.8}
                >
                  <title>{`${item.name}: ${formatFlowValue(item.value, mode)}`}</title>
                </path>
              ))}
            </g>

            {model.sourceItems.map((item, index) => (
              <g key={item.name}>
                <rect x="24" y={sourceNodes[index] - 25} width="142" height="50" rx="6" fill="var(--color-surface)" stroke="var(--color-border-strong)" />
                <rect x="24" y={sourceNodes[index] - 25} width="4" height="50" rx="2" fill={item.color} />
                <text x="39" y={sourceNodes[index] - 4} fill="var(--color-muted-foreground)" fontSize="10" fontWeight="600">{item.name}</text>
                <text x="39" y={sourceNodes[index] + 13} fill="var(--color-foreground)" fontSize="12" fontWeight="600">{formatFlowValue(item.value, mode)}</text>
              </g>
            ))}

            <g>
              <rect x="405" y="128" width="130" height="124" rx="8" fill="var(--color-surface)" stroke="var(--color-primary)" strokeOpacity="0.65" />
              <rect x="416" y="139" width="108" height="102" rx="5" fill="var(--color-primary)" fillOpacity="0.08" stroke="var(--color-border)" />
              <text x="470" y="176" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8.5" fontWeight="700" letterSpacing="0.08em">{busLabel}</text>
              <text x="470" y="200" textAnchor="middle" fill="var(--color-foreground)" fontSize="17" fontWeight="650">{formatFlowValue(model.total, mode)}</text>
              <text x="470" y="220" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="9">20 kV busbar</text>
            </g>

            {model.consumerItems.map((item, index) => (
              <g key={item.name}>
                <rect x="744" y={consumerNodes[index] - 22} width="154" height="44" rx="6" fill="var(--color-surface)" stroke="var(--color-border-strong)" />
                <rect x="744" y={consumerNodes[index] - 22} width="4" height="44" rx="2" fill={item.color} />
                <text x="758" y={consumerNodes[index] - 3} fill="var(--color-muted-foreground)" fontSize="9.4" fontWeight="600">{item.name}</text>
                <text x="758" y={consumerNodes[index] + 13} fill="var(--color-foreground)" fontSize="11" fontWeight="600">{formatFlowValue(item.value, mode)}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <aside className="rounded-md border border-border bg-surface-2/55 p-3" aria-label="Energy flow reconciliation summary">
        <div className="border-b border-border pb-3">
          <div className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Reconciled load</div>
          <div className="mt-1 text-[21px] font-medium tracking-[-0.03em] tabular">{currentPower.toFixed(2)} <span className="text-[10px] text-muted-foreground">MW</span></div>
          <div className="mt-1 text-[9.5px] text-green">Balance within 0.1%</div>
        </div>

        <div className="border-b border-border py-3">
          <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Source mix</div>
          <div className="space-y-1.5">
            {model.shares.map((source, index) => (
              <div key={source.name} className="flex items-center justify-between gap-2 text-[9.5px]">
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground"><span className="size-1.5 rounded-sm" style={{ background: sourceColors[index] }} />{source.name}</span>
                <span className="font-medium tabular">{source.share.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <dl className="space-y-3 pt-3 text-[9.5px]">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Blended energy rate</dt>
            <dd className="text-right font-medium tabular">Rp {Math.round(model.blendedRate).toLocaleString("en-US")} / kWh</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Carbon factor</dt>
            <dd className="text-right font-medium tabular">{model.carbonFactor.toFixed(3)} kgCO2e/kWh</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Confidence</dt>
            <dd className="text-right font-medium tabular">{dataHealth.toFixed(1)}% HIGH</dd>
          </div>
        </dl>

        <p className="mt-3 border-t border-border pt-3 text-[9px] leading-relaxed text-muted-foreground">
          Simulated allocation uses the active site, scenario, meter quality, tariff, and carbon factors.
        </p>
      </aside>
    </div>
  );
}
