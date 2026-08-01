from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"{label} anchor not found in {path}")
    path.write_text(text.replace(old, new, 1))


component = r'''import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FileDown, Maximize2, Minus, Plus, Printer, X } from "lucide-react";
import type { InvoiceRecord } from "@/lib/billing-domain";
import type { ReportDefinition, SustainabilityInventory } from "@/lib/sustainability-reporting";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.35;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

export function A4DocumentPreview({
  open,
  onClose,
  title,
  documentId,
  pages,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  documentId: string;
  pages: ReactNode[];
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.78);
  const [currentPage, setCurrentPage] = useState(1);

  const fitWidth = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const available = Math.max(360, stage.clientWidth - 72);
    setZoom(clampZoom(available / A4_WIDTH_PX));
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    const frame = window.requestAnimationFrame(fitWidth);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [fitWidth, onClose, open]);

  useEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    if (!stage) return;
    const updateCurrentPage = () => {
      const stageRect = stage.getBoundingClientRect();
      const focusY = stageRect.top + Math.min(stageRect.height * 0.42, 360);
      let nearestPage = 1;
      let nearestDistance = Number.POSITIVE_INFINITY;
      stage.querySelectorAll<HTMLElement>("[data-document-page]").forEach((page) => {
        const rect = page.getBoundingClientRect();
        const distance = Math.abs(rect.top + Math.min(rect.height * 0.28, 250) - focusY);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPage = Number(page.dataset.documentPage ?? 1);
        }
      });
      setCurrentPage(nearestPage);
    };
    updateCurrentPage();
    stage.addEventListener("scroll", updateCurrentPage, { passive: true });
    window.addEventListener("resize", updateCurrentPage);
    return () => {
      stage.removeEventListener("scroll", updateCurrentPage);
      window.removeEventListener("resize", updateCurrentPage);
    };
  }, [open, zoom]);

  if (!open) return null;

  return createPortal(
    <section className="document-preview-shell" role="dialog" aria-modal="true" aria-label={`${title} A4 print preview`}>
      <header className="document-preview-toolbar">
        <div className="document-preview-title">
          <span className="document-preview-file-icon"><FileDown className="size-4" /></span>
          <span className="min-w-0"><strong>{title}</strong><small>{documentId} · A4 portrait</small></span>
        </div>
        <div className="document-preview-page-state" aria-live="polite">
          Page <strong>{currentPage}</strong> of <strong>{pages.length}</strong>
          <span>{pages.length} pages</span>
        </div>
        <div className="document-preview-controls" aria-label="Print preview controls">
          <button type="button" onClick={() => setZoom((value) => clampZoom(value - 0.1))} aria-label="Zoom out"><Minus className="size-4" /></button>
          <span className="document-preview-zoom-value">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => clampZoom(value + 0.1))} aria-label="Zoom in"><Plus className="size-4" /></button>
          <button type="button" onClick={fitWidth} className="document-preview-text-button"><Maximize2 className="size-3.5" /> Fit width</button>
          <button type="button" onClick={() => setZoom(1)} className="document-preview-text-button">Actual size</button>
          <button type="button" onClick={() => window.print()} className="document-preview-print-button"><Printer className="size-3.5" /> Print / Save PDF</button>
          <button type="button" onClick={onClose} aria-label="Close print preview"><X className="size-4" /></button>
        </div>
      </header>

      <div id="document-print-root" ref={stageRef} className="document-preview-stage">
        {pages.map((page, index) => (
          <div
            key={`${documentId}-page-${index + 1}`}
            className="document-preview-page-frame"
            data-document-page={index + 1}
            style={{ width: A4_WIDTH_PX * zoom, height: A4_HEIGHT_PX * zoom }}
          >
            <div className="a4-page" style={{ transform: `scale(${zoom})` }}>
              {page}
            </div>
            <span className="document-preview-page-label" aria-hidden="true">Page {index + 1} of {pages.length}</span>
          </div>
        ))}
      </div>
    </section>,
    document.body,
  );
}

type PageProps = {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  pageCount: number;
  generatedAt: string;
  watermark: string;
  children: ReactNode;
};

function DocumentPage({ documentId, documentTitle, pageNumber, pageCount, generatedAt, watermark, children }: PageProps) {
  return (
    <article className="a4-document-page">
      <span className="a4-watermark">{watermark}</span>
      <header className="a4-document-header">
        <div className="a4-brand"><span>AR</span><div><strong>ArGrid</strong><small>Energy Management System</small></div></div>
        <div className="a4-header-meta"><strong>{documentTitle}</strong><span>{documentId}</span></div>
      </header>
      <main className="a4-document-body">{children}</main>
      <footer className="a4-document-footer">
        <span>Generated {generatedAt} · deterministic browser demonstration</span>
        <span>Page {pageNumber} of {pageCount}</span>
      </footer>
    </article>
  );
}

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function DocLabel({ children }: { children: ReactNode }) {
  return <div className="a4-label">{children}</div>;
}

function DocValue({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <div className={strong ? "a4-value is-strong" : "a4-value"}>{children}</div>;
}

function MetricBox({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="a4-metric"><DocLabel>{label}</DocLabel><DocValue strong>{value}</DocValue>{note && <small>{note}</small>}</div>;
}

function SectionTitle({ index, children }: { index?: string; children: ReactNode }) {
  return <h2 className="a4-section-title">{index && <span>{index}</span>}{children}</h2>;
}

function StatusMark({ passed, label }: { passed: boolean; label: string }) {
  return <span className={passed ? "a4-status is-pass" : "a4-status is-review"}>{passed ? "PASS" : "REVIEW"} · {label}</span>;
}

export function buildEnergyReportPages({
  report,
  inventory,
  site,
  scenario,
  generatedAt,
}: {
  report: ReportDefinition;
  inventory: SustainabilityInventory;
  site: string;
  scenario: string;
  generatedAt: string;
}): ReactNode[] {
  const pageCount = 5;
  const locationTotal = inventory.scope1Tco2e + inventory.scope2LocationTco2e;
  const marketTotal = inventory.scope1Tco2e + inventory.scope2MarketTco2e;
  const marketVariance = marketTotal - inventory.targetYtdTco2e;
  const totalGrid = inventory.months.slice(0, 7).reduce((sum, month) => sum + month.gridMWh, 0);
  const totalRenewable = inventory.months.slice(0, 7).reduce((sum, month) => sum + month.renewableMWh, 0);
  const watermark = "DEMO · SIMULATION ONLY";
  const shared = { documentId: report.id, documentTitle: report.title, pageCount, generatedAt, watermark };

  return [
    <DocumentPage key="cover" {...shared} pageNumber={1}>
      <section className="a4-cover">
        <div className="a4-cover-rule" />
        <DocLabel>Governed energy management report</DocLabel>
        <h1>{report.title}</h1>
        <p>{site}</p>
        <div className="a4-cover-period">{report.period}</div>
        <div className="a4-cover-grid">
          <div><DocLabel>Document ID</DocLabel><DocValue strong>{report.id}</DocValue></div>
          <div><DocLabel>Revision</DocLabel><DocValue strong>R01</DocValue></div>
          <div><DocLabel>Frequency</DocLabel><DocValue strong>{report.frequency}</DocValue></div>
          <div><DocLabel>Status</DocLabel><DocValue strong>{report.status}</DocValue></div>
          <div><DocLabel>Owner</DocLabel><DocValue>{report.owner}</DocValue></div>
          <div><DocLabel>Reviewer</DocLabel><DocValue>{report.reviewer}</DocValue></div>
          <div><DocLabel>Audience</DocLabel><DocValue>{report.audience}</DocValue></div>
          <div><DocLabel>Scenario</DocLabel><DocValue>{scenario}</DocValue></div>
        </div>
        <div className="a4-cover-confidence">
          <div><DocLabel>Source completeness</DocLabel><strong>{report.completenessPct.toFixed(1)}%</strong></div>
          <div><DocLabel>Blocking issues</DocLabel><strong>{report.blockingIssues}</strong></div>
          <div><DocLabel>Assurance state</DocLabel><strong>{inventory.assuranceState}</strong></div>
        </div>
        <p className="a4-cover-note">Automatically assembled from configured interval energy, carbon inventory, reporting workflow, and source-confidence records. No production meter, ERP, statutory filing, or external document system is connected.</p>
      </section>
    </DocumentPage>,

    <DocumentPage key="summary" {...shared} pageNumber={2}>
      <SectionTitle index="01">Executive summary</SectionTitle>
      <div className="a4-metric-grid">
        <MetricBox label="Grid energy YTD" value={`${integer.format(totalGrid)} MWh`} note="January–July" />
        <MetricBox label="Renewable energy YTD" value={`${integer.format(totalRenewable)} MWh`} note={`${inventory.renewableSharePct.toFixed(1)}% share`} />
        <MetricBox label="Scope 1" value={`${number.format(inventory.scope1Tco2e)} tCO₂e`} note="stationary sources" />
        <MetricBox label="Scope 2 market-based" value={`${number.format(inventory.scope2MarketTco2e)} tCO₂e`} note="configured supplier mix" />
        <MetricBox label="Location-based total" value={`${number.format(locationTotal)} tCO₂e`} />
        <MetricBox label="Market-based total" value={`${number.format(marketTotal)} tCO₂e`} />
      </div>
      <div className={marketVariance <= 0 ? "a4-finding is-positive" : "a4-finding is-warning"}>
        <strong>Management conclusion</strong>
        <p>{marketVariance <= 0 ? "Configured market-based emissions remain within the year-to-date target." : "Configured market-based emissions exceed the year-to-date target and require management review."} Current variance is {number.format(Math.abs(marketVariance))} tCO₂e {marketVariance <= 0 ? "favourable" : "adverse"}. Source completeness is {report.completenessPct.toFixed(1)}%.</p>
      </div>
      <SectionTitle index="02">Performance interpretation</SectionTitle>
      <div className="a4-two-column">
        <div className="a4-narrative"><h3>Energy and operational context</h3><p>The reporting period combines purchased grid electricity, on-site renewable generation, stationary fuel records, refrigerant additions, and configured production output. Values are normalized through the active demonstration site scale and scenario.</p><p>Management should review demand exposure, persistent baseload, production-normalized intensity, and verified-saving persistence together rather than treating energy consumption as a standalone KPI.</p></div>
        <div className="a4-narrative"><h3>Carbon and assurance context</h3><p>Location-based and market-based Scope 2 are presented separately. Renewable instruments remain traceable by identifier, vintage, geography, volume, allocation, and status.</p><p>{inventory.assuranceState === "Blocked" ? "At least one blocking assurance condition remains unresolved; publication should stay in review." : "The configured assurance gate is ready for controlled internal publication."}</p></div>
      </div>
      <SectionTitle index="03">Priority management actions</SectionTitle>
      <ol className="a4-action-list">
        <li>Confirm source completeness and estimation exposure before approving the reporting package.</li>
        <li>Review adverse target variance, demand exposure, and high-intensity operating periods with accountable site owners.</li>
        <li>Reconcile renewable allocation and factor versions before any external carbon claim or assurance activity.</li>
        <li>Retain the generated revision, source register, reviewer decision, and exception disposition as one governed package.</li>
      </ol>
    </DocumentPage>,

    <DocumentPage key="monthly" {...shared} pageNumber={3}>
      <SectionTitle index="04">Monthly energy and carbon performance</SectionTitle>
      <table className="a4-table is-compact">
        <thead><tr><th>Month</th><th className="num">Grid MWh</th><th className="num">Renewable MWh</th><th className="num">Scope 1</th><th className="num">Scope 2 LB</th><th className="num">Scope 2 MB</th><th className="num">Target</th><th className="num">Complete</th></tr></thead>
        <tbody>{inventory.months.map((month) => <tr key={month.month}><td><strong>{month.month}</strong></td><td className="num">{number.format(month.gridMWh)}</td><td className="num">{number.format(month.renewableMWh)}</td><td className="num">{number.format(month.scope1Tco2e)}</td><td className="num">{number.format(month.scope2LocationTco2e)}</td><td className="num">{number.format(month.scope2MarketTco2e)}</td><td className="num">{number.format(month.targetTco2e)}</td><td className="num">{month.completenessPct.toFixed(1)}%</td></tr>)}</tbody>
      </table>
      <div className="a4-chart-block" aria-label="Monthly market-based emissions versus target">
        <DocLabel>Monthly Scope 1 + market-based Scope 2 versus target</DocLabel>
        <div className="a4-bar-chart">{inventory.months.map((month) => {
          const actual = month.scope1Tco2e + month.scope2MarketTco2e;
          const maximum = Math.max(...inventory.months.map((item) => Math.max(item.scope1Tco2e + item.scope2MarketTco2e, item.targetTco2e))) * 1.08;
          return <div key={month.month} className="a4-bar-column"><div className="a4-bar-track"><span className="a4-bar-target" style={{ bottom: `${(month.targetTco2e / maximum) * 100}%` }} /><span className="a4-bar-actual" style={{ height: `${(actual / maximum) * 100}%` }} /></div><small>{month.month}</small></div>;
        })}</div>
        <div className="a4-chart-legend"><span><i className="actual" />Actual</span><span><i className="target" />Target</span></div>
      </div>
      <div className="a4-note"><strong>Reading note:</strong> January–July values represent the configured reporting-to-date period; August–December values are deterministic forward-period demonstration values and must not be interpreted as measured actuals.</div>
    </DocumentPage>,

    <DocumentPage key="registers" {...shared} pageNumber={4}>
      <SectionTitle index="05">Emission-factor registry</SectionTitle>
      <table className="a4-table is-compact">
        <thead><tr><th>ID</th><th>Activity</th><th className="num">Factor</th><th>Unit</th><th>Version</th><th>Quality</th></tr></thead>
        <tbody>{inventory.factors.map((factor) => <tr key={factor.id}><td>{factor.id}</td><td>{factor.activity}</td><td className="num">{factor.factor}</td><td>{factor.unit}</td><td>{factor.version}</td><td>{factor.quality}</td></tr>)}</tbody>
      </table>
      <SectionTitle index="06">Renewable-instrument register</SectionTitle>
      <table className="a4-table">
        <thead><tr><th>ID</th><th>Type</th><th>Vintage</th><th className="num">Volume MWh</th><th className="num">Allocated MWh</th><th className="num">Remaining</th><th>Status</th></tr></thead>
        <tbody>{inventory.instruments.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.type}</td><td>{item.vintage}</td><td className="num">{number.format(item.volumeMWh)}</td><td className="num">{number.format(item.allocatedMWh)}</td><td className="num">{number.format(item.remainingMWh)}</td><td>{item.status}</td></tr>)}</tbody>
      </table>
      <SectionTitle index="07">Boundary and method statement</SectionTitle>
      <div className="a4-method-grid">
        <div><DocLabel>Operational boundary</DocLabel><p>{inventory.boundary}</p></div>
        <div><DocLabel>Reporting year</DocLabel><p>{inventory.reportingYear}</p></div>
        <div><DocLabel>Location-based intensity</DocLabel><p>{inventory.intensityLocationTco2ePerKt.toFixed(2)} tCO₂e/kt</p></div>
        <div><DocLabel>Market-based intensity</DocLabel><p>{inventory.intensityMarketTco2ePerKt.toFixed(2)} tCO₂e/kt</p></div>
        <div><DocLabel>Estimated coverage</DocLabel><p>{inventory.estimatedCoveragePct.toFixed(1)}%</p></div>
        <div><DocLabel>Forecast year-end</DocLabel><p>{number.format(inventory.forecastYearEndTco2e)} tCO₂e</p></div>
      </div>
      <div className="a4-note">Factors, instruments, methods, boundaries, and calculations shown here are configured demonstration records. Applicability must be validated before external assurance, statutory reporting, contractual allocation, or public environmental claims.</div>
    </DocumentPage>,

    <DocumentPage key="governance" {...shared} pageNumber={5}>
      <SectionTitle index="08">Report assurance and source register</SectionTitle>
      <table className="a4-table">
        <thead><tr><th>State</th><th>Assurance check</th><th>Evidence / owner</th></tr></thead>
        <tbody>{inventory.checks.map((check) => <tr key={check.id}><td><StatusMark passed={check.passed} label={check.id} /></td><td><strong>{check.label}</strong><br /><small>{check.detail}</small></td><td>{check.owner}<br /><small>{check.blocking ? "Blocking control" : "Review control"}</small></td></tr>)}</tbody>
      </table>
      <div className="a4-two-column a4-source-section">
        <div><SectionTitle index="09">Source systems</SectionTitle><ul className="a4-source-list">{report.sourceSystems.map((source, index) => <li key={source}><span>{String(index + 1).padStart(2, "0")}</span>{source}<strong>{Math.max(82, report.completenessPct - index * 0.7).toFixed(1)}%</strong></li>)}</ul></div>
        <div><SectionTitle index="10">Document sections</SectionTitle><ol className="a4-section-list">{report.sections.map((section) => <li key={section}>{section}</li>)}</ol></div>
      </div>
      <SectionTitle index="11">Approval and publication control</SectionTitle>
      <div className="a4-signature-grid"><div><DocLabel>Prepared by</DocLabel><strong>{report.owner}</strong><span>Signature / date</span></div><div><DocLabel>Reviewed by</DocLabel><strong>{report.reviewer}</strong><span>Signature / date</span></div><div><DocLabel>Publication state</DocLabel><strong>{report.status}</strong><span>Controlled internal demo</span></div></div>
      <div className="a4-disclaimer">This generated package is a deterministic open-source demonstration. It is not a certified ISO 50001 record, statutory greenhouse-gas inventory, external assurance opinion, invoice, utility settlement statement, regulatory filing, or instruction to operate electrical equipment.</div>
    </DocumentPage>,
  ];
}

export function buildInvoicePages({ invoice, generatedAt }: { invoice: InvoiceRecord; generatedAt: string }): ReactNode[] {
  const pageCount = 3;
  const watermark = "SAMPLE INVOICE · NOT A TAX INVOICE";
  const shared = { documentId: invoice.id, documentTitle: "Energy Invoice", pageCount, generatedAt, watermark };
  const paymentTotal = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);

  return [
    <DocumentPage key="invoice" {...shared} pageNumber={1}>
      <section className="a4-invoice-heading">
        <div><DocLabel>Issued by</DocLabel><h1>ArGrid Facility Energy Services</h1><p>{invoice.site}<br />Indonesia · demonstration account</p></div>
        <div className="a4-invoice-title"><span>ENERGY INVOICE</span><strong>{invoice.id}</strong><em>{invoice.status}</em></div>
      </section>
      <div className="a4-invoice-party-grid">
        <div><DocLabel>Bill to</DocLabel><DocValue strong>{invoice.tenantName}</DocValue><p>Account {invoice.tenantId}<br />Service location: {invoice.site}</p></div>
        <div className="a4-invoice-meta"><div><DocLabel>Billing period</DocLabel><DocValue>{invoice.periodStart} — {invoice.periodEnd}</DocValue></div><div><DocLabel>Issue date</DocLabel><DocValue>{invoice.issueDate ?? "Pending issue"}</DocValue></div><div><DocLabel>Due date</DocLabel><DocValue strong>{invoice.dueDate}</DocValue></div><div><DocLabel>Currency</DocLabel><DocValue>IDR</DocValue></div></div>
      </div>
      <SectionTitle>Charge detail</SectionTitle>
      <table className="a4-table a4-invoice-lines">
        <thead><tr><th>Code</th><th>Description</th><th>Source</th><th className="num">Quantity</th><th className="num">Rate</th><th className="num">Amount</th></tr></thead>
        <tbody>{invoice.lines.map((line) => <tr key={line.code}><td>{line.code}</td><td><strong>{line.description}</strong><br /><small>{line.category}</small></td><td>{line.source}</td><td className="num">{integer.format(line.quantity)} {line.unit}</td><td className="num">{money.format(line.unitRate)}</td><td className="num"><strong>{money.format(line.amount)}</strong></td></tr>)}</tbody>
      </table>
      <div className="a4-invoice-bottom">
        <div className="a4-payment-box"><DocLabel>Payment instruction</DocLabel><p><strong>Beneficiary:</strong> ArGrid Facility Energy Services — DEMO<br /><strong>Bank:</strong> Demonstration Clearing Bank<br /><strong>Account:</strong> 000-ARGRID-DEMO<br /><strong>Reference:</strong> {invoice.id}</p><small>No real payment instruction is created. Do not transfer funds.</small></div>
        <div className="a4-total-box"><div><span>Charge subtotal</span><strong>{money.format(invoice.subtotal)}</strong></div><div><span>Configured tax</span><strong>{money.format(invoice.tax)}</strong></div><div><span>Previous balance</span><strong>{money.format(invoice.previousBalance)}</strong></div><div><span>Paid / allocated</span><strong>− {money.format(invoice.paid)}</strong></div><div className="total"><span>Total due</span><strong>{money.format(invoice.balance)}</strong></div></div>
      </div>
      <div className="a4-invoice-note">Tariff and tax values are illustrative configuration data. This document is print-ready for product demonstration but is not a legal tax invoice, utility bill, settlement record, or enforceable payment demand.</div>
    </DocumentPage>,

    <DocumentPage key="meter" {...shared} pageNumber={2}>
      <SectionTitle index="A1">Meter and tariff appendix</SectionTitle>
      <div className="a4-metric-grid is-four">
        <MetricBox label="Meter ID" value={invoice.meter.meterId} note={invoice.meter.meterClass} />
        <MetricBox label="Opening register" value={`${integer.format(invoice.meter.openingReadingKWh)} kWh`} />
        <MetricBox label="Closing register" value={`${integer.format(invoice.meter.closingReadingKWh)} kWh`} />
        <MetricBox label="Billing consumption" value={`${integer.format(invoice.meter.totalKWh)} kWh`} />
        <MetricBox label="Billing demand" value={`${integer.format(invoice.meter.billingDemandKW)} kW`} />
        <MetricBox label="Power factor" value={invoice.meter.powerFactor.toFixed(3)} />
        <MetricBox label="Completeness" value={`${invoice.meter.completenessPct.toFixed(1)}%`} note={`${invoice.meter.estimatedPct.toFixed(1)}% estimated`} />
        <MetricBox label="Meter quality" value={invoice.meter.quality} note={`Multiplier ${invoice.meter.multiplier}`} />
      </div>
      <SectionTitle index="A2">Time-of-use allocation</SectionTitle>
      <table className="a4-table">
        <thead><tr><th>Band</th><th>Window</th><th className="num">Consumption</th><th className="num">Configured rate</th><th>Source</th></tr></thead>
        <tbody>{[
          ["Off-peak", invoice.meter.offPeakKWh, invoice.tariff.offPeakRate],
          ["Shoulder", invoice.meter.shoulderKWh, invoice.tariff.shoulderRate],
          ["Peak", invoice.meter.peakKWh, invoice.tariff.peakRate],
        ].map(([band, usage, rate]) => {
          const window = invoice.tariff.timeBands.find((item) => item.name === band)?.window ?? "Configured period";
          return <tr key={String(band)}><td><strong>{band}</strong></td><td>{window}</td><td className="num">{integer.format(Number(usage))} kWh</td><td className="num">{money.format(Number(rate))}/kWh</td><td>{invoice.meter.meterId}</td></tr>;
        })}</tbody>
      </table>
      <SectionTitle index="A3">Tariff controls</SectionTitle>
      <div className="a4-method-grid">
        <div><DocLabel>Tariff ID</DocLabel><p>{invoice.tariff.id}</p></div><div><DocLabel>Effective period</DocLabel><p>{invoice.tariff.effectiveFrom} — {invoice.tariff.effectiveTo}</p></div><div><DocLabel>Demand rate</DocLabel><p>{money.format(invoice.tariff.demandRate)}/kW</p></div><div><DocLabel>Fixed charge</DocLabel><p>{money.format(invoice.tariff.fixedCharge)}</p></div><div><DocLabel>PF threshold</DocLabel><p>{invoice.tariff.powerFactorThreshold.toFixed(2)}</p></div><div><DocLabel>Calibration due</DocLabel><p>{invoice.meter.calibrationDue}</p></div>
      </div>
      <div className="a4-note"><strong>Billing demand rule:</strong> {invoice.tariff.billingDemandRule}. Allocation basis: {invoice.meter.allocationBasis}. Source path: {invoice.meter.sourcePath}. Last interval: {invoice.meter.lastInterval}.</div>
      <SectionTitle index="A4">Billing exceptions</SectionTitle>
      {invoice.exceptions.length === 0 ? <div className="a4-finding is-positive"><strong>No billing exception detected</strong><p>Configured completeness and tariff checks passed for this demonstration record.</p></div> : <table className="a4-table"><thead><tr><th>ID</th><th>Severity</th><th>Type</th><th>Description</th><th>Status</th></tr></thead><tbody>{invoice.exceptions.map((exception) => <tr key={exception.id}><td>{exception.id}</td><td>{exception.severity}</td><td>{exception.type}</td><td>{exception.description}</td><td>{exception.status}{exception.blocking ? " · blocking" : ""}</td></tr>)}</tbody></table>}
    </DocumentPage>,

    <DocumentPage key="audit" {...shared} pageNumber={3}>
      <SectionTitle index="B1">Document control and audit trail</SectionTitle>
      <table className="a4-table"><thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th></tr></thead><tbody>{invoice.auditTrail.map((entry) => <tr key={`${entry.at}-${entry.action}`}><td>{entry.at}</td><td>{entry.actor}</td><td>{entry.action}</td></tr>)}</tbody></table>
      <SectionTitle index="B2">Payment allocation</SectionTitle>
      {invoice.payments.length === 0 ? <div className="a4-note">No payment record is allocated to this invoice. Current recorded paid amount: {money.format(invoice.paid)}.</div> : <table className="a4-table"><thead><tr><th>Date</th><th>Reference</th><th>Method</th><th className="num">Amount</th></tr></thead><tbody>{invoice.payments.map((payment) => <tr key={payment.reference}><td>{payment.date}</td><td>{payment.reference}</td><td>{payment.method}</td><td className="num">{money.format(payment.amount)}</td></tr>)}</tbody><tfoot><tr><td colSpan={3}><strong>Registered payment records</strong></td><td className="num"><strong>{money.format(paymentTotal)}</strong></td></tr></tfoot></table>}
      <SectionTitle index="B3">Assurance statement</SectionTitle>
      <div className="a4-two-column">
        <div className="a4-narrative"><h3>Measurement provenance</h3><p>Meter {invoice.meter.meterId} is represented as {invoice.meter.meterClass}. The configured source path is {invoice.meter.sourcePath}. Register difference, time-of-use allocation, demand, power factor, tariff lines, tax, prior balance, and payment allocation remain traceable within the browser demonstration model.</p></div>
        <div className="a4-narrative"><h3>Issuance boundary</h3><p>No ERP posting, email delivery, payment-gateway instruction, fiscal signature, statutory tax validation, or immutable archive is performed. Production deployment requires segregated roles, controlled numbering, approved tax logic, retained meter evidence, and document-management integration.</p></div>
      </div>
      <div className="a4-signature-grid"><div><DocLabel>Prepared by</DocLabel><strong>{invoice.preparedBy}</strong><span>Signature / date</span></div><div><DocLabel>Approved by</DocLabel><strong>{invoice.approvedBy ?? "Pending approval"}</strong><span>Signature / date</span></div><div><DocLabel>Invoice status</DocLabel><strong>{invoice.status}</strong><span>Balance {money.format(invoice.balance)}</span></div></div>
      <div className="a4-disclaimer">SAMPLE DOCUMENT — This print package is generated from deterministic simulated records. It may be used for UI demonstration, training, and document-workflow evaluation only.</div>
    </DocumentPage>,
  ];
}
'''
Path("src/components/a4-document-preview.tsx").write_text(component)

