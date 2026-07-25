import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileCheck2,
  History,
  LockKeyhole,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, StatusPill } from "@/components/argrid-ui";
import { fmtIDR, fmtNum } from "@/lib/argrid-data";
import {
  BOARD_STAGES,
  boardStage,
  calculateVerification,
  evaluateVerificationGate,
  getActionRecords,
  getExecutiveFunnel,
  getNextStage,
  getPersistenceRecords,
  getSavingsLedger,
  getVerificationSeries,
  type ActionRecord,
  type ActionStage,
  type BoardStage,
  type PersistenceState,
} from "@/lib/actions-savings";
import { useDemoSimulation } from "@/lib/demo-simulation";

export const Route = createFileRoute("/savings")({
  component: ActionsAndSavings,
  head: () => ({
    meta: [
      { title: "Actions & Savings — ArGrid" },
      {
        name: "description",
        content: "Industrial action workflow, M&V-aligned savings verification, auditable ledger, and persistence monitoring.",
      },
      { property: "og:title", content: "ArGrid Actions & Savings" },
      {
        property: "og:description",
        content: "Move from detected opportunity to reviewed and persistent verified value.",
      },
    ],
  }),
});

const tabs = ["Action Board", "Verification", "Savings Ledger", "Persistence"] as const;
type Tab = (typeof tabs)[number];

const chartAxis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: 6,
    color: "var(--color-foreground)",
    fontSize: 11,
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 10 },
};

function riskClass(risk: ActionRecord["currentRisk"]) {
  if (risk === "High") return "border-red/30 bg-red/8 text-red";
  if (risk === "Medium") return "border-amber/30 bg-amber/8 text-amber";
  return "border-border bg-surface-2 text-muted-foreground";
}

function persistenceClass(state: PersistenceState) {
  if (state === "At risk") return "border-red/30 bg-red/8 text-red";
  if (state === "Watch") return "border-amber/30 bg-amber/8 text-amber";
  return "border-green/30 bg-green/8 text-green";
}

function nextStageLabel(next: ActionStage | null) {
  if (!next) return "Workflow complete";
  const labels: Record<ActionStage, string> = {
    Validated: "Validate",
    Approved: "Approve",
    Assigned: "Assign owner",
    "In Progress": "Start work",
    Implemented: "Record implementation",
    Verification: "Submit for verification",
    "Verified Saving": "Approve verified saving",
    "Persistence Monitoring": "Start persistence monitoring",
  };
  return labels[next];
}

