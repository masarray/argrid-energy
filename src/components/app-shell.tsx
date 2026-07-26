import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  PlayCircle,
  Radio,
  Receipt,
  Search,
  ShieldCheck,
  User,
  X,
  Zap,
} from "lucide-react";
import { kpis } from "@/lib/argrid-data";
import {
  demoScenarios,
  demoSites,
  timeRanges,
  useDemoSimulation,
  type DemoScenarioId,
} from "@/lib/demo-simulation";
import { storeIncidentContext, type IncidentContext } from "@/lib/incident-context";
import logoMark from "@/assets/argrid-logo.png";

type AppPath =
  | "/"
  | "/portfolio"
  | "/electrical"
  | "/analytics"
  | "/demand"
  | "/opportunities"
  | "/savings"
  | "/data-health"
  | "/alarms"
  | "/alarms/power-quality"
  | "/reports"
  | "/billing"
  | "/sustainability";

type NavItem = { to: AppPath; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };
type SearchableAsset = { label: string; detail: string; to: AppPath; context?: IncidentContext };
type GuidedStep = { title: string; body: string; to: AppPath; scenario: DemoScenarioId; context?: IncidentContext };

const navGroups: NavGroup[] = [
  {
    label: "Performance",
    items: [
      { to: "/portfolio", label: "Portfolio", icon: Building2 },
      { to: "/", label: "Overview", icon: LayoutDashboard },
      { to: "/analytics", label: "Energy Analytics", icon: Activity },
      { to: "/demand", label: "Demand & Cost", icon: Gauge },
      { to: "/opportunities", label: "Opportunities", icon: Lightbulb },
      { to: "/savings", label: "Actions & Savings", icon: ClipboardCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/electrical", label: "Electrical Network", icon: Zap },
      { to: "/alarms", label: "Alarms & Events", icon: Bell },
    ],
  },
  {
    label: "Commercial & ESG",
    items: [
      { to: "/reports", label: "Report Center", icon: FileText },
      { to: "/billing", label: "Billing", icon: Receipt },
      { to: "/sustainability", label: "Sustainability", icon: Leaf },
    ],
  },
  {
    label: "Governance",
    items: [{ to: "/data-health", label: "Data Health", icon: Database }],
  },
];

const primaryIncidentContext: IncidentContext = {
  eventId: "PQ-260715-143217",
  feederId: "F-07",
  incidentGroupId: "INC-PQ-1042",
};

const searchableAssets: SearchableAsset[] = [
  { label: "Enterprise Portfolio", detail: "Multi-site performance and opportunity ranking", to: "/portfolio" },
  { label: "Performance Constellation", detail: "Intensity, budget variance, and opportunity benchmark", to: "/portfolio" },
  { label: "Cikarang Manufacturing Complex", detail: "Enterprise site · West Java", to: "/" },
  { label: "Demand interval forecast", detail: "Contract-limit and financial exposure", to: "/demand" },
  { label: "Chiller Plant F-04", detail: "18% peak-demand contribution", to: "/demand" },
  { label: "Compressor Room F-05", detail: "Flexible demand-response load", to: "/demand" },
  { label: "ACT-2036", detail: "Chiller sequencing · verification ready", to: "/savings" },
  { label: "Verified Savings Ledger", detail: "Auditable cost and energy results", to: "/savings" },
  { label: "Weekend baseload persistence", detail: "Savings at risk review", to: "/savings" },
  { label: "PM-TNT-03", detail: "Tenant revenue meter · billing exception", to: "/data-health" },
  { label: "Data Quality DQ-3061", detail: "Missing intervals blocking invoice approval", to: "/data-health" },
  { label: "Measurement provenance", detail: "Source-to-decision calculation lineage", to: "/data-health" },
  { label: "MSB-Main", detail: "20 kV incomer · electrical network", to: "/electrical" },
  { label: "Transformer TR-01", detail: "6 MVA · 84% loading", to: "/electrical" },
  { label: "Feeder F-07", detail: "Utility & Aux · voltage sag and event evidence", to: "/electrical", context: primaryIncidentContext },
  { label: "PQ-260715-143217", detail: "82.0% Un · 240 ms · synchronized PQ evidence", to: "/alarms/power-quality", context: primaryIncidentContext },
  { label: "INC-PQ-1042", detail: "Grouped voltage-sag incident · formal investigation package", to: "/alarms", context: primaryIncidentContext },
  { label: "PM-PQ-07", detail: "Source PQ meter · F-07 Utility & Aux", to: "/alarms/power-quality", context: primaryIncidentContext },
  { label: "MCC-AUX-07", detail: "Probable downstream origin · equipment response linked", to: "/alarms/power-quality", context: primaryIncidentContext },
  { label: "AGR-PQ-2026-1042", detail: "Engineering report document control and evidence register", to: "/alarms/power-quality", context: primaryIncidentContext },
  { label: "Report Center", detail: "Governed executive, carbon, billing, PQ, savings, and data-quality reports", to: "/reports" },
  { label: "RPT-EXEC-2026-07", detail: "Executive Energy & Carbon Performance report", to: "/reports" },
  { label: "RPT-CARBON-2026-Q2", detail: "Quarterly Scope 1 and Scope 2 inventory", to: "/reports" },
  { label: "Scope 2 location-based", detail: "Regional-grid-factor carbon inventory", to: "/sustainability" },
  { label: "Scope 2 market-based", detail: "Supplier mix and renewable-attribute inventory", to: "/sustainability" },
  { label: "EAC-ID-2026-0148", detail: "Renewable-attribute allocation and evidence", to: "/sustainability" },
  { label: "Emission factor registry", detail: "Factor version, source, effective period, and quality", to: "/sustainability" },
  { label: "AHU-HL-03", detail: "Night setback opportunity", to: "/opportunities" },
  { label: "COMP-04", detail: "Compressed air loss", to: "/opportunities" },
  { label: "ALM-8821", detail: "Critical voltage sag member alarm", to: "/alarms", context: primaryIncidentContext },
  { label: "Tenant E", detail: "Overdue energy invoice", to: "/billing" },
];

const workspaceOptions: Array<{ id: string; label: string; to: AppPath }> = [
  { id: "management", label: "Management", to: "/portfolio" },
  { id: "operations", label: "Operations", to: "/electrical" },
  { id: "finance", label: "Finance", to: "/billing" },
];

const guidedSteps: GuidedStep[] = [
  {
    title: "1 · Portfolio confidence",
    body: "Rank sites by normalized intensity, budget variance, demand exposure, opportunity, savings, and data confidence.",
    to: "/portfolio",
    scenario: "peak-demand",
  },
  {
    title: "2 · Enterprise condition",
    body: "Open the selected site and review electrical operation, energy performance, cost exposure, and realized value.",
    to: "/",
    scenario: "peak-demand",
  },
  {
    title: "3 · Predict demand exposure",
    body: "Inspect the interval trajectory, contributing feeders, tariff exposure, and a simulation-only response plan.",
    to: "/demand",
    scenario: "peak-demand",
  },
  {
    title: "4 · Locate the electrical cause",
    body: "Move from financial impact to the contributing feeder without losing site and scenario context.",
    to: "/electrical",
    scenario: "peak-demand",
  },
  {
    title: "5 · Prioritize corrective action",
    body: "Review the opportunity, confidence, payback, evidence, and accountable owner.",
    to: "/opportunities",
    scenario: "efficiency-loss",
  },
  {
    title: "6 · Verify and approve value",
    body: "Review the frozen baseline, adjustments, meter quality, calculation trace, approval gate, and persistence risk.",
    to: "/savings",
    scenario: "efficiency-loss",
  },
  {
    title: "7 · Investigate a PQ incident",
    body: "Replay the voltage sag, compare synchronized meters, inspect equipment response, and export the governed engineering report.",
    to: "/alarms/power-quality",
    scenario: "voltage-sag",
    context: primaryIncidentContext,
  },
  {
    title: "8 · Validate decision data",
    body: "Trace a billing exception from missing interval to meter, gateway, historian, calculation, and approval consequence.",
    to: "/data-health",
    scenario: "billing-exception",
  },
  {
    title: "9 · Assure sustainability results",
    body: "Separate location-based and market-based Scope 2, inspect factor versions, reconcile renewable attributes, and review assurance gates.",
    to: "/sustainability",
    scenario: "normal",
  },
  {
    title: "10 · Govern the executive report",
    body: "Review report sources, coverage, blocking issues, owner, reviewer, approval gate, publication state, and printable evidence.",
    to: "/reports",
    scenario: "normal",
  },
  {
    title: "11 · Close commercial value",
    body: "Conclude with tariff trace, invoice assurance, collection status, and management-ready commercial evidence.",
    to: "/billing",
    scenario: "billing-exception",
  },
];

export function AppShell({
  title,
  subtitle,
  toolbar,
  children,
}: {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const {
    site,
    siteId,
    setSiteId,
    timeRange,
    setTimeRange,
    scenarioId,
    setScenarioId,
    telemetry,
    lastUpdated,
    running,
    setRunning,
  } = useDemoSimulation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" && window.innerWidth <= 1366);
  const [search, setSearch] = useState("");
  const [guideOpen, setGuideOpen] = useState(() => window.sessionStorage.getItem("argrid-guided-demo-open") === "true");
const [guideStep, setGuideStep] = useState(() => {
  const saved = Number(window.sessionStorage.getItem("argrid-guided-demo-step") ?? "0");
  return Number.isFinite(saved) ? Math.max(0, Math.min(guidedSteps.length - 1, saved)) : 0;
});

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavOpen]);

  const normalizedSearch = search.trim().toLowerCase();
  const operationsWorkspace = path.startsWith("/electrical") || path.startsWith("/alarms");
  const activeWorkspace = path.startsWith("/billing") ? "finance" : operationsWorkspace ? "operations" : "management";
  const searchResults = useMemo(
    () =>
      normalizedSearch.length < 2
        ? []
        : searchableAssets
            .filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(normalizedSearch))
            .slice(0, 7),
    [normalizedSearch],
  );

  const applyGuidedStep = (step: GuidedStep) => {
    setScenarioId(step.scenario);
    if (step.context) storeIncidentContext(step.context);
    void navigate({ to: step.to });
  };

  const persistGuideState = (open: boolean, step: number) => {
    window.sessionStorage.setItem("argrid-guided-demo-open", String(open));
    window.sessionStorage.setItem("argrid-guided-demo-step", String(step));
  };

  const closeGuide = () => {
    setGuideOpen(false);
    window.sessionStorage.removeItem("argrid-guided-demo-open");
    window.sessionStorage.removeItem("argrid-guided-demo-step");
  };

  const startGuide = () => {
    setGuideStep(0);
    setGuideOpen(true);
    persistGuideState(true, 0);
    applyGuidedStep(guidedSteps[0]);
  };

  const moveGuide = (nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(guidedSteps.length - 1, nextIndex));
    const nextStep = guidedSteps[boundedIndex];
    setGuideStep(boundedIndex);
    persistGuideState(true, boundedIndex);
    applyGuidedStep(nextStep);
  };

  const renderSidebar = (collapsed: boolean) => (
    <>
      <div className={`h-[52px] flex items-center border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "gap-2.5 px-3"}`}>
        <div className="size-8 rounded-md border border-primary/25 bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
          <img src={logoMark} alt="ArGrid" className="size-6 object-contain" />
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <div className="font-display font-medium text-[13px] tracking-tight">ArGrid</div>
            <div className="text-[9.5px] text-muted-foreground uppercase tracking-[0.14em]">Energy Management</div>
          </div>
        )}
      </div>

      <nav className={`flex-1 py-3 overflow-y-auto ${collapsed ? "px-2" : "px-2.5"}`} aria-label="Primary navigation">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            {!collapsed && <div className="px-2 pb-1.5 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">{group.label}</div>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileNavOpen(false)}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center h-8 rounded-md text-[12.5px] transition-colors relative ${collapsed ? "justify-center px-2" : "gap-2.5 px-2.5"} ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/55"}`}
                  >
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-primary" />}
                    <Icon className="size-4 shrink-0" strokeWidth={active ? 2.1 : 1.6} />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.to === "/alarms" && kpis.activeAlarms > 0 && <span className="text-[9.5px] tabular px-1.5 py-0.5 rounded border border-red/25 bg-red/10 text-red">{kpis.activeAlarms}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`border-t border-sidebar-border ${collapsed ? "p-2" : "p-3 space-y-2"}`}>
        {collapsed ? (
          <Link to="/data-health" className="size-8 mx-auto rounded-md flex items-center justify-center hover:bg-sidebar-accent" title={`Data health ${telemetry.dataHealth.toFixed(1)}%`}><Database className={`size-4 ${telemetry.meterQuality === "GOOD" ? "text-green" : "text-amber"}`} /></Link>
        ) : (
          <>
            <Link to="/data-health" className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground"><Database className="size-3.5" />Data health<span className="tabular text-foreground ml-auto">{telemetry.dataHealth.toFixed(1)}%</span></Link>
            <div className="h-1 rounded-full bg-sidebar-accent overflow-hidden"><div className={telemetry.meterQuality === "GOOD" ? "h-full bg-green" : "h-full bg-amber"} style={{ width: `${telemetry.dataHealth}%` }} /></div>
            <div className="text-[9.5px] leading-relaxed text-muted-foreground/75">{telemetry.meterQuality} · {telemetry.intervalCompletenessPct.toFixed(1)}% complete · simulation only</div>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to workspace content</a>
      <div className={`min-h-screen flex text-foreground ${operationsWorkspace ? "workspace-operations" : "workspace-management"}`}>
      <aside className={`hidden lg:flex shrink-0 border-r border-sidebar-border bg-sidebar flex-col relative z-20 transition-[width] duration-200 ${sidebarCollapsed ? "w-[60px]" : "w-[220px]"}`}>
        {renderSidebar(sidebarCollapsed)}
        <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className="absolute -right-3 top-[68px] size-6 rounded-full border border-sidebar-border bg-sidebar flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}>
          {sidebarCollapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
        </button>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative h-full w-[270px] border-r border-sidebar-border bg-sidebar flex flex-col">
            <button type="button" onClick={() => setMobileNavOpen(false)} className="absolute right-2 top-2 size-8 rounded-md flex items-center justify-center hover:bg-sidebar-accent" aria-label="Close navigation"><X className="size-4" /></button>
            {renderSidebar(false)}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col bg-background">
        <header className="shell-command-bar min-h-[52px] shrink-0 border-b border-border bg-surface flex flex-wrap items-center px-3 lg:px-4 py-2 lg:py-0 gap-2 relative z-30">
          <button type="button" className="lg:hidden size-8 rounded-md border border-border bg-surface-2 flex items-center justify-center" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu className="size-4" /></button>

          <label className="flex items-center gap-2 h-8 px-2 rounded-md border border-transparent hover:border-border hover:bg-surface-2 text-[11.5px] min-w-0">
            <span className="size-1.5 rounded-full bg-green shrink-0" /><span className="text-muted-foreground hidden xl:inline">Site</span>
            <select value={siteId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSiteId(event.target.value as typeof siteId)} className="max-w-[195px] bg-transparent font-medium focus:outline-none cursor-pointer truncate" aria-label="Select demo site">
              {demoSites.map((candidate) => <option key={candidate.id} value={candidate.id} className="bg-surface text-foreground">{candidate.name}</option>)}
            </select>
          </label>

          <label className="hidden md:flex items-center gap-1.5 h-8 px-2 rounded-md border border-transparent hover:border-border hover:bg-surface-2 text-[11.5px]">
            <Building2 className="size-3.5 text-muted-foreground" />
            <select value={activeWorkspace} onChange={(event: ChangeEvent<HTMLSelectElement>) => { const workspace = workspaceOptions.find((item) => item.id === event.target.value); if (workspace) void navigate({ to: workspace.to }); }} className="bg-transparent focus:outline-none cursor-pointer" aria-label="Select workspace">
              {workspaceOptions.map((workspace) => <option key={workspace.id} value={workspace.id} className="bg-surface text-foreground">{workspace.label}</option>)}
            </select>
          </label>

          <label className="h-8 px-2 rounded-md border border-transparent hover:border-border hover:bg-surface-2 text-[11.5px] text-muted-foreground flex items-center">
            <select value={timeRange} onChange={(event: ChangeEvent<HTMLSelectElement>) => setTimeRange(event.target.value as typeof timeRange)} className="bg-transparent focus:outline-none cursor-pointer" aria-label="Select reporting period">
              {timeRanges.map((range) => <option key={range} value={range} className="bg-surface text-foreground">{range}</option>)}
            </select>
          </label>

          <label className="hidden xl:flex h-8 px-2 rounded-md border border-border bg-surface-2 text-[11.5px] items-center gap-1.5">
            <Gauge className="size-3.5 text-primary" />
            <select value={scenarioId} onChange={(event: ChangeEvent<HTMLSelectElement>) => setScenarioId(event.target.value as DemoScenarioId)} className="max-w-[160px] bg-transparent focus:outline-none cursor-pointer" aria-label="Select demo scenario">
              {demoScenarios.map((scenario) => <option key={scenario.id} value={scenario.id} className="bg-surface text-foreground">{scenario.name}</option>)}
            </select>
          </label>

          <button type="button" onClick={() => setRunning(!running)} aria-pressed={running} className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[10.5px] font-medium tracking-wide ${running ? "border-primary/25 bg-primary/8 text-primary" : "border-amber/30 bg-amber/10 text-amber"}`} title={running ? "Pause simulated live telemetry" : "Resume simulated live telemetry"}>
            {running ? <Radio className="size-3" /> : <Pause className="size-3" />}{running ? "LIVE" : "PAUSED"}
          </button>

          <div className="relative order-last lg:order-none w-full lg:flex-1 lg:max-w-md lg:ml-1">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Escape") setSearch(""); }} placeholder="Search site, meter, incident, event, report, invoice…" className="w-full h-8 pl-8 pr-3 rounded-md bg-surface-2 border border-border text-[11.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50" aria-label="Search demo assets" role="combobox" aria-autocomplete="list" aria-expanded={normalizedSearch.length >= 2} aria-controls="global-search-results" />
            {normalizedSearch.length >= 2 && (
              <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-9 rounded-md border border-border-strong bg-surface overflow-hidden z-50 shadow-lg">
                {searchResults.length > 0 ? searchResults.map((result) => (
                  <Link key={`${result.to}-${result.label}`} to={result.to} onClick={() => { if (result.context) storeIncidentContext(result.context); setSearch(""); }} role="option" aria-selected="false" className="flex items-center gap-3 px-3 py-2 text-[11.5px] hover:bg-surface-2 border-b border-border last:border-b-0">
                    <Search className="size-3.5 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block font-medium">{result.label}</span><span className="block text-[10px] text-muted-foreground truncate">{result.detail}</span></span><ChevronRight className="size-3.5 text-muted-foreground" />
                  </Link>
                )) : <div className="px-3 py-3 text-[11px] text-muted-foreground">No matching demo asset.</div>}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={startGuide} className="hidden xl:flex h-8 items-center gap-1.5 rounded-md border border-primary/25 bg-primary/8 px-2.5 text-[10.5px] font-medium text-primary hover:bg-primary/12"><PlayCircle className="size-3.5" /> Guided demo</button>
            <div className="hidden 2xl:flex items-center gap-1.5 px-2 text-[10px] text-muted-foreground tabular" title={lastUpdated.toLocaleString()}><Play className={`size-3 ${running ? "text-green" : "text-amber"}`} />{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            <Link to="/alarms" className="relative size-8 rounded-md hover:bg-surface-2 flex items-center justify-center" aria-label="Open alarms"><Bell className="size-4 text-muted-foreground" />{kpis.criticalAlarms > 0 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red" />}</Link>
            <Link to="/data-health" className="size-8 rounded-md flex items-center justify-center hover:bg-surface-2" title={`Data health ${telemetry.dataHealth.toFixed(1)}%`}><ShieldCheck className={`size-4 ${telemetry.meterQuality === "GOOD" ? "text-green" : "text-amber"}`} /></Link>
            <div className="hidden sm:block h-4 w-px bg-border mx-1" />
            <div className="hidden sm:flex items-center gap-2 h-8 px-2 text-[11.5px]"><div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><User className="size-3.5 text-primary" /></div><span className="text-muted-foreground">Energy Manager</span></div>
          </div>
        </header>

        <div className="border-b border-border bg-surface">
          <div className="px-4 lg:px-6 py-3.5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><span>{site.region}</span><ChevronRight className="size-3" /><span>{operationsWorkspace ? "Operations workspace" : activeWorkspace === "finance" ? "Finance workspace" : "Management workspace"}</span></div>
              <h1 className="font-display text-[20px] font-medium tracking-tight leading-tight mt-1">{title}</h1>
              {subtitle && <div className="text-[11.5px] text-muted-foreground mt-0.5">{subtitle}</div>}
            </div>
            {toolbar && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{toolbar}</div>}
          </div>
        </div>

        {(!running || telemetry.meterQuality !== "GOOD") && (
          <div className="workspace-status" role="status" aria-live="polite">
            <div className="flex min-w-0 items-center gap-2">
              {running ? <ShieldCheck className="size-3.5 shrink-0 text-amber" /> : <Pause className="size-3.5 shrink-0 text-amber" />}
              <span className="font-medium text-foreground">{running ? "Decision confidence reduced" : "Simulation paused"}</span>
              <span className="hidden text-muted-foreground md:inline">
                {running
                  ? `${telemetry.meterQuality} source quality · ${telemetry.intervalCompletenessPct.toFixed(1)}% interval completeness`
                  : `Values are frozen at ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
              </span>
            </div>
            <Link to="/data-health" className="shrink-0 text-[10px] font-medium text-primary hover:underline">Review data trust</Link>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 overflow-auto p-2.5 sm:p-3 lg:p-5">{children}</main>
      </div>

      {guideOpen && (
        <section className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-32px))] rounded-lg border border-border-strong bg-surface shadow-xl" aria-live="polite">
          <div className="flex items-center justify-between border-b border-border px-4 h-10"><div className="text-[10px] uppercase tracking-[0.14em] text-primary">Guided value story</div><button type="button" className="size-7 rounded-md flex items-center justify-center hover:bg-surface-2" onClick={closeGuide} aria-label="Close guided demo"><X className="size-3.5" /></button></div>
          <div className="p-4"><div className="text-[13px] font-medium">{guidedSteps[guideStep].title}</div><p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{guidedSteps[guideStep].body}</p><div className="mt-4 flex items-center gap-1.5">{guidedSteps.map((step, index) => <span key={step.title} className={`h-1 flex-1 rounded-full ${index <= guideStep ? "bg-primary" : "bg-surface-3"}`} />)}</div><div className="mt-4 flex items-center justify-between"><button type="button" onClick={() => moveGuide(guideStep - 1)} disabled={guideStep === 0} className="h-8 px-3 rounded-md border border-border text-[11px] disabled:opacity-40">Previous</button>{guideStep < guidedSteps.length - 1 ? <button type="button" onClick={() => moveGuide(guideStep + 1)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium">Next scene</button> : <button type="button" onClick={closeGuide} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium">Finish demo</button>}</div></div>
        </section>
      )}
      </div>
    </>
  );
}
