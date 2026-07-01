import { requireRole } from "@/lib/auth";
import { getBlPnl, getLenderRevenue, type BlPnl } from "@/lib/crm-queries";
import { inr } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Filters from "@/components/ui/Filters";
import Panel from "@/components/dashboard/Panel";
import { StatGrid, type Stat } from "@/components/ui/StatCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import type { LenderRevenue } from "@/lib/crm-queries";

export const dynamic = "force-dynamic";

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
const pctf = (v: number | null) => (v == null ? "—" : (v * 100).toFixed(2) + "%");
const KIND: Record<string, string> = {
  actual: "bg-emerald-100 text-emerald-700",
  projection: "bg-amber-100 text-amber-700",
  plan: "bg-blue-100 text-blue-700",
};

function Row({ label, value, bold, indent, accent, sub }: { label: string; value: string; bold?: boolean; indent?: boolean; accent?: string; sub?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 py-3" style={{ paddingLeft: indent ? 18 : 2 }}>
      <span className={`${bold ? "text-[13.5px] font-bold text-slate-900" : sub ? "text-[12px] text-slate-500" : "text-[12.5px] font-medium text-slate-600"}`}>{label}</span>
      <span className="font-display text-[13.5px] font-bold" style={{ color: accent ?? "#0f172a" }}>{value}</span>
    </div>
  );
}

