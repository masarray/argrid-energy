import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  padded = true,
  busy = false,
  variant = "standard",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  busy?: boolean;
  variant?: "primary" | "standard" | "quiet";
}) {
  return (
    <section className={`panel panel-variant-${variant} flex min-w-0 flex-col overflow-hidden ${className}`} aria-busy={busy || undefined}>
      {(title || description || actions) && (
        <header className="panel-header flex min-h-10 items-start justify-between gap-3 border-b border-border px-4 py-2.5">
<div className="min-w-0">
  {title && <h2 className="truncate text-[11.5px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>}
  {description && <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground">{description}</p>}
</div>
{actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${padded ? "p-4" : ""}`}>{children}</div>
    </section>
  );
}

export function ChartLegend({
  items,
  unit,
  note,
}: {
  items: Array<{ label: string; color: string; dashed?: boolean; muted?: boolean }>;
  unit?: string;
  note?: string;
}) {
  const accessibleLabel = [unit ? `Unit ${unit}` : "", ...items.map((item) => item.label), note ?? ""].filter(Boolean).join(", ");
  return (
    <div className="chart-legend" aria-label={accessibleLabel}>
      {unit && <span className="chart-legend-unit">{unit}</span>}
      {items.map((item) => (
        <span key={item.label} className={`chart-legend-item ${item.muted ? "is-muted" : ""}`}>
          <span
            className={`chart-legend-swatch ${item.dashed ? "is-dashed" : ""}`}
            style={{ backgroundColor: item.dashed ? "transparent" : item.color, borderTopColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
      {note && <span className="chart-legend-note">{note}</span>}
    </div>
  );
}

export function KpiTile({
  label,
  value,
  unit,
  trend,
  hint,
  tone = "neutral",
  emphasis = "support",
  progress,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  hint?: string;
  tone?: "neutral" | "warning" | "critical" | "good";
  emphasis?: "primary" | "support";
  progress?: number;
}) {
  const toneClass = {
    neutral: "kpi-neutral",
    warning: "kpi-warning",
    critical: "kpi-critical",
    good: "kpi-good",
  }[tone];
  const stateLabel = {
    neutral: "normal",
    warning: "warning",
    critical: "critical",
    good: "good",
  }[tone];

  return (
    <section className={`kpi-tile kpi-emphasis-${emphasis} ${toneClass}`} aria-label={`${label}: ${value}${unit ? ` ${unit}` : ""}. State ${stateLabel}${hint ? `. ${hint}` : ""}${typeof progress === "number" ? `. ${Math.round(progress)} percent of reference` : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9.5px] font-medium uppercase tracking-[0.11em] text-muted-foreground">{label}</div>
        <span className="kpi-state-dot" aria-hidden="true" />
      </div>
      <div className="mt-2 flex min-w-0 items-baseline gap-1.5">
        <span className="kpi-value font-display truncate text-[22px] font-medium leading-none tracking-[-0.035em] tabular">{value}</span>
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
      {typeof progress === "number" && (
        <div className="kpi-progress-track" aria-hidden="true">
          <span style={{ width: `${Math.max(3, Math.min(100, progress))}%` }} />
        </div>
      )}
    </section>
  );
}

export function WorkspaceState({
  eyebrow,
  title,
  description,
  action,
  tone = "neutral",
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "warning" | "critical";
  compact?: boolean;
}) {
  const toneClass = tone === "critical" ? "workspace-state-critical" : tone === "warning" ? "workspace-state-warning" : "workspace-state-neutral";
  return (
    <section className={`workspace-state ${toneClass} ${compact ? "workspace-state-compact" : ""}`} role={tone === "critical" ? "alert" : "status"}>
      <span className="workspace-state-mark" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</div>}
        <h2 className="mt-1 text-[13px] font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </section>
  );
}

export function SkeletonBlock({ className = "h-20" }: { className?: string }) {
  return <div className={`skeleton-block ${className}`} aria-hidden="true" />;
}

export function SeverityDot({ level }: { level: "Critical" | "Warning" | "Info" | string }) {
  const c = level === "Critical" ? "bg-red" : level === "Warning" ? "bg-amber" : "bg-primary";
  return <span className={`mt-1 inline-block size-2 shrink-0 rounded-full ${c}`} aria-hidden="true" />;
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
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.09em] ${cls}`}>{status}</span>;
}
