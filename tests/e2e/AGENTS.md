# Playwright browser QA rules

These rules apply to `tests/e2e/`.

## Determinism

- Freeze browser time and seed local demo context before navigation.
- Do not depend on wall-clock time, random values, external services, or live network data.
- Keep simulation timers frozen unless a test explicitly advances or verifies replay behavior.
- Disable decorative animation before visual comparison.

## Smoke tests

- Cover user-observable workflows rather than implementation details.
- Prefer accessible roles, labels, headings, and visible state over brittle CSS selectors.
- Verify simulation boundaries: no field command, ERP posting, filing, payment transfer, or legal document transmission.
- Preserve and verify route, scenario, site, event, feeder, and incident context where relevant.

## Visual regression

- Protect representative Management Light, Operations Dark, Billing, and compact engineering layouts.
- Keep baselines at 1440×900 and 1280×800 unless a change intentionally adds another supported viewport.
- A baseline update requires visual review; never update snapshots merely to make CI green.
- Keep the allowed pixel-difference ratio narrow and document intentional changes in the commit or pull request.

## Accessibility

- Run Axe against representative workspaces using WCAG A/AA tags.
- Serious and critical violations are blocking.
- Color contrast remains a separate visual/manual review until the palette audit is fully automated; do not use that exception to hide missing names, labels, keyboard access, landmarks, or semantics.
- Horizontal scroll regions must be keyboard-focusable and have an accessible region name.

## Failure diagnostics

- Preserve trace, screenshot, video, and Axe JSON attachments on failure.
- Do not commit generated reports, videos, or traces.
- Keep committed PNG files limited to reviewed visual baselines.
