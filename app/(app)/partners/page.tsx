import { requireRole } from "@/lib/auth";
import { BL_ROLES, canOnboardPartner } from "@/lib/roles";
import { getPartners, getAggCases, getManagers } from "@/lib/crm-queries";
import { inr } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import OnboardPartnerForm from "@/components/admin/OnboardPartnerForm";
import EditPartner from "@/components/admin/EditPartner";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const profile = await requireRole(BL_ROLES);
  const canEdit = canOnboardPartner(profile.role);
  const [partners, cases, managers] = await Promise.all([
    getPartners(),
    getAggCases(),
    canEdit ? getManagers() : Promise.resolve([]),
  ]);

  const rows = partners.map((p) => {
    const own = cases.filter((c) => c.dsa_partner_id === p.id);
    return {
      ...p,
      caseCount: own.length,
      disbursed: own.reduce((s, c) => s + c.disbursed_amount, 0),
      pending: own.filter((c) => c.billing_status !== "released").reduce((s, c) => s + c.dsa_payout_amt, 0),
    };
  });
  const managerOpts = managers.map((m) => ({ id: m.id, name: m.name }));

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="DSA Partners"
        right={canEdit ? <OnboardPartnerForm /> : undefined}
      />
      <DataTable
        title={`${rows.length} partners`}
        subtitle="Onboarded DSA organisations — assign a manager and set DSA-wise payout margin"
        rows={rows}
        rowKey={(p) => p.id}
        columns={[
          { key: "name", header: "DSA", render: (p) => <span className="font-semibold text-slate-800">{p.name}</span> },
          { key: "code", header: "Vendor", render: (p) => <span className="text-slate-500">{p.vendor_code}</span> },
          { key: "manager", header: "Manager", render: (p) => p.manager ? <span className="text-slate-700">{p.manager}</span> : <span className="text-slate-400">Unassigned</span> },
          { key: "margin", header: "BL Margin", align: "right", render: (p) => <span className="font-semibold text-brand">{p.bl_margin_pct.toFixed(2)}%</span> },
          { key: "cases", header: "Cases", align: "right", render: (p) => p.caseCount },
          { key: "disb", header: "Disbursed", align: "right", render: (p) => inr(p.disbursed) },
          { key: "pending", header: "Pending Payout", align: "right", render: (p) => <span className="font-semibold text-slate-800">{inr(p.pending)}</span> },
          { key: "status", header: "Status", render: (p) => <StatusPill status={p.status} /> },
          ...(canEdit
            ? [{
                key: "actions",
                header: "",
                align: "right" as const,
                render: (p: (typeof rows)[number]) => (
                  <EditPartner
                    partner={{ id: p.id, name: p.name, manager_user_id: p.manager_user_id, bl_margin_pct: p.bl_margin_pct }}
                    managers={managerOpts}
                  />
                ),
              }]
            : []),
        ]}
      />
    </>
  );
}
