import { requireRole } from "@/lib/auth";
import { BL_ROLES } from "@/lib/roles";
import { getAggCases, getLenders, getPartners } from "@/lib/crm-queries";
import { inr } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireRole(BL_ROLES);
  const [cases, lenders, partners] = await Promise.all([getAggCases(), getLenders(), getPartners()]);

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
      </div>
    </>
  );
}
