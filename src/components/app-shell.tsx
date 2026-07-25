import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  ChevronRight,
  Database,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  Menu,
  Pause,
  Play,
  Radio,
  Receipt,
  Search,
  ShieldCheck,
  User,
  X,
  Zap,
} from "lucide-react";
import { kpis } from "@/lib/argrid-data";
import { demoSites, timeRanges, useDemoSimulation } from "@/lib/demo-simulation";
import bgTexture from "@/assets/argrid-bg.jpg";
import logoMark from "@/assets/argrid-logo.png";
import headerAccent from "@/assets/argrid-header-accent.jpg";

type AppPath =
  | "/"
  | "/electrical"
  | "/analytics"
  | "/opportunities"
  | "/alarms"
  | "/billing"
  | "/sustainability";

const nav = [
  { to: "/" as AppPath, label: "Overview", icon: LayoutDashboard },
  { to: "/electrical" as AppPath, label: "Electrical Network", icon: Zap },
  { to: "/analytics" as AppPath, label: "Energy Analytics", icon: Activity },
  { to: "/opportunities" as AppPath, label: "Opportunities", icon: Lightbulb },
  { to: "/alarms" as AppPath, label: "Alarms & Events", icon: Bell },
  { to: "/billing" as AppPath, label: "Billing", icon: Receipt },
  { to: "/sustainability" as AppPath, label: "Sustainability", icon: Leaf },
] as const;

