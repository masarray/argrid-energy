# Route and workspace rules

These rules apply to route-level pages under `src/routes/`.

## Page composition

- Use `AppShell` so global site, time, scenario, live state, search, alarm, data-health, role, and workspace context remain consistent.
- A route should answer one primary user question and expose a clear next action.
- Above-the-fold content should be understandable in roughly ten seconds without relying on oversized cards.
- Prefer one high-value contextual insight over generic greetings or decorative banners.
- Maintain direct navigation between portfolio, business impact, electrical root cause, opportunity, action, verification, data confidence, sustainability, billing, and reporting.
- Management workspaces should combine graphical summaries with traceable detail instead of becoming either chart walls or spreadsheet-only pages.

## Portfolio

- Benchmark sites only after stating or implying the normalization basis: production, weather, occupancy, area, site type, or another meaningful denominator.
- Keep estimated opportunity, approved value, verified saving, actual cost, budget variance, demand utilization, renewable share, alarm consequence, and data confidence as separate metrics.
- Use graphical ranking to support decisions, then provide a precise matrix and selected-site profile for traceability.
- Bubble size, color, axes, benchmark bands, and ranking order must have explicit meaning.
- Portfolio confidence must inherit site measurement quality; a low-confidence site must not silently rank as equally trusted.
- Allow direct drill-down from a portfolio site to the live site overview when that site is available in the demo simulation.

## Overview

Prioritize six compact KPIs: active power, energy, month-to-date cost, demand utilization, verified savings, and critical alarms. The primary visual story should combine live energy flow, demand/cost forecast, abnormal consumers, opportunity pipeline, and recent events.

## Electrical network

- Use credible hierarchy: utility source → transformer → busbar → breaker/disconnector → feeder/load.
- Breaker states include closed, open, tripped, intermediate, unknown, maintenance, and communication lost where relevant.
- State must be represented through geometry and text/icon, not color alone.
- Support operations, energy, power-quality, and maintenance layers without losing selected equipment context.
- Selection should highlight the upstream/downstream path and open contextual measurements, trends, events, asset data, and simulated actions.
- All switching actions remain simulation-only.

## Opportunities and savings

- Rank by financial impact, confidence, urgency, and payback.
- Explain why an issue was detected, baseline used, actual deviation, evidence, probable cause, false-positive conditions, recommended validation, owner, and workflow state.
- Connect `Detected → Validated → Approved → Assigned → In Progress → Implemented → Verification → Verified Saving → Persistence Monitoring`.
- Do not present estimated opportunity value as verified saving.

## Demand and cost

Show current demand, projected interval demand, contract limit, remaining margin, interval countdown, financial exposure, contributing feeders, confidence, operational constraint, and a visibly separated what-if simulation.

## Power quality and alarms

- Keep event timestamp, type, residual or maximum magnitude, duration, phase, voltage level, source meter, sample rate, trigger threshold, affected assets, severity, and investigation status.
- One physical incident may create multiple device alarms. Group alarms by common cause and chronology before presenting counts to operators.
- Acknowledgement confirms operator awareness; it does not resolve the condition, validate probable origin, approve the report, or close the investigation.
- Power-quality evidence should correlate RMS envelope, instantaneous waveform, electrical location, synchronized meters, equipment response, operational impact, probable origin, confidence, and investigation owner.
- RMS and waveform panels should share event selection and replay cursor where practical.
- Replay controls should expose play/pause, restart, speed, progress, deterministic stop behavior, and manual cursor override.
- Electrical, incident, global-search, guided-demo, and PQ routes must preserve selected feeder, event, and incident-group context when navigating between workspaces.
- Investigation reports must be generated from the same event, meter-correlation, equipment-response, chronology, and workflow state used by the visible workspace.
- Formal reports should carry document number, revision, document status, evidence register, revision history, prepared/reviewed/approved roles, and explicit sign-off state.
- Embedded report charts and one-line diagrams must be generated from the same deterministic event source as the visible RMS, waveform, and electrical-context panels.
- Review completion and final approval are separate gates. Acknowledgement or investigation progress must not silently create an approved document.
- Exported demo reports must state that they are not certified PQ reports, COMTRADE/PQDIF records, protection studies, contractual-loss statements, digital signatures, insurance-loss statements, or switching authorizations.
- Correlation conclusions must explain arrival order, residual depth, duration, time-sync error, source quality, and why competing origin hypotheses are weaker.
- Equipment response must distinguish ride-through, automatic recovery, trip, controller reboot, process interruption, and no-change states.
- Estimated operational exposure is not a verified loss. State assumptions and preserve this distinction.
- Red is reserved for critical/trip conditions. Avoid alarm fatigue through grouping, acknowledgement, disciplined priority semantics, and one clear next action.
- Any workflow action remains simulation-only and must not change protection settings, operate switchgear, or write to field devices.

