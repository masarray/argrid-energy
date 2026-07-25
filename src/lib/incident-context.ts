import type { InvestigationStatus, PowerQualityEvent } from "./power-quality";

const EVENT_KEY = "argrid-selected-pq-event";
const FEEDER_KEY = "argrid-selected-electrical-feeder";
const INCIDENT_KEY = "argrid-selected-incident-group";

export type IncidentContext = {
  eventId?: string;
  feederId?: string;
  incidentGroupId?: string;
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

export function buildInvestigationReport(
  event: PowerQualityEvent,
  status: InvestigationStatus,
  timeline: ReportTimelineItem[],
) {
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(event.id)} — ArGrid PQ Investigation</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Arial, sans-serif; color: #17202a; }
    body { max-width: 1120px; margin: 0 auto; padding: 32px; line-height: 1.45; }
    header { border-bottom: 3px solid #00a6c7; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 25px; } h2 { margin: 28px 0 10px; font-size: 16px; }
    .eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: 10px; color: #607080; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .card { border: 1px solid #d7e0e7; border-radius: 6px; padding: 12px; background: #f7fafc; }
    .label { font-size: 9px; text-transform: uppercase; letter-spacing: .11em; color: #607080; }
    .value { margin-top: 4px; font-size: 14px; font-weight: 650; }
    .finding { border-left: 4px solid #d38a00; background: #fff8e7; padding: 14px 16px; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #d7e0e7; padding: 7px; text-align: left; vertical-align: top; }
    th { background: #edf3f6; text-transform: uppercase; letter-spacing: .08em; font-size: 8px; }
    .disclaimer { margin-top: 28px; border-top: 1px solid #d7e0e7; padding-top: 12px; color: #607080; font-size: 9px; }
    @media print { body { padding: 0; } .card { break-inside: avoid; } }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">ArGrid Engineering Investigation Report · Open-source deterministic demo</div>
    <h1>${escapeHtml(event.id)} · ${escapeHtml(event.type)} on ${escapeHtml(event.feederId)}</h1>
    <p>${escapeHtml(event.timestamp)} · Incident ${escapeHtml(event.incidentGroupId)} · Status ${escapeHtml(status)}</p>
  </header>
  <section class="grid">
    <div class="card"><div class="label">Minimum RMS</div><div class="value">${event.minimumVoltagePct.toFixed(1)}% Un</div></div>
    <div class="card"><div class="label">Duration</div><div class="value">${event.durationMs} ms</div></div>
    <div class="card"><div class="label">Phases</div><div class="value">${escapeHtml(event.phases)}</div></div>
    <div class="card"><div class="label">Source Meter</div><div class="value">${escapeHtml(event.sourceMeter)}</div></div>
    <div class="card"><div class="label">Origin Confidence</div><div class="value">${event.confidencePct}%</div></div>
    <div class="card"><div class="label">Waveform Sampling</div><div class="value">${event.waveformSampleRateHz.toLocaleString("en-US")} Hz</div></div>
    <div class="card"><div class="label">Estimated Exposure</div><div class="value">IDR ${Math.round(event.estimatedExposureIDR).toLocaleString("en-US")}</div></div>
    <div class="card"><div class="label">Investigation Owner</div><div class="value">${escapeHtml(event.investigationOwner)}</div></div>
  </section>
  <div class="finding"><strong>Probable origin:</strong> ${escapeHtml(event.probableOrigin)}.<br/>${escapeHtml(event.operationalImpact)}</div>
  <h2>Correlation notes</h2><ul>${notes}</ul>
  <h2>Synchronized meter evidence</h2>
  <table><thead><tr><th>Meter</th><th>Location</th><th>Direction</th><th>Minimum RMS</th><th>Duration</th><th>Offset</th><th>Sync error</th><th>Quality</th><th>Evidence</th></tr></thead><tbody>${meterRows}</tbody></table>
  <h2>Equipment response</h2>
  <table><thead><tr><th>Asset</th><th>Name</th><th>State</th><th>Restart</th><th>Response</th><th>Operational consequence</th></tr></thead><tbody>${responseRows || '<tr><td colspan="6">No linked equipment-response evidence.</td></tr>'}</tbody></table>
  <h2>Event chronology</h2>
  <table><thead><tr><th>Timestamp</th><th>Event</th><th>Detail</th></tr></thead><tbody>${chronologyRows}</tbody></table>
  <div class="disclaimer">This report is generated from deterministic demonstration data. It is not a certified PQ report, protection study, insurance-loss statement, or field switching authorization. Confirm conclusions using calibrated instruments, applicable standards, site records, and competent engineering review.</div>
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
