# Contributing to ArGrid

Thank you for improving ArGrid.

## Development workflow

1. Create a focused branch.
2. Install dependencies with `npm install`.
3. Keep all demo functionality static-host compatible.
4. Run `npm run check` before opening a pull request.
5. Explain changes to data assumptions, calculations, alarms, or electrical terminology in the pull request.

## Engineering principles

- Clearly distinguish simulated values from actual measurements.
- Do not add remote tracking, proprietary builder dependencies, or hidden telemetry.
- Keep interfaces compact, readable, responsive, and useful on normal engineering laptops.
- Avoid presenting protection or switching actions as functional unless a separately reviewed secure control architecture exists.
- Use deterministic sample data when practical so visual regression results remain stable.

By contributing, you agree that your contribution is licensed under GPL-3.0-only.
