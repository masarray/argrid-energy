import { useMemo, useState } from "react";
import { CircleDollarSign, Leaf, Zap } from "lucide-react";

export type SankeyMode = "Power" | "Cost" | "Carbon";

type Props = {
  siteName: string;
  currentPowerMW: number;
  gridMW: number;
  solarMW: number;
  generatorMW: number;
  energyRateIDR: number;
  meterQuality: "GOOD" | "ESTIMATED" | "STALE";
  completenessPct: number;
  scenarioId: "normal" | "peak-demand" | "voltage-sag" | "efficiency-loss" | "billing-exception";
};

type Flow = { id: string; label: string; mw: number; color: string; detail: string };
const icons = { Power: Zap, Cost: CircleDollarSign, Carbon: Leaf };
const fmtPower = (value: number) => value >= 1 ? `${value.toFixed(2)} MW` : `${Math.round(value * 1000)} kW`;
const fmtIDR = (value: number) => value >= 1_000_000 ? `IDR ${(value / 1_000_000).toFixed(2)}m/h` : `IDR ${Math.round(value).toLocaleString("en-US")}/h`;
const path = (x1: number, y1: number, x2: number, y2: number) => {
  const c = Math.max(52, (x2 - x1) * 0.48);
  return `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`;
};

export function EnergySankey(props: Props) {
  const [mode, setMode] = useState<SankeyMode>("Power");
  const [active, setActive] = useState<string | null>(null);
  const lossShare = props.scenarioId === "efficiency-loss" ? 0.064 : props.scenarioId === "voltage-sag" ? 0.041 : 0.032;
  const shares = props.scenarioId === "peak-demand" ? [0.43, 0.215, 0.152, 0.095, 0.108] : props.scenarioId === "efficiency-loss" ? [0.37, 0.248, 0.184, 0.092, 0.106] : [0.395, 0.223, 0.163, 0.098, 0.121];
  const sources = useMemo<Flow[]>(() => [
    { id: "grid", label: "Utility grid", mw: props.gridMW, color: "#227da0", detail: "20 kV incomer" },
    { id: "solar", label: "Solar PV", mw: props.solarMW, color: "#3aa876", detail: "On-site renewable" },
    { id: "generator", label: "Generator", mw: props.generatorMW, color: "#d28a32", detail: props.scenarioId === "voltage-sag" ? "Event support" : "Standby support" },
  ].filter((item) => item.mw > 0.001), [props.generatorMW, props.gridMW, props.scenarioId, props.solarMW]);
  const consumers = useMemo<Flow[]>(() => {
    const delivered = props.currentPowerMW * (1 - lossShare);
    const labels = [
      ["production", "Production lines", "Process and machine loads", "#4a78b8"],
      ["hvac", "HVAC & cooling", "Chillers, AHU and cooling towers", "#6d76bf"],
      ["air", "Compressed air", "Compressors and dryers", "#8d68ad"],
      ["utilities", "Site utilities", "Pumps, lighting and auxiliaries", "#4c91a8"],
      ["tenants", "Tenant & support", "Submetered support areas", "#7398a3"],
    ] as const;
    const total = shares.reduce((sum, value) => sum + value, 0);
    const result = labels.map(([id, label, detail, color], index) => ({ id, label, detail, color, mw: delivered * shares[index] / total }));
    result.push({ id: "losses", label: "Distribution losses", detail: props.scenarioId === "efficiency-loss" ? "Elevated technical and unallocated loss" : "Technical and unallocated loss", color: "#c56a5f", mw: props.currentPowerMW * lossShare });
    return result;
  }, [lossShare, props.currentPowerMW, props.scenarioId, shares]);
  const value = (mw: number, sourceId?: string) => {
    if (mode === "Power") return fmtPower(mw);
    if (mode === "Cost") return fmtIDR(mw * 1000 * (sourceId === "solar" ? 280 : sourceId === "generator" ? 2650 : props.energyRateIDR));
    return `${(mw * (sourceId === "solar" ? 0 : sourceId === "generator" ? 0.71 : 0.74)).toFixed(2)} tCO2e/h`;
  };
  const sourceMax = Math.max(...sources.map((item) => item.mw), 0.1);
  const consumerMax = Math.max(...consumers.map((item) => item.mw), 0.1);
  const sourceY = sources.length === 3 ? [78, 176, 274] : sources.length === 2 ? [118, 236] : [176];
  const consumerY = [54, 110, 166, 222, 278, 334];

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><div className="text-[9.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Live energy-flow hierarchy</div><div className="mt-0.5 text-[11px] text-muted-foreground">{props.siteName} · source to major consumer</div></div>
      <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2 p-0.5" aria-label="Sankey measurement mode">
        {(["Power", "Cost", "Carbon"] as SankeyMode[]).map((item) => { const Icon = icons[item]; return <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={`flex h-7 items-center gap-1.5 rounded px-2 text-[9.5px] font-medium ${mode === item ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-3" />{item}</button>; })}
      </div>
    </div>
    <div className="overflow-x-auto rounded-lg border border-border bg-[linear-gradient(180deg,var(--color-surface),var(--color-surface-2))]" tabIndex={0} role="region" aria-label="Energy Sankey diagram">
      <svg viewBox="0 0 980 390" className="min-w-[820px] w-full" role="img" aria-labelledby="energy-sankey-title energy-sankey-desc">
        <title id="energy-sankey-title">Energy flow Sankey diagram</title><desc id="energy-sankey-desc">Flow width is proportional to the selected power, cost, or carbon contribution from energy sources through the main bus to major consumers and losses.</desc>
        <defs><filter id="sankey-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" /></filter></defs>
        <text x="34" y="25" fontSize="10" fill="var(--color-muted-foreground)" letterSpacing="1.4">ENERGY SOURCES</text><text x="415" y="25" fontSize="10" fill="var(--color-muted-foreground)" letterSpacing="1.4">SITE DISTRIBUTION</text><text x="758" y="25" fontSize="10" fill="var(--color-muted-foreground)" letterSpacing="1.4">MAJOR CONSUMERS</text>
        {sources.map((source, index) => { const y = sourceY[index]; const width = 10 + source.mw / sourceMax * 22; const visible = active === null || active === source.id; return <g key={source.id} onMouseEnter={() => setActive(source.id)} onMouseLeave={() => setActive(null)}><path d={path(176, y, 407, 176)} fill="none" stroke={source.color} strokeWidth={width} strokeLinecap="round" opacity={visible ? 0.7 : 0.16}><title>{source.label}: {value(source.mw, source.id)} · {source.detail}</title></path><rect x="28" y={y - 29} width="148" height="58" rx="7" fill="var(--color-surface)" stroke="var(--color-border)" filter="url(#sankey-shadow)" /><rect x="28" y={y - 29} width="5" height="58" rx="2.5" fill={source.color} /><text x="44" y={y - 7} fontSize="11" fontWeight="600" fill="var(--color-foreground)">{source.label}</text><text x="44" y={y + 10} fontSize="14" fontWeight="600" fill={source.color}>{value(source.mw, source.id)}</text><text x="44" y={y + 23} fontSize="8.5" fill="var(--color-muted-foreground)">{source.detail}</text></g>; })}
        <g filter="url(#sankey-shadow)"><rect x="407" y="116" width="166" height="120" rx="10" fill="var(--color-surface)" stroke="var(--color-border-strong)" /><rect x="407" y="116" width="166" height="7" rx="3.5" fill="#227da0" /><text x="490" y="150" textAnchor="middle" fontSize="9.5" letterSpacing="1.1" fill="var(--color-muted-foreground)">MAIN DISTRIBUTION BUS</text><text x="490" y="179" textAnchor="middle" fontSize="25" fontWeight="600" fill="var(--color-foreground)">{value(props.currentPowerMW)}</text><text x="490" y="199" textAnchor="middle" fontSize="9" fill="var(--color-muted-foreground)">20 kV · live balanced flow</text><text x="490" y="216" textAnchor="middle" fontSize="9" fill={props.meterQuality === "GOOD" ? "#2d8a5d" : "#9c6410"}>{props.meterQuality} · {props.completenessPct.toFixed(1)}% complete</text></g>
        {consumers.map((consumer, index) => { const y = consumerY[index]; const width = 7 + consumer.mw / consumerMax * 21; const visible = active === null || active === consumer.id; const share = props.currentPowerMW > 0 ? consumer.mw / props.currentPowerMW * 100 : 0; return <g key={consumer.id} onMouseEnter={() => setActive(consumer.id)} onMouseLeave={() => setActive(null)}><path d={path(573, 176, 758, y)} fill="none" stroke={consumer.color} strokeWidth={width} strokeLinecap="round" opacity={visible ? 0.66 : 0.14}><title>{consumer.label}: {value(consumer.mw)} · {share.toFixed(1)}% · {consumer.detail}</title></path><rect x="758" y={y - 22} width="190" height="44" rx="7" fill="var(--color-surface)" stroke="var(--color-border)" /><rect x="758" y={y - 22} width="5" height="44" rx="2.5" fill={consumer.color} /><text x="774" y={y - 3} fontSize="10.5" fontWeight="600" fill="var(--color-foreground)">{consumer.label}</text><text x="774" y={y + 13} fontSize="10" fontWeight="600" fill={consumer.color}>{value(consumer.mw)}</text><text x="932" y={y + 13} textAnchor="end" fontSize="8.5" fill="var(--color-muted-foreground)">{share.toFixed(1)}%</text></g>; })}
      </svg>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-muted-foreground"><span>Hover a source or consumer to isolate its flow. Width is proportional to {mode.toLowerCase()} contribution.</span><span className="tabular">Balance: {(sources.reduce((sum, item) => sum + item.mw, 0) - consumers.reduce((sum, item) => sum + item.mw, 0)).toFixed(3)} MW</span></div>
  </div>;
}
