import { requireRole } from "@/lib/auth";
import { BL_ROLES, canOnboardPartner } from "@/lib/roles";
import { getPartners, getAggCases } from "@/lib/crm-queries";
import { inr } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import OnboardPartnerForm from "@/components/admin/OnboardPartnerForm";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const profile = await requireRole(BL_ROLES);
  const [partners, cases] = await Promise.all([getPartners(), getAggCases()]);

  const rows = partners.map((p) => {
    const own = cases.filter((c) => c.dsa_partner_id === p.id);
    return {
      ...p,
      caseCount: own.length,
      disbursed: own.reduce((s, c) => s + c.disbursed_amount, 0),
      pending: own.filter((c) => c.billing_status !== "released").reduce((s, c) => s + c.dsa_payout_amt, 0),
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="DSA Partners"
        right={canOnboardPartner(profile.role) ? <OnboardPartnerForm /> : undefined}
      />
      <DataTable
        title={`${rows.length} partners`}
        subtitle="Onboarded DSA organisations"
        rows={rows}
        rowKey={(p) => p.id}
        columns={[
          { key: "name", header: "DSA", render: (p) => <span style={{ fontWeight: 600 }}>{p.name}</span> },
          { key: "code", header: "Vendor Code", render: (p) => <span style={{ color: "#8DA2BD" }}>{p.vendor_code}</span> },
          { key: "gst", header: "GST", render: (p) => <span style={{ color: "#8DA2BD", fontSize: 11.5 }}>{p.gst_no ?? "—"}</span> },
          { key: "margin", header: "BL Margin", align: "right", render: (p) => p.bl_margin_pct.toFixed(2) + "%" },
          { key: "cases", header: "Cases", align: "right", render: (p) => p.caseCount },
          { key: "disb", header: "Disbursed", align: "right", render: (p) => inr(p.disbursed) },
          { key: "pending", header: "Pending Payout", align: "right", render: (p) => <span style={{ fontWeight: 600 }}>{inr(p.pending)}</span> },
          { key: "status", header: "Status", align: "right", render: (p) => <StatusPill status={p.status} /> },
        ]}
      />
    </>
  );
}
