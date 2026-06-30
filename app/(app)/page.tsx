import { requireProfile } from "@/lib/auth";
import { getAggCases, getLenders, getDisputes, getInvoices } from "@/lib/crm-queries";
import { inr, inrL, monthLabel, monthRange, MONTHS } from "@/lib/format";
import { isDSA } from "@/lib/roles";
import Filters from "@/components/ui/Filters";
import Panel from "@/components/dashboard/Panel";
import { StatGrid, type Stat } from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import TrendChart from "@/components/dashboard/TrendChart";
import DonutChart from "@/components/dashboard/DonutChart";

export const dynamic = "force-dynamic";

const MONTH_ABBR: Record<string, string> = {
  "2026-01": "Jan", "2026-02": "Feb", "2026-03": "Mar", "2026-04": "Apr", "2026-05": "May",
};

export default async function DashboardPage({ searchParams }: { searchParams: { month?: string } }) {
  const profile = await requireProfile();
  const selectedMonth = searchParams.month && searchParams.month !== "all" ? searchParams.month : "2026-05";

  const [allCases, lenders, disputes, invoices] = await Promise.all([
    getAggCases(),
    getLenders(),
    getDisputes(),
    getInvoices(),
  ]);

  const range = monthRange(selectedMonth);
  const monthCases = range
    ? allCases.filter((c) => (c.disbursed_date ?? "") >= range[0] && (c.disbursed_date ?? "") < range[1])
    : allCases;

  const sum = (arr: typeof allCases, f: (c: (typeof allCases)[number]) => number) =>
    arr.reduce((s, c) => s + f(c), 0);

  const lbl = monthLabel(selectedMonth).replace(" 2026", "");
  const stats: Stat[] = [
    { label: `Disbursed · ${lbl}`, value: inr(sum(monthCases, (c) => c.disbursed_amount)), sub: `${monthCases.length} cases`, tone: "blue", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
    { label: `DSA Payout · ${lbl}`, value: inr(sum(monthCases, (c) => c.dsa_payout_amt)), sub: "to partners", tone: "violet", icon: "M20 12V8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v4M4 6v12a2 2 0 0 0 2 2h14v-4M18 12a2 2 0 0 0 0 4h4v-4z" },
    { label: `BL Margin · ${lbl}`, value: inr(sum(monthCases, (c) => c.bl_margin_amt)), sub: "before GST", tone: "green", icon: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
    { label: "Open Disputes", value: String(disputes.filter((d) => d.status === "open" || d.status === "under_review").length), sub: "need attention", tone: "rose", icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" },
  ];

  // Trend across all months (₹ Lakh)
  const byMonth = new Map<string, { disb: number; payout: number }>();
  for (const c of allCases) {
    // Always attribute to the disbursal month (not billing month)
    const m = c.disbursed_date?.slice(0, 7) ?? "";
    if (!m) continue;
    const e = byMonth.get(m) ?? { disb: 0, payout: 0 };
    e.disb += c.disbursed_amount;
    e.payout += c.dsa_payout_amt;
    byMonth.set(m, e);
  }
  const sortedMonths = [...byMonth.keys()].sort();
  const trend = {
    months: sortedMonths.map((m) => MONTH_ABBR[m] ?? m),
    disAmt: sortedMonths.map((m) => +(byMonth.get(m)!.disb / 1e5).toFixed(2)),
    spentM: sortedMonths.map((m) => +(byMonth.get(m)!.payout / 1e5).toFixed(2)),
  };

  // Lender split for selected month (₹ Lakh)
  const lenderMap = new Map(lenders.map((l) => [l.id, l]));
  const byLender = new Map<number, number>();
  for (const c of monthCases) byLender.set(c.lender_id, (byLender.get(c.lender_id) ?? 0) + c.disbursed_amount);
  const lenderSplit = [...byLender.entries()]
    .map(([id, amt]) => ({ name: lenderMap.get(id)?.name ?? "—", disb: +(amt / 1e5).toFixed(2), color: lenderMap.get(id)?.color ?? "#94a3b8" }))
    .sort((a, b) => b.disb - a.disb);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12.5px] font-medium text-slate-500">{greeting}, {profile.name.split(" ")[0]}</div>
          <h1 className="font-display text-[24px] font-bold tracking-tight text-slate-900 mt-0.5">
            {isDSA(profile.role) ? "My Command Center" : "DSA Command Center"}
          </h1>
        </div>
        <Filters
          showSearch={false}
          selects={[{ param: "month", placeholder: "May 2026", options: MONTHS.filter((m) => m.value !== "all").map((m) => ({ value: m.value, label: m.label })) }]}
        />
      </div>

      <StatGrid stats={stats} />

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <h3 className="font-display text-[15px] font-bold text-slate-900">Disbursed Volume &amp; DSA Payout</h3>
          <p className="text-[12px] text-slate-500">By month · FY 26-27</p>
          <div className="relative mt-3 h-[258px]">
            <TrendChart trend={trend} />
          </div>
        </Panel>
        <Panel>
          <h3 className="font-display text-[15px] font-bold text-slate-900">Lender Split</h3>
          <p className="text-[12px] text-slate-500">{monthLabel(selectedMonth)} · ₹ Lakh</p>
          <div className="relative mt-3 h-[232px]">
            <DonutChart lenders={lenderSplit} />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DataTable
          title="Recent Disputes"
          rows={disputes.slice(0, 6)}
          rowKey={(d) => d.id}
          empty="No disputes."
          columns={[
            { key: "lan", header: "LAN", render: (d) => <span className="font-semibold text-slate-800">{d.lan_id}</span> },
            { key: "type", header: "Type", render: (d) => <span className="text-slate-500">{d.type.replace(/_/g, " ")}</span> },
            { key: "status", header: "Status", render: (d) => <StatusPill status={d.status} /> },
          ]}
        />
        <DataTable
          title="Recent Invoices / PO"
          rows={invoices.slice(0, 6)}
          rowKey={(i) => i.id}
          empty="No invoices."
          columns={[
            { key: "po", header: "PO No", render: (i) => <span className="font-semibold text-slate-800">{i.po_number}</span> },
            { key: "month", header: "Month", render: (i) => i.billing_month },
            { key: "amt", header: "DSA Payout", align: "right", render: (i) => inrL(i.total_dsa_payout) },
            { key: "status", header: "Status", align: "right", render: (i) => <StatusPill status={i.status} /> },
          ]}
        />
      </div>
    </>
  );
}
