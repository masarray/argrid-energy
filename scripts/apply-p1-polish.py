from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"{label} anchor not found in {path}")
    path.write_text(text.replace(old, new, 1))


shell = Path("src/components/app-shell.tsx")
shell_text = shell.read_text()
start_marker = '          <label className="flex items-center gap-2 h-8 px-2 rounded-md border border-transparent hover:border-border hover:bg-surface-2 text-[11.5px] min-w-0">'
end_marker = '        </header>'
start = shell_text.find(start_marker)
end = shell_text.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit("Command bar replacement anchors were not found")

command_bar = '''          <div className="command-context-cluster">
            <label className="command-control command-control-site flex min-w-0 items-center gap-1.5">
              <span className="size-1.5 shrink-0 rounded-full bg-green" />
              <span className="command-control-caption hidden 2xl:inline">Site</span>
              <select value={siteId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSiteId(event.target.value as typeof siteId)} className="command-select max-w-[178px] truncate font-medium" aria-label="Select demo site">
                {demoSites.map((candidate) => <option key={candidate.id} value={candidate.id} className="bg-surface text-foreground">{candidate.name}</option>)}
              </select>
            </label>

            <span className="command-control-divider hidden md:block" aria-hidden="true" />

            <label className="command-control hidden items-center gap-1.5 md:flex">
              <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="command-control-caption hidden 2xl:inline">Workspace</span>
              <select value={activeWorkspace} onChange={(event: ChangeEvent<HTMLSelectElement>) => { const workspace = workspaceOptions.find((item) => item.id === event.target.value); if (workspace) void navigate({ to: workspace.to }); }} className="command-select" aria-label="Select workspace">
                {workspaceOptions.map((workspace) => <option key={workspace.id} value={workspace.id} className="bg-surface text-foreground">{workspace.label}</option>)}
              </select>
            </label>

            <span className="command-control-divider hidden md:block" aria-hidden="true" />

            <label className="command-control flex items-center gap-1.5">
              <span className="command-control-caption hidden xl:inline">Period</span>
              <select value={timeRange} onChange={(event: ChangeEvent<HTMLSelectElement>) => setTimeRange(event.target.value as typeof timeRange)} className="command-select text-muted-foreground" aria-label="Select reporting period">
                {timeRanges.map((range) => <option key={range} value={range} className="bg-surface text-foreground">{range}</option>)}
              </select>
            </label>

            <span className="command-control-divider hidden xl:block" aria-hidden="true" />

            <label className="command-control command-scenario-control hidden items-center gap-1.5 xl:flex">
              <Gauge className="size-3.5 shrink-0 text-primary" />
              <span className="command-control-caption hidden 2xl:inline">Scenario</span>
              <select value={scenarioId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setScenarioId(event.target.value as DemoScenarioId)} className="command-select max-w-[148px] font-medium" aria-label="Select demo scenario">
                {demoScenarios.map((scenario) => <option key={scenario.id} value={scenario.id} className="bg-surface text-foreground">{scenario.name}</option>)}
              </select>
            </label>
          </div>

          <div className="command-search relative order-last w-full lg:order-none lg:min-w-[260px] lg:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Escape") setSearch(""); }} placeholder="Search assets, incidents, reports, invoices…" className="command-search-input w-full pl-8 pr-3 text-[11.5px] placeholder:text-muted-foreground/65" aria-label="Search demo assets" role="combobox" aria-autocomplete="list" aria-expanded={normalizedSearch.length >= 2} aria-controls="global-search-results" />
            {normalizedSearch.length >= 2 && (
              <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-md border border-border-strong bg-surface shadow-lg">
                {searchResults.length > 0 ? searchResults.map((result) => (
                  <Link key={`${result.to}-${result.label}`} to={result.to} onClick={() => { if (result.context) storeIncidentContext(result.context); setSearch(""); }} role="option" aria-selected="false" className="flex items-center gap-3 border-b border-border px-3 py-2 text-[11.5px] last:border-b-0 hover:bg-surface-2">
                    <Search className="size-3.5 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block font-medium">{result.label}</span><span className="block truncate text-[10px] text-muted-foreground">{result.detail}</span></span><ChevronRight className="size-3.5 text-muted-foreground" />
                  </Link>
                )) : <div className="px-3 py-3 text-[11px] text-muted-foreground">No matching demo asset.</div>}
              </div>
            )}
          </div>

          <div className="command-status-cluster ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setRunning(!running)} aria-pressed={running} className={`command-live-control flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[10.5px] font-medium tracking-wide ${running ? "is-live" : "is-paused"}`} title={running ? "Pause simulated live telemetry" : "Resume simulated live telemetry"}>
              {running ? <Radio className="size-3" /> : <Pause className="size-3" />}{running ? "LIVE" : "PAUSED"}
            </button>
            <button type="button" onClick={startGuide} className="command-guide-button hidden h-8 items-center gap-1.5 rounded-md px-2.5 text-[10.5px] font-medium xl:flex"><PlayCircle className="size-3.5" /> Guided demo</button>
            <div className="command-update-time hidden items-center gap-1.5 px-1.5 text-[10px] text-muted-foreground tabular 2xl:flex" title={lastUpdated.toLocaleString()}><Play className={`size-3 ${running ? "text-green" : "text-amber"}`} />{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            <Link to="/alarms" className="command-icon-button relative flex size-8 items-center justify-center rounded-md" aria-label="Open alarms"><Bell className="size-4 text-muted-foreground" />{kpis.criticalAlarms > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red" />}</Link>
            <Link to="/data-health" className="command-icon-button flex size-8 items-center justify-center rounded-md" title={`Data health ${telemetry.dataHealth.toFixed(1)}%`}><ShieldCheck className={`size-4 ${telemetry.meterQuality === "GOOD" ? "text-green" : "text-amber"}`} /></Link>
            <div className="command-status-divider mx-1 hidden h-4 w-px 2xl:block" />
            <div className="command-user-chip hidden h-8 items-center gap-2 px-2 text-[11px] 2xl:flex"><div className="flex size-6 items-center justify-center rounded-full border border-primary/20 bg-primary/10"><User className="size-3.5 text-primary" /></div><span className="text-muted-foreground">Energy Manager</span></div>
          </div>
'''
shell.write_text(shell_text[:start] + command_bar + shell_text[end:])

