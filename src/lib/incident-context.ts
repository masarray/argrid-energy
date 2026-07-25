import {
  getRmsSeries,
  getWaveformSeries,
  type InvestigationStatus,
  type PowerQualityEvent,
} from "./power-quality";

const EVENT_KEY = "argrid-selected-pq-event";
const FEEDER_KEY = "argrid-selected-electrical-feeder";
const INCIDENT_KEY = "argrid-selected-incident-group";

export type IncidentContext = {
  eventId?: string;
  feederId?: string;
  incidentGroupId?: string;
};

export type IncidentDocumentControl = {
  documentNumber: string;
  revision: string;
  documentStatus: "Draft" | "For technical review" | "Technically reviewed" | "Approved and closed";
  classification: string;
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  reviewState: "Pending" | "Completed";
  approvalState: "Not required yet" | "Pending" | "Completed";
};

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readIncidentContext(): IncidentContext {
  if (!storageAvailable()) return {};
  return {
    eventId: window.localStorage.getItem(EVENT_KEY) ?? undefined,
    feederId: window.localStorage.getItem(FEEDER_KEY) ?? undefined,
    incidentGroupId: window.localStorage.getItem(INCIDENT_KEY) ?? undefined,
  };
}

export function storeIncidentContext(context: IncidentContext) {
  if (!storageAvailable()) return;
  if (context.eventId) window.localStorage.setItem(EVENT_KEY, context.eventId);
  if (context.feederId) window.localStorage.setItem(FEEDER_KEY, context.feederId);
  if (context.incidentGroupId) window.localStorage.setItem(INCIDENT_KEY, context.incidentGroupId);
}

