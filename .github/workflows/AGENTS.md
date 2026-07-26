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
- Keep `package-lock.json` committed and use `npm ci` in validation and deployment workflows.

## Required pipeline

The Pages workflow should perform, in order:

1. checkout;
2. Node setup with npm cache;
3. locked dependency installation using `npm ci`;
4. lint;
5. TypeScript validation;
6. Vite static build;
7. `npm run verify:build` for routes, generated assets, and GitHub Pages base path;
8. Pages configuration;
9. artifact upload;
10. deployment.

Use clear job names and reasonable timeouts. Keep build failure logs easy to diagnose. Do not deploy when validation fails.

## Quality gate

- Keep the pull-request quality workflow separate from Pages deployment.
- Run lint, TypeScript, build, and `verify:build` as individually named steps so a failure is immediately diagnosable.
- A pull request must pass the quality workflow before its changes are considered ready for `main`.
