# GitHub Actions and Pages rules

These rules apply to `.github/workflows/`.

## Deployment contract

- The default deployment target is GitHub Pages for `masarray/argrid-energy`.
- Build the Vite static site into `dist/` and upload that directory with the official Pages artifact action.
- Preserve permissions required by Pages: `contents: read`, `pages: write`, and `id-token: write`.
- Preserve the `github-pages` environment and deployment URL output.
- Keep concurrency protection so obsolete Pages runs can be cancelled.

## Dependency and action safety

- Never guess an unpublished package or GitHub Action version.
- Verify that action tags exist before upgrading them.
- Do not solve dependency conflicts with `--force` or `--legacy-peer-deps` unless the incompatibility is understood and documented.
- Do not reintroduce `@tanstack/router-plugin` merely to regenerate the committed route tree.
- Prefer a reproducible lockfile when dependency resolution is stable.

## Required pipeline

The Pages workflow should perform, in order:

1. checkout;
2. Node setup;
3. dependency installation;
4. `npm run check`;
5. explicit verification that `dist/index.html` exists;
6. Pages configuration;
7. artifact upload;
8. deployment.

Use clear job names and reasonable timeouts. Keep build failure logs easy to diagnose. Do not deploy when validation fails.