## Sustainability and carbon accounting

- Keep Scope 1, Scope 2 location-based, and Scope 2 market-based results distinct. Never replace physical electricity consumption with renewable-attribute allocation.
- Every carbon value must retain reporting boundary, activity data, factor ID, factor value, unit, source, version, effective period, quality state, and reporting method.
- Keep physical energy reduction, verified energy saving, avoided emissions, renewable generation, contractual renewable attributes, and carbon inventory results as separate concepts.
- Renewable instruments require unique identity, type, vintage, geography, volume, allocation, remaining balance, evidence, and retirement/review state.
- Forecasts and target trajectories must state whether values are actual, estimated, scenario-based, or forecast.
- Carbon reporting confidence must inherit activity-data completeness, estimated coverage, factor applicability, and unresolved data-quality exceptions.
- Do not describe the open-source demo as an externally assured inventory, statutory filing, certificate-retirement registry, supplier attestation, or regulatory submission.

## Report center

- A governed report definition requires report ID, title, category, audience, period, frequency, accountable owner, independent reviewer, status, source systems, completeness, blocking issues, sections, generation history, and next-run context.
- Keep `Draft → Review required → Approved → Published` explicit. Report generation is not approval, and approval is not external publication.
- Approval and publication must be blocked by inadequate source completeness, unresolved blocking issues, missing ownership/reviewer assignment, or failed domain assurance gates.
- Report sections and exported visuals must use the same domain source as their source workspaces; do not create separate hard-coded executive numbers.
- Direct users from a report to the relevant energy, carbon, billing, PQ, savings, or data-quality workspace for evidence inspection.
- Browser-local schedules and publication states are demonstrations only. They must not imply background delivery, email distribution, regulatory filing, customer publication, or document-management integration.

## Billing and invoicing

- The main view should expose billed value, collected value, outstanding and overdue balance, billing readiness, charge composition, and data-quality exceptions.
- Billing values must have an auditable trace from invoice total → line item → tariff rule → time band or demand rule → meter reading → source measurement.
- Distinguish draft, review required, approved, issued, partially paid, paid, and overdue states.
- Do not count draft or blocked calculations as issued receivables.
- Invoice detail should include period, issue date, due date, tenant, meter, tariff version, opening and closing readings, multiplier, time-of-use quantities, billing demand, power factor, reactive penalty, fixed charges, tax, prior balance, payment allocation, and outstanding balance where applicable.
- Approval is blocked by unresolved critical exceptions or inadequate completeness.
- Distinguish missing, estimated, substituted, reset, rollover, duplicate, tariff mismatch, and abnormal data.
- Data quality is part of the billing decision, not a footer decoration.
- Any approve, issue, or payment control in the open-source demo must clearly state that it does not post to ERP, send a legal invoice, or move money.

## Data health

- Show meter identity, role, source path, quality state, completeness, estimated coverage, freshness, time synchronization, calibration, ownership, and affected calculations.
- Support visible issue types including missing, estimated, substituted, reset, rollover, duplicate, stale, time drift, and abnormal values.
- A blocking issue must explain which invoice, KPI, M&V result, opportunity, carbon inventory, report, or operational decision is blocked.
- Keep original data, corrected data, method, reason, actor, approval, timestamp, and recalculation impact conceptually distinct.
- Provenance should show source device → field transport → gateway → historian/aggregation → calculation/model/tariff/factor → user decision or report.
- Allow users to move from a data-quality issue to the affected financial, carbon, or engineering calculation.
- Data-health thresholds shown in the demo are explicit product configuration, not universal regulatory requirements.
