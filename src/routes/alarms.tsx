import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel, KpiTile, SeverityDot } from "@/components/argrid-ui";
import { alarms, powerQualityEvents } from "@/lib/argrid-data";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, ReferenceLine } from "recharts";
import { Check } from "lucide-react";

export const Route = createFileRoute("/alarms")({
  component: AlarmsPage,
  head: () => ({
    meta: [
      { title: "Alarms & Events — ArGrid" },
      { name: "description", content: "Live alarms, events, and power-quality analysis with ITIC context." },
      { property: "og:title", content: "ArGrid Alarms & Events" },
      { property: "og:description", content: "Live alarms and power-quality investigation workspace." },
    ],
  }),
});

const chartAxis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

function AlarmsPage() {
  const [acknowledged, setAcknowledged] = useState(() => new Set(alarms.filter((alarm) => alarm.ack).map((alarm) => alarm.id)));
  const crit = alarms.filter((a) => a.severity === "Critical").length;
  const warn = alarms.filter((a) => a.severity === "Warning").length;
  const unack = alarms.filter((a) => !acknowledged.has(a.id)).length;

  const acknowledge = (id: string) => {
    setAcknowledged((current) => new Set([...current, id]));
  };

  return (
    <AppShell title="Alarms & Events" subtitle="All active and recent alarms across the site">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Critical" value={String(crit)} tone="critical" hint="P1 · requires ack" />
        <KpiTile label="Warning" value={String(warn)} tone="warning" />
        <KpiTile label="Unacknowledged" value={String(unack)} tone="warning" />
        <KpiTile label="Avg time to ack" value="4.2" unit="min" tone="good" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Alarm Table" className="col-span-1 xl:col-span-8">
          <div className="overflow-x-auto"><table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 font-normal">Sev</th>
                <th className="py-2 font-normal">Time</th>
                <th className="py-2 font-normal">Source</th>
                <th className="py-2 font-normal">Message</th>
                <th className="py-2 font-normal">Ack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alarms.map((a) => (
                <tr key={a.id} className="hover:bg-surface-2/50">
                  <td className="py-2.5"><SeverityDot level={a.severity} /></td>
                  <td className="py-2.5 tabular text-muted-foreground">{a.ts}</td>
                  <td className="py-2.5 font-medium">{a.source}</td>
                  <td className="py-2.5">{a.message}</td>
                  <td className="py-2.5">
                    {acknowledged.has(a.id)
                      ? <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Check className="size-3 text-green" /> acked</span>
                      : <button type="button" onClick={() => acknowledge(a.id)} className="h-7 px-2 rounded border border-amber/35 bg-amber/10 text-[10.5px] text-amber uppercase tracking-wider hover:bg-amber/15">Acknowledge</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Panel>

        <Panel title="Power Quality — ITIC Scatter" className="col-span-1 xl:col-span-4 h-[420px]" actions={<span className="text-[10.5px] text-muted-foreground">last 30 days</span>}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" />
              <XAxis type="number" dataKey="duration" name="Duration" scale="log" domain={[0.001, 1000]} {...chartAxis} tickFormatter={(v) => v < 1 ? `${v}s` : `${v}s`} />
              <YAxis type="number" dataKey="magnitude" name="Magnitude" domain={[0, 160]} {...chartAxis} tickFormatter={(v) => `${v}%`} />
              <ZAxis range={[40, 40]} />
              <ReferenceLine y={90} stroke="var(--color-amber)" strokeDasharray="3 3" />
              <ReferenceLine y={110} stroke="var(--color-amber)" strokeDasharray="3 3" />
              <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-strong)", borderRadius: 6, fontSize: 11 }} />
              <Scatter data={powerQualityEvents.filter(e => e.type === "sag")} fill="var(--color-red)" />
              <Scatter data={powerQualityEvents.filter(e => e.type === "swell")} fill="var(--color-amber)" />
              <Scatter data={powerQualityEvents.filter(e => e.type === "normal")} fill="var(--color-cyan)" />
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </AppShell>
  );
}
