import { BadgeCheck, Leaf, Scale, Waves } from "lucide-react";
import type { EnergyFlowSnapshot } from "@/lib/energy-flow";
import "./energy-flow-sankey.css";

const sourceY = [34, 120, 206];
const loadY = [14, 60, 106, 152, 198, 244];

function fmt(value: number) {
  return value >= 1 ? `${value.toFixed(2)} MW` : `${Math.round(value * 1000)} kW`;
}

function curve(x1: number, y1: number, x2: number, y2: number) {
  const bend = (x2 - x1) * 0.46;
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}

export function EnergyFlowSankey({ snapshot }: { snapshot: EnergyFlowSnapshot }) {
  let cumulative = 0;
  const busY = snapshot.consumers.map((load) => {
    const y = 56 + (cumulative + load.sharePct / 2) * 1.94;
    cumulative += load.sharePct;
    return y;
  });

  return (
    <div className="energy-flow-sankey space-y-3">
      <div className="grid grid-cols-2 gap-3 border-b border-border pb-3 md:grid-cols-4">
        <Metric label="Site demand" value={`${snapshot.totalMW.toFixed(2)} MW`} />
        <Metric label="Renewable share" value={`${snapshot.renewableSharePct.toFixed(1)}%`} icon={<Leaf className="size-3 text-green" />} />
        <Metric label="Distribution losses" value={fmt(snapshot.lossesMW)} icon={<Waves className="size-3 text-amber" />} />
        <Metric label="Balance check" value="Reconciled" icon={<Scale className="size-3 text-green" />} />
      </div>

      <div className="energy-flow-canvas">
        <div className="relative z-10 flex justify-between border-b border-border bg-surface/85 px-3 py-2 text-[8.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <span>Energy sources</span><span>Site distribution</span><span>End-use allocation</span>
        </div>
        <svg viewBox="0 0 920 300" className="relative z-10 block h-[276px] w-full" role="img" aria-label="Energy flow Sankey diagram from supply to end uses">
          <g aria-hidden="true">
            {snapshot.sources.map((source, index) => (
              <path key={source.id} d={curve(180, sourceY[index] + 24, 390, 122 + index * 28)} className="energy-flow-path is-active" stroke={source.color} strokeOpacity="0.64" strokeWidth={Math.max(5, 4 + source.sharePct * 0.34)}>
                <title>{`${source.label}: ${fmt(source.valueMW)} (${source.sharePct.toFixed(1)}%)`}</title>
              </path>
            ))}
            {snapshot.consumers.map((load, index) => (
              <path key={load.id} d={curve(510, busY[index], 716, loadY[index] + 18)} className="energy-flow-path is-active" stroke={load.color} strokeOpacity={load.id === "losses" ? "0.52" : "0.68"} strokeWidth={Math.max(4.5, 4 + load.sharePct * 0.31)} strokeDasharray={load.id === "losses" ? "7 5" : undefined}>
                <title>{`${load.label}: ${fmt(load.valueMW)} (${load.sharePct.toFixed(1)}%)`}</title>
              </path>
            ))}

            {snapshot.sources.map((source, index) => <FlowNode key={source.id} x={18} y={sourceY[index]} width={162} label={source.label} detail={source.detail} value={fmt(source.valueMW)} share={source.sharePct} color={source.color} />)}

            <g>
              <rect className="energy-flow-bus" x="390" y="104" width="120" height="92" rx="8" />
              <rect x="402" y="116" width="4" height="68" rx="2" fill="var(--sankey-bus)" />
              <text x="418" y="129" fill="var(--color-muted-foreground)" fontSize="8.5" fontWeight="600" letterSpacing="1">MAIN BUS</text>
              <text x="418" y="153" fill="var(--color-foreground)" fontSize="18" fontWeight="600">{snapshot.totalMW.toFixed(2)}</text>
              <text x="468" y="153" fill="var(--color-muted-foreground)" fontSize="9">MW</text>
              <text x="418" y="172" fill="var(--color-muted-foreground)" fontSize="8.5">20 kV · reconciled</text>
              <text x="418" y="186" fill={snapshot.meterQuality === "GOOD" ? "var(--color-green)" : "var(--color-amber)"} fontSize="8.5">{snapshot.meterQuality} data</text>
            </g>

            {snapshot.consumers.map((load, index) => <FlowNode key={load.id} x={716} y={loadY[index]} width={188} height={36} label={load.label} detail={load.state === "estimated" ? "ESTIMATED" : load.detail} value={fmt(load.valueMW)} share={load.sharePct} color={load.color} warning={load.state === "warning" || load.state === "estimated"} />)}
          </g>
        </svg>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-[9.5px] leading-relaxed">
        <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-green" /><span className="flex-1">{snapshot.insight}</span><span className="hidden text-muted-foreground sm:inline">Flow width = active power</span>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="md:border-r md:border-border md:pr-3 last:border-r-0"><div className="flex items-center gap-1.5 text-[8.5px] font-medium uppercase tracking-[0.11em] text-muted-foreground">{icon}{label}</div><div className="mt-1 text-[15px] font-medium tabular">{value}</div></div>;
}

function FlowNode({ x, y, width, height = 48, label, detail, value, share, color, warning = false }: { x: number; y: number; width: number; height?: number; label: string; detail: string; value: string; share: number; color: string; warning?: boolean }) {
  return <g className="energy-flow-node"><rect className="energy-flow-node-shell" x={x} y={y} width={width} height={height} rx="6" /><rect x={x} y={y} width="5" height={height} rx="3" fill={color} /><circle cx={x + 18} cy={y + 14} r="3.5" fill={color} /><text x={x + 29} y={y + 17} fill="var(--color-foreground)" fontSize="9.5" fontWeight="600">{label}</text><text x={x + 14} y={y + height - 8} fill={warning ? "var(--color-amber)" : "var(--color-muted-foreground)"} fontSize="8">{detail}</text><text x={x + width - 12} y={y + 17} textAnchor="end" fill="var(--color-foreground)" fontSize="10.5" fontWeight="600">{value}</text><text x={x + width - 12} y={y + height - 8} textAnchor="end" fill="var(--color-muted-foreground)" fontSize="8">{share.toFixed(1)}%</text></g>;
}