ui = Path("src/components/argrid-ui.tsx")
replace_once(
    ui,
    '''  padded = true,
  busy = false,
}: {''',
    '''  padded = true,
  busy = false,
  variant = "standard",
}: {''',
    "Panel variant default",
)
replace_once(
    ui,
    '''  busy?: boolean;
}) {''',
    '''  busy?: boolean;
  variant?: "primary" | "standard" | "quiet";
}) {''',
    "Panel variant type",
)
replace_once(
    ui,
    '''    <section className={`panel flex min-w-0 flex-col overflow-hidden ${className}`} aria-busy={busy || undefined}>''',
    '''    <section className={`panel panel-variant-${variant} flex min-w-0 flex-col overflow-hidden ${className}`} aria-busy={busy || undefined}>''',
    "Panel variant class",
)

overview = Path("src/routes/index.tsx")
replace_once(
    overview,
    '''          <Panel
            title="Energy Flow Sankey"''',
    '''          <Panel
            variant="primary"
            title="Energy Flow Sankey"''',
    "Overview primary Sankey",
)
replace_once(
    overview,
    '''          <Panel title="Value Realization" className="xl:col-span-4"''',
    '''          <Panel variant="quiet" title="Value Realization" className="xl:col-span-4"''',
    "Overview quiet value panel",
)
replace_once(
    overview,
    '''          <Panel title="Recent Operational Events" className="xl:col-span-4"''',
    '''          <Panel variant="quiet" title="Recent Operational Events" className="xl:col-span-4"''',
    "Overview quiet events panel",
)

portfolio = Path("src/routes/portfolio.tsx")
replace_once(
    portfolio,
    '''          <Panel title="Performance Constellation" className="h-[390px] xl:col-span-7"''',
    '''          <Panel variant="primary" title="Performance Constellation" className="h-[390px] xl:col-span-7"''',
    "Portfolio primary constellation",
)
replace_once(
    portfolio,
    '''          <Panel title={`${selected.name} · Management Profile`} className="xl:col-span-4"''',
    '''          <Panel variant="quiet" title={`${selected.name} · Management Profile`} className="xl:col-span-4"''',
    "Portfolio quiet profile",
)

styles = Path("src/styles.css")
css = styles.read_text()
marker = '''.workspace-management main {
  background:'''
if marker not in css:
    raise SystemExit("P1 CSS insertion marker not found")
if "command-context-cluster" in css:
    raise SystemExit("P1 CSS already exists")