reports = Path("src/routes/reports.tsx")
replace_once(
    reports,
    'import { KpiTile, Panel } from "@/components/argrid-ui";\n',
    'import { KpiTile, Panel } from "@/components/argrid-ui";\nimport { A4DocumentPreview, buildEnergyReportPages } from "@/components/a4-document-preview";\n',
    "report preview import",
)
replace_once(
    reports,
    '  buildExecutiveSustainabilityReport,\n  downloadReport,\n',
    '',
    "legacy report export imports",
)
replace_once(
    reports,
    '  const [message, setMessage] = useState("");\n',
    '  const [message, setMessage] = useState("");\n  const [previewOpen, setPreviewOpen] = useState(false);\n  const [generatedAt] = useState(() => new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }));\n',
    "report preview state",
)
replace_once(
    reports,
    '  const directlyExportable = selected.category === "Executive" || selected.category === "Carbon";\n\n',
    '',
    "legacy directly exportable flag",
)
report_text = reports.read_text()
start = report_text.find('  const exportSelected = () => {')
end = report_text.find('\n\n  return (', start)
if start < 0 or end < 0:
    raise SystemExit("report export function anchors not found")
report_pages = '''  const reportPages = useMemo(
    () => buildEnergyReportPages({ report: selected, inventory, site: site.name, scenario: scenario.name, generatedAt }),
    [generatedAt, inventory, scenario.name, selected, site.name],
  );'''
