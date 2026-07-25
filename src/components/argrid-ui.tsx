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
    <div className={`panel flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 h-11 border-b border-border">
          <div className="text-[12px] font-medium tracking-tight text-foreground/90">{title}</div>
          {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div className={`flex-1 min-h-0 ${padded ? "p-4" : ""}`}>{children}</div>
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
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  hint?: string;
  tone?: "neutral" | "warning" | "critical" | "good";
}) {
  const toneRing = {
    neutral: "",
    warning: "border-l-2 border-l-amber",
    critical: "border-l-2 border-l-red",
    good: "border-l-2 border-l-green",
  }[tone];

  return (
    <div className={`panel px-4 py-3 ${toneRing}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-display text-[26px] font-medium tabular leading-none tracking-tight">
          {value}
        </span>
        {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        {typeof trend === "number" && (
          <span className={`tabular ${trend < 0 ? "text-green" : trend > 0 ? "text-amber" : ""}`}>
            {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  );
}

export function SeverityDot({ level }: { level: "Critical" | "Warning" | "Info" | string }) {
  const c =
    level === "Critical" ? "bg-red" : level === "Warning" ? "bg-amber" : "bg-primary";
  return <span className={`inline-block size-2 rounded-full ${c}`} />;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    normal: "bg-green/15 text-green border-green/25",
    warning: "bg-amber/15 text-amber border-amber/30",
    critical: "bg-red/15 text-red border-red/30",
    Open: "bg-primary/15 text-primary border-primary/25",
    Assigned: "bg-violet/15 text-violet border-violet/25",
    Converted: "bg-green/15 text-green border-green/25",
    "In review": "bg-amber/15 text-amber border-amber/25",
  };
  const cls = map[status] || "bg-surface-2 text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}
