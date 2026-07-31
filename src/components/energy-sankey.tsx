import { useMemo, useState } from "react";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import type { SankeyLink, SankeyMode, SankeyModel, SankeyNode } from "@/lib/energy-visualization";

type EnergySankeyProps = {
  model: SankeyModel;
  mode: SankeyMode;
  className?: string;
};

type LayoutNode = SankeyNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};

const nodeLayout: Record<string, Omit<LayoutNode, keyof SankeyNode>> = {
  grid: { x: 36, y: 42, width: 156, height: 62 },
  solar: { x: 36, y: 154, width: 156, height: 62 },
  generator: { x: 36, y: 266, width: 156, height: 62 },
  "main-bus": { x: 357, y: 136, width: 160, height: 118 },
  production: { x: 694, y: 10, width: 192, height: 58 },
  hvac: { x: 694, y: 86, width: 192, height: 58 },
  "compressed-air": { x: 694, y: 162, width: 192, height: 58 },
  utilities: { x: 694, y: 238, width: 192, height: 58 },
  "tenant-support": { x: 694, y: 314, width: 192, height: 58 },
  losses: { x: 694, y: 390, width: 192, height: 58 },
};

function modeValue(link: SankeyLink, mode: SankeyMode) {
  if (mode === "cost") return `${fmtIDR(link.costPerHourIDR)}/h`;
  if (mode === "carbon") return `${link.carbonTPerHour.toFixed(2)} tCO₂e/h`;
  return `${fmtNum(link.valueKW)} kW`;
}

function nodeMetric(node: LayoutNode, relatedLinks: SankeyLink[], mode: SankeyMode) {
  const isSource = node.category === "source";
  const isBus = node.category === "distribution";
  const links = isSource ? relatedLinks.filter((link) => link.source === node.id) : relatedLinks.filter((link) => link.target === node.id);
  if (isBus) {
    const incoming = relatedLinks.filter((link) => link.target === node.id);
    if (mode === "cost") return `${fmtIDR(incoming.reduce((sum, link) => sum + link.costPerHourIDR, 0))}/h`;
    if (mode === "carbon") return `${incoming.reduce((sum, link) => sum + link.carbonTPerHour, 0).toFixed(2)} tCO₂e/h`;
    return `${fmtNum(incoming.reduce((sum, link) => sum + link.valueKW, 0))} kW`;
  }
  if (mode === "cost") return `${fmtIDR(links.reduce((sum, link) => sum + link.costPerHourIDR, 0))}/h`;
  if (mode === "carbon") return `${links.reduce((sum, link) => sum + link.carbonTPerHour, 0).toFixed(2)} tCO₂e/h`;
  return `${fmtNum(links.reduce((sum, link) => sum + link.valueKW, 0))} kW`;
}

function linkWidth(valueKW: number, maxValue: number) {
  return 8 + (valueKW / Math.max(1, maxValue)) * 34;
}

function labelForCategory(category: SankeyNode["category"]) {
  if (category === "source") return "SOURCE";
  if (category === "distribution") return "DISTRIBUTION";
  if (category === "loss") return "LOSS";
  return "CONSUMER";
}

export function EnergySankey({ model, mode, className = "" }: EnergySankeyProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const layoutNodes = useMemo(
    () => model.nodes.map((node) => ({ ...node, ...nodeLayout[node.id] })) as LayoutNode[],
    [model.nodes],
  );
  const maxValue = Math.max(...model.links.map((link) => link.valueKW));

  const related = (link: SankeyLink) => !focusId || link.source === focusId || link.target === focusId;
  const nodeRelated = (node: LayoutNode) =>
    !focusId ||
    node.id === focusId ||
    model.links.some((link) =>
      (link.source === node.id && link.target === focusId) || (link.target === node.id && link.source === focusId),
    );

  return (
    <div
      className={`overflow-x-auto rounded-md border border-border bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-surface-2)_72%,transparent),var(--color-surface))] ${className}`}
      role="region"
      aria-label="Energy Sankey diagram"
      tabIndex={0}
    >
      <svg
        viewBox="0 0 920 470"
        className="min-w-[920px] w-full"
        role="img"
        aria-labelledby="argrid-sankey-title argrid-sankey-description"
      >
        <title id="argrid-sankey-title">ArGrid energy flow Sankey</title>
        <desc id="argrid-sankey-description">
          Energy flows from utility grid, solar PV, and generator through the main distribution bus to production, HVAC, compressed air, utilities, tenant support, and distribution losses. Flow width is proportional to energy.
        </desc>
        <defs>
          <filter id="sankey-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
          </filter>
        </defs>

        {model.links.map((link) => {
          const source = layoutNodes.find((node) => node.id === link.source);
          const target = layoutNodes.find((node) => node.id === link.target);
          if (!source || !target) return null;
          const x1 = source.x + source.width;
          const y1 = source.y + source.height / 2;
          const x2 = target.x;
          const y2 = target.y + target.height / 2;
          const c1 = x1 + (x2 - x1) * 0.42;
          const c2 = x1 + (x2 - x1) * 0.58;
          const active = related(link);
          const width = linkWidth(link.valueKW, maxValue);
          return (
            <g key={`${link.source}-${link.target}`}>
              <path
                d={`M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={link.color}
                strokeOpacity={active ? 0.58 : 0.12}
                strokeLinecap="round"
                strokeWidth={width}
                className="transition-opacity duration-150"
                onMouseEnter={() => setFocusId(link.target)}
                onMouseLeave={() => setFocusId(null)}
              >
                <title>{`${link.label}: ${modeValue(link, mode)} · ${link.quality}`}</title>
              </path>
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - width * 0.24}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="var(--color-muted-foreground)"
                opacity={active ? 0.96 : 0.26}
              >
                {modeValue(link, mode)}
              </text>
            </g>
          );
        })}

        {layoutNodes.map((node) => {
          const active = nodeRelated(node);
          const relatedLinks = model.links.filter((link) => link.source === node.id || link.target === node.id);
          return (
            <g
              key={node.id}
              opacity={active ? 1 : 0.5}
              onMouseEnter={() => setFocusId(node.id)}
              onMouseLeave={() => setFocusId(null)}
              filter="url(#sankey-soft-shadow)"
            >
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={10}
                fill={node.category === "distribution" ? "var(--color-surface-3)" : "var(--color-surface)"}
                stroke={node.color}
                strokeOpacity={0.7}
                strokeWidth={1.25}
              />
              <rect x={node.x + 11} y={node.y + 11} width={7} height={node.height - 22} rx={3.5} fill={node.color} opacity={0.82} />
              <text x={node.x + 28} y={node.y + 20} fontSize="9" letterSpacing="1.2" fill="var(--color-muted-foreground)">
                {labelForCategory(node.category)}
              </text>
              <text x={node.x + 28} y={node.y + 39} fontSize="13" fontWeight="650" fill="var(--color-foreground)">
                {node.label}
              </text>
              <text x={node.x + 28} y={node.y + node.height - 10} fontSize="11" fontWeight="600" fill="var(--color-foreground)">
                {nodeMetric(node, relatedLinks, mode)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