reports.write_text(report_text[:start] + report_pages + report_text[end:])
replace_once(
    reports,
    '            onClick={exportSelected}\n',
    '            onClick={() => setPreviewOpen(true)}\n',
    "report preview button action",
)
replace_once(
    reports,
    '            <FileDown className="size-3.5" /> {directlyExportable ? "Export report" : "Open export source"}\n',
    '            <FileDown className="size-3.5" /> Open A4 preview\n',
    "report preview button label",
)
replace_once(reports, '  return (\n    <AppShell', '  return (\n    <>\n    <AppShell', "report return fragment")
report_text = reports.read_text()
old_tail = '''    </AppShell>
  );
}
'''
new_tail = '''    </AppShell>
    <A4DocumentPreview
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      title={selected.title}
      documentId={selected.id}
      pages={reportPages}
    />
    </>
  );
}
'''
if old_tail not in report_text:
    raise SystemExit("report tail anchor not found")
reports.write_text(report_text.replace(old_tail, new_tail, 1))

billing = Path("src/routes/billing.tsx")
replace_once(
    billing,
    'import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";\n',
    'import { useEffect, useMemo, useState, type ChangeEvent } from "react";\n',
    "billing remove ref import",
)
replace_once(
    billing,
    'import { KpiTile, Panel } from "@/components/argrid-ui";\nimport { ExportPdfButton } from "@/components/export-pdf-button";\n',
    'import { KpiTile, Panel } from "@/components/argrid-ui";\nimport { A4DocumentPreview, buildInvoicePages } from "@/components/a4-document-preview";\n',
    "billing document preview import",
)
replace_once(billing, '  const exportRef = useRef<HTMLDivElement>(null);\n', '', "billing export ref")
replace_once(
    billing,
    '  const [message, setMessage] = useState("");\n',
    '  const [message, setMessage] = useState("");\n  const [previewOpen, setPreviewOpen] = useState(false);\n  const [generatedAt] = useState(() => new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }));\n',
    "billing preview state",
)
replace_once(
    billing,
    '  const selected = invoices.find((invoice) => invoice.id === selectedId) ?? invoices[0];\n',
    '  const selected = invoices.find((invoice) => invoice.id === selectedId) ?? invoices[0];\n  const invoicePages = useMemo(() => buildInvoicePages({ invoice: selected, generatedAt }), [generatedAt, selected]);\n',
    "billing invoice pages",
)
old_export = '''          <ExportPdfButton
            targetRef={exportRef}
            title="Billing & Invoicing — June 2026"
            subtitle="Tenant allocation, tariff trace, data quality, and collection"
            filename={`argrid-billing-${new Date().toISOString().slice(0, 10)}.pdf`}
          />'''
