# Domain data and simulation rules

These rules apply to shared logic under `src/lib/`.

## Single source of truth

- Keep site, time range, scenario, telemetry, alarm, opportunity, data-quality, and formatting logic centralized.
- Route files may derive display values but should not create independent contradictory versions of the same domain state.
- Preserve deterministic seed data where practical so screenshots, tests, and guided demos remain repeatable.

## Simulation

- Scenario changes must produce coherent effects across electrical state, telemetry, alarms, demand, cost, opportunities, and data health.
- Avoid random values that can create impossible or contradictory system states.
- Keep totals and child contributions reconcilable within a documented tolerance.
- Simulation updates must be lightweight, stable, and cleaned up correctly when components unmount.
- Persist only user-facing demo context that is useful across reloads, such as selected site, range, or scenario.

## Measurements and units

Each measurement should have or imply:

- value and unit;
- source timestamp;
- quality state;
- source device or measurement identity;
- aggregation period where relevant;
- calculation/version context where relevant.

Use consistent conversions and precision. Energy, power, demand, cost, carbon, voltage, current, power factor, frequency, THD, and loading must remain dimensionally credible.

## Data quality

Supported visible states should include `GOOD`, `UNCERTAIN`, `STALE`, `BAD`, `SUBSTITUTED`, `ESTIMATED`, and `MANUAL` where relevant. These states must not render identically.

## Financial logic

- Keep currency formatting in Indonesian context and preserve explicit IDR values.
- Distinguish estimated annual opportunity, approved value, implemented value, verified saving, avoided demand charge, billing discrepancy, and recovered amount.
- Do not label a value verified without a baseline/reporting-period comparison and a stated confidence or verification method.
