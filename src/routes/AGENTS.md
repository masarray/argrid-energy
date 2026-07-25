# Route and workspace rules

These rules apply to route-level pages under `src/routes/`.

## Page composition

- Use `AppShell` so global site, time, scenario, live state, search, alarm, data-health, role, and workspace context remain consistent.
- A route should answer one primary user question and expose a clear next action.
- Above-the-fold content should be understandable in roughly ten seconds without relying on oversized cards.
- Prefer one high-value contextual insight over generic greetings or decorative banners.
- Maintain direct navigation between business impact, electrical root cause, opportunity, action, verification, billing, and reporting.

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

- Keep event timestamp, magnitude, duration, phase, source meter, affected assets, severity, and investigation status.
- Power-quality evidence should correlate waveform/RMS context, electrical location, related meters, equipment response, operational impact, and probable origin.
- Red is reserved for critical/trip conditions. Avoid alarm fatigue through grouping, acknowledgement, and disciplined priority semantics.

## Billing and data health

- Billing values must have an auditable trace from invoice line → tariff rule → interval → meter reading → source measurement.
- Distinguish missing, estimated, substituted, reset, rollover, duplicate, and abnormal data.
- Data quality is part of the decision, not a footer decoration.
