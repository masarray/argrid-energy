import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Factory,
  Gauge,
  Leaf,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { opportunities, fmtIDR, fmtNum } from "@/lib/argrid-data";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/opportunities")({
  component: Opportunities,
  head: () => ({
    meta: [
      { title: "Opportunities — ArGrid" },
      { name: "description", content: "Prioritized energy opportunities with evidence, ownership, payback, and action workflow." },
      { property: "og:title", content: "ArGrid Opportunity Center" },
      { property: "og:description", content: "Convert detected waste and electrical risk into accountable, verifiable action." },
    ],
  }),
});

const lenses = ["Cost", "Energy", "Carbon", "Reliability", "Production risk"] as const;
type Lens = (typeof lenses)[number];

type Opportunity = (typeof opportunities)[number];

function lensValue(opportunity: Opportunity, lens: Lens, scale: number) {
  const energyKWh = (opportunity.annualSaving / 1200) * scale;
  if (lens === "Energy") return `${fmtNum(energyKWh)} kWh/yr`;
  if (lens === "Carbon") return `${fmtNum(energyKWh * 0.00075, 1)} tCO₂e/yr`;
  if (lens === "Reliability") return opportunity.urgency === "P1" ? "High risk reduction" : "Moderate risk reduction";
  if (lens === "Production risk") return opportunity.urgency === "P1" ? "18–26 h/yr exposure" : "6–14 h/yr exposure";
  return fmtIDR(opportunity.annualSaving * scale);
}