p1_css = '''/* Public-launch P1: calm command hierarchy and three panel emphasis levels. */
.shell-command-bar {
  gap: 8px;
  background: color-mix(in oklab, var(--surface) 96%, var(--surface-2));
  box-shadow: 0 1px 0 color-mix(in oklab, var(--foreground) 4%, transparent);
}

.command-context-cluster {
  display: flex;
  min-width: 0;
  height: 34px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: color-mix(in oklab, var(--surface-2) 78%, var(--surface));
  padding: 2px;
  box-shadow: inset 0 1px 0 color-mix(in oklab, white 58%, transparent);
}

.command-control {
  min-width: 0;
  height: 28px;
  border-radius: 5px;
  padding: 0 8px;
  color: var(--muted-foreground);
  transition: color 140ms ease, background-color 140ms ease;
}

.command-control:hover,
.command-control:focus-within {
  background: var(--surface);
  color: var(--foreground);
}

.command-control-caption {
  flex: none;
  font-size: 8px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--muted-foreground) 78%, transparent);
}

.command-select {
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--foreground);
  font-size: 11px;
  line-height: 1;
  outline: none;
}

.command-control-divider {
  width: 1px;
  height: 18px;
  flex: none;
  background: color-mix(in oklab, var(--border) 82%, transparent);
}

.command-scenario-control {
  background: color-mix(in oklab, var(--primary) 5%, transparent);
}

.command-search-input {
  height: 34px;
  border: 1px solid color-mix(in oklab, var(--border-strong) 72%, var(--border));
  border-radius: 7px;
  background: var(--surface);
  color: var(--foreground);
  outline: none;
  box-shadow:
    0 1px 2px color-mix(in oklab, var(--foreground) 4%, transparent),
    inset 0 0 0 1px transparent;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.command-search-input:hover {
  border-color: var(--border-strong);
}

.command-search-input:focus {
  border-color: color-mix(in oklab, var(--primary) 62%, var(--border));
  box-shadow:
    0 1px 2px color-mix(in oklab, var(--foreground) 4%, transparent),
    0 0 0 3px color-mix(in oklab, var(--primary) 10%, transparent);
}

.command-status-cluster {
  flex: none;
}

.command-live-control {
  transition: background-color 140ms ease, border-color 140ms ease;
}

.command-live-control.is-live {
  border-color: color-mix(in oklab, var(--green) 28%, var(--border));
  background: color-mix(in oklab, var(--green) 7%, var(--surface));
  color: var(--green);
}

.command-live-control.is-paused {
  border-color: color-mix(in oklab, var(--amber) 34%, var(--border));
  background: color-mix(in oklab, var(--amber) 9%, var(--surface));
  color: var(--amber);
}

.command-guide-button {
  border: 1px solid color-mix(in oklab, var(--primary) 22%, var(--border));
  background: color-mix(in oklab, var(--primary) 5%, var(--surface));
  color: var(--primary);
}

.command-guide-button:hover {
  background: color-mix(in oklab, var(--primary) 9%, var(--surface));
}

.command-icon-button {
  transition: background-color 140ms ease;
}

.command-icon-button:hover {
  background: var(--surface-2);
}

.command-status-divider {
  background: var(--border);
}

.command-user-chip {
  border-radius: 6px;
  background: color-mix(in oklab, var(--surface-2) 62%, transparent);
}

.panel {
  position: relative;
}

.workspace-management .panel-variant-primary {
  border-color: color-mix(in oklab, var(--primary) 24%, var(--border)) !important;
  box-shadow:
    0 1px 2px color-mix(in oklab, var(--foreground) 5%, transparent),
    0 10px 28px color-mix(in oklab, var(--primary) 5%, transparent) !important;
}

.workspace-management .panel-variant-primary::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  z-index: 2;
  height: 2px;
  background: linear-gradient(90deg, var(--primary), color-mix(in oklab, var(--primary) 28%, transparent) 62%, transparent);
}

.workspace-management .panel-variant-primary .panel-header {
  background: linear-gradient(90deg, color-mix(in oklab, var(--primary) 6%, var(--surface)), color-mix(in oklab, var(--surface) 96%, var(--surface-2)) 52%);
}

.panel-variant-primary .panel-header h2 {
  font-size: 12px;
}

.workspace-management .panel-variant-quiet {
  border-color: color-mix(in oklab, var(--border) 72%, transparent) !important;
  background: color-mix(in oklab, var(--surface) 76%, var(--surface-2)) !important;
  box-shadow: none !important;
}

.workspace-management .panel-variant-quiet .panel-header {
  border-bottom-color: color-mix(in oklab, var(--border) 72%, transparent);
  background: transparent;
}

.workspace-management .panel-variant-quiet .panel-header h2 {
  color: color-mix(in oklab, var(--foreground) 88%, var(--muted-foreground));
}

.workspace-operations .panel-variant-primary {
  border-color: color-mix(in oklab, var(--primary) 42%, var(--border)) !important;
  box-shadow: inset 0 2px 0 color-mix(in oklab, var(--primary) 72%, transparent);
}

.workspace-operations .panel-variant-quiet {
  border-color: color-mix(in oklab, var(--border) 70%, transparent) !important;
  background: color-mix(in oklab, var(--surface) 82%, var(--surface-2)) !important;
}

@media (max-width: 1279px) {
  .command-search {
    flex-basis: 100%;
  }
}

@media (max-width: 767px) {
  .command-context-cluster {
    flex: 1 1 auto;
    max-width: calc(100% - 154px);
  }

  .command-control {
    padding-inline: 6px;
  }

  .command-control-site .command-select {
    max-width: 132px;
  }
}

'''
styles.write_text(css.replace(marker, p1_css + marker, 1))