new_export = '''          <button type="button" onClick={() => setPreviewOpen(true)} className="flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-[11px] font-medium text-primary hover:bg-primary/15">
            <FileText className="size-3.5" /> Preview A4 invoice
          </button>'''
replace_once(billing, old_export, new_export, "billing export button")
replace_once(billing, '<div ref={exportRef} className="space-y-3">', '<div className="space-y-3">', "billing export wrapper")
replace_once(billing, '  return (\n    <AppShell', '  return (\n    <>\n    <AppShell', "billing return fragment")
billing_text = billing.read_text()
old_tail = '''    </AppShell>
  );
}

function Metric'''
new_tail = '''    </AppShell>
    <A4DocumentPreview
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      title={`Energy Invoice · ${selected.tenantName}`}
      documentId={selected.id}
      pages={invoicePages}
    />
    </>
  );
}

function Metric'''
if old_tail not in billing_text:
    raise SystemExit("billing tail anchor not found")
billing.write_text(billing_text.replace(old_tail, new_tail, 1))

styles = Path("src/styles.css")
css = styles.read_text()
if "document-preview-shell" in css:
    raise SystemExit("P4 document preview CSS already exists")
css += r'''

/* P4: true paginated A4 document preview and print engine. */
.document-preview-shell {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  flex-direction: column;
  background: #2c3239;
  color: #e8edf2;
}

.document-preview-toolbar {
  position: relative;
  z-index: 2;
  display: grid;
  min-height: 54px;
  grid-template-columns: minmax(240px, 1fr) auto minmax(480px, 1fr);
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #4a525c;
  background: #20262c;
  padding: 8px 14px;
  box-shadow: 0 2px 14px rgb(0 0 0 / 24%);
}

.document-preview-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.document-preview-title strong,
.document-preview-title small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-preview-title strong { font-size: 12px; font-weight: 650; }
.document-preview-title small { margin-top: 2px; color: #aab4bf; font-size: 9.5px; }
.document-preview-file-icon { display: grid; width: 30px; height: 30px; flex: none; place-items: center; border: 1px solid #4d5964; border-radius: 6px; background: #2c343c; color: #61c4d8; }
.document-preview-page-state { display: flex; align-items: center; gap: 4px; color: #cbd3da; font-size: 10.5px; white-space: nowrap; }
.document-preview-page-state span { margin-left: 8px; border-left: 1px solid #4d5964; padding-left: 10px; color: #8f9aa5; }
.document-preview-controls { display: flex; justify-content: flex-end; align-items: center; gap: 5px; }
.document-preview-controls button { display: inline-flex; height: 32px; align-items: center; justify-content: center; gap: 6px; border: 1px solid #4b555f; border-radius: 5px; background: #2b3239; padding: 0 9px; color: #dfe5ea; font-size: 10px; }
.document-preview-controls button:hover { border-color: #697681; background: #343d45; }
.document-preview-controls button:not(.document-preview-text-button):not(.document-preview-print-button) { width: 32px; padding: 0; }
.document-preview-controls .document-preview-print-button { border-color: #2498ad; background: #147f92; color: white; font-weight: 650; }
.document-preview-zoom-value { min-width: 44px; text-align: center; color: #bec8d1; font-size: 10px; font-variant-numeric: tabular-nums; }

.document-preview-stage {
  flex: 1;
  overflow: auto;
  scroll-behavior: smooth;
  background:
    linear-gradient(rgb(255 255 255 / 2%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 2%) 1px, transparent 1px),
    #343a42;
  background-size: 20px 20px;
  padding: 32px 36px 72px;
}

.document-preview-page-frame {
  position: relative;
  margin: 0 auto 42px;
  transition: width 120ms ease, height 120ms ease;
}

.document-preview-page-label {
  position: absolute;
  left: 50%;
  top: calc(100% + 10px);
  transform: translateX(-50%);
  color: #aeb8c1;
  font-size: 9.5px;
  white-space: nowrap;
}

.a4-page {
  width: 794px;
  height: 1123px;
  transform-origin: top left;
  overflow: hidden;
  background: white;
  box-shadow: 0 8px 30px rgb(0 0 0 / 36%), 0 0 0 1px rgb(0 0 0 / 18%);
  color: #1f2933;
  font-family: Inter, Arial, sans-serif;
  font-size: 10px;
  line-height: 1.42;
}

.a4-document-page { position: relative; display: flex; height: 100%; flex-direction: column; overflow: hidden; padding: 34px 42px 30px; }
.a4-watermark { position: absolute; left: 50%; top: 49%; z-index: 0; transform: translate(-50%, -50%) rotate(-35deg); color: rgb(13 148 170 / 5.5%); font-size: 50px; font-weight: 800; letter-spacing: .08em; white-space: nowrap; }
.a4-document-header { position: relative; z-index: 1; display: flex; min-height: 46px; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 2px solid #1497ad; padding-bottom: 10px; }
.a4-brand { display: flex; align-items: center; gap: 9px; }
.a4-brand > span { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 5px; background: #14313c; color: #75d4e4; font-size: 11px; font-weight: 800; }
.a4-brand strong, .a4-brand small { display: block; }
.a4-brand strong { font-size: 12px; letter-spacing: -.01em; }
.a4-brand small { color: #65727e; font-size: 7.5px; text-transform: uppercase; letter-spacing: .12em; }
.a4-header-meta { min-width: 0; text-align: right; }
.a4-header-meta strong, .a4-header-meta span { display: block; }
.a4-header-meta strong { max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; }
.a4-header-meta span { margin-top: 2px; color: #6d7882; font-size: 8px; font-variant-numeric: tabular-nums; }
.a4-document-body { position: relative; z-index: 1; flex: 1; min-height: 0; padding-top: 22px; }
.a4-document-footer { position: relative; z-index: 1; display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid #ccd5dc; padding-top: 8px; color: #74808b; font-size: 7.5px; }
.a4-label { color: #64717d; font-size: 7.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.a4-value { margin-top: 3px; font-size: 9px; line-height: 1.35; }
.a4-value.is-strong { font-size: 11px; font-weight: 700; }
.a4-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; color: #1d3540; font-size: 13px; line-height: 1.2; }
.a4-section-title:not(:first-child) { margin-top: 19px; }
.a4-section-title span { display: grid; width: 24px; height: 20px; place-items: center; border-radius: 3px; background: #e5f4f7; color: #117f92; font-size: 8px; }
.a4-cover { display: flex; height: 100%; flex-direction: column; padding: 72px 28px 28px; }
.a4-cover-rule { width: 72px; height: 5px; margin-bottom: 20px; background: #1497ad; }
.a4-cover h1 { max-width: 590px; margin: 10px 0 0; color: #172d37; font-size: 30px; line-height: 1.08; letter-spacing: -.035em; }
.a4-cover > p { margin: 10px 0 0; color: #5d6b76; font-size: 12px; }
.a4-cover-period { margin-top: 28px; color: #1497ad; font-size: 16px; font-weight: 700; }
.a4-cover-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; margin-top: 42px; border: 1px solid #cfd8df; }
.a4-cover-grid > div { min-height: 60px; border-right: 1px solid #d9e1e6; border-bottom: 1px solid #d9e1e6; padding: 12px 14px; }
.a4-cover-grid > div:nth-child(2n) { border-right: 0; }
.a4-cover-grid > div:nth-last-child(-n+2) { border-bottom: 0; }
.a4-cover-confidence { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 22px; border-left: 4px solid #1497ad; background: #eff7f8; padding: 14px 16px; }
.a4-cover-confidence > div { border-right: 1px solid #cbdadd; padding-right: 14px; }
.a4-cover-confidence > div + div { padding-left: 14px; }
.a4-cover-confidence > div:last-child { border-right: 0; }
.a4-cover-confidence strong { display: block; margin-top: 3px; font-size: 14px; }
.a4-cover-note { margin-top: auto !important; border-top: 1px solid #d4dde3; padding-top: 14px; font-size: 8.5px !important; line-height: 1.55; }
.a4-metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.a4-metric-grid.is-four { grid-template-columns: repeat(4, 1fr); }
.a4-metric { min-height: 74px; border: 1px solid #d6dee4; border-radius: 4px; background: #f8fafb; padding: 11px; }
.a4-metric small { display: block; margin-top: 5px; color: #77838d; font-size: 7.5px; }
.a4-finding { margin-top: 16px; border-left: 4px solid #d89a19; background: #fff8e8; padding: 12px 14px; }
.a4-finding.is-positive { border-left-color: #25835a; background: #edf8f2; }
.a4-finding strong { font-size: 9px; }
.a4-finding p { margin: 4px 0 0; color: #495761; font-size: 8.5px; }
.a4-two-column { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.a4-narrative { border: 1px solid #d8e0e5; padding: 12px; }
.a4-narrative h3 { margin: 0; color: #263c47; font-size: 9px; }
.a4-narrative p { margin: 6px 0 0; color: #586670; font-size: 8px; line-height: 1.55; }
.a4-action-list { margin: 0; padding-left: 20px; }
.a4-action-list li { margin: 7px 0; padding-left: 4px; font-size: 8.5px; }
.a4-table { width: 100%; border-collapse: collapse; table-layout: auto; font-size: 8px; }
.a4-table th, .a4-table td { border: 1px solid #d5dde3; padding: 7px 8px; text-align: left; vertical-align: top; }
.a4-table th { background: #edf3f6; color: #52616d; font-size: 7px; letter-spacing: .07em; text-transform: uppercase; }
.a4-table td.num, .a4-table th.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.a4-table small { color: #72808b; font-size: 7px; }
.a4-table.is-compact th, .a4-table.is-compact td { padding: 5.5px 6px; }
.a4-table tfoot td { background: #f3f6f8; }
.a4-chart-block { margin-top: 18px; border: 1px solid #d5dde3; background: #fafcfd; padding: 12px 14px; }
.a4-bar-chart { display: flex; height: 170px; align-items: flex-end; gap: 8px; margin-top: 14px; }
.a4-bar-column { display: flex; min-width: 0; flex: 1; height: 100%; flex-direction: column; align-items: center; gap: 5px; }
.a4-bar-track { position: relative; width: 72%; flex: 1; border-bottom: 1px solid #9eabb5; background: linear-gradient(to top, #eef3f5 1px, transparent 1px); background-size: 100% 25%; }
.a4-bar-actual { position: absolute; right: 16%; bottom: 0; left: 16%; min-height: 2px; background: #1497ad; }
.a4-bar-target { position: absolute; right: 5%; left: 5%; z-index: 2; border-top: 2px dashed #c18419; }
.a4-bar-column small { color: #66737e; font-size: 7px; }
.a4-chart-legend { display: flex; justify-content: flex-end; gap: 14px; margin-top: 7px; color: #66737e; font-size: 7px; }
.a4-chart-legend span { display: flex; align-items: center; gap: 5px; }
.a4-chart-legend i { display: block; width: 14px; height: 4px; background: #1497ad; }
.a4-chart-legend i.target { height: 0; border-top: 2px dashed #c18419; background: transparent; }
.a4-note { margin-top: 14px; border: 1px solid #d6dfe5; background: #f7f9fa; padding: 10px 12px; color: #596771; font-size: 8px; line-height: 1.5; }
.a4-method-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid #d5dde3; }
.a4-method-grid > div { min-height: 62px; border-right: 1px solid #dce3e8; border-bottom: 1px solid #dce3e8; padding: 10px; }
.a4-method-grid > div:nth-child(3n) { border-right: 0; }
.a4-method-grid > div:nth-last-child(-n+3) { border-bottom: 0; }
.a4-method-grid p { margin: 5px 0 0; font-size: 8px; }
.a4-status { display: inline-flex; border-radius: 3px; padding: 3px 5px; font-size: 6.5px; font-weight: 800; white-space: nowrap; }
.a4-status.is-pass { background: #e7f5ed; color: #20714d; }
.a4-status.is-review { background: #fff3d9; color: #9a6a0e; }
.a4-source-section { margin-top: 4px; }
.a4-source-list, .a4-section-list { margin: 0; padding: 0; list-style: none; }
.a4-source-list li { display: grid; grid-template-columns: 24px 1fr auto; align-items: center; gap: 8px; border-bottom: 1px solid #dce3e8; padding: 7px 0; font-size: 8px; }
.a4-source-list li span { color: #1497ad; font-size: 7px; }
.a4-source-list li strong { font-variant-numeric: tabular-nums; }
.a4-section-list { counter-reset: section; }
.a4-section-list li { counter-increment: section; border-bottom: 1px solid #dce3e8; padding: 7px 0; font-size: 8px; }
.a4-section-list li::before { content: counter(section, decimal-leading-zero) "  "; color: #1497ad; font-size: 7px; }
.a4-signature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }
.a4-signature-grid > div { min-height: 90px; border: 1px solid #cfd8df; padding: 12px; }
.a4-signature-grid strong { display: block; margin-top: 8px; font-size: 9px; }
.a4-signature-grid span { display: block; margin-top: 30px; border-top: 1px solid #9facb6; padding-top: 5px; color: #74808a; font-size: 7px; }
.a4-disclaimer { margin-top: 18px; border-top: 2px solid #263e49; padding-top: 10px; color: #64717b; font-size: 7.5px; line-height: 1.55; }
.a4-invoice-heading { display: flex; justify-content: space-between; gap: 24px; }
.a4-invoice-heading h1 { margin: 5px 0 3px; color: #1a333e; font-size: 16px; }
.a4-invoice-heading p { margin: 0; color: #66737e; font-size: 8px; }
.a4-invoice-title { text-align: right; }
.a4-invoice-title span, .a4-invoice-title strong, .a4-invoice-title em { display: block; }
.a4-invoice-title span { color: #1497ad; font-size: 17px; font-weight: 800; letter-spacing: .06em; }
.a4-invoice-title strong { margin-top: 5px; font-size: 11px; }
.a4-invoice-title em { display: inline-block; margin-top: 6px; border: 1px solid #cbd5dc; border-radius: 3px; padding: 3px 7px; color: #52616b; font-size: 7px; font-style: normal; text-transform: uppercase; }
.a4-invoice-party-grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 24px; margin-top: 26px; border-top: 1px solid #cfd8df; border-bottom: 1px solid #cfd8df; padding: 14px 0; }
.a4-invoice-party-grid p { margin: 6px 0 0; color: #63707b; font-size: 8px; }
.a4-invoice-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 18px; }
.a4-invoice-lines { margin-top: 0; }
.a4-invoice-bottom { display: grid; grid-template-columns: 1fr 280px; gap: 22px; margin-top: 16px; }
.a4-payment-box { border: 1px solid #d3dce2; background: #f8fafb; padding: 12px; }
.a4-payment-box p { margin: 7px 0; font-size: 8px; line-height: 1.55; }
.a4-payment-box small { color: #a05e17; font-size: 7px; }
.a4-total-box { font-size: 8.5px; }
.a4-total-box > div { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #d8e0e5; padding: 6px 0; }
.a4-total-box .total { margin-top: 6px; border-top: 2px solid #173640; border-bottom: 0; padding-top: 10px; color: #173640; font-size: 12px; }
.a4-invoice-note { margin-top: 18px; border-left: 4px solid #d19122; background: #fff8e7; padding: 10px 12px; color: #6d5a37; font-size: 7.5px; line-height: 1.5; }

@media (max-width: 1100px) {
  .document-preview-toolbar { grid-template-columns: minmax(180px, 1fr) auto; }
  .document-preview-page-state { display: none; }
  .document-preview-controls { grid-column: 1 / -1; justify-content: center; }
}

@media (max-width: 640px) {
  .document-preview-toolbar { display: flex; flex-wrap: wrap; gap: 7px; }
  .document-preview-title { width: calc(100% - 40px); }
  .document-preview-controls { width: 100%; overflow-x: auto; justify-content: flex-start; padding-bottom: 2px; }
  .document-preview-controls .document-preview-text-button { display: none; }
  .document-preview-stage { padding: 24px 16px 64px; }
}

@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  html, body { width: 210mm !important; margin: 0 !important; background: white !important; }
  body > * { visibility: hidden !important; }
  .document-preview-shell, .document-preview-shell * { visibility: visible !important; }
  .document-preview-shell { position: absolute !important; inset: 0 auto auto 0 !important; display: block !important; width: 210mm !important; background: white !important; color: #1f2933 !important; }
  .document-preview-toolbar, .document-preview-page-label { display: none !important; }
  .document-preview-stage { display: block !important; overflow: visible !important; width: 210mm !important; padding: 0 !important; background: white !important; }
  .document-preview-page-frame { width: 210mm !important; height: 297mm !important; margin: 0 !important; break-after: page; page-break-after: always; }
  .document-preview-page-frame:last-child { break-after: auto; page-break-after: auto; }
  .a4-page { width: 210mm !important; height: 297mm !important; transform: none !important; box-shadow: none !important; }
}
'''
styles.write_text(css)

