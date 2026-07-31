from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"{label} anchor not found in {path}")
    path.write_text(text.replace(old, new, 1))


# Raise only the smallest micro-copy sizes. This preserves the compact visual
# density while removing the hardest-to-read 8.5–9 px labels.
for path in Path("src").rglob("*.tsx"):
    text = path.read_text()
    text = text.replace("text-[8.5px]", "text-[9.5px]")
    text = text.replace("text-[9px]", "text-[9.5px]")
    path.write_text(text)

shell = Path("src/components/app-shell.tsx")
replace_once(
    shell,
    '''              <h1 className="font-display text-[20px] font-medium tracking-tight leading-tight mt-1">{title}</h1>
              {subtitle && <div className="text-[11.5px] text-muted-foreground mt-0.5">{subtitle}</div>}''',
    '''              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[20px] font-medium tracking-tight leading-tight">{title}</h1>
                <span className="demo-environment-badge" title="Synthetic demonstration data. No production system is connected.">
                  <Database className="size-3" /> Demo · simulation only
                </span>
              </div>
              {subtitle && <div className="text-[11.5px] text-muted-foreground mt-0.5">{subtitle}</div>}''',
    "persistent demo environment badge",
)

portfolio = Path("src/routes/portfolio.tsx")
replace_once(
    portfolio,
    '''                    <tr key={site.id} onClick={() => setSelectedId(site.id)} aria-selected={selected.id === site.id} className={`portfolio-benchmark-row cursor-pointer hover:bg-surface-2/70 ${selected.id === site.id ? "portfolio-benchmark-row-selected bg-primary/5" : ""}`}>''',
    '''                    <tr
                      key={site.id}
                      tabIndex={0}
                      aria-label={`Select ${site.name}`}
                      aria-selected={selected.id === site.id}
                      onClick={() => setSelectedId(site.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(site.id);
                        }
                      }}
                      className={`portfolio-benchmark-row cursor-pointer hover:bg-surface-2/70 ${selected.id === site.id ? "portfolio-benchmark-row-selected bg-primary/5" : ""}`}
                    >''',
    "keyboard accessible portfolio benchmark row",
)

smoke = Path("tests/e2e/smoke.spec.ts")
replace_once(
    smoke,
    '''    await expect(page.locator(".workspace-management")).toBeVisible();

    await page.getByRole("link", { name: "Electrical Network" }).click();''',
    '''    await expect(page.locator(".workspace-management")).toBeVisible();
    await expect(page.getByText("Demo · simulation only", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Electrical Network" }).click();''',
    "demo environment smoke assertion",
)

smoke_text = smoke.read_text()
final_marker = "\n});\n"
insert_at = smoke_text.rfind(final_marker)
if insert_at < 0:
    raise SystemExit("Smoke suite closing marker not found")
keyboard_test = '''

  test("portfolio benchmark rows support keyboard selection", async ({ page }) => {
    await prepareDemo(page, { scenario: "normal" });
    await openWorkspace(page, "/portfolio");
    await expectWorkspaceHeading(page, "Enterprise Portfolio");

    const gresikRow = page.getByLabel("Select Gresik Process Utilities");
    await gresikRow.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".portfolio-identity").getByText("Gresik Process Utilities", { exact: true })).toBeVisible();

    const batamRow = page.getByLabel("Select Batam Electronics Campus");
    await batamRow.focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".portfolio-identity").getByText("Batam Electronics Campus", { exact: true })).toBeVisible();
  });
'''
smoke.write_text(smoke_text[:insert_at] + keyboard_test + smoke_text[insert_at:])

styles = Path("src/styles.css")
css = styles.read_text()
if "Public-launch P3" in css:
    raise SystemExit("P3 CSS already exists")

p3_css = r'''

/* Public-launch P3: readable micro-copy, calm interaction feedback, and final table polish. */
.demo-environment-badge {
  display: inline-flex;
  height: 22px;
  align-items: center;
  gap: 5px;
  border: 1px solid color-mix(in oklab, var(--amber) 24%, var(--border));
  border-radius: 999px;
  background: color-mix(in oklab, var(--amber) 7%, var(--surface));
  padding: 0 8px;
  color: color-mix(in oklab, var(--amber) 82%, var(--foreground));
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.035em;
  white-space: nowrap;
}

button,
a,
select,
input,
[tabindex]:not([tabindex="-1"]) {
  transition-property: color, background-color, border-color, box-shadow, opacity;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

button:disabled,
select:disabled,
input:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

button:focus-visible,
a:focus-visible,
select:focus-visible,
input:focus-visible,
[tabindex]:not([tabindex="-1"]):focus-visible {
  outline: 2px solid color-mix(in oklab, var(--ring) 76%, transparent);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--ring) 10%, transparent);
}

.panel table {
  border-collapse: separate;
  border-spacing: 0;
}

.panel table thead th {
  position: sticky;
  top: 0;
  z-index: 4;
  background: color-mix(in oklab, var(--surface) 96%, var(--surface-2));
  box-shadow: inset 0 -1px 0 var(--border);
}

.panel table tbody tr {
  transition: background-color 150ms cubic-bezier(0.2, 0, 0, 1), box-shadow 150ms cubic-bezier(0.2, 0, 0, 1);
}

.panel table tbody tr:hover {
  background: color-mix(in oklab, var(--primary) 4%, var(--surface));
}

.panel table tbody tr:focus-visible {
  position: relative;
  z-index: 2;
  outline: 2px solid color-mix(in oklab, var(--primary) 70%, transparent);
  outline-offset: -2px;
  background: color-mix(in oklab, var(--primary) 7%, var(--surface));
  box-shadow: inset 3px 0 0 var(--primary);
}

.workspace-operations .panel table thead th {
  background: color-mix(in oklab, var(--surface) 94%, var(--surface-2));
}

.portfolio-benchmark-row[aria-selected="true"] {
  box-shadow: inset 3px 0 0 color-mix(in oklab, var(--primary) 78%, transparent);
}

* {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklab, var(--border-strong) 76%, transparent) transparent;
}

*::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: color-mix(in oklab, var(--border-strong) 76%, transparent);
  background-clip: padding-box;
}

*::-webkit-scrollbar-thumb:hover {
  background: color-mix(in oklab, var(--muted-foreground) 68%, transparent);
  background-clip: padding-box;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
'''
styles.write_text(css + p3_css)
