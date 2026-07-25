import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel, KpiTile } from "@/components/argrid-ui";
import { co2Trend, fmtNum } from "@/lib/argrid-data";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/sustainability")({
  component: Sustainability,
  head: () => ({
    meta: [
      { title: "Sustainability — ArGrid" },
      { name: "description", content: "CO₂ emissions, EnPI, and sustainability targets tracking." },
      { property: "og:title", content: "ArGrid Sustainability" },
      { property: "og:description", content: "Scope 2 emissions and target progress." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function Sustainability() {
  return (
    <AppShell title="Sustainability" subtitle="Scope 2 emissions and reduction targets">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <KpiTile label="YTD Emissions" value="10,240" unit="tCO₂e" trend={-4.2} tone="good" hint="vs target" />
        <KpiTile label="2026 Target" value="18,200" unit="tCO₂e" hint="on track" tone="good" />
        <KpiTile label="Emission Intensity" value="0.318" unit="tCO₂/MWh" trend={-1.6} tone="good" />
        <KpiTile label="Renewable Share" value="12.4%" trend={2.3} hint="rooftop PV" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Monthly CO₂ Emissions vs Target" className="col-span-1 xl:col-span-8 h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={co2Trend} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="m" {...chartAxis} />
              <YAxis {...chartAxis} width={50} />
              <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }} formatter={(v: number) => `${fmtNum(v)} tCO₂e`} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} iconType="circle" iconSize={7} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="var(--color-cyan)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="target" name="Target" stroke="var(--color-amber)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Emission Sources" className="col-span-1 xl:col-span-4 h-[380px]">
          <ul className="space-y-3 text-[12px]">
            {[
              { label: "Grid electricity", value: 82, color: "var(--color-cyan)" },
              { label: "Diesel gensets", value: 9, color: "var(--color-orange)" },
              { label: "Natural gas", value: 6, color: "var(--color-amber)" },
              { label: "Refrigerants", value: 3, color: "var(--color-violet)" },
            ].map((s) => (
              <li key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="tabular font-medium">{s.value}%</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${s.value}%`, background: s.color }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 p-3 rounded border border-green/25 bg-green/10 text-[11.5px] text-green">
            You are on track to reduce annual emissions by <span className="font-semibold">6.4%</span> vs 2025 baseline.
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