smoke = Path("tests/e2e/smoke.spec.ts")
smoke_text = smoke.read_text()
insert = r'''
  test("report center provides a real paginated A4 print preview", async ({ page }) => {
    await prepareDemo(page, { scenario: "normal" });
    await openWorkspace(page, "/reports");
    await expectWorkspaceHeading(page, "Report Center");

    await page.getByRole("button", { name: "Open A4 preview" }).click();
    const preview = page.getByRole("dialog", { name: /A4 print preview/ });
    await expect(preview).toBeVisible();
    await expect(preview.getByText("5 pages", { exact: true })).toBeVisible();
    await expect(preview.locator("[data-document-page]")).toHaveCount(5);
    await expect(preview.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(preview.getByRole("button", { name: "Zoom out" })).toBeVisible();
    await expect(preview.getByRole("button", { name: "Print / Save PDF" })).toBeVisible();
    await preview.getByRole("button", { name: "Close print preview" }).click();
    await expect(preview).toBeHidden();
  });

  test("billing opens a multi-page print-ready A4 invoice", async ({ page }) => {
    await prepareDemo(page, { scenario: "normal" });
    await openWorkspace(page, "/billing");
    await expectWorkspaceHeading(page, "Billing & Invoicing");

    await page.getByRole("button", { name: "Preview A4 invoice" }).click();
    const preview = page.getByRole("dialog", { name: /Energy Invoice.*A4 print preview/ });
    await expect(preview).toBeVisible();
    await expect(preview.getByText("3 pages", { exact: true })).toBeVisible();
    await expect(preview.locator("[data-document-page]")).toHaveCount(3);
    await expect(preview.getByText("SAMPLE INVOICE · NOT A TAX INVOICE").first()).toBeVisible();
    await expect(preview.getByText("Payment instruction", { exact: true })).toBeVisible();
  });
'''
closing = "\n});\n"
if not smoke_text.endswith(closing):
    raise SystemExit("smoke test closing anchor not found")
smoke.write_text(smoke_text[:-len(closing)] + "\n" + insert + closing)
