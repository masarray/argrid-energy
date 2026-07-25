import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/argrid-ui";
import { monthlyEnergy, powerFlow24h, usageByType, fmtNum } from "@/lib/argrid-data";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
  head: () => ({
    meta: [
      { title: "Energy Analytics — ArGrid" },
      { name: "description", content: "Deep energy analytics: baseline, EnPI, and load profiles." },
      { property: "og:title", content: "ArGrid Energy Analytics" },
      { property: "og:description", content: "Baseline comparison, load profiles, and EnPI trends." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };
const tt = { contentStyle: { background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 } };

// Heatmap data (7 days × 24 hours) — deterministic
const heatmap = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => {
    const workday = d < 5;
    const business = h >= 7 && h <= 18;
    const base = workday && business ? 3.8 : 1.6;
    const jitter = Math.sin(d * 7 + h * 1.3) * 0.35 + Math.cos(h * 0.7) * 0.25;
    return +(base + Math.sin(h / 3) * 0.6 + jitter).toFixed(2);
  })
);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const enpiTrend = powerFlow24h.map((point, index) => ({
  ...point,
  enpi: +(0.68 + point.load * 0.042 + Math.sin(index / 3.2) * 0.018).toFixed(3),
}));

function Analytics() {
  const max = Math.max(...heatmap.flat());
  return (
    <AppShell title="Energy Analytics" subtitle="Baseline, EnPI, and load profiling across sites">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Monthly Energy — Actual vs Baseline (YoY)" className="col-span-1 xl:col-span-8 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyEnergy} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="m" {...chartAxis} />
              <YAxis {...chartAxis} width={56} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip {...tt} formatter={(v: number) => `${fmtNum(v)} kWh`} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} iconType="circle" iconSize={7} />
              <Bar dataKey="lastYear" name="Baseline (last yr)" fill="var(--color-surface-3)" radius={[3, 3, 0, 0]} barSize={18} />
              <Bar dataKey="thisYear" name="Actual" fill="var(--color-cyan)" radius={[3, 3, 0, 0]} barSize={18} />
              <Line type="monotone" dataKey="thisYear" stroke="var(--color-amber)" strokeWidth={1.5} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Energy Split by Usage" className="col-span-1 xl:col-span-4 h-[340px]">
          <div className="flex items-center h-full gap-3">
            <ResponsiveContainer width="55%" height="90%">
              <PieChart>
                <Pie data={usageByType} dataKey="value" innerRadius={44} outerRadius={80} paddingAngle={1} stroke="var(--color-surface)">
                  {usageByType.map((u, i) => <Cell key={i} fill={u.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 text-[12px]">
              {usageByType.map((u) => (
                <li key={u.name} className="flex items-center gap-2">
                  <span className="size-2 rounded-sm" style={{ background: u.color }} />
                  <span className="flex-1 text-muted-foreground">{u.name}</span>
                  <span className="tabular font-medium">{u.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Load Profile Heatmap — Last 7 days × 24h" className="col-span-1 xl:col-span-8 h-[320px]" actions={<span className="text-[10.5px] text-muted-foreground">MW · darker = higher load</span>}>
          <div className="h-full flex flex-col">
            <div className="flex-1 grid grid-cols-[32px_1fr] gap-2">
              <div className="flex flex-col justify-between text-[10px] text-muted-foreground tabular py-1">
                {days.map((d) => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-rows-7 gap-[3px]">
                {heatmap.map((row, di) => (
                  <div key={di} className="grid grid-cols-24 gap-[3px]" style={{ gridTemplateColumns: "repeat(24,1fr)" }}>
                    {row.map((v, hi) => {
                      const o = (v / max) * 0.95 + 0.05;
                      return (
                        <div key={hi} className="rounded-[2px]" style={{ background: `color-mix(in oklch, var(--color-cyan) ${o * 100}%, var(--color-surface-3))` }} title={`${days[di]} ${hi}:00 · ${v} MW`} />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="pl-[40px] mt-2 grid gap-[3px] text-[9px] text-muted-foreground tabular" style={{ gridTemplateColumns: "repeat(24,1fr)" }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-center">{h % 3 === 0 ? h : ""}</div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="EnPI — kWh / production unit" className="col-span-1 xl:col-span-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enpiTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gEnpi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-violet)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-violet)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="t" {...chartAxis} interval={7} />
              <YAxis {...chartAxis} width={44} domain={[0.75, 1]} tickFormatter={(value) => Number(value).toFixed(2)} />
              <Tooltip {...tt} formatter={(value: number) => `${Number(value).toFixed(3)} kWh/unit`} />
              <Area type="monotone" dataKey="enpi" name="EnPI" stroke="var(--color-violet)" strokeWidth={1.6} fill="url(#gEnpi)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </AppShell>
  );
}
