# Route files

ArGrid uses TanStack Router file-based routing. Each route file in this directory maps to a workspace URL and the Vite router plugin generates `src/routeTree.gen.ts` during development and production builds.

The application uses hash history so the static GitHub Pages deployment can open and refresh every workspace without server-side rewrite rules.
