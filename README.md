# ArGrid Energy Management System

ArGrid is an open-source, browser-based industrial energy management system demonstration. It presents a realistic multi-site energy operations workflow without requiring a backend, cloud account, meter, PLC, RTU, or proprietary platform.

The project is designed for technical demonstrations, product discovery, training, UI/UX exploration, and early customer workshops. It runs entirely as a static Vite application and can be published directly with GitHub Pages.

> **Demo-data notice:** all telemetry, alarms, invoices, emissions, and savings opportunities are simulated locally in the browser. ArGrid does not claim that the displayed values are actual field measurements.

## Included workspaces

- Enterprise overview with live simulated power, energy, cost, demand, power factor, CO₂, data health, and PDF export
- Electrical one-line diagram with feeder load, breaker state, power-quality warnings, and 24-hour trend
- Energy analytics with baseline comparisons, load profiles, consumption heatmap, EnPI views, and end-use breakdown
- Opportunity management with annual savings, payback, confidence, urgency, asset reference, and status
- Alarm and event workspace with acknowledgement status and ITIC-style power-quality scatter analysis
- Tenant billing workspace with energy, demand, invoice status, completeness, and PDF export
- Sustainability workspace with Scope 2 trends, targets, emission intensity, and renewable contribution
- Functional demo site selector, reporting period selector, asset search, live/pause telemetry, timestamp, and responsive navigation

## Demonstration walkthrough

Use [DEMO_GUIDE.md](DEMO_GUIDE.md) for an 8–10 minute customer-facing scenario covering the overview, one-line diagram, alarm acknowledgement, analytics, opportunity validation, billing, and sustainability.

## Architecture

- React 19 and TypeScript
- Vite static build
- TanStack Router using hash history for reliable GitHub Pages routing
- TanStack Query context for future API integration
- Tailwind CSS 4 design system
- Recharts visualizations
- jsPDF and html2canvas-pro for local PDF export
- No server runtime and no proprietary builder dependency

## Run locally

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite.

## Quality checks

```bash
npm run check
```

This runs ESLint, TypeScript validation, and a production build.

## Deploy to GitHub Pages

1. Push this project to a GitHub repository whose default branch is `main`.
2. Open **Settings → Pages** in the repository.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or run the **Deploy ArGrid to GitHub Pages** workflow manually.

The workflow automatically detects the repository name and configures the correct Vite base path. Hash routing keeps every workspace accessible after refresh without requiring a custom 404 redirect.

For a custom domain or root-hosted build, set `VITE_BASE_PATH=/` in the build environment.

## Connect real systems later

The current repository intentionally uses local simulated data. A production implementation should add a secure integration layer rather than connecting field devices directly from the browser. Typical integration boundaries include:

- IEC 61850 gateway or substation data concentrator
- Modbus TCP/RTU gateway
- OPC UA server
- MQTT broker or historian stream
- Utility tariff and billing service
- PostgreSQL/time-series database
- Role-based identity provider and audit log service

Replace the simulation provider in `src/lib/demo-simulation.tsx` with a typed API client or streaming adapter while retaining the page components and data contracts.

## Safety and limitations

ArGrid is not a protection, control, settlement, revenue-metering, or safety system. Do not use the demonstration to operate breakers, issue switching commands, calculate regulated invoices, or make safety-critical decisions without independent engineering validation and the required certified systems.

## License

Copyright © 2026 ArGrid contributors.

Licensed under the GNU General Public License v3.0 only. See [LICENSE](LICENSE).