function ActionsAndSavings() {
  const { site } = useDemoSimulation();
  const [activeTab, setActiveTab] = useState<Tab>("Action Board");
  const [selectedId, setSelectedId] = useState("ACT-2036");
  const [verificationId, setVerificationId] = useState("ACT-2036");
  const [persistenceId, setPersistenceId] = useState("PER-2022");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [stageOverrides, setStageOverrides] = useState<Record<string, ActionStage>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("argrid-action-stage-overrides") ?? "{}") as Record<string, ActionStage>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    window.localStorage.setItem("argrid-action-stage-overrides", JSON.stringify(stageOverrides));
  }, [stageOverrides]);

  const actions = useMemo(
    () =>
      getActionRecords(site.name, site.powerScale).map((action) => ({
        ...action,
        stage: stageOverrides[action.id] ?? action.stage,
      })),
    [site.name, site.powerScale, stageOverrides],
  );
  const baseLedger = useMemo(() => getSavingsLedger(site.name, site.powerScale), [site.name, site.powerScale]);
  const persistence = useMemo(() => getPersistenceRecords(site.powerScale), [site.powerScale]);

  const selected = actions.find((action) => action.id === selectedId) ?? actions[0];
  const verificationCandidates = actions.filter((action) => action.verification !== null);
  const verificationAction = verificationCandidates.find((action) => action.id === verificationId) ?? verificationCandidates[0];
  const verificationPlan = verificationAction.verification;
  const gate = evaluateVerificationGate(verificationPlan);
  const verificationResult = verificationPlan ? calculateVerification(verificationPlan) : null;
  const verificationSeries = useMemo(
    () => getVerificationSeries(verificationAction.id, site.powerScale),
    [site.powerScale, verificationAction.id],
  );
  const selectedPersistence = persistence.find((record) => record.id === persistenceId) ?? persistence[0];
  const persistenceSeries = selectedPersistence.months.map((month, index) => ({
    month,
    expected: 100,
    realized: selectedPersistence.monthlyPerformancePct[index],
    threshold: selectedPersistence.thresholdPct,
  }));

  const chillerAction = actions.find((action) => action.id === "ACT-2036");
  const chillerPlan = chillerAction?.verification ?? null;
  const chillerResult = chillerPlan ? calculateVerification(chillerPlan) : null;
  const chillerApproved = chillerAction?.stage === "Verified Saving" || chillerAction?.stage === "Persistence Monitoring";
  const ledger = useMemo(() => {
    if (!chillerApproved || !chillerPlan || !chillerResult) return baseLedger;
    return [
      {
        id: "SVG-2036",
        initiative: "Chiller sequencing optimization",
        site: site.name,
        savingType: "Energy" as const,
        verifiedEnergyKWh: chillerResult.annualizedEnergyKWh,
        verifiedCostIDR: chillerResult.annualizedCostIDR,
        avoidedEmissionsTco2e: chillerResult.avoidedEmissionsTco2e,
        implementationCostIDR: chillerAction?.actualImplementationCostIDR ?? 0,
        paybackYears:
          chillerResult.annualizedCostIDR > 0
            ? (chillerAction?.actualImplementationCostIDR ?? 0) / chillerResult.annualizedCostIDR
            : 0,
        verificationConfidencePct: 91,
        verificationMethod: `${chillerPlan.option} · system-level metering`,
        persistenceState: "Stable" as const,
        atRiskIDR: 0,
      },
      ...baseLedger,
    ];
  }, [baseLedger, chillerAction?.actualImplementationCostIDR, chillerApproved, chillerPlan, chillerResult, site.name]);

  const ledgerTotals = ledger.reduce(
    (totals, record) => ({
      energyKWh: totals.energyKWh + record.verifiedEnergyKWh,
      costIDR: totals.costIDR + record.verifiedCostIDR,
      emissionsTco2e: totals.emissionsTco2e + record.avoidedEmissionsTco2e,
      implementationIDR: totals.implementationIDR + record.implementationCostIDR,
      atRiskIDR: totals.atRiskIDR + record.atRiskIDR,
    }),
    { energyKWh: 0, costIDR: 0, emissionsTco2e: 0, implementationIDR: 0, atRiskIDR: 0 },
  );

  const funnel = useMemo(
    () =>
      getExecutiveFunnel(site.powerScale).map((stage) =>
        stage.stage === "Verified"
          ? { ...stage, count: ledger.length, valueIDR: ledgerTotals.costIDR }
          : stage,
      ),
    [ledger.length, ledgerTotals.costIDR, site.powerScale],
  );

  const boardGroups = useMemo(
    () =>
      BOARD_STAGES.reduce<Record<BoardStage, ActionRecord[]>>(
        (groups, stage) => {
          groups[stage] = actions.filter((action) => boardStage(action.stage) === stage);
          return groups;
        },
        {
          Validated: [],
          Approved: [],
          "In Progress": [],
          Implemented: [],
          Verification: [],
          Verified: [],
        },
      ),
    [actions],
  );

  const advanceSelected = () => {
    const next = getNextStage(selected.stage);
    if (!next) return;
    if (next === "Verified Saving") {
      const selectedGate = evaluateVerificationGate(selected.verification);
      if (!selectedGate.eligible) {
        setMessage("Verification is blocked. Resolve the failed M&V checks before approving a verified saving.");
        return;
      }
    }
    setStageOverrides((current) => ({ ...current, [selected.id]: next }));
    setMessage(`${selected.id} advanced to ${next}. Demo audit entry stored locally.`);
  };

  const approveVerification = () => {
    if (!gate.eligible || !reviewConfirmed) return;
    setStageOverrides((current) => ({ ...current, [verificationAction.id]: "Verified Saving" }));
    setMessage(`${verificationAction.id} approved as Verified Saving after reviewer confirmation.`);
  };

  return (
    <AppShell
      title="Actions & Savings"
      subtitle="Controlled action workflow, M&V-aligned verification, auditable value, and persistence monitoring"
      toolbar={
        <div className="h-8 px-2.5 rounded-md border border-border bg-surface flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-green" /> M&V-aligned demo · not a certified savings guarantee
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
        <KpiTile label="Identified Value" value={fmtIDR(funnel[0].valueIDR)} hint={`${funnel[0].count} opportunities`} />
        <KpiTile label="Approved Value" value={fmtIDR(funnel[2].valueIDR)} hint={`${funnel[2].count} approved initiatives`} />
        <KpiTile label="Implemented Value" value={fmtIDR(funnel[3].valueIDR)} hint={`${funnel[3].count} implemented`} />
        <KpiTile label="Verified Value" value={fmtIDR(ledgerTotals.costIDR)} hint={`${ledger.length} ledger records`} tone="good" />
        <KpiTile label="Savings at Risk" value={fmtIDR(ledgerTotals.atRiskIDR)} hint="persistence review required" tone="critical" />
      </div>

      <Panel title="Executive Value Funnel" className="mb-3" actions={<span className="text-[10px] text-muted-foreground">annualized value · stage conversion</span>}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {funnel.map((stage, index) => {
            const conversion = index === 0 ? 100 : (stage.valueIDR / funnel[0].valueIDR) * 100;
            return (
              <div key={stage.stage} className="relative rounded-md border border-border bg-surface-2 p-3 min-w-0">
                <div className="text-[9.5px] uppercase tracking-[0.13em] text-muted-foreground">{stage.stage}</div>
                <div className="mt-1 text-[16px] font-medium tabular">{fmtIDR(stage.valueIDR)}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{stage.count} records</span>
                  <span className="tabular">{conversion.toFixed(0)}%</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-surface-3 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${conversion}%` }} />
                </div>
                {index < funnel.length - 1 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground z-10" />}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mb-3 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setMessage("");
            }}
            className={`h-8 rounded-md px-3 text-[11px] font-medium ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}
          >
            {tab}
          </button>
        ))}
        <span className="ml-auto hidden lg:inline text-[9.5px] text-muted-foreground pr-2">Measured and estimated values remain visually and logically separated.</span>
      </div>

      {message && (
        <div className="mb-3 rounded-md border border-primary/25 bg-primary/8 px-3 py-2 text-[10.5px] flex items-center gap-2">
          <History className="size-3.5 text-primary" /> {message}
        </div>
      )}

      {activeTab === "Action Board" && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-3">
          <Panel title="Action Workflow Board" actions={<span className="text-[10px] text-muted-foreground">owner-controlled transitions · local demo persistence</span>}>
            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-6 gap-2 min-w-[1160px]">
                {BOARD_STAGES.map((stage) => (
                  <section key={stage} className="rounded-md border border-border bg-background/40 min-h-[430px]">
                    <div className="h-9 px-2.5 border-b border-border flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{stage}</span>
                      <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-[9.5px] tabular">{boardGroups[stage].length}</span>
                    </div>
                    <div className="p-2 space-y-2">
                      {boardGroups[stage].map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => setSelectedId(action.id)}
                          className={`w-full rounded-md border p-2.5 text-left transition-colors ${selected.id === action.id ? "border-primary bg-primary/8" : "border-border bg-surface hover:border-border-strong"}`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[9.5px] text-muted-foreground">
                            <span className="tabular">{action.id}</span>
                            <span className={`rounded border px-1.5 py-0.5 ${riskClass(action.currentRisk)}`}>{action.currentRisk}</span>
                          </div>
                          <div className="mt-2 text-[11.5px] font-medium leading-snug">{action.title}</div>
                          <div className="mt-1 text-[9.5px] text-muted-foreground tabular">{action.asset}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[9.5px]">
                            <div><span className="block text-muted-foreground">Owner</span><span className="block mt-0.5 truncate">{action.owner}</span></div>
                            <div className="text-right"><span className="block text-muted-foreground">Due</span><span className="block mt-0.5 tabular">{action.dueDate.slice(5)}</span></div>
                          </div>
                          <div className="mt-2 text-[10.5px] text-green tabular">{fmtIDR(action.estimatedSavingIDR)}/yr</div>
                          <div className="mt-2 h-1 rounded-full bg-surface-3 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${action.progressPct}%` }} /></div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title={`${selected.id} · Action record`} actions={<StatusPill status={selected.stage} />}>
            <div className="space-y-4 text-[11px]">
              <div>
                <div className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">Problem statement</div>
                <p className="mt-1 leading-relaxed">{selected.problemStatement}</p>
              </div>
              <div>
                <div className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">Corrective action</div>
                <p className="mt-1 leading-relaxed text-muted-foreground">{selected.correctiveAction}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Info label="Owner" value={selected.owner} />
                <Info label="Supporting team" value={selected.supportingTeam} />
                <Info label="Target completion" value={selected.dueDate} />
                <Info label="Work order" value={selected.workOrder ?? "Not issued"} />
                <Info label="Estimated capex" value={fmtIDR(selected.estimatedCapexIDR)} />
                <Info label="Actual cost" value={selected.actualImplementationCostIDR === null ? "Pending" : fmtIDR(selected.actualImplementationCostIDR)} />
              </div>
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="flex items-center gap-2 font-medium"><ClipboardCheck className="size-4 text-primary" /> Verification readiness</div>
                <div className="mt-2 text-muted-foreground leading-relaxed">
                  {selected.verification ? `${selected.verification.option} · ${selected.verification.methodLabel}` : "M&V plan must be assigned before implementation close-out."}
                </div>
              </div>
              <button
                type="button"
                onClick={advanceSelected}
                disabled={getNextStage(selected.stage) === null}
                className="w-full h-9 rounded-md bg-primary text-primary-foreground text-[11px] font-medium disabled:opacity-40"
              >
                {nextStageLabel(getNextStage(selected.stage))}
              </button>
              <div className="text-[9.5px] leading-relaxed text-muted-foreground">Workflow changes are persisted in this browser for demonstration. Production deployment requires RBAC, approval separation, and an immutable audit log.</div>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "Verification" && verificationPlan && verificationResult && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <Panel title="Action and M&V Method" className="xl:col-span-4">
            <div className="mb-3 grid grid-cols-2 gap-2">
              {verificationCandidates.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    setVerificationId(action.id);
                    setReviewConfirmed(false);
                    setMessage("");
                  }}
                  className={`rounded-md border p-2 text-left ${verificationAction.id === action.id ? "border-primary bg-primary/8" : "border-border bg-surface-2"}`}
                >
                  <span className="block text-[9.5px] text-muted-foreground tabular">{action.id}</span>
                  <span className="mt-0.5 block text-[10.5px] font-medium leading-snug">{action.title}</span>
                </button>
              ))}
            </div>
            <div className="space-y-3 text-[10.5px]">
              <Info label="M&V option" value={`${verificationPlan.option} — ${verificationPlan.methodLabel}`} />
              <Info label="Measurement boundary" value={verificationPlan.measurementBoundary} />
              <Info label="Meter / source" value={verificationPlan.meter} />
              <div className="grid grid-cols-2 gap-3"><Info label="Baseline period" value={verificationPlan.baselinePeriod} /><Info label="Reporting period" value={verificationPlan.reportingPeriod} /></div>
              <div className="grid grid-cols-2 gap-3"><Info label="Data completeness" value={`${verificationPlan.dataCompletenessPct.toFixed(1)}%`} /><Info label="Quality" value={verificationPlan.quality} /></div>
              <div className="grid grid-cols-3 gap-2"><Info label="R²" value={verificationPlan.modelR2.toFixed(2)} /><Info label="CV(RMSE)" value={`${verificationPlan.cvRmsePct.toFixed(1)}%`} /><Info label="NMBE" value={`${verificationPlan.nmbePct.toFixed(1)}%`} /></div>
              <div className="rounded-md border border-border bg-surface-2 p-3">
                <div className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">Normalization variables</div>
                <div className="mt-2 space-y-2">
                  {verificationPlan.variables.map((variable) => (
                    <div key={variable.name} className="grid grid-cols-[1fr_auto] gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
                      <div><div>{variable.name}</div><div className="text-[9.5px] text-muted-foreground">{variable.baselineValue} → {variable.reportingValue}</div></div>
                      <span className="tabular text-primary">{variable.adjustmentKWh >= 0 ? "+" : ""}{fmtNum(variable.adjustmentKWh)} kWh</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Adjusted Baseline vs Reporting Period" className="xl:col-span-8 h-[470px]" actions={<span className="text-[10px] text-muted-foreground">kWh/day · reporting-condition normalization</span>}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={verificationSeries} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                <defs><linearGradient id="savingGap" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-green)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--color-green)" stopOpacity={0.01} /></linearGradient></defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="day" {...chartAxis} />
                <YAxis {...chartAxis} width={54} />
                <Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [`${fmtNum(Number(value))} kWh`, name === "adjustedBaseline" ? "Adjusted baseline" : "Actual"]} />
                <Area type="monotone" dataKey="adjustedBaseline" name="adjustedBaseline" stroke="var(--color-primary)" strokeWidth={1.7} fill="url(#savingGap)" />
                <Line type="monotone" dataKey="actual" name="actual" stroke="var(--color-green)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Calculation Trace" className="xl:col-span-7">
            <div className="overflow-x-auto"><table className="w-full text-[11px] min-w-[620px]"><thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"><th className="py-2 font-normal">Step</th><th className="py-2 font-normal">Source / reason</th><th className="py-2 font-normal text-right">Value</th></tr></thead><tbody className="divide-y divide-border">
              <TraceRow label="Baseline model" source="Frozen baseline model" value={`${fmtNum(verificationPlan.baselineModelKWh)} kWh`} />
              <TraceRow label="Routine adjustment" source="Production and weather normalization" value={`${verificationPlan.routineAdjustmentKWh >= 0 ? "+" : ""}${fmtNum(verificationPlan.routineAdjustmentKWh)} kWh`} />
              <TraceRow label="Non-routine adjustment" source="Documented boundary / operating change" value={`${verificationPlan.nonRoutineAdjustmentKWh >= 0 ? "+" : ""}${fmtNum(verificationPlan.nonRoutineAdjustmentKWh)} kWh`} />
              <TraceRow label="Adjusted baseline" source="Expected use at reporting conditions" value={`${fmtNum(verificationPlan.adjustedBaselineKWh)} kWh`} strong />
              <TraceRow label="Reporting-period actual" source={verificationPlan.meter} value={`${fmtNum(verificationPlan.actualKWh)} kWh`} />
              <TraceRow label="Verified period difference" source="Adjusted baseline − actual" value={`${fmtNum(verificationResult.verifiedPeriodKWh)} kWh`} strong tone="good" />
              <TraceRow label="Annualized verified saving" source={`× ${verificationPlan.annualizationFactor.toFixed(2)} annualization factor`} value={`${fmtNum(verificationResult.annualizedEnergyKWh)} kWh/yr`} strong tone="good" />
              <TraceRow label="Annualized cost saving" source={`IDR ${verificationPlan.tariffIDRPerKWh.toLocaleString("en-US")}/kWh`} value={fmtIDR(verificationResult.annualizedCostIDR)} strong tone="good" />
            </tbody></table></div>
          </Panel>

          <Panel title="Verification Gate & Approval" className="xl:col-span-5">
            <div className={`mb-3 rounded-md border p-3 ${gate.eligible ? "border-green/30 bg-green/8" : "border-amber/30 bg-amber/8"}`}>
              <div className="flex items-center gap-2 font-medium text-[11.5px]">{gate.eligible ? <BadgeCheck className="size-4 text-green" /> : <AlertTriangle className="size-4 text-amber" />}{gate.eligible ? "Eligible for reviewer approval" : "Verification blocked"}</div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">A completed installation is not automatically a verified saving. All measurement, adjustment, quality, and review gates must pass.</p>
            </div>
            <div className="space-y-2">
              {gate.checks.map((check) => (
                <div key={check.label} className="flex items-start gap-2 text-[10.5px]"><span className={`mt-0.5 size-4 rounded-full border flex items-center justify-center ${check.passed ? "border-green/30 bg-green/8 text-green" : "border-red/30 bg-red/8 text-red"}`}>{check.passed ? "✓" : "!"}</span><div><div className="font-medium">{check.label}</div><div className="text-[9.5px] text-muted-foreground">{check.detail}</div></div></div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-border bg-surface-2 p-3 text-[10.5px]"><div className="grid grid-cols-2 gap-3"><Info label="Prepared by" value={verificationPlan.preparedBy} /><Info label="Independent review" value={verificationPlan.reviewedBy} /></div><div className="mt-3 text-[9.5px] text-muted-foreground">Calibration due {verificationPlan.calibrationDue} · evidence count {verificationPlan.evidence.length}</div></div>
            <label className="mt-3 flex items-start gap-2 text-[10.5px]"><input type="checkbox" checked={reviewConfirmed} onChange={(event: ChangeEvent<HTMLInputElement>) => setReviewConfirmed(event.target.checked)} disabled={!gate.eligible} className="mt-0.5" /><span>I reviewed the calculation trace, evidence, adjustment rationale, and data-quality exceptions.</span></label>
            <button type="button" onClick={approveVerification} disabled={!gate.eligible || !reviewConfirmed} className="mt-3 w-full h-9 rounded-md bg-primary text-primary-foreground text-[11px] font-medium disabled:opacity-40">Approve verified saving</button>
          </Panel>

          <Panel title="Supporting Evidence" className="xl:col-span-12">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-2">{verificationPlan.evidence.map((item) => <div key={item} className="rounded-md border border-border bg-surface-2 p-3 text-[10.5px] flex items-start gap-2"><FileCheck2 className="size-4 text-primary shrink-0" /><span className="leading-relaxed">{item}</span></div>)}</div>
          </Panel>
        </div>
      )}

      {activeTab === "Savings Ledger" && (
        <Panel title="Verified Savings Ledger" actions={<span className="text-[10px] text-muted-foreground">verified values only · estimates excluded</span>}>
          <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2"><MiniTotal icon={CircleDollarSign} label="Verified cost" value={fmtIDR(ledgerTotals.costIDR)} /><MiniTotal icon={TrendingDown} label="Verified energy" value={`${fmtNum(ledgerTotals.energyKWh)} kWh`} /><MiniTotal icon={Database} label="Avoided emissions" value={`${ledgerTotals.emissionsTco2e.toFixed(1)} tCO₂e`} /><MiniTotal icon={LockKeyhole} label="Implementation cost" value={fmtIDR(ledgerTotals.implementationIDR)} /></div>
          <div className="overflow-x-auto"><table className="w-full text-[11px] min-w-[1180px]"><thead><tr className="border-b border-border text-left text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"><th className="py-2 font-normal">Record</th><th className="py-2 font-normal">Initiative</th><th className="py-2 font-normal">Saving type</th><th className="py-2 font-normal text-right">Verified energy</th><th className="py-2 font-normal text-right">Verified cost</th><th className="py-2 font-normal text-right">Avoided CO₂e</th><th className="py-2 font-normal text-right">Implementation</th><th className="py-2 font-normal text-right">Payback</th><th className="py-2 font-normal">Verification</th><th className="py-2 font-normal">Persistence</th></tr></thead><tbody className="divide-y divide-border">
            {ledger.map((record) => <tr key={record.id} className="hover:bg-surface-2/50"><td className="py-2.5 tabular text-muted-foreground">{record.id}</td><td className="py-2.5"><div className="font-medium">{record.initiative}</div><div className="text-[9.5px] text-muted-foreground">{record.site}</div></td><td className="py-2.5">{record.savingType}</td><td className="py-2.5 text-right tabular">{record.verifiedEnergyKWh > 0 ? `${fmtNum(record.verifiedEnergyKWh)} kWh` : "—"}</td><td className="py-2.5 text-right tabular text-green font-medium">{fmtIDR(record.verifiedCostIDR)}</td><td className="py-2.5 text-right tabular">{record.avoidedEmissionsTco2e > 0 ? `${record.avoidedEmissionsTco2e.toFixed(1)} t` : "—"}</td><td className="py-2.5 text-right tabular">{fmtIDR(record.implementationCostIDR)}</td><td className="py-2.5 text-right tabular">{record.paybackYears.toFixed(2)} yr</td><td className="py-2.5"><div>{record.verificationMethod}</div><div className="text-[9.5px] text-muted-foreground">{record.verificationConfidencePct}% confidence</div></td><td className="py-2.5"><span className={`inline-flex rounded border px-1.5 py-0.5 text-[9.5px] ${persistenceClass(record.persistenceState)}`}>{record.persistenceState}</span></td></tr>)}
          </tbody><tfoot><tr className="border-t border-border-strong font-medium"><td className="pt-3" colSpan={3}>Ledger total</td><td className="pt-3 text-right tabular">{fmtNum(ledgerTotals.energyKWh)} kWh</td><td className="pt-3 text-right tabular text-green">{fmtIDR(ledgerTotals.costIDR)}</td><td className="pt-3 text-right tabular">{ledgerTotals.emissionsTco2e.toFixed(1)} t</td><td className="pt-3 text-right tabular">{fmtIDR(ledgerTotals.implementationIDR)}</td><td className="pt-3" colSpan={3}></td></tr></tfoot></table></div>
          <div className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-[9.5px] text-muted-foreground">Verified cost may include energy, demand-charge, or power-factor-penalty savings. Cost-only records intentionally show no fictitious kWh saving.</div>
        </Panel>
      )}

      {activeTab === "Persistence" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <Panel title="Persistence Portfolio" className="xl:col-span-4">
            <div className="space-y-2">{persistence.map((record) => <button key={record.id} type="button" onClick={() => setPersistenceId(record.id)} className={`w-full rounded-md border p-3 text-left ${selectedPersistence.id === record.id ? "border-primary bg-primary/8" : "border-border bg-surface-2"}`}><div className="flex items-center justify-between gap-2"><span className="text-[9.5px] text-muted-foreground tabular">{record.id}</span><span className={`rounded border px-1.5 py-0.5 text-[9.5px] ${persistenceClass(record.state)}`}>{record.state}</span></div><div className="mt-1 text-[11.5px] font-medium">{record.initiative}</div><div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Expected</span><span className="tabular">{fmtIDR(record.expectedAnnualIDR)}/yr</span></div>{record.atRiskIDR > 0 && <div className="mt-1 flex items-center justify-between text-[10px] text-red"><span>At risk</span><span className="tabular">{fmtIDR(record.atRiskIDR)}/yr</span></div>}</button>)}</div>
          </Panel>
          <Panel title={`${selectedPersistence.initiative} · Persistence performance`} className="xl:col-span-8 h-[420px]" actions={<span className={`rounded border px-1.5 py-0.5 text-[9.5px] ${persistenceClass(selectedPersistence.state)}`}>{selectedPersistence.state}</span>}>
            <ResponsiveContainer width="100%" height="100%"><LineChart data={persistenceSeries} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="month" {...chartAxis} /><YAxis {...chartAxis} width={44} domain={[70, 110]} tickFormatter={(value: number) => `${value}%`} /><Tooltip {...tooltipStyle} formatter={(value: number | string, name: string) => [`${Number(value).toFixed(0)}%`, name === "realized" ? "Realized saving" : name]} /><ReferenceLine y={selectedPersistence.thresholdPct} stroke="var(--color-red)" strokeDasharray="5 4" label={{ value: "Review threshold", position: "insideBottomRight", fill: "var(--color-red)", fontSize: 9 }} /><Line type="monotone" dataKey="expected" stroke="var(--color-muted-foreground)" strokeDasharray="4 4" dot={false} /><Line type="monotone" dataKey="realized" stroke={selectedPersistence.state === "At risk" ? "var(--color-red)" : selectedPersistence.state === "Watch" ? "var(--color-amber)" : "var(--color-green)"} strokeWidth={2} dot={{ r: 2 }} /></LineChart></ResponsiveContainer>
          </Panel>
          <Panel title="Persistence Review" className="xl:col-span-12">
            <div className="grid md:grid-cols-4 gap-3"><Info label="Responsible owner" value={selectedPersistence.owner} /><Info label="Last review" value={selectedPersistence.lastReview} /><Info label="Next review" value={selectedPersistence.nextReview} /><Info label="Threshold" value={`${selectedPersistence.thresholdPct}% of normalized expectation`} /></div>
            <div className={`mt-3 rounded-md border p-3 ${selectedPersistence.state === "At risk" ? "border-red/30 bg-red/8" : "border-border bg-surface-2"}`}><div className="flex items-center gap-2 text-[11.5px] font-medium">{selectedPersistence.state === "At risk" ? <AlertTriangle className="size-4 text-red" /> : <CheckCircle2 className="size-4 text-green" />}{selectedPersistence.trigger}</div><p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">Recommended action: {selectedPersistence.recommendedAction}</p></div>
            <button type="button" onClick={() => setMessage(`Corrective-action draft opened for ${selectedPersistence.id}. No work order was issued.`)} className="mt-3 h-8 px-3 rounded-md border border-border bg-surface text-[11px] font-medium flex items-center gap-1.5 hover:bg-surface-2"><CalendarClock className="size-3.5" /> Open corrective-action draft</button>
          </Panel>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[9.5px] text-muted-foreground"><span>Industry-realistic demo boundary: M&V calculations are deterministic frontend examples and require engineering review before real contractual use.</span><Link to="/opportunities" className="text-primary hover:underline">Return to Opportunity Center →</Link></div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[9.5px] uppercase tracking-[0.11em] text-muted-foreground">{label}</div><div className="mt-0.5 leading-relaxed">{value}</div></div>;
}

function TraceRow({ label, source, value, strong = false, tone }: { label: string; source: string; value: string; strong?: boolean; tone?: "good" }) {
  return <tr><td className={`py-2 ${strong ? "font-medium" : ""}`}>{label}</td><td className="py-2 text-muted-foreground">{source}</td><td className={`py-2 text-right tabular ${strong ? "font-medium" : ""} ${tone === "good" ? "text-green" : ""}`}>{value}</td></tr>;
}

function MiniTotal({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return <div className="rounded-md border border-border bg-surface-2 p-3"><div className="flex items-center gap-2 text-[9.5px] uppercase tracking-[0.11em] text-muted-foreground"><Icon className="size-3.5 text-primary" />{label}</div><div className="mt-1 text-[14px] font-medium tabular">{value}</div></div>;
}
