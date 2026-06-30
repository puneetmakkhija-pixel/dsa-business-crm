import { requireRole } from "@/lib/auth";
import { getAggCases } from "@/lib/crm-queries";
import { inr, MONTHS } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Filters from "@/components/ui/Filters";
import Panel from "@/components/dashboard/Panel";

export const dynamic = "force-dynamic";

export default async function PnlPage({ searchParams }: { searchParams: { month?: string } }) {
  await requireRole(["bl_accounts", "bl_dsa_admin_pl", "bl_dsa_admin_bl", "tech_super_admin", "dsa_owner"]);
  const cases = await getAggCases(searchParams.month);

  const sum = (f: (c: (typeof cases)[number]) => number) => cases.reduce((s, c) => s + f(c), 0);
  const disbursed = sum((c) => c.disbursed_amount);
  const grossPayout = sum((c) => c.payout_amt);
  const dsaPayout = sum((c) => c.dsa_payout_amt);
  const blMargin = sum((c) => c.bl_margin_amt);
  const gst = blMargin * 0.18;
  const netMargin = blMargin - gst;
  const released = sum((c) => (c.billing_status === "released" ? c.dsa_payout_amt : 0));
  const pending = dsaPayout - released;

  const Row = ({ label, value, bold, indent, accent }: { label: string; value: string; bold?: boolean; indent?: boolean; accent?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 4px", borderTop: "1px solid #e2e8f0", paddingLeft: indent ? 22 : 4 }}>
      <span style={{ fontSize: bold ? 13.5 : 12.5, fontWeight: bold ? 700 : 500, color: bold ? "#0f172a" : "#475569" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-sora), sans-serif", fontSize: bold ? 14 : 13, fontWeight: bold ? 800 : 600, color: accent ?? (bold ? "#0f172a" : "#0f172a") }}>{value}</span>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Profit & Loss"
        right={<Filters showSearch={false} selects={[{ param: "month", placeholder: "All months", options: MONTHS.filter((m) => m.value !== "all").map((m) => ({ value: m.value, label: m.label })) }]} />}
      />
      <div style={{ maxWidth: 680 }}>
        <Panel>
          <h3 style={{ margin: "0 0 4px", fontFamily: "var(--font-sora), sans-serif", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            P&amp;L Statement
          </h3>
          <span style={{ fontSize: 11.5, color: "#64748b" }}>By disbursal month{searchParams.month ? "" : " · all months"} · {cases.length} cases</span>
          <div style={{ marginTop: 10 }}>
            <Row label="Total Disbursed Volume" value={inr(disbursed)} />
            <Row label="(A) Gross Lender Payout" value={inr(grossPayout)} bold />
            <Row label="(B) Less: Total DSA Payout" value={"− " + inr(dsaPayout)} indent />
            <Row label="(C) BuddyLoan Gross Margin" value={inr(blMargin)} bold accent="#2563eb" />
            <Row label="(D) Less: GST on Margin (18%)" value={"− " + inr(gst)} indent />
            <Row label="(E) Net BL Margin" value={inr(netMargin)} bold accent="#059669" />
            <div style={{ height: 14 }} />
            <Row label="Released Payouts" value={inr(released)} />
            <Row label="Pending Payouts" value={inr(pending)} accent="#b45309" />
          </div>
        </Panel>
      </div>
    </>
  );
}
