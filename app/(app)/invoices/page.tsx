import { requireProfile } from "@/lib/auth";
import { getInvoices, getPartners, getManagedPartnerIds } from "@/lib/crm-queries";
import { scopeFor } from "@/lib/scope";
import { inr } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import GenerateInvoiceForm from "@/components/admin/GenerateInvoiceForm";

export const dynamic = "force-dynamic";

const ACCOUNTS = ["bl_accounts", "bl_dsa_admin_bl", "bl_dsa_admin_pl", "tech_super_admin"];

export default async function InvoicesPage() {
  const profile = await requireProfile();
  const canGenerate = ACCOUNTS.includes(profile.role);
  const scope = scopeFor(profile);
  const partnerIds = scope.dsaManagerId ? await getManagedPartnerIds(scope.dsaManagerId) : null;
  const [rows, partners] = await Promise.all([
    getInvoices(partnerIds),
    canGenerate ? getPartners() : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader eyebrow="Finance" title="Invoices / PO" />
      {canGenerate && <GenerateInvoiceForm partners={partners.map((p) => ({ id: p.id, name: p.name }))} />}
      <DataTable
        title={`${rows.length} invoices`}
        subtitle="Monthly purchase orders raised per DSA"
        rows={rows}
        rowKey={(i) => i.id}
        columns={[
          { key: "po", header: "PO Number", render: (i) => <span className="font-mono text-[12px] font-semibold text-brand">{i.po_number}</span> },
          { key: "dsa", header: "DSA", render: (i) => i.partner },
          { key: "month", header: "Month", render: (i) => i.billing_month },
          { key: "cases", header: "Cases", align: "right", render: (i) => i.case_count },
          { key: "gross", header: "Gross Payout", align: "right", render: (i) => inr(i.gross_lender_payout) },
          { key: "dsapay", header: "DSA Payout", align: "right", render: (i) => inr(i.total_dsa_payout) },
          { key: "margin", header: "BL Margin", align: "right", render: (i) => inr(i.bl_margin_total) },
          { key: "gst", header: "GST", align: "right", render: (i) => inr(i.gst_amount) },
          { key: "net", header: "Net Margin", align: "right", render: (i) => <span className="font-semibold text-emerald-600">{inr(i.net_bl_margin)}</span> },
          { key: "status", header: "Status", align: "right", render: (i) => <StatusPill status={i.status} /> },
        ]}
      />
    </>
  );
}
