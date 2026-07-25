import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel, KpiTile, StatusPill } from "@/components/argrid-ui";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";

export const Route = createFileRoute("/billing")({
  component: Billing,
  head: () => ({
    meta: [
      { title: "Billing — ArGrid" },
      { name: "description", content: "Tenant billing, tariff analysis, and invoice workspace." },
      { property: "og:title", content: "ArGrid Billing" },
      { property: "og:description", content: "Multi-tenant billing period workspace and invoice status." },
    ],
  }),
});

const tenants = [
  { id: "T-001", name: "Tenant A · Plastics Line", kwh: 184_200, demand: 480, amount: 244_800_000, status: "Sent" },
  { id: "T-002", name: "Tenant B · Metal Fab", kwh: 96_400, demand: 260, amount: 128_100_000, status: "Approved" },
  { id: "T-003", name: "Tenant C · Cold Storage", kwh: 220_600, demand: 540, amount: 291_600_000, status: "Draft" },
  { id: "T-004", name: "Tenant D · Packaging", kwh: 62_100, demand: 180, amount: 82_400_000, status: "Sent" },
  { id: "T-005", name: "Tenant E · Assembly", kwh: 128_900, demand: 340, amount: 171_200_000, status: "Overdue" },
];

function Billing() {
  const total = tenants.reduce((a, b) => a + b.amount, 0);
  const exportRef = useRef<HTMLDivElement>(null);
  return (
    <AppShell
      title="Billing"
      subtitle="July 2026 billing period · 5 tenants"
      toolbar={
        <ExportPdfButton
          targetRef={exportRef}
          title="Billing — July 2026"
          subtitle="Multi-tenant billing period workspace"
          filename={`argrid-billing-${new Date().toISOString().slice(0, 10)}.pdf`}
        />
      }
    >
      <div ref={exportRef}>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <KpiTile label="Period Total" value={fmtIDR(total)} tone="good" hint="Jul 1 – Jul 25" />
        <KpiTile label="Tenants Billed" value="5 / 5" hint="100% complete" />
        <KpiTile label="Overdue" value="1" tone="critical" hint="Tenant E — 4 days" />
        <KpiTile label="Data Completeness" value="99.6%" unit="" tone="good" />
      </div>

      <Panel title="Billing Period Workspace">
        <div className="overflow-x-auto"><table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="py-2 font-normal">Tenant</th>
              <th className="py-2 font-normal text-right">Energy (kWh)</th>
              <th className="py-2 font-normal text-right">Peak demand (kW)</th>
              <th className="py-2 font-normal text-right">Amount</th>
              <th className="py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-surface-2/50">
                <td className="py-2.5">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-[10.5px] text-muted-foreground tabular">{t.id}</div>
                </td>
                <td className="py-2.5 text-right tabular">{fmtNum(t.kwh)}</td>
                <td className="py-2.5 text-right tabular">{fmtNum(t.demand)}</td>
                <td className="py-2.5 text-right tabular font-medium">{fmtIDR(t.amount)}</td>
                <td className="py-2.5">
                  {t.status === "Overdue"
                    ? <span className="inline-block px-1.5 py-0.5 rounded text-[10.5px] uppercase tracking-wider border border-red/40 text-red bg-red/10">Overdue</span>
                    : <StatusPill status={t.status === "Approved" ? "Converted" : t.status === "Sent" ? "Assigned" : "Open"} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Panel>
      </div>
    </AppShell>
  );
}
