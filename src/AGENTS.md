# Frontend implementation rules

These rules apply to everything under `src/`.

## Visual language

- Premium comes from precise alignment, compact spacing, hierarchy, fine borders, tabular numerals, realistic data behavior, and fast interaction, not decoration.
- Keep information dense but organized. Prefer compact panels, tables, contextual drawers, and progressive disclosure.
- Avoid oversized cards, large hero type, heavy bold fonts, excessive whitespace, glassmorphism, neon styling, strong glow, particles, moving backgrounds, decorative gradients, and bouncing or constant pulsing animation.
- Use compact radii, generally 6–10 px. Large 16–24 px rounded cards must not become the default.
- Body and table text should normally stay around 12–14 px. Page titles should remain compact.
- Normal conditions use restrained neutral treatment. Reserve strong color for selected context, active energy flow, warning, alarm, stale data, and critical state.
- Never use color as the only state indicator. Pair it with geometry, text, icon, border, pattern, or a status label.

## Taste Skill redesign locks

- Audit the current screen before changing code. Identify hierarchy, contrast, density, repetition, and broken theme boundaries first.
- Apply one accent family per page. Do not introduce unrelated CTA, chart, or selected-state colors.
- Keep one radius system per workspace. Compact 6–8 px radii are the default; pills are reserved for statuses and compact controls.
- Enforce a page-level theme lock. Management pages are light end-to-end, including navigation chrome. Operations, electrical one-line, power-quality, and alarm-investigation pages are dark end-to-end.
- Dark and light workspaces must have equivalent contrast and hierarchy quality. Do not reuse light-theme text tokens on dark navigation or dark-theme surfaces on light management pages.
- On redesigns, preserve domain behavior and working interactions while removing generic nested-card patterns and equal-weight module grids.

## Workspace themes

- Management, portfolio, opportunities, savings, billing, reports, and sustainability default to the light management workspace.
- Electrical network, power-quality investigation, event replay, and alarm investigation default to the dark operations workspace.
- Theme changes follow workspace context; they are not decorative full-product rebranding.
- The management sidebar uses a light neutral shell with dark text and a restrained selected state.
- The operations sidebar uses graphite with high-contrast text and visually joins the HMI canvas without merging into it.

## Interaction and behavior

- Technical abnormalities should expose useful meaning where applicable: wasted energy, avoidable cost, demand exposure, production risk, annual saving, payback, confidence, and recommended next action.
- Prefer drawers and inline contextual detail over large modal dialogs and deep nested-card hierarchies.
- Motion must be short, subtle, meaningful, and compatible with reduced motion.
- Keep source, site, asset, time range, scenario, selected measurement, and event context when drilling between workspaces.
- Use accessible native controls and visible focus states.
- All visible buttons must work or clearly communicate that the feature is simulated or not available.

## React and TypeScript

- Keep route components focused on composition and workflow; move reusable domain logic to `src/lib/` and reusable UI to `src/components/`.
- Prefer typed data structures and derived values over duplicated literals.
- Avoid unnecessary dependencies and avoid client-side packages that require a server runtime.
- Keep imports compatible with the `@/*` alias.
- Preserve static Vite build compatibility and hash routing.
- `src/routeTree.gen.ts` is intentionally committed. Do not hand-edit it unless route definitions are also updated consistently.

## Engineering display

- Use tabular numerals for measurements and money.
- Separate value and unit visually.
- Normalize units; do not mix kW, MW, and raw values without deliberate conversion.
- Use measurement-appropriate decimal precision.
- Mark estimated, stale, substituted, manual, and simulated values distinctly.
