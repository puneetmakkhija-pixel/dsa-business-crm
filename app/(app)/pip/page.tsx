import { requireRole } from "@/lib/auth";
import { getPipStatuses, type PipStatus } from "@/lib/crm-queries";
import { scopeFor } from "@/lib/scope";
import PageHeader from "@/components/ui/PageHeader";
import { StatGrid, type Stat } from "@/components/ui/StatCard";
import DataTable, { type Column } from "@/components/ui/DataTable";

export const dynamic = "force-dynamic";

const SEV: Record<string, { cls: string; tone: Stat["tone"] }> = {
  "Ramp — no action": { cls: "bg-slate-100 text-slate-600", tone: "blue" },
  "On track": { cls: "bg-emerald-100 text-emerald-700", tone: "green" },
  "P&L Head review (coaching)": { cls: "bg-amber-100 text-amber-700", tone: "amber" },
  "PIP initiated (P&L Head + HR)": { cls: "bg-rose-100 text-rose-700", tone: "rose" },
  "PIP renewed / escalation (P&L Head + HR)": { cls: "bg-violet-100 text-violet-700", tone: "violet" },
};

export default async function PipPage() {
  const profile = await requireRole(["bl_dsa_manager", "bl_dsa_admin_pl", "bl_dsa_admin_bl", "tech_super_admin"]);
  const scope = scopeFor(profile);
  const rows = await getPipStatuses(scope.ccTeam);

  const count = (a: string) => rows.filter((r) => r.pip_action === a).length;
  const stats: Stat[] = [
    { label: "On PIP (active)", value: String(count("PIP initiated (P&L Head + HR)") + count("PIP renewed / escalation (P&L Head + HR)")), sub: "2nd + 3rd miss month", tone: "rose", icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" },
    { label: "In review", value: String(count("P&L Head review (coaching)")), sub: "1st miss month", tone: "amber", icon: "M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" },
    { label: "On track", value: String(count("On track")), sub: "hit latest target", tone: "green", icon: "M20 6L9 17l-5-5" },
    { label: "On ramp", value: String(count("Ramp — no action")), sub: "tenure < 4 months", tone: "blue", icon: "M13 2L3 14h9l-1 8 10-12h-9z" },
  ];

  const columns: Column<PipStatus>[] = [
    { key: "name", header: "Agent", render: (r) => (
      <div>
        <div className="font-semibold text-slate-900">{r.name}</div>
        <div className="text-[11px] text-slate-400">{r.ecode}</div>
      </div>
    ) },
    { key: "ten", header: "Tenure", align: "right", render: (r) => `${r.tenure_months}m` },
    { key: "streak", header: "Miss streak", align: "right", render: (r) => (
      <span className={r.miss_streak >= 2 ? "font-bold text-rose-600" : "text-slate-700"}>{r.miss_streak}</span>
    ) },
    { key: "action", header: "PIP Action", render: (r) => {
      const s = SEV[r.pip_action] ?? { cls: "bg-slate-100 text-slate-600" };
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {r.pip_action}
        </span>
      );
    } },
    { key: "owner", header: "Owner", render: (r) => r.owner },
  ];

  return (
    <>
      <PageHeader eyebrow={scope.ccTeam ? `Performance · ${scope.ccTeam}'s team` : "Performance"} title="PIP / Performance" />
      <StatGrid stats={stats} />
      <DataTable
        title="Performance Improvement — non-achievement clause"
        subtitle="Consecutive misses (resets on any hit). 4m+: 1st → review · 2nd → PIP · 3rd → escalation. 0–3m: ramp, no action."
        columns={columns}
        rows={rows}
        rowKey={(r) => r.ecode}
        empty="No agents tracked yet."
      />
    </>
  );
}
