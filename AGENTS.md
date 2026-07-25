# ArGrid contributor notes

ArGrid is a standalone, open-source Vite application. Keep it deployable as static files on GitHub Pages.

- Do not add server-only dependencies for demo functionality.
- Keep routes compatible with hash history.
- Preserve deterministic sample data where possible so screenshots and tests remain stable.
- Clearly label simulated telemetry and avoid presenting demo values as actual field measurements.
- Run `npm run check` before publishing changes.
