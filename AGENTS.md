# ArGrid agent guide

ArGrid is an open-source industrial Energy Management System demonstration built with React, TypeScript, Vite, TanStack Router, Tailwind CSS, and deterministic local simulation.

Read this file before changing the repository. Then read the nearest nested `AGENTS.md` for the files being edited; the nearest file has the most specific rules.

## Product purpose

ArGrid connects electrical operation, energy intelligence, reliability, cost, opportunity workflow, verified savings, billing, sustainability, and data trust in one premium industrial interface.

The product should feel like a precise enterprise electrical command center, not a generic SaaS, crypto, gaming, or decorative dashboard. Benchmark the depth and credibility of leading industrial energy-management platforms without copying proprietary branding, assets, wording, icons, or layouts.

Core value loop:

`Measure → Understand → Detect → Prioritize → Assign → Act → Verify → Sustain`

## Non-negotiable boundaries

- This repository is a static GitHub Pages demo. Do not add a required server runtime.
- Keep hash routing and repository-aware Vite base paths working under `/argrid-energy/`.
- All telemetry, alarms, scenarios, switching actions, invoices, and savings are simulated unless explicitly documented otherwise.
- Never imply that a browser action sends a command to field equipment.
- Any switching or control interaction must say: `Simulation Mode — No field command will be executed.`
- Do not add proprietary builder dependencies, tracking, hidden telemetry, credentials, or secrets.
- Keep GPL-3.0-only licensing intact.

## Architecture map

- `src/components/` — shared application shell and reusable UI primitives.
- `src/routes/` — route-level workspaces and user workflows.
- `src/lib/` — deterministic data, simulation, domain rules, formatting, and shared state.
- `src/routeTree.gen.ts` — committed route tree used by the build.
- `tests/e2e/` — deterministic Playwright smoke, visual-regression, and accessibility coverage.
- `.github/workflows/` — validation and GitHub Pages deployment.

Do not reintroduce `@tanstack/router-plugin` unless published package versions and peer dependencies are verified and the route-generation strategy is intentionally changed.

## Working method

1. Inspect the nearest `AGENTS.md` and the related route, component, data, simulation, and browser-test files.
2. Trace shared state before editing. Do not duplicate site, scenario, telemetry, status, formatting, or financial logic in route files.
3. Make the smallest coherent change that completes the requested workflow.
4. Preserve context across navigation: site, asset, meter, event timestamp, time range, scenario, and selected measurement.
5. Ensure every visible control works locally or is clearly labelled as simulated/unavailable.
6. Check compact desktop layouts at 1440×900 and 1280×800; do not force dense engineering screens into a simplified mobile imitation.
7. Run validation before considering the work complete.

## Required validation

```bash
npm ci --no-audit --no-fund
npm run check
npm run qa:browser
```

When changing deployment, also confirm that generated asset URLs use the GitHub Pages repository base path. When changing a covered visual surface, review and intentionally update the corresponding Playwright baseline rather than bypassing screenshot comparison.

## Completion standard

A task is not complete merely because TypeScript compiles. Confirm that:

- the workflow tells a credible operational story;
- values, units, states, and financial consequences are internally consistent;
- abnormal conditions are obvious because normal conditions remain calm;
- interactions preserve context and do not become decorative dead ends;
- simulation and data-quality states are explicit;
- no serious or critical automated accessibility violation is introduced in representative workspaces;
- no unreviewed visual-regression baseline changes are introduced;
- no regression is introduced to GitHub Pages deployment.

## Product hardening gate

- Keep `package-lock.json` committed and use `npm ci` in CI and deployment.
- Pull requests must pass lint, TypeScript, static build, route registration, asset existence, GitHub Pages base-path verification, browser smoke tests, visual regression, and automated accessibility checks before merge.
- Do not combine all diagnostics into one opaque workflow step; preserve separate lint, type-check, build, static-verification, and browser-QA reporting.
