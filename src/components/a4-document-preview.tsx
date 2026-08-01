import { createPortal } from "react-dom";
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
