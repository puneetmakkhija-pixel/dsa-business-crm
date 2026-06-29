import { requireProfile } from "@/lib/auth";
import { getAggCases, getLenders, getDisputes, getInvoices } from "@/lib/crm-queries";
import { inr, inrL, fmtDate, monthLabel } from "@/lib/format";
import { isDSA } from "@/lib/roles";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/dashboard/Panel";
import { StatGrid, type Stat } from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import TrendChart from "@/components/dashboard/TrendChart";
import DonutChart from "@/components/dashboard/DonutChart";

export const dynamic = "force-dynamic";

const MONTH_LABELS: Record<string, string> = {
  "2026-03": "Mar", "2026-04": "Apr", "2026-05": "May",
  "2026-02": "Feb", "2026-01": "Jan",
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [cases, lenders, disputes, invoices] = await Promise.all([
    getAggCases(),
    getLenders(),
    getDisputes(),
    getInvoices(),
  ]);

  const may = cases.filter((c) => (c.disbursed_date ?? "") >= "2026-05-01");
  const sum = (arr: typeof cases, f: (c: (typeof cases)[number]) => number) =>
    arr.reduce((s, c) => s + f(c), 0);

  const disbursedMay = sum(may, (c) => c.disbursed_amount);
  const payoutMay = sum(may, (c) => c.dsa_payout_amt);
  const released = sum(cases.filter((c) => c.billing_status === "released"), (c) => c.dsa_payout_amt);
  const pending = sum(cases.filter((c) => c.billing_status !== "released"), (c) => c.dsa_payout_amt);
  const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "under_review").length;

  const stats: Stat[] = [
    { label: "Disbursed · May", value: inr(disbursedMay), sub: `${may.length} cases`, glow: "#5B8DEF", icFg: "#7CA8FF", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
    { label: "DSA Payout · May", value: inr(payoutMay), sub: "to partners", glow: "#7C5BEF", icFg: "#B6A0FF", icon: "M20 12V8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v4M4 6v12a2 2 0 0 0 2 2h14v-4M18 12a2 2 0 0 0 0 4h4v-4z" },
    { label: "Released", value: inr(released), sub: "paid out", glow: "#34D399", icFg: "#34D399", icon: "M20 6L9 17l-5-5" },
    { label: "Pending Payout", value: inr(pending), sub: "awaiting release", glow: "#E8B873", icFg: "#E8B873", icon: "M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" },
  ];

  // Trend by month (₹ Lakh; TrendChart converts disbursed to Cr)
  const byMonth = new Map<string, { disb: number; payout: number }>();
  for (const c of cases) {
    const m = c.billing_month ?? c.disbursed_date?.slice(0, 7) ?? "";
    if (!m) continue;
    const e = byMonth.get(m) ?? { disb: 0, payout: 0 };
    e.disb += c.disbursed_amount;
    e.payout += c.dsa_payout_amt;
    byMonth.set(m, e);
  }
  const sortedMonths = [...byMonth.keys()].sort();
  const trend = {
    months: sortedMonths.map((m) => MONTH_LABELS[m] ?? m),
    disAmt: sortedMonths.map((m) => +(byMonth.get(m)!.disb / 1e5).toFixed(2)),
    spentM: sortedMonths.map((m) => +(byMonth.get(m)!.payout / 1e5).toFixed(2)),
  };

  // Lender split (May, ₹ Lakh)
  const lenderMap = new Map(lenders.map((l) => [l.id, l]));
  const byLender = new Map<number, number>();
  for (const c of may) byLender.set(c.lender_id, (byLender.get(c.lender_id) ?? 0) + c.disbursed_amount);
  const lenderSplit = [...byLender.entries()]
    .map(([id, amt]) => ({ name: lenderMap.get(id)?.name ?? "—", disb: +(amt / 1e5).toFixed(2), color: lenderMap.get(id)?.color ?? "#7E93B0" }))
    .sort((a, b) => b.disb - a.disb);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <>
      <PageHeader
        eyebrow={`${greeting}, ${profile.name.split(" ")[0]}`}
        title={isDSA(profile.role) ? "My Command Center" : "DSA Command Center"}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "10px 14px", fontSize: 12.5, fontWeight: 600, color: "#CFDCEC" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399" }} />
            {monthLabel("2026-05")}
          </div>
        }
      />

      <StatGrid stats={stats} />

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18, marginBottom: 18 }}>
        <Panel>
          <h3 style={{ margin: 0, fontFamily: "var(--font-sora), sans-serif", fontSize: 15, fontWeight: 700, color: "#F4F8FE" }}>
            Disbursed Volume &amp; DSA Payout
          </h3>
          <span style={{ fontSize: 11.5, color: "#7E93B0" }}>By month · FY 26-27</span>
          <div style={{ height: 258, position: "relative", marginTop: 8 }}>
            <TrendChart trend={trend} />
          </div>
        </Panel>
        <Panel>
          <h3 style={{ margin: 0, fontFamily: "var(--font-sora), sans-serif", fontSize: 15, fontWeight: 700, color: "#F4F8FE" }}>
            Lender Split
          </h3>
          <span style={{ fontSize: 11.5, color: "#7E93B0" }}>May disbursal · ₹ Lakh</span>
          <div style={{ height: 232, position: "relative", marginTop: 8 }}>
            <DonutChart lenders={lenderSplit} />
          </div>
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <DataTable
          title="Recent Disputes"
          rows={disputes.slice(0, 6)}
          rowKey={(d) => d.id}
          empty="No disputes."
          columns={[
            { key: "lan", header: "LAN", render: (d) => <span style={{ fontWeight: 600 }}>{d.lan_id}</span> },
            { key: "type", header: "Type", render: (d) => <span style={{ color: "#8DA2BD" }}>{d.type.replace(/_/g, " ")}</span> },
            { key: "status", header: "Status", render: (d) => <StatusPill status={d.status} /> },
          ]}
        />
        <DataTable
          title="Recent Invoices / PO"
          rows={invoices.slice(0, 6)}
          rowKey={(i) => i.id}
          empty="No invoices."
          columns={[
            { key: "po", header: "PO No", render: (i) => <span style={{ fontWeight: 600 }}>{i.po_number}</span> },
            { key: "month", header: "Month", render: (i) => i.billing_month },
            { key: "amt", header: "DSA Payout", align: "right", render: (i) => inrL(i.total_dsa_payout) },
            { key: "status", header: "Status", align: "right", render: (i) => <StatusPill status={i.status} /> },
          ]}
        />
      </div>
    </>
  );
}
