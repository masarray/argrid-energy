# Domain data and simulation rules

These rules apply to shared logic under `src/lib/`.

## Single source of truth

- Keep site, portfolio, time range, scenario, telemetry, alarm, incident, power-quality event, opportunity, data-quality, tariff, invoice, sustainability, report, and formatting logic centralized.
- Route files may derive display values but should not create independent contradictory versions of the same domain state.
- Preserve deterministic seed data where practical so screenshots, tests, event replay, reports, and guided demos remain repeatable.

## Simulation

- Scenario changes must produce coherent effects across electrical state, telemetry, source mix, production, weather, tariff band, alarms, incidents, power-quality evidence, demand, cost, opportunities, billing, sustainability, reporting, portfolio confidence, and data health.
- Avoid random values that can create impossible or contradictory system states.
- Industrial load should follow plausible operating drivers such as shift schedule, production index, occupancy, weather, solar availability, and equipment cycling.
- Grid import must reconcile with site load, on-site generation, and renewable contribution.
- Energy accumulation, cost accumulation, carbon, peak demand, and tariff band must use dimensionally consistent calculations.
- Keep totals and child contributions reconcilable within a documented tolerance.
- Simulation updates must be lightweight, stable, and cleaned up correctly when components unmount.
- Persist only user-facing demo context that is useful across reloads, such as selected site, range, scenario, workflow state, issue state, incident acknowledgement, investigation status, selected invoice, or report status.

## Portfolio benchmarking

- Compare sites only with an explicit normalization basis such as production output, occupied floor area, operating hours, weather, shipped units, or site type.
- Keep actual energy, normalized intensity, target, cost, budget variance, demand utilization, renewable share, opportunity, verified saving, alarms, and confidence as distinct fields.
- Portfolio totals must reconcile to child-site totals where they share the same scope and period.
- Weight portfolio confidence by a meaningful denominator such as energy or affected financial value rather than using an unqualified average.
- Scenario changes may alter the active site's risk and confidence but must not arbitrarily rewrite unrelated site history.

## Power quality and incident correlation

- Use one shared event record for alarm console, power-quality workspace, electrical context, replay, and investigation evidence.
- Keep physical event and generated device alarms distinct. Several alarms may belong to one incident group.
- A power-quality event should retain timestamp, event type, residual or maximum magnitude, duration, phases, source meter, voltage level, sample rate, pre/post-event capture, trigger threshold, and source quality.
- Correlated meters require location, electrical direction, minimum voltage, duration, start offset, time-sync error, quality, and an evidence statement.
- Arrival order and residual depth must remain physically coherent with the stated probable origin.
- Equipment response should retain asset identity, response, post-event state, restart time, and process consequence.
- Investigation status and alarm acknowledgement are different state machines. Acknowledgement must not silently advance or close the investigation.
- Store replay series deterministically. RMS envelope and instantaneous waveform should correspond to the same event magnitude and duration.
- Do not call estimated exposure a verified production loss, insurance loss, or contractual value.
- Demo trigger and classification thresholds are product configuration, not universal standards, unless a verified standard reference is explicitly attached.

## Sustainability and carbon logic

- Carbon calculations require reporting boundary, reporting period, activity quantity, activity unit, factor ID, factor value, factor unit, factor source, factor version, effective period, quality, method, and source completeness.
- Keep Scope 1, Scope 2 location-based, and Scope 2 market-based calculations separate and reconcilable.
- Renewable generation is physical activity. Renewable attributes are contractual instruments. Do not subtract either from physical grid consumption.
- Attribute allocation must never exceed eligible instrument volume or eligible electricity consumption, and must retain unique ID, vintage, geography, evidence, allocation, remaining balance, and retirement/review state.
- Keep verified energy saving, avoided emissions, carbon inventory reduction, target variance, and forecast reduction as distinct outputs.
- Forecast values must be deterministic and explicitly distinguish actual periods from forecast periods.
- Carbon assurance state must inherit activity completeness, estimated coverage, factor applicability, renewable-attribute reconciliation, and unresolved data-quality issues.
- Configured factors and instruments are illustrative unless verified against applicable organizational policy, supplier evidence, contract, and reporting requirements.

## Governed reporting

- Report definitions require identity, category, audience, period, frequency, owner, reviewer, status, source systems, sections, source completeness, blocking issues, generation history, and next-run context.
- Keep `Draft`, `Review required`, `Approved`, and `Published` as distinct workflow states.
- Report generation does not imply review. Review does not imply approval. Approval does not imply external publication or filing.
- Report approval gates must use domain evidence and quality inherited from source workspaces rather than separate hard-coded report values.
- Exported visuals and tables must be generated from the same domain objects shown in the application.
- Browser-local scheduling and workflow persistence are demonstration behavior only; do not imply background execution or external distribution.

## Measurements and units

Each measurement should have or imply:

- value and unit;
- source timestamp;
- quality state;
- source device or measurement identity;
- aggregation period where relevant;
- calculation/version context where relevant.

Use consistent conversions and precision. Energy, power, demand, cost, carbon, voltage, current, power factor, frequency, THD, loading, and tariff quantities must remain dimensionally credible.

## Data quality and provenance

Supported visible states should include `GOOD`, `UNCERTAIN`, `STALE`, `BAD`, `SUBSTITUTED`, `ESTIMATED`, and `MANUAL` where relevant. These states must not render identically.

- Missing or estimated billing intervals must affect invoice and carbon-report readiness and must never be hidden behind an overall health percentage.
- A resolved or accepted exception retains its reason, responsible actor, and audit context.
- Keep missing, estimated, substituted, reset, rollover, duplicate, stale, time-drift, and abnormal-value conditions distinct.
- A quality state must propagate to dependent KPI, forecast, invoice, opportunity, M&V result, alarm evidence, carbon inventory, report, and portfolio confidence.
- Provenance should identify source device, field protocol, gateway, storage/aggregation, calculation or tariff/model/factor version, output, and decision or report context.
- Corrections should conceptually trigger recalculation of every dependent output while retaining the original value and audit history.
- Demo thresholds such as completeness, freshness, time drift, and estimated coverage are configurable product policies, not universal standards.

## Financial and invoicing logic

- Keep currency formatting in Indonesian context and preserve explicit IDR values.
- Distinguish calculated charge, approved invoice, issued receivable, collected payment, outstanding balance, overdue balance, billing discrepancy, recovered amount, estimated annual opportunity, and verified saving.
- Do not count draft or blocked invoices as issued receivables.
- Build invoice totals from auditable line items such as time-of-use energy, billing demand, reactive-energy penalty, fixed charge, credit, adjustment, tax, previous balance, and payment allocation.
- Every invoice line must identify the tariff rule and measurement source used to calculate it.
- Billing demand must state its interval and selection rule.
- Tariff versions require effective dates and must not be silently changed after a billing period is closed.
- Demo tariff and tax values must be labeled illustrative unless they are verified against the applicable utility contract and jurisdiction.
- Do not label a value verified without a baseline/reporting-period comparison and a stated confidence or verification method.
