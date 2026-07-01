import { requireRole } from "@/lib/auth";
import { BL_ROLES } from "@/lib/roles";
import { getAggCases, getLenders, getPartners, getBlMonths, getAgentIncentives, getManagedPartnerIds, type AgentIncentive } from "@/lib/crm-queries";
import { inr } from "@/lib/format";
import { scopeFor, showsCallCenter, showsDsa } from "@/lib/scope";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";

export const dynamic = "force-dynamic";

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default async function ReportsPage() {
  const profile = await requireRole(BL_ROLES);
  const scope = scopeFor(profile);
  const seeCC = showsCallCenter(scope);
  const seeDsa = showsDsa(scope);
  const partnerIds = scope.dsaManagerId ? await getManagedPartnerIds(scope.dsaManagerId) : null;
  const [cases, lenders, partners, blMonths] = await Promise.all([getAggCases(undefined, partnerIds), getLenders(), getPartners(), getBlMonths()]);

  // Call-centre performance — latest month, by team manager (team-scoped for a TM)
  const ccMonth = blMonths.length ? blMonths[blMonths.length - 1].billing_month : null;
  const ccAgents: AgentIncentive[] = ccMonth && seeCC ? await getAgentIncentives(ccMonth, scope.ccTeam) : [];
  const teamMap = new Map<string, { agents: number; disbursal: number; incentive: number; hitters: number }>();
  for (const a of ccAgents) {
    const k = a.team_manager ?? "Unassigned";
    const e = teamMap.get(k) ?? { agents: 0, disbursal: 0, incentive: 0, hitters: 0 };
    e.agents++; e.disbursal += a.disbursed_value; e.incentive += a.incentive; if (a.hit) e.hitters++;
    teamMap.set(k, e);
  }
  const teamRows = [...teamMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.disbursal - a.disbursal);

  const lenderMap = new Map(lenders.map((l) => [l.id, l]));
  const partnerMap = new Map(partners.map((p) => [p.id, p]));

  function group<K>(keyFn: (c: (typeof cases)[number]) => K) {
    const m = new Map<K, { cases: number; disbursed: number; dsaPayout: number; margin: number; released: number }>();
    for (const c of cases) {
      const k = keyFn(c);
      const e = m.get(k) ?? { cases: 0, disbursed: 0, dsaPayout: 0, margin: 0, released: 0 };
      e.cases++; e.disbursed += c.disbursed_amount; e.dsaPayout += c.dsa_payout_amt; e.margin += c.bl_margin_amt;
      if (c.billing_status === "released") e.released += c.dsa_payout_amt;
      m.set(k, e);
    }
    return m;
  }

  const lenderRows = [...group((c) => c.lender_id).entries()]
    .map(([id, v]) => ({ id, name: lenderMap.get(id)?.name ?? "—", ...v }))
    .sort((a, b) => b.disbursed - a.disbursed);
  const dsaRows = [...group((c) => c.dsa_partner_id).entries()]
    .map(([id, v]) => ({ id, name: partnerMap.get(id)?.name ?? "—", code: partnerMap.get(id)?.vendor_code ?? "", ...v }))
    .sort((a, b) => b.disbursed - a.disbursed);

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Reports" />
      <div style={{ display: "grid", gap: 18 }}>
        {seeCC && !scope.ccTeam && (
        <DataTable
          title="Call-Center — monthly performance"
          subtitle="Disbursal, revenue & agent cost by month (BL team)"
          rows={blMonths.slice().reverse()}
          rowKey={(r) => r.billing_month}
          columns={[
            { key: "m", header: "Month", render: (r) => <span style={{ fontWeight: 600 }}>{monthLabel(r.billing_month)}</span> },
            { key: "ag", header: "Agents", align: "right", render: (r) => r.agents },
            { key: "disb", header: "Disbursal", align: "right", render: (r) => inr(r.disbursal) },
            { key: "rev", header: "Revenue", align: "right", render: (r) => inr(r.revenue_at_2_65) },
            { key: "hit", header: "Hit / Miss", align: "right", render: (r) => `${r.hitters} / ${r.missers}` },
            { key: "cost", header: "Agent Cost", align: "right", render: (r) => inr(r.total_agent_cost) },
          ]}
        />
        )}
        {seeCC && (
        <DataTable
          title={`Team-wise performance${ccMonth ? " — " + monthLabel(ccMonth) : ""}`}
          subtitle={scope.ccTeam ? `Your team (${scope.ccTeam})` : "Disbursal & incentive by Team Manager"}
          rows={teamRows}
          rowKey={(r) => r.name}
          empty="No agent attribution for the latest month."
          columns={[
            { key: "tm", header: "Team Manager", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
            { key: "ag", header: "Agents", align: "right", render: (r) => r.agents },
            { key: "hit", header: "Hitters", align: "right", render: (r) => `${r.hitters}/${r.agents}` },
            { key: "disb", header: "Disbursal", align: "right", render: (r) => inr(r.disbursal) },
            { key: "inc", header: "Incentive", align: "right", render: (r) => inr(r.incentive) },
          ]}
        />
        )}
        {seeDsa && (
        <>
        <DataTable
          title="Lender-wise"
          subtitle="Disbursal & margin by lender"
          rows={lenderRows}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "Lender", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
            { key: "cases", header: "Cases", align: "right", render: (r) => r.cases },
            { key: "disb", header: "Disbursed", align: "right", render: (r) => inr(r.disbursed) },
            { key: "dsa", header: "DSA Payout", align: "right", render: (r) => inr(r.dsaPayout) },
            { key: "margin", header: "BL Margin", align: "right", render: (r) => inr(r.margin) },
            { key: "released", header: "Released", align: "right", render: (r) => inr(r.released) },
          ]}
        />
        <DataTable
          title="DSA-wise"
          subtitle="Disbursal & payout by partner"
          rows={dsaRows}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "DSA", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
            { key: "code", header: "Vendor", render: (r) => <span style={{ color: "#64748b" }}>{r.code}</span> },
            { key: "cases", header: "Cases", align: "right", render: (r) => r.cases },
            { key: "disb", header: "Disbursed", align: "right", render: (r) => inr(r.disbursed) },
            { key: "dsa", header: "DSA Payout", align: "right", render: (r) => inr(r.dsaPayout) },
            { key: "pending", header: "Pending", align: "right", render: (r) => inr(r.dsaPayout - r.released) },
          ]}
        />
        </>
        )}
      </div>
    </>
  );
}
