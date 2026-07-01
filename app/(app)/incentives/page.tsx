import { requireRole } from "@/lib/auth";
import {
  getAgentIncentives,
  getBlMonths,
  getLatestIncentiveMonth,
  type AgentIncentive,
} from "@/lib/crm-queries";
import { inr } from "@/lib/format";
import { BL_ROLES } from "@/lib/roles";
import { scopeFor } from "@/lib/scope";
import PageHeader from "@/components/ui/PageHeader";
import Filters from "@/components/ui/Filters";
import { StatGrid, type Stat } from "@/components/ui/StatCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ExportButton from "./ExportButton";

export const dynamic = "force-dynamic";

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function Badge({ row }: { row: AgentIncentive }) {
  const [label, cls] =
    row.base_target == null
      ? ["Ramp", "bg-slate-100 text-slate-600"]
      : row.hit
      ? ["Hit", "bg-emerald-100 text-emerald-700"]
      : ["Miss", "bg-rose-100 text-rose-700"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export default async function IncentivesPage({ searchParams }: { searchParams: { month?: string; q?: string } }) {
  const profile = await requireRole(BL_ROLES);
  const scope = scopeFor(profile);

  const months = await getBlMonths();
  const monthValues = months.map((m) => m.billing_month).reverse(); // latest first
  const selected =
    searchParams.month && monthValues.includes(searchParams.month)
      ? searchParams.month
      : monthValues[0] ?? (await getLatestIncentiveMonth());

  let rows = await getAgentIncentives(selected, scope.ccTeam);
  const q = (searchParams.q ?? "").trim().toLowerCase();
  if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.ecode.toLowerCase().includes(q));

  const sum = (f: (r: AgentIncentive) => number) => rows.reduce((s, r) => s + f(r), 0);
  const disbursal = sum((r) => r.disbursed_value);
  const totalIncentive = sum((r) => r.incentive);
  const totalPayout = sum((r) => r.total_payout);
  const hitters = rows.filter((r) => r.hit).length;
  const missers = rows.filter((r) => r.base_target != null && !r.hit).length;
  const ramp = rows.filter((r) => r.base_target == null).length;

  const stats: Stat[] = [
    { label: "Disbursal", value: inr(disbursal), sub: `${rows.length} agents`, tone: "blue", icon: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
    { label: "Hitters / Missers", value: `${hitters} / ${missers}`, sub: `${ramp} on ramp`, tone: "violet", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
    { label: "Total Incentive", value: inr(totalIncentive), sub: "over salary floor", tone: "green", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
    { label: "Payout (incl. salary)", value: inr(totalPayout), sub: monthLabel(selected), tone: "amber", icon: "M20 12V8H6a2 2 0 0 1 0-4h12v4M4 6v12a2 2 0 0 0 2 2h14v-4M18 12a2 2 0 0 0 0 4h4v-4z" },
  ];

  const columns: Column<AgentIncentive>[] = [
    { key: "name", header: "Agent", render: (r) => (
      <div>
        <div className="font-semibold text-slate-900">{r.name}</div>
        <div className="text-[11px] text-slate-400">{r.ecode}</div>
      </div>
    ) },
    { key: "tl", header: "TL", render: (r) => r.team_manager ?? "—" },
    { key: "salary", header: "Salary", align: "right", render: (r) => (r.salary ? inr(r.salary) : "—") },
    { key: "ten", header: "Tenure", align: "right", render: (r) => (r.tenure_months ?? "—") + "m" },
    { key: "target", header: "Base Target", align: "right", render: (r) => (r.base_target ? inr(r.base_target) : "—") },
    { key: "disb", header: "Disbursal", align: "right", render: (r) => inr(r.disbursed_value) },
    { key: "hit", header: "Status", align: "center", render: (r) => <Badge row={r} /> },
    { key: "payout", header: "Payout", align: "right", render: (r) => <span className="text-slate-700">{inr(r.total_payout)}</span> },
    { key: "inc", header: "Incentive", align: "right", render: (r) => (
      <span className="font-display font-bold text-slate-900">{inr(r.incentive)}</span>
    ) },
  ];

  const csvRows = rows.map((r) => ({
    ecode: r.ecode, name: r.name, tl: r.team_manager ?? "", salary: r.salary ?? "",
    tenure_months: r.tenure_months ?? "", base_target: r.base_target ?? "",
    disbursal: r.disbursed_value, status: r.base_target == null ? "Ramp" : r.hit ? "Hit" : "Miss",
    total_payout: r.total_payout, incentive: r.incentive,
  }));
  const csvCols = [
    { key: "ecode", header: "Ecode" }, { key: "name", header: "Name" }, { key: "tl", header: "TL" },
    { key: "salary", header: "Salary" }, { key: "tenure_months", header: "Tenure (m)" },
    { key: "base_target", header: "Base Target" }, { key: "disbursal", header: "Disbursal" },
    { key: "status", header: "Status" }, { key: "total_payout", header: "Total Payout" }, { key: "incentive", header: "Incentive" },
  ];

  return (
    <>
      <PageHeader
        eyebrow={scope.ccTeam ? `Performance · ${scope.ccTeam}'s team` : "Performance"}
        title="Incentives"
        right={
          <>
            <Filters
              searchPlaceholder="Search agent…"
              selects={[{ param: "month", placeholder: monthLabel(selected), options: monthValues.map((v) => ({ value: v, label: monthLabel(v) })) }]}
            />
            <ExportButton rows={csvRows} columns={csvCols} filename={`incentives_${selected}.csv`} />
          </>
        }
      />

      <StatGrid stats={stats} />

      <DataTable
        title={`Agent incentive statement — ${monthLabel(selected)}`}
        subtitle="Hit = disbursal ≥ band/tenure target · ≤₹50L: 0.65% · >₹50L: ₹32,500 + 0.75% · floored at salary"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.ecode}
        empty="No agent disbursal for this month."
      />

      <p className="mt-4 text-[12px] text-slate-500">
        Missers are paid salary only (no incentive). LAP/secured disbursal counts at 40%. P&amp;L Head earns 20% of
        the fully-loaded margin (see P&amp;L). Salary &amp; tenure are sourced from the BDL roster.
      </p>
    </>
  );
}