export default async function BlPnlPage({ searchParams }: { searchParams: { month?: string } }) {
  await requireRole(["bl_accounts", "bl_dsa_admin_pl", "bl_dsa_admin_bl", "tech_super_admin"]);

  const pnl = await getBlPnl();
  const months = pnl.map((p) => p.period).reverse();
  const selected = searchParams.month && months.includes(searchParams.month) ? searchParams.month : months[0];
  const m = pnl.find((p) => p.period === selected) ?? pnl[pnl.length - 1];
  const lenders = await getLenderRevenue();

  const GREEN = "#059669", ROSE = "#e11d48", BLUE = "#2563eb";
  const stats: Stat[] = [
    { label: "Revenue", value: inr(m.revenue), sub: monthLabel(m.period), tone: "blue", icon: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
    { label: "Margin (excl BDL)", value: inr(m.margin_excl_bdl), sub: pctf(m.margin_pct_excl_bdl), tone: m.margin_excl_bdl >= 0 ? "green" : "rose", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
    { label: "Margin (incl BDL)", value: inr(m.margin_incl_bdl), sub: pctf(m.margin_pct_incl_bdl) + " · fully loaded", tone: m.margin_incl_bdl >= 0 ? "green" : "rose", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
    { label: "P&L Head Incentive", value: inr(m.pl_head_incentive), sub: "20% of fully-loaded margin", tone: "violet", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  ];

  const trendCols: Column<BlPnl>[] = [
    { key: "period", header: "Month", render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-900">{monthLabel(r.period)}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${KIND[r.kind] ?? "bg-slate-100 text-slate-600"}`}>{r.kind}</span>
      </div>
    ) },
    { key: "rev", header: "Revenue", align: "right", render: (r) => inr(r.revenue) },
    { key: "me", header: "Margin (excl BDL)", align: "right", render: (r) => <span style={{ color: r.margin_excl_bdl >= 0 ? GREEN : ROSE }}>{inr(r.margin_excl_bdl)}</span> },
    { key: "mep", header: "%", align: "right", render: (r) => pctf(r.margin_pct_excl_bdl) },
    { key: "mi", header: "Margin (incl BDL)", align: "right", render: (r) => <span style={{ color: r.margin_incl_bdl >= 0 ? GREEN : ROSE }}>{inr(r.margin_incl_bdl)}</span> },
    { key: "mip", header: "%", align: "right", render: (r) => pctf(r.margin_pct_incl_bdl) },
    { key: "plh", header: "P&L Head", align: "right", render: (r) => inr(r.pl_head_incentive) },
  ];

  const totalDisb = lenders.reduce((s, l) => s + l.disbursed, 0);
  const totalRev = lenders.reduce((s, l) => s + l.revenue, 0);
  const lenderCols: Column<LenderRevenue>[] = [
    { key: "lender", header: "Lender", render: (l) => <span className="font-semibold text-slate-900">{l.lender}</span> },
    { key: "rate", header: "Payout rate", align: "right", render: (l) => (
      <span>{l.payout_pct == null ? "—" : (l.payout_pct * 100).toFixed(2) + "%"}{l.is_placeholder ? <span className="ml-1 text-[10px] text-amber-600">(est)</span> : null}</span>
    ) },
    { key: "disb", header: "Disbursal", align: "right", render: (l) => inr(l.disbursed) },
    { key: "rev", header: "Revenue", align: "right", render: (l) => <span className="font-display font-bold text-slate-900">{inr(l.revenue)}</span> },
    { key: "mix", header: "% of rev", align: "right", render: (l) => totalRev ? ((l.revenue / totalRev) * 100).toFixed(1) + "%" : "—" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="P&L — Call Center"
        right={<Filters showSearch={false} selects={[{ param: "month", placeholder: monthLabel(selected), options: months.map((v) => ({ value: v, label: monthLabel(v) })) }]} />}
      />

      <StatGrid stats={stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <h3 className="font-display text-[15px] font-bold text-slate-900">P&amp;L Statement</h3>
          <span className="text-[11.5px] text-slate-500">{monthLabel(m.period)} · {m.kind}</span>
          <div className="mt-2">
            <Row label="Revenue (lender-wise @ blended rate)" value={inr(m.revenue)} bold accent={BLUE} />
            <Row label="Less: Spends (excl. BDL employees)" value={"− " + inr(m.spends_excl_bdl)} indent />
            <Row label="Margin (excl BDL)" value={inr(m.margin_excl_bdl)} bold accent={m.margin_excl_bdl >= 0 ? GREEN : ROSE} />
            <Row label={`Margin % (excl BDL)`} value={pctf(m.margin_pct_excl_bdl)} sub indent />
            <div className="h-3" />
            <Row label="Less: BDL Employee Cost" value={"− " + inr(m.bdl_emp_cost)} indent />
            <Row label="Margin (incl BDL — fully loaded)" value={inr(m.margin_incl_bdl)} bold accent={m.margin_incl_bdl >= 0 ? GREEN : ROSE} />
            <Row label="Margin % (incl BDL)" value={pctf(m.margin_pct_incl_bdl)} sub indent />
            <div className="h-3" />
            <Row label="P&L Head Incentive (20% of fully-loaded margin)" value={inr(m.pl_head_incentive)} bold accent="#7c3aed" />
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display text-[15px] font-bold text-slate-900">Lender-wise revenue mix</h3>
          <span className="text-[11.5px] text-slate-500">
            Blended {totalDisb ? ((totalRev / totalDisb) * 100).toFixed(2) : "—"}% across {lenders.length} lenders · revenue varies by lender rate
          </span>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <tbody>
                {lenders.map((l) => (
                  <tr key={l.lender} className="border-t border-slate-100">
                    <td className="py-2 font-semibold text-slate-800">{l.lender}</td>
                    <td className="py-2 text-right text-slate-500">{l.payout_pct == null ? "—" : (l.payout_pct * 100).toFixed(2) + "%"}</td>
                    <td className="py-2 text-right text-slate-600">{inr(l.disbursed)}</td>
                    <td className="py-2 text-right font-display font-bold text-slate-900">{inr(l.revenue)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td className="py-2 font-bold text-slate-900">Total</td>
                  <td className="py-2 text-right font-bold text-brand">{totalDisb ? ((totalRev / totalDisb) * 100).toFixed(2) + "%" : "—"}</td>
                  <td className="py-2 text-right font-bold text-slate-900">{inr(totalDisb)}</td>
                  <td className="py-2 text-right font-display font-bold text-slate-900">{inr(totalRev)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <DataTable
          title="Monthly P&L trend"
          subtitle="Two margin views — excluding and including BDL employee cost (fully loaded)"
          columns={trendCols}
          rows={pnl.slice().reverse()}
          rowKey={(r) => r.period}
        />
      </div>
    </>
  );
}
