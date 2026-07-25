import type { ReactNode } from "react";

export function Panel({
  title,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`panel overflow-hidden flex flex-col ${className}`}>
      {title && (
        <header className="panel-header flex min-h-10 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <h2 className="min-w-0 truncate text-[11.5px] font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </h2>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${padded ? "p-4" : ""}`}>{children}</div>
    </section>
  );
}

export function KpiTile({
  label,
  value,
  unit,
  trend,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  hint?: string;
  tone?: "neutral" | "warning" | "critical" | "good";
}) {
  const toneClass = {
    neutral: "kpi-neutral",
    warning: "kpi-warning",
    critical: "kpi-critical",
    good: "kpi-good",
  }[tone];

  return (
    <section className={`kpi-tile ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9.5px] font-medium uppercase tracking-[0.11em] text-muted-foreground">{label}</div>
        <span className="kpi-state-dot" aria-hidden="true" />
      </div>
      <div className="mt-2 flex min-w-0 items-baseline gap-1.5">
        <span className="font-display truncate text-[22px] font-medium leading-none tracking-[-0.035em] tabular">
          {value}
        </span>
        {unit && <span className="shrink-0 text-[10.5px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2 flex min-h-4 items-center gap-2 text-[9.5px] text-muted-foreground">
        {typeof trend === "number" && (
          <span className={`shrink-0 tabular ${trend < 0 ? "text-green" : trend > 0 ? "text-amber" : ""}`}>
            {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {hint && <span className="truncate">{hint}</span>}
      </div>
    </section>
  );
}

export function SeverityDot({ level }: { level: "Critical" | "Warning" | "Info" | string }) {
  const c = level === "Critical" ? "bg-red" : level === "Warning" ? "bg-amber" : "bg-primary";
  return <span className={`mt-1 inline-block size-2 shrink-0 rounded-full ${c}`} />;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    normal: "bg-green/10 text-green border-green/25",
    warning: "bg-amber/10 text-amber border-amber/30",
    critical: "bg-red/10 text-red border-red/30",
    Open: "bg-primary/10 text-primary border-primary/25",
    Assigned: "bg-violet/10 text-violet border-violet/25",
    Converted: "bg-green/10 text-green border-green/25",
    "In review": "bg-amber/10 text-amber border-amber/25",
    Validated: "bg-primary/10 text-primary border-primary/25",
    Approved: "bg-violet/10 text-violet border-violet/25",
    "In Progress": "bg-amber/10 text-amber border-amber/25",
    Implemented: "bg-primary/10 text-primary border-primary/25",
    Verification: "bg-amber/10 text-amber border-amber/25",
    "Verified Saving": "bg-green/10 text-green border-green/25",
    "Persistence Monitoring": "bg-green/10 text-green border-green/25",
  };
  const cls = map[status] || "bg-surface-2 text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.09em] ${cls}`}>
      {status}
    </span>
  );
}