const searchableAssets: Array<{ label: string; detail: string; to: AppPath }> = [
  { label: "MSB-Main", detail: "20 kV incomer · electrical network", to: "/electrical" },
  { label: "Feeder F-07", detail: "Utility & Aux · voltage sag", to: "/electrical" },
  { label: "AHU-HL-03", detail: "Night setback opportunity", to: "/opportunities" },
  { label: "COMP-04", detail: "Compressed air leak", to: "/opportunities" },
  { label: "ALM-8821", detail: "Critical voltage sag event", to: "/alarms" },
  { label: "Tenant E", detail: "Overdue energy invoice", to: "/billing" },
  { label: "Scope 2 emissions", detail: "Sustainability performance", to: "/sustainability" },
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
  const {
    site,
    siteId,
    setSiteId,
    timeRange,
    setTimeRange,
    telemetry,
    lastUpdated,
    running,
    setRunning,
  } = useDemoSimulation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const searchResults = useMemo(
    () =>
      normalizedSearch.length < 2
        ? []
        : searchableAssets
            .filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(normalizedSearch))
            .slice(0, 5),
    [normalizedSearch],
  );

  const sidebar = (
    <>
      <div className="h-[52px] flex items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="size-8 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
          <img src={logoMark} alt="ArGrid" className="size-6 object-contain" />
        </div>
        <div className="leading-tight">
          <div className="font-display font-semibold text-[13px] tracking-tight">ArGrid</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Energy OS · Demo</div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5" aria-label="Primary navigation">
        <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">Workspace</div>
        {nav.map((item) => {
          const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileNavOpen(false)}
              className={`group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors relative ${
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-primary" />}
              <Icon className="size-4" strokeWidth={active ? 2.2 : 1.6} />
              <span className="flex-1">{item.label}</span>
              {item.to === "/alarms" && kpis.activeAlarms > 0 && (
                <span className="text-[10px] tabular px-1.5 py-0.5 rounded bg-red/20 text-red">{kpis.activeAlarms}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Database className="size-3.5" />
          Data health <span className="tabular text-foreground ml-auto">{telemetry.dataHealth.toFixed(1)}%</span>
        </div>
        <div className="text-[10px] leading-relaxed text-muted-foreground/75">
          Simulated IEC 61850, Modbus TCP, and meter telemetry. No field equipment is connected.
        </div>
      </div>
    </>
  );

  return (
    <div
      className="min-h-screen flex bg-background text-foreground bg-no-repeat bg-cover bg-fixed"
      style={{ backgroundImage: `url(${bgTexture})` }}
    >
      <aside className="hidden lg:flex w-[220px] shrink-0 border-r border-sidebar-border bg-sidebar/95 backdrop-blur flex-col relative z-20">
        {sidebar}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative h-full w-[250px] border-r border-sidebar-border bg-sidebar flex flex-col">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-2 top-2 size-8 rounded-md flex items-center justify-center hover:bg-sidebar-accent"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col relative">
        <header className="min-h-[52px] shrink-0 border-b border-border bg-surface/90 backdrop-blur flex flex-wrap items-center px-3 lg:px-4 py-2 lg:py-0 gap-2 lg:gap-3 relative z-30">
          <button
            type="button"
            className="lg:hidden size-8 rounded-md border border-border bg-surface-2 flex items-center justify-center"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>

          <label className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-surface-2 text-[12px] min-w-0">
            <span className="size-1.5 rounded-full bg-green shrink-0" />
            <span className="text-muted-foreground hidden sm:inline">Site</span>
            <select
              value={siteId}
              onChange={(event) => setSiteId(event.target.value as typeof siteId)}
              className="max-w-[190px] bg-transparent font-medium focus:outline-none cursor-pointer truncate"
              aria-label="Select demo site"
            >
              {demoSites.map((candidate) => (
                <option key={candidate.id} value={candidate.id} className="bg-surface text-foreground">
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          <div className="hidden sm:block h-4 w-px bg-border" />
          <label className="h-8 px-2 rounded-md hover:bg-surface-2 text-[12px] text-muted-foreground flex items-center">
            <select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value as typeof timeRange)}
              className="bg-transparent focus:outline-none cursor-pointer"
              aria-label="Select reporting period"
            >
              {timeRanges.map((range) => (
                <option key={range} value={range} className="bg-surface text-foreground">
                  {range}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setRunning(!running)}
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[11px] ${
              running ? "border-primary/30 bg-primary/10 text-primary" : "border-amber/30 bg-amber/10 text-amber"
            }`}
            title={running ? "Pause simulated live telemetry" : "Resume simulated live telemetry"}
          >
            {running ? <Radio className="size-3" /> : <Pause className="size-3" />}
            {running ? "LIVE DEMO" : "PAUSED"}
          </button>

          <div className="relative order-last lg:order-none w-full lg:flex-1 lg:max-w-md lg:ml-1">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets, feeders, alarms…"
              className="w-full h-8 pl-8 pr-3 rounded-md bg-surface-2 border border-border text-[12px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50"
              aria-label="Search demo assets"
            />
            {normalizedSearch.length >= 2 && (
              <div className="absolute left-0 right-0 top-9 rounded-md border border-border-strong bg-surface shadow-xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <Link
                      key={`${result.to}-${result.label}`}
                      to={result.to}
                      onClick={() => setSearch("")}
                      className="flex items-center gap-3 px-3 py-2 text-[12px] hover:bg-surface-2 border-b border-border last:border-b-0"
                    >
                      <Search className="size-3.5 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{result.label}</span>
                        <span className="block text-[10.5px] text-muted-foreground truncate">{result.detail}</span>
                      </span>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-3 text-[11px] text-muted-foreground">No matching demo asset.</div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <div className="hidden xl:flex items-center gap-1.5 px-2 text-[10.5px] text-muted-foreground tabular" title={lastUpdated.toLocaleString()}>
              <Play className={`size-3 ${running ? "text-green" : "text-amber"}`} />
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <Link to="/alarms" className="relative size-8 rounded-md hover:bg-surface-2 flex items-center justify-center" aria-label="Open alarms">
              <Bell className="size-4 text-muted-foreground" />
              {kpis.criticalAlarms > 0 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red" />}
            </Link>
            <div className="size-8 rounded-md flex items-center justify-center" title="Demo data integrity checks active">
              <ShieldCheck className="size-4 text-green" />
            </div>
            <div className="hidden sm:block h-4 w-px bg-border mx-1" />
            <div className="hidden sm:flex items-center gap-2 h-8 px-2 text-[12px]">
              <div className="size-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                <User className="size-3.5 text-primary" />
              </div>
              <span className="text-muted-foreground">Operator</span>
            </div>
          </div>
        </header>

        <div className="relative border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${headerAccent})` }} aria-hidden />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, var(--color-background) 0%, color-mix(in oklab, var(--color-background) 70%, transparent) 45%, transparent 100%)",
            }}
            aria-hidden
          />
          <div className="relative px-4 lg:px-6 py-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{site.region}</div>
              <h1 className="font-display text-[21px] font-semibold tracking-tight leading-tight mt-0.5">{title}</h1>
              {subtitle && <div className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</div>}
            </div>
            {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
          </div>
        </div>

        <main className="flex-1 overflow-auto p-3 lg:p-5 bg-background/70">{children}</main>
      </div>
    </div>
  );
}