export function getIncidentDocumentControl(event: PowerQualityEvent, status: InvestigationStatus): IncidentDocumentControl {
  const incidentSequence = event.incidentGroupId.replace(/\D/g, "").slice(-4).padStart(4, "0");
  const reviewed = status === "Confirmed" || status === "Closed";
  const approved = status === "Closed";

  return {
    documentNumber: `AGR-PQ-${event.timestamp.slice(0, 4)}-${incidentSequence}`,
    revision: approved ? "R2" : reviewed ? "R1" : "R0",
    documentStatus: approved ? "Approved and closed" : reviewed ? "Technically reviewed" : status === "Investigating" ? "For technical review" : "Draft",
    classification: "Internal engineering review · deterministic demonstration data",
    preparedBy: event.investigationOwner,
    reviewedBy: "Electrical Reliability Manager",
    approvedBy: "Plant Engineering Manager",
    reviewState: reviewed ? "Completed" : "Pending",
    approvalState: approved ? "Completed" : reviewed ? "Pending" : "Not required yet",
  };
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type ReportTimelineItem = {
  timestamp: string;
  title: string;
  detail: string;
};

type NumericPoint = Record<string, number>;

function polyline(
  points: NumericPoint[],
  xKey: string,
  yKey: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  width: number,
  height: number,
  padX: number,
  padY: number,
) {
  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;
  return points
    .map((point) => {
      const x = padX + ((point[xKey] - xMin) / Math.max(1e-9, xMax - xMin)) * usableWidth;
      const y = padY + (1 - (point[yKey] - yMin) / Math.max(1e-9, yMax - yMin)) * usableHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function renderRmsEvidenceSvg(event: PowerQualityEvent) {
  const width = 920;
  const height = 260;
  const padX = 50;
  const padY = 28;
  const points = getRmsSeries(event) as unknown as NumericPoint[];
  const xMin = Math.min(...points.map((point) => point.timeMs));
  const xMax = Math.max(...points.map((point) => point.timeMs));
  const eventX1 = padX + ((0 - xMin) / (xMax - xMin)) * (width - padX * 2);
  const eventX2 = padX + ((event.durationMs - xMin) / (xMax - xMin)) * (width - padX * 2);
  const thresholdY = padY + (1 - (90 - 70) / (112 - 70)) * (height - padY * 2);

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Three-phase RMS voltage envelope">
    <rect width="${width}" height="${height}" fill="#f8fafc" />
    <rect x="${eventX1.toFixed(1)}" y="${padY}" width="${Math.max(2, eventX2 - eventX1).toFixed(1)}" height="${height - padY * 2}" fill="#dc2626" opacity="0.08" />
    <line x1="${padX}" y1="${thresholdY.toFixed(1)}" x2="${width - padX}" y2="${thresholdY.toFixed(1)}" stroke="#d97706" stroke-dasharray="6 5" />
    <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#94a3b8" />
    <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" stroke="#94a3b8" />
    <polyline points="${polyline(points, "timeMs", "phaseA", xMin, xMax, 70, 112, width, height, padX, padY)}" fill="none" stroke="#0891b2" stroke-width="2" />
    <polyline points="${polyline(points, "timeMs", "phaseB", xMin, xMax, 70, 112, width, height, padX, padY)}" fill="none" stroke="#d97706" stroke-width="1.6" />
    <polyline points="${polyline(points, "timeMs", "phaseC", xMin, xMax, 70, 112, width, height, padX, padY)}" fill="none" stroke="#7c3aed" stroke-width="1.6" />
    <text x="${padX}" y="17" font-size="10" fill="#475569">RMS VOLTAGE ENVELOPE · % Un</text>
    <text x="${width - padX}" y="${height - 8}" text-anchor="end" font-size="9" fill="#64748b">Time relative to trigger · ms</text>
    <text x="${width - padX}" y="${thresholdY - 5}" text-anchor="end" font-size="9" fill="#b45309">90% Un trigger threshold</text>
    <g font-size="9" fill="#475569"><text x="${padX + 170}" y="17" fill="#0891b2">Phase A</text><text x="${padX + 230}" y="17" fill="#d97706">Phase B</text><text x="${padX + 290}" y="17" fill="#7c3aed">Phase C</text></g>
  </svg>`;
}

function renderWaveformEvidenceSvg(event: PowerQualityEvent) {
  const width = 920;
  const height = 260;
  const padX = 50;
  const padY = 28;
  const raw = getWaveformSeries(event) as unknown as NumericPoint[];
  const step = Math.max(1, Math.floor(raw.length / 380));
  const points = raw.filter((_, index) => index % step === 0);
  const xMin = Math.min(...points.map((point) => point.timeMs));
  const xMax = Math.max(...points.map((point) => point.timeMs));
  const zeroY = padY + 0.5 * (height - padY * 2);

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Three-phase instantaneous voltage waveform">
    <rect width="${width}" height="${height}" fill="#f8fafc" />
    <line x1="${padX}" y1="${zeroY}" x2="${width - padX}" y2="${zeroY}" stroke="#cbd5e1" />
    <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#94a3b8" />
    <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" stroke="#94a3b8" />
    <polyline points="${polyline(points, "timeMs", "phaseA", xMin, xMax, -360, 360, width, height, padX, padY)}" fill="none" stroke="#0891b2" stroke-width="1.2" />
    <polyline points="${polyline(points, "timeMs", "phaseB", xMin, xMax, -360, 360, width, height, padX, padY)}" fill="none" stroke="#d97706" stroke-width="1.1" />
    <polyline points="${polyline(points, "timeMs", "phaseC", xMin, xMax, -360, 360, width, height, padX, padY)}" fill="none" stroke="#7c3aed" stroke-width="1.1" />
    <text x="${padX}" y="17" font-size="10" fill="#475569">INSTANTANEOUS VOLTAGE WAVEFORM · V peak</text>
    <text x="${width - padX}" y="${height - 8}" text-anchor="end" font-size="9" fill="#64748b">Time relative to trigger · ms</text>
  </svg>`;
}

function renderElectricalContextSvg(event: PowerQualityEvent) {
  return `<svg viewBox="0 0 920 250" role="img" aria-label="Electrical context one-line">
    <rect width="920" height="250" fill="#f8fafc" />
    <rect x="365" y="18" width="190" height="42" rx="5" fill="#ffffff" stroke="#94a3b8" />
    <text x="460" y="35" text-anchor="middle" font-size="9" fill="#64748b">UTILITY / MAIN INCOMER</text>
    <text x="460" y="51" text-anchor="middle" font-size="12" fill="#17202a">PM-MAIN-01 · 91.4% Un</text>
    <line x1="460" y1="60" x2="460" y2="112" stroke="#0891b2" stroke-width="3" />
    <line x1="100" y1="112" x2="820" y2="112" stroke="#0891b2" stroke-width="5" />
    ${[160, 310, 460, 610, 760].map((x, index) => {
      const selected = index === 4;
      const feeder = selected ? event.feederId : `F-0${index + 3}`;
      const value = selected ? `${event.minimumVoltagePct.toFixed(1)}% Un` : "NORMAL";
      const color = selected ? "#dc2626" : "#0891b2";
      return `<line x1="${x}" y1="112" x2="${x}" y2="155" stroke="${color}" stroke-width="${selected ? 4 : 2}" /><rect x="${x - 48}" y="155" width="96" height="55" rx="4" fill="#ffffff" stroke="${color}" stroke-width="${selected ? 2 : 1}" /><text x="${x}" y="176" text-anchor="middle" font-size="10" fill="#17202a">${feeder}</text><text x="${x}" y="195" text-anchor="middle" font-size="10" fill="${selected ? "#dc2626" : "#15803d"}">${value}</text>`;
    }).join("")}
    <text x="100" y="101" font-size="9" fill="#64748b">MSB-MAIN · CORRELATED EVENT PATH</text>
  </svg>`;
}

export function buildInvestigationReport(
  event: PowerQualityEvent,
  status: InvestigationStatus,
  timeline: ReportTimelineItem[],
) {
  const document = getIncidentDocumentControl(event, status);
  const generatedAt = new Date().toLocaleString("en-US", { hour12: false });
  const meterRows = event.correlatedMeters
    .map(
      (meter) => `<tr>
        <td>${escapeHtml(meter.meterId)}</td>
        <td>${escapeHtml(meter.location)}</td>
        <td>${escapeHtml(meter.direction)}</td>
        <td>${meter.minimumVoltagePct.toFixed(1)}% Un</td>
        <td>${meter.durationMs} ms</td>
        <td>+${meter.startOffsetMs} ms</td>
        <td>±${meter.timeSyncErrorMs.toFixed(1)} ms</td>
        <td>${escapeHtml(meter.quality)}</td>
        <td>${escapeHtml(meter.evidence)}</td>
      </tr>`,
    )
    .join("");

  const responseRows = event.equipmentResponses
    .map(
      (equipment) => `<tr>
        <td>${escapeHtml(equipment.assetId)}</td>
        <td>${escapeHtml(equipment.assetName)}</td>
        <td>${escapeHtml(equipment.stateAfterEvent)}</td>
        <td>${equipment.restartSeconds.toFixed(1)} s</td>
        <td>${escapeHtml(equipment.response)}</td>
        <td>${escapeHtml(equipment.productionConsequence)}</td>
      </tr>`,
    )
    .join("");

  const chronologyRows = timeline
    .map(
      (item) => `<tr><td>${escapeHtml(item.timestamp)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail)}</td></tr>`,
    )
    .join("");

  const notes = event.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  const revisions = [
    ["R0", "Initial event package and deterministic evidence capture", event.investigationOwner, event.timestamp.slice(0, 10)],
    ...(document.revision !== "R0" ? [["R1", "Correlation conclusion and engineering review", document.reviewedBy, "2026-07-18"]] : []),
    ...(document.revision === "R2" ? [["R2", "Final disposition and incident closure", document.approvedBy, "2026-07-22"]] : []),
  ];

  const revisionRows = revisions.map(([revision, description, author, date]) => `<tr><td>${revision}</td><td>${escapeHtml(description)}</td><td>${escapeHtml(author)}</td><td>${date}</td></tr>`).join("");
  const evidenceRows = [
    ["EV-01", "Three-phase RMS envelope", `${event.sourceMeter} · deterministic replay`, "Available"],
    ["EV-02", "Three-phase instantaneous waveform", `${event.waveformSampleRateHz.toLocaleString("en-US")} Hz source package`, "Available"],
    ["EV-03", "Synchronized meter correlation", `${event.correlatedMeters.length} meters · max ±${Math.max(...event.correlatedMeters.map((meter) => meter.timeSyncErrorMs)).toFixed(1)} ms`, "Available"],
    ["EV-04", "Equipment response chronology", `${event.equipmentResponses.length} linked assets`, event.equipmentResponses.length > 0 ? "Available" : "Not attached"],
    ["EV-05", "Field inspection evidence", "MCC-AUX-07 inspection record", status === "Confirmed" || status === "Closed" ? "Accepted" : "Pending"],
  ].map(([id, evidence, source, state]) => `<tr><td>${id}</td><td>${escapeHtml(evidence)}</td><td>${escapeHtml(source)}</td><td>${escapeHtml(state)}</td></tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(document.documentNumber)} ${escapeHtml(document.revision)} — ArGrid PQ Investigation</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Arial, sans-serif; color: #17202a; }
    * { box-sizing: border-box; }
    body { max-width: 1120px; margin: 0 auto; padding: 32px; line-height: 1.45; background: #fff; }
    header { border-bottom: 3px solid #00a6c7; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 25px; } h2 { margin: 28px 0 10px; font-size: 16px; }
    .eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: 10px; color: #607080; }
    .document-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; border: 1px solid #cbd5e1; margin-top: 18px; }
    .document-grid > div { padding: 9px 11px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .card { border: 1px solid #d7e0e7; border-radius: 6px; padding: 12px; background: #f7fafc; }
    .label { font-size: 9px; text-transform: uppercase; letter-spacing: .11em; color: #607080; }
    .value { margin-top: 4px; font-size: 14px; font-weight: 650; }
    .finding { border-left: 4px solid #d38a00; background: #fff8e7; padding: 14px 16px; margin-top: 16px; }
    .evidence-chart { border: 1px solid #d7e0e7; border-radius: 6px; overflow: hidden; margin-top: 10px; break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #d7e0e7; padding: 7px; text-align: left; vertical-align: top; }
    th { background: #edf3f6; text-transform: uppercase; letter-spacing: .08em; font-size: 8px; }
    .approval-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .approval { border: 1px solid #cbd5e1; min-height: 96px; padding: 11px; }
    .signature-line { border-top: 1px solid #94a3b8; margin-top: 32px; padding-top: 5px; color: #64748b; font-size: 9px; }
    .disclaimer { margin-top: 28px; border-top: 1px solid #d7e0e7; padding-top: 12px; color: #607080; font-size: 9px; }
    .page-break { break-before: page; }
    @media print { body { padding: 0; } .card, .approval, .evidence-chart { break-inside: avoid; } }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">ArGrid Engineering Investigation Report</div>
    <h1>${escapeHtml(event.id)} · ${escapeHtml(event.type)} on ${escapeHtml(event.feederId)}</h1>
    <p>${escapeHtml(event.timestamp)} · Incident ${escapeHtml(event.incidentGroupId)} · Investigation status ${escapeHtml(status)}</p>
    <div class="document-grid">
      <div><div class="label">Document number</div><div class="value">${escapeHtml(document.documentNumber)}</div></div>
      <div><div class="label">Revision</div><div class="value">${escapeHtml(document.revision)}</div></div>
      <div><div class="label">Document status</div><div class="value">${escapeHtml(document.documentStatus)}</div></div>
      <div><div class="label">Classification</div><div class="value">${escapeHtml(document.classification)}</div></div>
      <div><div class="label">Generated</div><div class="value">${escapeHtml(generatedAt)}</div></div>
      <div><div class="label">Owner</div><div class="value">${escapeHtml(event.investigationOwner)}</div></div>
    </div>
  </header>
  <section class="grid">
    <div class="card"><div class="label">Minimum RMS</div><div class="value">${event.minimumVoltagePct.toFixed(1)}% Un</div></div>
    <div class="card"><div class="label">Duration</div><div class="value">${event.durationMs} ms</div></div>
    <div class="card"><div class="label">Phases</div><div class="value">${escapeHtml(event.phases)}</div></div>
    <div class="card"><div class="label">Source meter</div><div class="value">${escapeHtml(event.sourceMeter)}</div></div>
    <div class="card"><div class="label">Origin confidence</div><div class="value">${event.confidencePct}%</div></div>
    <div class="card"><div class="label">Waveform sampling</div><div class="value">${event.waveformSampleRateHz.toLocaleString("en-US")} Hz</div></div>
    <div class="card"><div class="label">Estimated exposure</div><div class="value">IDR ${Math.round(event.estimatedExposureIDR).toLocaleString("en-US")}</div></div>
    <div class="card"><div class="label">Affected assets</div><div class="value">${event.affectedAssets.length}</div></div>
  </section>
  <div class="finding"><strong>Probable origin:</strong> ${escapeHtml(event.probableOrigin)}.<br/>${escapeHtml(event.operationalImpact)}<br/><strong>Confidence:</strong> ${event.confidencePct}% · estimated exposure is not a verified production loss.</div>
  <h2>Electrical context</h2><div class="evidence-chart">${renderElectricalContextSvg(event)}</div>
  <h2>RMS evidence</h2><div class="evidence-chart">${renderRmsEvidenceSvg(event)}</div>
  <h2>Instantaneous waveform evidence</h2><div class="evidence-chart">${renderWaveformEvidenceSvg(event)}</div>
  <h2>Correlation notes</h2><ul>${notes}</ul>
  <h2>Evidence register</h2><table><thead><tr><th>ID</th><th>Evidence</th><th>Source / scope</th><th>State</th></tr></thead><tbody>${evidenceRows}</tbody></table>
  <h2>Synchronized meter evidence</h2>
  <table><thead><tr><th>Meter</th><th>Location</th><th>Direction</th><th>Minimum RMS</th><th>Duration</th><th>Offset</th><th>Sync error</th><th>Quality</th><th>Evidence</th></tr></thead><tbody>${meterRows}</tbody></table>
  <h2>Equipment response</h2>
  <table><thead><tr><th>Asset</th><th>Name</th><th>State</th><th>Restart</th><th>Response</th><th>Operational consequence</th></tr></thead><tbody>${responseRows || '<tr><td colspan="6">No linked equipment-response evidence.</td></tr>'}</tbody></table>
  <h2>Event chronology</h2>
  <table><thead><tr><th>Timestamp</th><th>Event</th><th>Detail</th></tr></thead><tbody>${chronologyRows}</tbody></table>
  <h2>Revision history</h2><table><thead><tr><th>Revision</th><th>Description</th><th>Author / reviewer</th><th>Date</th></tr></thead><tbody>${revisionRows}</tbody></table>
  <h2>Review and approval</h2>
  <div class="approval-grid">
    <div class="approval"><div class="label">Prepared by</div><div class="value">${escapeHtml(document.preparedBy)}</div><div class="signature-line">Electronic sign-off not implemented in open-source demo</div></div>
    <div class="approval"><div class="label">Reviewed by · ${document.reviewState}</div><div class="value">${escapeHtml(document.reviewedBy)}</div><div class="signature-line">Technical review record</div></div>
    <div class="approval"><div class="label">Approved by · ${document.approvalState}</div><div class="value">${escapeHtml(document.approvedBy)}</div><div class="signature-line">Final approval record</div></div>
  </div>
  <div class="disclaimer">This report is generated from deterministic demonstration data. It is not a certified PQ report, COMTRADE/PQDIF record, protection study, contractual loss statement, insurance-loss statement, digital signature, or field switching authorization. Confirm conclusions using calibrated instruments, applicable standards, site records, and competent engineering review.</div>
</body>
</html>`;
}

export function downloadInvestigationReport(filename: string, html: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
