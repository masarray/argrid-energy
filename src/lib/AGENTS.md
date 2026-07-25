# Domain data and simulation rules

These rules apply to shared logic under `src/lib/`.

## Single source of truth

- Keep site, portfolio, time range, scenario, telemetry, alarm, opportunity, data-quality, tariff, invoice, and formatting logic centralized.
- Route files may derive display values but should not create independent contradictory versions of the same domain state.
- Preserve deterministic seed data where practical so screenshots, tests, and guided demos remain repeatable.

## Simulation

- Scenario changes must produce coherent effects across electrical state, telemetry, source mix, production, weather, tariff band, alarms, demand, cost, opportunities, billing, portfolio confidence, and data health.
- Avoid random values that can create impossible or contradictory system states.
- Industrial load should follow plausible operating drivers such as shift schedule, production index, occupancy, weather, solar availability, and equipment cycling.
- Grid import must reconcile with site load, on-site generation, and renewable contribution.
- Energy accumulation, cost accumulation, carbon, peak demand, and tariff band must use dimensionally consistent calculations.
- Keep totals and child contributions reconcilable within a documented tolerance.
- Simulation updates must be lightweight, stable, and cleaned up correctly when components unmount.
- Persist only user-facing demo context that is useful across reloads, such as selected site, range, scenario, workflow state, issue state, or selected invoice.

## Portfolio benchmarking

- Compare sites only with an explicit normalization basis such as production output, occupied floor area, operating hours, weather, shipped units, or site type.
- Keep actual energy, normalized intensity, target, cost, budget variance, demand utilization, renewable share, opportunity, verified saving, alarms, and confidence as distinct fields.
- Portfolio totals must reconcile to child-site totals where they share the same scope and period.
- Weight portfolio confidence by a meaningful denominator such as energy or affected financial value rather than using an unqualified average.
- Scenario changes may alter the active site's risk and confidence but must not arbitrarily rewrite unrelated site history.

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

- Missing or estimated billing intervals must affect invoice readiness and must never be hidden behind an overall health percentage.
- A resolved or accepted exception retains its reason, responsible actor, and audit context.
- Keep missing, estimated, substituted, reset, rollover, duplicate, stale, time-drift, and abnormal-value conditions distinct.
- A quality state must propagate to dependent KPI, forecast, invoice, opportunity, M&V result, alarm evidence, and portfolio confidence.
- Provenance should identify source device, field protocol, gateway, storage/aggregation, calculation or tariff/model version, output, and decision context.
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