function Opportunities() {
  const { site, scenario } = useDemoSimulation();
  const [selectedId, setSelectedId] = useState(opportunities[0].id);
  const [lens, setLens] = useState<Lens>("Cost");
  const [search, setSearch] = useState("");
  const [confidence, setConfidence] = useState("All confidence");
  const [status, setStatus] = useState("All status");
  const [owner, setOwner] = useState("Utility Supervisor");
  const [workflowStatus, setWorkflowStatus] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const selected = opportunities.find((item) => item.id === selectedId) ?? opportunities[0];
  const total = opportunities.reduce((sum, item) => sum + item.annualSaving, 0) * site.powerScale;
  const highConfidence = opportunities.filter((item) => item.confidence === "High").reduce((sum, item) => sum + item.annualSaving, 0) * site.powerScale;
  const p1 = opportunities.filter((item) => item.urgency === "P1").length;
  const open = opportunities.filter((item) => (workflowStatus[item.id] ?? item.status) === "Open").length;

  const filtered = useMemo(
    () =>
      opportunities.filter((item) => {
        const textMatch = `${item.id} ${item.title} ${item.asset}`.toLowerCase().includes(search.trim().toLowerCase());
        const confidenceMatch = confidence === "All confidence" || item.confidence === confidence;
        const currentStatus = workflowStatus[item.id] ?? item.status;
        const statusMatch = status === "All status" || currentStatus === status;
        return textMatch && confidenceMatch && statusMatch;
      }),
    [confidence, search, status, workflowStatus],
  );

  const applyWorkflow = (nextStatus: string, message: string) => {
    setWorkflowStatus((previous) => ({ ...previous, [selected.id]: nextStatus }));
    setNotice(message);
  };

  const energyKWh = selected.annualSaving / 1200;
  const baseline = [72, 76, 74, 79, 82, 78, 81, 84, 80, 83, 86, 88];
  const actual = baseline.map((value, index) => value + (index > 5 ? 12 + (index % 3) * 3 : 3 + (index % 2) * 2));

  return (
    <AppShell title="Opportunity Center" subtitle="From detected deviation to accountable action and verified financial value">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <KpiTile label="Annualized Opportunity" value={fmtIDR(total)} tone="good" hint="identified pipeline" />
        <KpiTile label="High Confidence" value={fmtIDR(highConfidence)} tone="good" hint="evidence-ready" />
        <KpiTile label="Open Opportunities" value={String(open)} hint={`${opportunities.length} total records`} />
        <KpiTile label="Priority 1" value={String(p1)} tone="critical" hint="requires owner action" />
      </div>

      <div className="mb-3 rounded-lg border border-border bg-surface px-3 py-2.5 flex flex-wrap items-center gap-2">
        <div className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground mr-1">Opportunity value lens</div>
        <div className="flex rounded-md border border-border bg-surface-2 p-0.5">
          {lenses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLens(item)}
              className={`h-7 rounded px-2.5 text-[10px] ${lens === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[10px] text-muted-foreground">Scenario: <span className="text-foreground">{scenario.name}</span></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <Panel title="Prioritized Opportunity Register" className="xl:col-span-7" padded={false} actions={<span className="text-[10px] text-muted-foreground">sorted by financial impact · confidence · urgency</span>}>
          <div className="min-h-[50px] border-b border-border px-3 py-2 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[210px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search opportunity, asset, or ID…"
                className="h-8 w-full rounded-md border border-border bg-surface-2 pl-8 pr-3 text-[10.5px] focus:outline-none focus:border-primary/50"
              />
            </div>
            <select value={confidence} onChange={(event) => setConfidence(event.target.value)} className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[10.5px]">
              <option>All confidence</option><option>High</option><option>Medium</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[10.5px]">
              <option>All status</option><option>Open</option><option>Assigned</option><option>In review</option><option>Converted</option><option>Validated</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
                  <th className="px-3 py-2 font-normal">Priority</th>
                  <th className="py-2 font-normal">Opportunity</th>
                  <th className="py-2 font-normal">Asset</th>
                  <th className="py-2 font-normal text-right">{lens}</th>
                  <th className="py-2 font-normal text-right">Payback</th>
                  <th className="py-2 font-normal">Confidence</th>
                  <th className="px-3 py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const active = selected.id === item.id;
                  const currentStatus = workflowStatus[item.id] ?? item.status;
                  return (
                    <tr key={item.id} onClick={() => { setSelectedId(item.id); setNotice(""); }} className={`cursor-pointer hover:bg-surface-2/60 ${active ? "bg-primary/7" : ""}`}>
                      <td className="px-3 py-2.5"><span className={`inline-flex h-5 min-w-7 items-center justify-center rounded border px-1 text-[9.5px] ${item.urgency === "P1" ? "border-red/35 bg-red/10 text-red" : item.urgency === "P2" ? "border-amber/35 bg-amber/10 text-amber" : "border-border text-muted-foreground"}`}>{item.urgency}</span></td>
                      <td className="py-2.5 min-w-[220px]"><div className="font-medium leading-snug">{item.title}</div><div className="mt-0.5 text-[9px] text-muted-foreground tabular">{item.id} · detected 4 days ago</div></td>
                      <td className="py-2.5 tabular text-muted-foreground">{item.asset}</td>
                      <td className="py-2.5 text-right tabular font-medium text-green whitespace-nowrap">{lensValue(item, lens, site.powerScale)}</td>
                      <td className="py-2.5 text-right tabular">{item.payback.toFixed(1)} yr</td>
                      <td className={`py-2.5 ${item.confidence === "High" ? "text-green" : "text-amber"}`}>{item.confidence}</td>
                      <td className="px-3 py-2.5"><StatusPill status={currentStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={`${selected.id} · Opportunity Detail`} className="xl:col-span-5" padded={false} actions={<StatusPill status={workflowStatus[selected.id] ?? selected.status} />}>
          <div className="max-h-[760px] overflow-auto">
            <section className="p-4 border-b border-border">
              <div className="text-[15px] font-medium leading-snug">{selected.title}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9.5px] text-muted-foreground">
                <span className="tabular">{selected.asset}</span><span>·</span><span>{site.name}</span><span>·</span><span>Detected 21 Jul 2026</span>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <DetailMetric label="Annual value" value={fmtIDR(selected.annualSaving * site.powerScale)} tone="good" />
                <DetailMetric label="Energy waste" value={`${fmtNum(energyKWh * site.powerScale)} kWh`} />
                <DetailMetric label="Confidence" value={`${selected.confidence} · ${selected.confidence === "High" ? "91%" : "74%"}`} />
                <DetailMetric label="Payback" value={`${selected.payback.toFixed(1)} yr`} />
              </div>
            </section>

            <section className="p-4 border-b border-border">
              <div className="flex items-center gap-2 text-[11px] font-medium"><Activity className="size-3.5 text-primary" /> Why this was detected</div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">Actual interval consumption remained above the weather- and schedule-adjusted baseline for six consecutive operating periods. Meter completeness is 99.2%, and the deviation is correlated with equipment runtime rather than production output.</p>
              <div className="mt-3 rounded-md border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between text-[9.5px] text-muted-foreground"><span>Adjusted baseline vs actual</span><span className="tabular">12 intervals · +17.8%</span></div>
                <div className="mt-3 flex h-24 items-end gap-1.5">
                  {baseline.map((value, index) => (
                    <div key={index} className="flex-1 h-full flex items-end gap-[2px]">
                      <div className="w-1/2 rounded-t-sm bg-surface-3" style={{ height: `${value}%` }} title={`Baseline ${value}`} />
                      <div className={`w-1/2 rounded-t-sm ${index > 5 ? "bg-amber" : "bg-primary"}`} style={{ height: `${actual[index]}%` }} title={`Actual ${actual[index]}`} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-4 text-[9px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 bg-surface-3" /> Baseline</span><span className="flex items-center gap-1.5"><span className="size-2 bg-primary" /> Actual</span><span className="flex items-center gap-1.5"><span className="size-2 bg-amber" /> Abnormal</span></div>
              </div>
            </section>

            <section className="p-4 border-b border-border">
              <div className="flex items-center gap-2 text-[11px] font-medium"><ShieldAlert className="size-3.5 text-amber" /> Probable causes</div>
              <div className="mt-3 space-y-2">
                {[
                  { cause: selected.asset.includes("AHU") ? "Occupancy schedule and AHU command mismatch" : selected.asset.includes("COMP") ? "Compressor running unloaded or distribution leakage" : "Equipment sequencing outside efficient operating range", confidence: "82%", evidence: "Runtime and schedule correlation" },
                  { cause: "Control setpoint drift", confidence: "61%", evidence: "Deviation increased after last maintenance" },
                  { cause: "Meter scaling or data substitution", confidence: "12%", evidence: "Low probability · data quality GOOD" },
                ].map((cause, index) => (
                  <div key={cause.cause} className="rounded-md border border-border bg-surface-2 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2"><span className="text-[10.5px] font-medium"><span className="mr-2 text-muted-foreground">{index + 1}</span>{cause.cause}</span><span className="text-[9.5px] tabular text-primary">{cause.confidence}</span></div>
                    <div className="mt-1 text-[9.5px] text-muted-foreground">{cause.evidence}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-4 border-b border-border">
              <div className="flex items-center gap-2 text-[11px] font-medium"><CheckCircle2 className="size-3.5 text-green" /> Recommended validation</div>
              <div className="mt-3 grid sm:grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                <span className="rounded-md border border-border bg-surface-2 px-3 py-2">Confirm interval-meter completeness</span>
                <span className="rounded-md border border-border bg-surface-2 px-3 py-2">Review production and occupancy schedule</span>
                <span className="rounded-md border border-border bg-surface-2 px-3 py-2">Inspect equipment command and runtime</span>
                <span className="rounded-md border border-border bg-surface-2 px-3 py-2">Validate avoided-cost assumption</span>
              </div>
            </section>

            <section className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium"><UserRound className="size-3.5 text-primary" /> Workflow & ownership</div>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                <label className="text-[9.5px] text-muted-foreground">Owner
                  <select value={owner} onChange={(event) => setOwner(event.target.value)} className="mt-1 h-8 w-full rounded-md border border-border bg-surface-2 px-2 text-[10.5px] text-foreground">
                    <option>Utility Supervisor</option><option>Energy Manager</option><option>Maintenance Lead</option><option>Production Manager</option>
                  </select>
                </label>
                <label className="text-[9.5px] text-muted-foreground">Due date
                  <div className="mt-1 h-8 rounded-md border border-border bg-surface-2 px-2 flex items-center gap-2 text-[10.5px] text-foreground"><CalendarClock className="size-3.5 text-muted-foreground" /> 31 Jul 2026</div>
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => applyWorkflow("Validated", `${selected.id} validated by Energy Manager. Measurement plan is now required.`)} className="h-8 rounded-md border border-border text-[10.5px] font-medium hover:bg-surface-2 flex items-center justify-center gap-1.5"><BadgeCheck className="size-3.5" /> Validate</button>
                <button type="button" onClick={() => applyWorkflow("Assigned", `${selected.id} assigned to ${owner}. Due date: 31 Jul 2026.`)} className="h-8 rounded-md border border-border text-[10.5px] font-medium hover:bg-surface-2 flex items-center justify-center gap-1.5"><UserRound className="size-3.5" /> Assign</button>
                <button type="button" onClick={() => applyWorkflow("Converted", `Work order WO-AG-2041 prepared from ${selected.id}. No external CMMS command was sent.`)} className="h-8 rounded-md bg-primary text-primary-foreground text-[10.5px] font-medium flex items-center justify-center gap-1.5"><Factory className="size-3.5" /> Convert to work order</button>
                <button type="button" onClick={() => applyWorkflow("In review", `${selected.id} moved to review with a false-positive validation requirement.`)} className="h-8 rounded-md border border-border text-[10.5px] font-medium hover:bg-surface-2 flex items-center justify-center gap-1.5"><Gauge className="size-3.5" /> Request review</button>
              </div>
              {notice && <div className="mt-3 rounded-md border border-green/25 bg-green/10 px-3 py-2.5 text-[10px] text-green">{notice}</div>}
              <div className="mt-3 text-[9.5px] text-muted-foreground">Simulation mode · workflow state is local to this browser session.</div>
            </section>
          </div>
        </Panel>

        <div className="xl:col-span-12 grid md:grid-cols-4 gap-3">
          <ValueCard icon={CircleDollarSign} label="Avoidable cost" value={fmtIDR(selected.annualSaving * site.powerScale)} detail="annualized" />
          <ValueCard icon={Activity} label="Wasted energy" value={`${fmtNum(energyKWh * site.powerScale)} kWh`} detail="annual estimate" />
          <ValueCard icon={Leaf} label="Avoided carbon" value={`${fmtNum(energyKWh * site.powerScale * 0.00075, 1)} tCO₂e`} detail="scope 2 estimate" />
          <ValueCard icon={Factory} label="Production exposure" value={selected.urgency === "P1" ? "18–26 h" : "6–14 h"} detail="risk-equivalent per year" />
        </div>
      </div>
    </AppShell>
  );
}

function DetailMetric({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-2.5 py-2">
      <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-[10.5px] font-medium tabular ${tone === "good" ? "text-green" : ""}`}>{value}</div>
    </div>
  );
}

function ValueCard({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-center gap-3">
      <div className="size-8 rounded-md border border-primary/20 bg-primary/8 flex items-center justify-center text-primary"><Icon className="size-4" /></div>
      <div><div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-0.5 text-[13px] font-medium tabular">{value}</div><div className="text-[9px] text-muted-foreground">{detail}</div></div>
    </div>
  );
}
