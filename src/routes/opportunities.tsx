import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel, KpiTile, StatusPill } from "@/components/argrid-ui";
import { opportunities, fmtIDR } from "@/lib/argrid-data";
import { CheckCircle2, TrendingUp, X } from "lucide-react";

export const Route = createFileRoute("/opportunities")({
  component: Opportunities,
  head: () => ({
    meta: [
      { title: "Opportunities — ArGrid" },
      { name: "description", content: "Prioritized savings opportunities ranked by financial impact and payback." },
      { property: "og:title", content: "ArGrid Opportunities" },
      { property: "og:description", content: "Prioritized savings opportunities with payback and confidence." },
    ],
  }),
});

function Opportunities() {
  const [selected, setSelected] = useState<(typeof opportunities)[number] | null>(null);
  const total = opportunities.reduce((a, b) => a + b.annualSaving, 0);
  const p1 = opportunities.filter((o) => o.urgency === "P1").length;
  const open = opportunities.filter((o) => o.status === "Open").length;
  return (
    <AppShell title="Opportunities" subtitle="Detected savings ranked by financial impact">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Total Annualized Value" value={fmtIDR(total)} tone="good" hint="if all executed" />
        <KpiTile label="Open Opportunities" value={String(open)} hint={`${opportunities.length} total`} />
        <KpiTile label="Priority 1" value={String(p1)} tone="critical" hint="requires action" />
        <KpiTile label="Avg Payback" value="2.7" unit="yr" tone="good" />
      </div>

      <Panel title="Opportunity Value Lens" actions={<span className="text-[10.5px] text-muted-foreground">sorted by annual saving</span>}>
        <div className="overflow-x-auto"><table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="py-2 font-normal">ID</th>
              <th className="py-2 font-normal">Opportunity</th>
              <th className="py-2 font-normal">Asset</th>
              <th className="py-2 font-normal text-right">Annual saving</th>
              <th className="py-2 font-normal text-right">Payback (yr)</th>
              <th className="py-2 font-normal">Confidence</th>
              <th className="py-2 font-normal">Urgency</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {opportunities.map((o) => (
              <tr key={o.id} className="hover:bg-surface-2/50 group">
                <td className="py-2.5 tabular text-muted-foreground">{o.id}</td>
                <td className="py-2.5 font-medium">{o.title}</td>
                <td className="py-2.5 tabular text-muted-foreground">{o.asset}</td>
                <td className="py-2.5 text-right tabular text-green font-medium">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="size-3.5" /> {fmtIDR(o.annualSaving)}
                  </div>
                </td>
                <td className="py-2.5 text-right tabular">{o.payback.toFixed(1)}</td>
                <td className="py-2.5">
                  <span className={`text-[11px] ${o.confidence === "High" ? "text-green" : "text-amber"}`}>{o.confidence}</span>
                </td>
                <td className="py-2.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] tabular border ${
                    o.urgency === "P1" ? "border-red/40 text-red bg-red/10" :
                    o.urgency === "P2" ? "border-amber/40 text-amber bg-amber/10" :
                    "border-border text-muted-foreground"
                  }`}>{o.urgency}</span>
                </td>
                <td className="py-2.5"><StatusPill status={o.status} /></td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => setSelected(o)}
                    className="opacity-100 xl:opacity-0 xl:group-hover:opacity-100 h-7 px-2 rounded border border-border bg-surface-2 text-[11px] hover:border-primary/40"
                  >
                    Investigate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Opportunity investigation">
          <button type="button" className="absolute inset-0 bg-black/65" onClick={() => setSelected(null)} aria-label="Close opportunity" />
          <div className="relative w-full max-w-xl rounded-lg border border-border-strong bg-surface shadow-2xl">
            <div className="h-11 px-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{selected.id} · {selected.asset}</div>
                <div className="text-[13px] font-medium">Opportunity investigation</div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="size-8 rounded-md hover:bg-surface-2 flex items-center justify-center" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 text-[12px]">
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Detected condition</div>
                <div className="mt-1 font-medium text-[14px]">{selected.title}</div>
                <p className="mt-1.5 text-muted-foreground leading-relaxed">
                  The demo analytics engine identified a sustained deviation from the asset baseline. Validate operating schedules, meter quality, and process constraints before converting this item into a project.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><div className="text-[10px] text-muted-foreground uppercase">Annual value</div><div className="mt-0.5 text-green font-medium tabular">{fmtIDR(selected.annualSaving)}</div></div>
                <div><div className="text-[10px] text-muted-foreground uppercase">Payback</div><div className="mt-0.5 font-medium tabular">{selected.payback.toFixed(1)} yr</div></div>
                <div><div className="text-[10px] text-muted-foreground uppercase">Confidence</div><div className="mt-0.5 font-medium">{selected.confidence}</div></div>
                <div><div className="text-[10px] text-muted-foreground uppercase">Priority</div><div className="mt-0.5 font-medium">{selected.urgency}</div></div>
              </div>
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4 text-green" /> Recommended validation</div>
                <div className="mt-2 grid sm:grid-cols-2 gap-2 text-muted-foreground">
                  <span>• Confirm 15-minute interval meter completeness</span>
                  <span>• Review production and occupancy schedule</span>
                  <span>• Validate tariff and avoided-cost assumption</span>
                  <span>• Assign owner and measurement plan</span>
                </div>
              </div>
              <div className="text-[10.5px] text-muted-foreground">
                Demo workflow only. No work order or control command is issued.
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
