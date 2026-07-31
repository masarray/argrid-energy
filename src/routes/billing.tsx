import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  History,
  Landmark,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel } from "@/components/argrid-ui";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import {
  buildInvoices,
  getBillingSummary,
  getChargeComposition,
  getCollectionHistory,
  getDailyCostProfile,
  type BillingException,
  type InvoiceRecord,
  type InvoiceStatus,
} from "@/lib/billing-domain";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/billing")({
  component: Billing,
  head: () => ({
    meta: [
      { title: "Billing & Invoicing — ArGrid" },
      {
        name: "description",
        content: "Auditable tenant invoicing, tariff allocation, meter trace, billing exceptions, collection, and payment workflow.",
      },
      { property: "og:title", content: "ArGrid Billing & Invoicing" },
      {
        property: "og:description",
        content: "Trace each invoice from financial value to tariff rule, meter interval, data quality, and payment status.",
      },
    ],
  }),
});

const invoiceTabs = ["Invoice", "Meter trace", "Audit & payment"] as const;
type InvoiceTab = (typeof invoiceTabs)[number];

const chartAxis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    color: "var(--color-foreground)",
    fontSize: 10,
    padding: "6px 8px",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 9.5 },
};

const chargeColors = [
  "var(--color-primary)",
  "var(--color-violet)",
  "var(--color-amber)",
  "var(--color-muted-foreground)",
  "var(--color-green)",
  "var(--color-orange)",
];

const currencyFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function statusClass(status: InvoiceStatus) {
  if (status === "Paid") return "border-green/30 bg-green/8 text-green";
  if (status === "Overdue" || status === "Review required") return "border-red/30 bg-red/8 text-red";
  if (status === "Partially paid") return "border-amber/30 bg-amber/8 text-amber";
  if (status === "Issued") return "border-primary/30 bg-primary/8 text-primary";
  if (status === "Approved") return "border-violet/30 bg-violet/8 text-violet";
  return "border-border bg-surface-2 text-muted-foreground";
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.09em] ${statusClass(status)}`}>
      {status}
    </span>
  );
}

function Billing() {
  const { site, scenarioId, scenario, telemetry } = useDemoSimulation();
  const exportRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState("INV-2026-06-001");
  const [activeTab, setActiveTab] = useState<InvoiceTab>("Invoice");
  const [message, setMessage] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, InvoiceStatus>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-billing-status-overrides") ?? "{}") as Record<string, InvoiceStatus>;
    } catch {
      return {};
    }
  });
  const [paymentOverrides, setPaymentOverrides] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-billing-payment-overrides") ?? "{}") as Record<string, number>;
    } catch {
      return {};
    }
  });
  const [acceptedExceptions, setAcceptedExceptions] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-billing-accepted-exceptions") ?? "{}") as Record<string, string[]>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    window.localStorage.setItem("argrid-billing-status-overrides", JSON.stringify(statusOverrides));
  }, [statusOverrides]);

  useEffect(() => {
    window.localStorage.setItem("argrid-billing-payment-overrides", JSON.stringify(paymentOverrides));
  }, [paymentOverrides]);

  useEffect(() => {
    window.localStorage.setItem("argrid-billing-accepted-exceptions", JSON.stringify(acceptedExceptions));
  }, [acceptedExceptions]);

  const invoices = useMemo(
    () =>
      buildInvoices(site.name, site.powerScale, scenarioId).map((invoice) => {
        const accepted = new Set(acceptedExceptions[invoice.id] ?? []);
        const exceptions = invoice.exceptions.map((exception) =>
          accepted.has(exception.id) ? { ...exception, status: "Accepted" as const, blocking: false } : exception,
        );
        const extraPayment = paymentOverrides[invoice.id] ?? 0;
        const paid = Math.min(invoice.total, invoice.paid + extraPayment);
        const balance = Math.max(0, invoice.total - paid);
        const override = statusOverrides[invoice.id];
        const derivedStatus: InvoiceStatus =
          paid >= invoice.total
            ? "Paid"
            : extraPayment > 0
              ? "Partially paid"
              : override ?? invoice.status;
        return { ...invoice, exceptions, paid, balance, status: derivedStatus };
      }),
    [acceptedExceptions, paymentOverrides, scenarioId, site.name, site.powerScale, statusOverrides],
  );

  const selected = invoices.find((invoice) => invoice.id === selectedId) ?? invoices[0];
  const summary = useMemo(() => getBillingSummary(invoices), [invoices]);
  const chargeComposition = useMemo(() => getChargeComposition(invoices), [invoices]);
  const collectionHistory = useMemo(() => getCollectionHistory(site.powerScale), [site.powerScale]);
  const dailyCost = useMemo(() => getDailyCostProfile(selected), [selected]);
  const openBlocking = selected.exceptions.filter((exception) => exception.blocking && exception.status === "Open");
  const selectedReady = openBlocking.length === 0 && selected.meter.completenessPct >= 95;
  const totalEnergy = invoices.reduce((sum, invoice) => sum + invoice.meter.totalKWh, 0);
  const peakDemandTotal = invoices.reduce((sum, invoice) => sum + invoice.meter.billingDemandKW, 0);

  const acceptException = (exception: BillingException) => {
    setAcceptedExceptions((current) => ({
      ...current,
      [selected.id]: [...new Set([...(current[selected.id] ?? []), exception.id])],
    }));
    setMessage(`${exception.id} accepted for demonstration with analyst accountability. Production use requires reason code and approval authority.`);
  };

  const approveInvoice = () => {
    if (!selectedReady) {
      setMessage("Approval blocked: resolve billing exceptions and meet the configured completeness gate first.");
      return;
    }
    setStatusOverrides((current) => ({ ...current, [selected.id]: "Approved" }));
    setMessage(`${selected.id} approved by the demo Finance Controller.`);
  };

  const issueInvoice = () => {
    if (selected.status !== "Approved") return;
    setStatusOverrides((current) => ({ ...current, [selected.id]: "Issued" }));
    setMessage(`${selected.id} issued in simulation. No email, ERP posting, or legal document was sent.`);
  };

  const recordPayment = () => {
    const amount = Math.min(selected.balance, Math.max(selected.total * 0.35, 1_000_000));
    if (amount <= 0) return;
    setPaymentOverrides((current) => ({ ...current, [selected.id]: (current[selected.id] ?? 0) + amount }));
    setMessage(`${currencyFull.format(amount)} demo payment recorded against ${selected.id}.`);
  };

  return (
    <AppShell
      title="Billing & Invoicing"
      subtitle="Closed period June 2026 · tenant allocation, invoice assurance, and collection"
      toolbar={
        <>
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[10px] text-muted-foreground" title={scenario.description}>
            <Gauge className="size-3.5 text-primary" /> {telemetry.tariffBand} · {currencyFull.format(telemetry.energyRateIDR)}/kWh
          </div>
          <ExportPdfButton
            targetRef={exportRef}
            title="Billing & Invoicing — June 2026"
            subtitle="Tenant allocation, tariff trace, data quality, and collection"
            filename={`argrid-billing-${new Date().toISOString().slice(0, 10)}.pdf`}
          />
        </>
      }
    >
      <div ref={exportRef} className="space-y-3">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiTile label="Period Billed" value={fmtIDR(summary.billed)} hint="closed June cycle" tone="good" />
          <KpiTile label="Collected" value={fmtIDR(summary.collected)} hint={`${summary.collectionPct.toFixed(1)}% collection`} tone="good" />
          <KpiTile label="Outstanding" value={fmtIDR(summary.outstanding)} hint="issued and overdue" tone={summary.outstanding > 0 ? "warning" : "neutral"} />
          <KpiTile label="Overdue" value={fmtIDR(summary.overdue)} hint="past contractual due date" tone={summary.overdue > 0 ? "critical" : "neutral"} />
          <KpiTile label="Billing Energy" value={fmtNum(totalEnergy)} unit="kWh" hint={`${fmtNum(peakDemandTotal)} kW allocated demand`} />
          <KpiTile label="Data Completeness" value={summary.weightedCompleteness.toFixed(1)} unit="%" hint={`${summary.blockingExceptions} blocking exception`} tone={summary.blockingExceptions > 0 ? "critical" : "good"} />
        </section>

        <section className={`rounded-lg border px-4 py-3 ${summary.blockingExceptions > 0 ? "border-amber/35 bg-amber/8" : "border-green/30 bg-green/8"}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${summary.blockingExceptions > 0 ? "bg-amber/12 text-amber" : "bg-green/12 text-green"}`}>
              {summary.blockingExceptions > 0 ? <ShieldAlert className="size-4" /> : <ShieldCheck className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Billing assurance</span>
                <span className={`rounded border px-1.5 py-0.5 text-[9.5px] font-medium ${summary.blockingExceptions > 0 ? "border-amber/30 bg-amber/10 text-amber" : "border-green/30 bg-green/10 text-green"}`}>
                  {summary.blockingExceptions > 0 ? `${summary.blockingExceptions} blocking issue` : "Ready to issue"}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed">
                Tenant C remains blocked because interval completeness is below the configured 95% review gate. Tenant E has an overdue balance of <strong className="font-medium text-red">{fmtIDR(invoices.find((invoice) => invoice.tenantId === "T-005")?.balance ?? 0)}</strong>. Financial totals are calculated from tariff line items, not typed manually.
              </p>
            </div>
            <button type="button" onClick={() => { setSelectedId("INV-2026-06-003"); setActiveTab("Meter trace"); }} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[10.5px] font-medium hover:bg-surface-2">
              Review exception <ChevronRight className="size-3.5" />
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <Panel title="Billing & Collection Trend" className="h-[328px] xl:col-span-8" actions={<span className="text-[9.5px] text-muted-foreground">issued value vs received payment</span>}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionHistory} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="billedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.01} /></linearGradient>
                  <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-green)" stopOpacity={0.14} /><stop offset="100%" stopColor="var(--color-green)" stopOpacity={0.01} /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis {...chartAxis} width={52} tickFormatter={(value: number) => `${(value / 1_000_000_000).toFixed(1)}B`} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [fmtIDR(Number(value)), name === "billed" ? "Billed" : "Collected"]} />
                <Area type="monotone" dataKey="billed" stroke="var(--color-primary)" strokeWidth={1.8} fill="url(#billedFill)" />
                <Area type="monotone" dataKey="collected" stroke="var(--color-green)" strokeWidth={1.8} fill="url(#collectedFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Charge Composition" className="h-[328px] xl:col-span-4" actions={<span className="text-[9.5px] text-muted-foreground">before tax</span>}>
            <div className="grid h-full grid-cols-[150px_1fr] items-center gap-3">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={chargeComposition} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="var(--color-surface)">
                    {chargeComposition.map((item, index) => <Cell key={item.name} fill={chargeColors[index % chargeColors.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(value: number | string) => [fmtIDR(Number(value))]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {chargeComposition.map((item, index) => {
                  const total = chargeComposition.reduce((sum, current) => sum + current.value, 0);
                  return (
                    <div key={item.name} className="flex items-center gap-2 text-[10px]">
                      <span className="size-2 rounded-sm" style={{ background: chargeColors[index % chargeColors.length] }} />
                      <span className="flex-1 text-muted-foreground">{item.name}</span>
                      <span className="tabular font-medium">{((item.value / total) * 100).toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel title="Invoice Register" className="xl:col-span-4" actions={<span className="text-[9.5px] text-muted-foreground">{invoices.length} tenant invoices</span>}>
            <div className="space-y-1.5">
              {invoices.map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => { setSelectedId(invoice.id); setMessage(""); }}
                  className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors ${selected.id === invoice.id ? "border-primary bg-primary/7" : "border-border bg-surface hover:bg-surface-2"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-semibold">{invoice.tenantName}</div>
                      <div className="mt-0.5 text-[9.5px] text-muted-foreground tabular">{invoice.id} · {invoice.meter.meterId}</div>
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">Invoice total</div>
                      <div className="mt-0.5 text-[13px] font-medium tabular">{fmtIDR(invoice.total)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">Balance</div>
                      <div className={`mt-0.5 text-[11px] font-medium tabular ${invoice.balance > 0 ? "text-amber" : "text-green"}`}>{fmtIDR(invoice.balance)}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted-foreground">
                    <span>{invoice.meter.completenessPct.toFixed(1)}% complete</span>
                    <span>{invoice.exceptions.filter((exception) => exception.status === "Open").length} exceptions</span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title={`${selected.id} · ${selected.tenantName}`} className="xl:col-span-8" actions={<InvoiceStatusBadge status={selected.status} />}>
            <div className="mb-3 grid grid-cols-2 gap-3 border-b border-border pb-3 md:grid-cols-4">
              <Metric icon={Receipt} label="Invoice total" value={fmtIDR(selected.total)} />
              <Metric icon={WalletCards} label="Paid" value={fmtIDR(selected.paid)} tone="good" />
              <Metric icon={Banknote} label="Balance" value={fmtIDR(selected.balance)} tone={selected.balance > 0 ? "warning" : "good"} />
              <Metric icon={CalendarDays} label="Due date" value={selected.dueDate} tone={selected.status === "Overdue" ? "critical" : "neutral"} />
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-1 rounded-md border border-border bg-surface-2 p-1">
              {invoiceTabs.map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`h-7 rounded px-2.5 text-[10px] font-medium ${activeTab === tab ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab}
                </button>
              ))}
              <span className="ml-auto hidden text-[9.5px] text-muted-foreground md:inline">Tariff {selected.tariff.id}</span>
            </div>

            {message && <div className="mb-3 flex items-center gap-2 rounded-md border border-primary/25 bg-primary/7 px-3 py-2 text-[10px]"><History className="size-3.5 text-primary" />{message}</div>}

            {activeTab === "Invoice" && (
              <div>
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Invoice charge line items">
                  <table className="w-full min-w-[760px] text-[10.5px]">
                    <thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.11em] text-muted-foreground"><th className="py-2 font-normal">Code / charge</th><th className="py-2 font-normal">Source</th><th className="py-2 font-normal text-right">Quantity</th><th className="py-2 font-normal text-right">Rate</th><th className="py-2 font-normal text-right">Amount</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {selected.lines.map((line) => (
                        <tr key={line.code} className="hover:bg-surface-2/60">
                          <td className="py-2.5"><div className="font-medium">{line.description}</div><div className="text-[9.5px] text-muted-foreground tabular">{line.code}</div></td>
                          <td className="py-2.5 text-muted-foreground">{line.source}</td>
                          <td className="py-2.5 text-right tabular">{fmtNum(line.quantity)} {line.unit}</td>
                          <td className="py-2.5 text-right tabular">{currencyFull.format(line.unitRate)}</td>
                          <td className="py-2.5 text-right font-medium tabular">{currencyFull.format(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 ml-auto w-full max-w-sm space-y-1.5 text-[10.5px]">
                  <TotalRow label="Charge subtotal" value={selected.subtotal} />
                  <TotalRow label={`Configured tax (${(selected.tariff.taxRate * 100).toFixed(0)}%)`} value={selected.tax} />
                  <TotalRow label="Previous balance" value={selected.previousBalance} />
                  <div className="flex items-center justify-between border-t border-border-strong pt-2 text-[12px] font-semibold"><span>Invoice total</span><span className="tabular">{currencyFull.format(selected.total)}</span></div>
                </div>
                <div className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-[9.5px] leading-relaxed text-muted-foreground">
                  The tariff is an illustrative contract configuration for this open-source demo. It is not represented as an official utility tariff, tax ruling, or legal invoice template.
                </div>
              </div>
            )}

            {activeTab === "Meter trace" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Info label="Meter" value={`${selected.meter.meterId} · ${selected.meter.meterClass}`} />
                  <Info label="Opening reading" value={`${fmtNum(selected.meter.openingReadingKWh)} kWh`} />
                  <Info label="Closing reading" value={`${fmtNum(selected.meter.closingReadingKWh)} kWh`} />
                  <Info label="Billing demand" value={`${fmtNum(selected.meter.billingDemandKW)} kW`} />
                  <Info label="Completeness" value={`${selected.meter.completenessPct.toFixed(1)}%`} />
                  <Info label="Estimated intervals" value={`${selected.meter.estimatedPct.toFixed(1)}%`} />
                  <Info label="Period power factor" value={selected.meter.powerFactor.toFixed(3)} />
                  <Info label="Calibration due" value={selected.meter.calibrationDue} />
                </div>

                <div className="h-[230px] rounded-md border border-border bg-surface-2 p-3">
                  <div className="mb-2 flex items-center justify-between"><div className="text-[9.5px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Daily cost by time band</div><div className="text-[9.5px] text-muted-foreground">illustrative allocation profile</div></div>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={dailyCost} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barGap={0}>
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="day" {...chartAxis} interval={4} />
                      <YAxis {...chartAxis} width={42} tickFormatter={(value: number) => `${(value / 1_000_000).toFixed(0)}M`} />
                      <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [fmtIDR(Number(value)), name]} />
                      <Bar dataKey="offPeak" name="Off-peak" stackId="cost" fill="var(--color-primary)" />
                      <Bar dataKey="shoulder" name="Shoulder" stackId="cost" fill="var(--color-violet)" />
                      <Bar dataKey="peak" name="Peak" stackId="cost" fill="var(--color-amber)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border bg-surface-2 p-3">
                    <div className="flex items-center gap-2 text-[10.5px] font-semibold"><Database className="size-3.5 text-primary" />Measurement provenance</div>
                    <div className="mt-2 space-y-2 text-[9.5px]"><Info label="Source path" value={selected.meter.sourcePath} /><Info label="Allocation basis" value={selected.meter.allocationBasis} /><Info label="Last interval" value={selected.meter.lastInterval} /></div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-2 p-3">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[10.5px] font-semibold"><AlertTriangle className="size-3.5 text-amber" />Billing exceptions</div><span className="text-[9.5px] text-muted-foreground">{selected.exceptions.length} total</span></div>
                    <div className="mt-2 space-y-2">
                      {selected.exceptions.length === 0 ? <div className="flex items-center gap-2 text-[10px] text-green"><CheckCircle2 className="size-3.5" />No billing exception detected.</div> : selected.exceptions.map((exception) => (
                        <div key={exception.id} className={`rounded border p-2 ${exception.blocking && exception.status === "Open" ? "border-red/30 bg-red/6" : "border-border bg-surface"}`}>
                          <div className="flex items-center justify-between gap-2"><span className="text-[9.5px] font-medium">{exception.type}</span><span className="text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">{exception.status}</span></div>
                          <p className="mt-1 text-[9.5px] leading-relaxed text-muted-foreground">{exception.description}</p>
                          {exception.status === "Open" && <button type="button" onClick={() => acceptException(exception)} className="mt-2 h-6 rounded border border-border bg-surface px-2 text-[9.5px] font-medium hover:bg-surface-2">Accept in demo</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Audit & payment" && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Audit trail</div>
                  <div className="space-y-0">
                    {selected.auditTrail.map((entry, index) => (
                      <div key={`${entry.at}-${entry.action}`} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < selected.auditTrail.length - 1 && <span className="absolute left-[5px] top-3 bottom-0 w-px bg-border" />}
                        <span className="mt-1 size-2.5 shrink-0 rounded-full border-2 border-surface bg-primary" />
                        <div><div className="text-[10px] font-medium">{entry.action}</div><div className="mt-0.5 text-[9.5px] text-muted-foreground tabular">{entry.at} · {entry.actor}</div></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3"><Info label="Prepared by" value={selected.preparedBy} /><Info label="Approved by" value={selected.approvedBy ?? "Pending"} /></div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between"><div className="text-[9.5px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Payments</div><span className="text-[9.5px] text-muted-foreground">Balance {fmtIDR(selected.balance)}</span></div>
                  <div className="rounded-md border border-border bg-surface-2">
                    {selected.payments.length === 0 && (paymentOverrides[selected.id] ?? 0) === 0 ? <div className="p-3 text-[10px] text-muted-foreground">No payment has been allocated to this invoice.</div> : selected.payments.map((payment) => (
                      <div key={payment.reference} className="flex items-center gap-3 border-b border-border p-3 last:border-0"><Landmark className="size-4 text-green" /><div className="min-w-0 flex-1"><div className="text-[10px] font-medium">{payment.method}</div><div className="text-[9.5px] text-muted-foreground tabular">{payment.date} · {payment.reference}</div></div><div className="text-[10.5px] font-medium text-green tabular">{currencyFull.format(payment.amount)}</div></div>
                    ))}
                    {(paymentOverrides[selected.id] ?? 0) > 0 && <div className="flex items-center gap-3 border-t border-border p-3"><Landmark className="size-4 text-green" /><div className="min-w-0 flex-1"><div className="text-[10px] font-medium">Demo payment allocation</div><div className="text-[9.5px] text-muted-foreground">Local browser workflow</div></div><div className="text-[10.5px] font-medium text-green tabular">{currencyFull.format(paymentOverrides[selected.id])}</div></div>}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selected.status === "Draft" || selected.status === "Review required") && <button type="button" onClick={approveInvoice} className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground"><BadgeCheck className="size-3.5" />Approve invoice</button>}
                    {selected.status === "Approved" && <button type="button" onClick={issueInvoice} className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground"><FileCheck2 className="size-3.5" />Issue invoice</button>}
                    {["Issued", "Partially paid", "Overdue"].includes(selected.status) && selected.balance > 0 && <button type="button" onClick={recordPayment} className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[10px] font-medium hover:bg-surface-2"><CircleDollarSign className="size-3.5 text-green" />Record demo payment</button>}
                  </div>
                  <div className="mt-3 text-[9.5px] leading-relaxed text-muted-foreground">Workflow changes are stored locally for demonstration. Production invoicing requires segregated approval roles, immutable audit records, ERP posting controls, document numbering governance, and jurisdiction-specific tax validation.</div>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <TrustCard icon={FileText} label="Tariff version" value={selected.tariff.id} detail={`${selected.tariff.effectiveFrom} → ${selected.tariff.effectiveTo}`} />
          <TrustCard icon={Database} label="Meter quality" value={selected.meter.quality} detail={`${selected.meter.completenessPct.toFixed(1)}% complete · ${selected.meter.estimatedPct.toFixed(1)}% estimated`} />
          <TrustCard icon={Clock3} label="Billing demand" value={`${fmtNum(selected.meter.billingDemandKW)} kW`} detail="highest valid 15-minute interval" />
          <TrustCard icon={ShieldCheck} label="Simulation boundary" value="No ERP posting" detail="no legal invoice or payment instruction issued" />
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, tone = "neutral" }: { icon: typeof Receipt; label: string; value: string; tone?: "neutral" | "good" | "warning" | "critical" }) {
  const toneClass = tone === "good" ? "text-green" : tone === "warning" ? "text-amber" : tone === "critical" ? "text-red" : "text-foreground";
  return <div className="flex items-center gap-2.5"><div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2"><Icon className={`size-3.5 ${toneClass}`} /></div><div className="min-w-0"><div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className={`mt-0.5 truncate text-[12px] font-semibold tabular ${toneClass}`}>{value}</div></div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-0.5 text-[10px] leading-relaxed">{value}</div></div>;
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="tabular">{currencyFull.format(value)}</span></div>;
}

function TrustCard({ icon: Icon, label, value, detail }: { icon: typeof FileText; label: string; value: string; detail: string }) {
  return <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/8"><Icon className="size-4 text-primary" /></div><div className="min-w-0"><div className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</div><div className="mt-0.5 truncate text-[10.5px] font-semibold">{value}</div><div className="mt-0.5 truncate text-[9.5px] text-muted-foreground">{detail}</div></div></div>;
}
