import { requireProfile } from "@/lib/auth";
import { getInvoices } from "@/lib/crm-queries";
import { inr } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  await requireProfile();
  const rows = await getInvoices();

  return (
    <>
      <PageHeader eyebrow="Finance" title="Invoices / PO" />
      <DataTable
        title={`${rows.length} invoices`}
        subtitle="Monthly purchase orders raised per DSA"
        rows={rows}
        rowKey={(i) => i.id}
        columns={[
          { key: "po", header: "PO Number", render: (i) => <span style={{ fontWeight: 600 }}>{i.po_number}</span> },
          { key: "dsa", header: "DSA", render: (i) => i.partner },
          { key: "month", header: "Month", render: (i) => i.billing_month },
          { key: "cases", header: "Cases", align: "right", render: (i) => i.case_count },
          { key: "gross", header: "Gross Payout", align: "right", render: (i) => inr(i.gross_lender_payout) },
          { key: "dsapay", header: "DSA Payout", align: "right", render: (i) => inr(i.total_dsa_payout) },
          { key: "margin", header: "BL Margin", align: "right", render: (i) => inr(i.bl_margin_total) },
          { key: "gst", header: "GST", align: "right", render: (i) => inr(i.gst_amount) },
          { key: "net", header: "Net Margin", align: "right", render: (i) => <span style={{ fontWeight: 600, color: "#34D399" }}>{inr(i.net_bl_margin)}</span> },
          { key: "status", header: "Status", align: "right", render: (i) => <StatusPill status={i.status} /> },
        ]}
      />
    </>
  );
}
