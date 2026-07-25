import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel, StatusPill } from "@/components/argrid-ui";
import { feeders, powerFlow24h, fmtNum } from "@/lib/argrid-data";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Zap } from "lucide-react";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/electrical")({
  component: ElectricalNetwork,
  head: () => ({
    meta: [
      { title: "Electrical Network — ArGrid" },
      { name: "description", content: "Live one-line diagram, feeder loading, and breaker status." },
      { property: "og:title", content: "ArGrid Electrical Network" },
      { property: "og:description", content: "Interactive one-line diagram with live breaker and feeder status." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };
const baseTotalKW = feeders.reduce((sum, feeder) => sum + feeder.kw, 0);

function ElectricalNetwork() {
  const { telemetry, lastUpdated, site } = useDemoSimulation();
  const [selectedId, setSelectedId] = useState("F-07");
  const selected = feeders.find((feeder) => feeder.id === selectedId) ?? feeders[0];
  const totalKW = baseTotalKW * site.powerScale;
  const selectedKW = selected.kw * site.powerScale;
  const selectedPf = selected.status === "critical" ? 0.88 : selected.status === "warning" ? 0.92 : 0.96;
  const selectedVoltage = selected.status === "critical" ? 391 : selected.status === "warning" ? 396 : 400;
  const selectedCurrent = Math.round((selectedKW * 1000) / (Math.sqrt(3) * selectedVoltage * selectedPf));
  const selectedTrend = useMemo(
    () =>
      powerFlow24h.map((point) => ({
        ...point,
        feederKW: Math.round(point.load * site.powerScale * 1000 * (selected.kw / baseTotalKW)),
      })),
    [selected.kw, site.powerScale],
  );
  return (
    <AppShell title="Electrical Network" subtitle="Live one-line diagram · MSB-Main · 20 kV incomer">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* One-line diagram */}
        <Panel title="One-Line Diagram — MSB-Main" className="col-span-1 xl:col-span-8 h-[520px]" actions={<span className="text-[10.5px] text-muted-foreground tabular">Live · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}>
          <div className="relative w-full h-full grid-bg rounded-md overflow-hidden">
            <svg viewBox="0 0 800 460" className="w-full h-full">
              {/* Grid source */}
              <g>
                <rect x="340" y="16" width="120" height="40" rx="4" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" />
                <text x="400" y="34" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="10" fontFamily="Inter">UTILITY 20 kV</text>
                <text x="400" y="48" textAnchor="middle" fill="var(--color-foreground)" fontSize="11" fontWeight="600" fontFamily="Inter">{telemetry.currentPower.toFixed(2)} MW · {telemetry.powerFactor.toFixed(2)} PF</text>
                {/* Transformer symbol */}
                <line x1="400" y1="56" x2="400" y2="82" stroke="var(--color-cyan)" strokeWidth="2" />
                <circle cx="400" cy="92" r="10" fill="none" stroke="var(--color-cyan)" strokeWidth="1.5" />
                <circle cx="400" cy="104" r="10" fill="none" stroke="var(--color-cyan)" strokeWidth="1.5" />
                <line x1="400" y1="114" x2="400" y2="140" stroke="var(--color-cyan)" strokeWidth="2" />
                <text x="418" y="102" fill="var(--color-muted-foreground)" fontSize="9">TX-01/02 · 2 × 4 MVA</text>
                {/* Main breaker */}
                <rect x="388" y="140" width="24" height="18" fill="var(--color-green)" opacity="0.9" />
                <text x="420" y="153" fill="var(--color-muted-foreground)" fontSize="9">MCB-Main · CLOSED</text>
                {/* Main busbar */}
                <line x1="80" y1="180" x2="720" y2="180" stroke="var(--color-cyan)" strokeWidth="3" />
                <line x1="400" y1="158" x2="400" y2="180" stroke="var(--color-cyan)" strokeWidth="2" />
              </g>

              {/* Feeders */}
              {feeders.map((f, i) => {
                const x = 80 + i * 80;
                const color = f.status === "critical" ? "var(--color-red)" : f.status === "warning" ? "var(--color-amber)" : "var(--color-cyan)";
                const brColor = f.status === "critical" ? "var(--color-red)" : f.status === "warning" ? "var(--color-amber)" : "var(--color-green)";
                return (
                  <g key={f.id}>
                    <line x1={x} y1={180} x2={x} y2={215} stroke={color} strokeWidth="1.6" />
                    <rect x={x - 10} y={215} width="20" height="14" fill={brColor} opacity="0.9" />
                    <line x1={x} y1={229} x2={x} y2={260} stroke={color} strokeWidth="1.6" />
                    {/* Feeder card */}
                    <rect x={x - 34} y={260} width="68" height="90" rx="4" fill="var(--color-surface-2)" stroke={selected.id === f.id ? "var(--color-primary)" : "var(--color-border-strong)"} strokeWidth={selected.id === f.id ? 1.8 : 1} />
                    <text x={x} y={275} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="9">{f.id}</text>
                    <text x={x} y={289} textAnchor="middle" fill="var(--color-foreground)" fontSize="10" fontWeight="600">{f.name}</text>
                    <text x={x} y={310} textAnchor="middle" fill={color} fontSize="13" fontWeight="600" fontFamily="Space Grotesk">{Math.round(f.kw * site.powerScale)}</text>
                    <text x={x} y={322} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8">kW</text>
                    {/* Load bar */}
                    <rect x={x - 26} y={332} width="52" height="4" rx="1" fill="var(--color-surface-3)" />
                    <rect x={x - 26} y={332} width={52 * (f.load / 100)} height="4" rx="1" fill={color} />
                    <text x={x} y={346} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8">{f.load}%</text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(20, 420)">
                <rect x="0" y="0" width="10" height="8" fill="var(--color-green)" /><text x="16" y="8" fill="var(--color-muted-foreground)" fontSize="9">Closed / Normal</text>
                <rect x="130" y="0" width="10" height="8" fill="var(--color-amber)" /><text x="146" y="8" fill="var(--color-muted-foreground)" fontSize="9">Warning</text>
                <rect x="220" y="0" width="10" height="8" fill="var(--color-red)" /><text x="236" y="8" fill="var(--color-muted-foreground)" fontSize="9">Critical / Trip risk</text>
              </g>
            </svg>
          </div>
        </Panel>

        {/* Selected feeder detail */}
        <div className="col-span-1 xl:col-span-4 space-y-3">
          <Panel title={`Feeder ${selected.id} · ${selected.name}`} className="h-[250px]" actions={<StatusPill status={selected.status} />}>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <Stat label="Load" value={`${fmtNum(selectedKW)} kW`} />
              <Stat label="Current" value={`${fmtNum(selectedCurrent)} A`} />
              <Stat label="Voltage L-L" value={`${selectedVoltage} V`} tone={selected.status !== "normal" ? "warn" : undefined} />
              <Stat label="THD-V" value={selected.status === "critical" ? "4.8%" : selected.status === "warning" ? "3.7%" : "2.2%"} />
              <Stat label="PF" value={selectedPf.toFixed(2)} tone={selectedPf < 0.95 ? "warn" : undefined} />
              <Stat label="Freq" value="49.98 Hz" />
            </div>
            <div className={`mt-3 text-[11px] flex items-center gap-2 border rounded px-2 py-1.5 ${selected.status === "critical" ? "text-red border-red/25 bg-red/10" : selected.status === "warning" ? "text-amber border-amber/25 bg-amber/10" : "text-green border-green/25 bg-green/10"}`}>
              <Zap className="size-3.5" />
              {selected.status === "critical" ? "Voltage sag 82% Un · 240 ms · investigation open" : selected.status === "warning" ? "Loading above preferred operating band" : "Feeder operating within configured limits"}
            </div>
          </Panel>
          <Panel title="Feeder Load — Last 24h" className="h-[258px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="t" {...chartAxis} interval={7} />
                <YAxis {...chartAxis} width={44} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }}
                  formatter={(value: number) => [`${fmtNum(value)} kW`, selected.id]}
                />
                <Line type="monotone" dataKey="feederKW" name={selected.id} stroke="var(--color-cyan)" strokeWidth={1.6} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Feeder table */}
        <Panel title="All Feeders" className="col-span-1 xl:col-span-12">
          <div className="overflow-x-auto"><table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 font-normal">ID</th>
                <th className="py-2 font-normal">Name</th>
                <th className="py-2 font-normal text-right">Load (kW)</th>
                <th className="py-2 font-normal text-right">Load %</th>
                <th className="py-2 font-normal text-right">Share</th>
                <th className="py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {feeders.map((f) => (
                <tr key={f.id} className={`hover:bg-surface-2/50 ${selected.id === f.id ? "bg-primary/5" : ""}`}>
                  <td className="py-2 tabular text-muted-foreground">{f.id}</td>
                  <td className="py-2 font-medium">
                    <button type="button" onClick={() => setSelectedId(f.id)} className="text-left hover:text-primary focus:text-primary">
                      {f.name}
                    </button>
                  </td>
                  <td className="py-2 text-right tabular">{fmtNum(f.kw * site.powerScale)}</td>
                  <td className="py-2 text-right tabular">{f.load}%</td>
                  <td className="py-2 text-right tabular text-muted-foreground">{(((f.kw * site.powerScale) / totalKW) * 100).toFixed(1)}%</td>
                  <td className="py-2"><StatusPill status={f.status} /></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 tabular font-medium ${tone === "warn" ? "text-amber" : ""}`}>{value}</div>
    </div>
  );
}
