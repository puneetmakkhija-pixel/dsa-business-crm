import { requireProfile } from "@/lib/auth";
import { getCases } from "@/lib/crm-queries";
import { inr, fmtDate, MONTHS } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Filters from "@/components/ui/Filters";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; billing?: string; month?: string };

export default async function CasesPage({ searchParams }: { searchParams: SP }) {
  await requireProfile();
  const rows = await getCases({
    q: searchParams.q,
    status: searchParams.status,
    billing: searchParams.billing,
    month: searchParams.month,
  });

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Cases"
        right={
          <Filters
            searchPlaceholder="Search LAN / customer…"
            selects={[
              { param: "status", placeholder: "MIS status", options: ["awaited", "pending", "confirmed", "disputed"].map((v) => ({ value: v, label: v })) },
              { param: "billing", placeholder: "Billing status", options: ["unbilled", "billed", "released"].map((v) => ({ value: v, label: v })) },
              { param: "month", placeholder: "Month", options: MONTHS.filter((m) => m.value !== "all").map((m) => ({ value: m.value, label: m.label })) },
            ]}
          />
        }
      />
      <DataTable
        title={`${rows.length} cases`}
        subtitle="Every disbursed case, scoped to your access"
        rows={rows}
        rowKey={(c) => c.id}
        columns={[
          { key: "lan", header: "LAN", render: (c) => <span style={{ fontWeight: 600 }}>{c.lan_id}</span> },
          { key: "cust", header: "Customer", render: (c) => <span style={{ color: "#CFDCEC" }}>{c.customer_name ?? "—"}</span> },
          { key: "lender", header: "Lender", render: (c) => (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.lenderColor }} />
              {c.lender}
            </span>
          ) },
          { key: "partner", header: "DSA", render: (c) => <span style={{ color: "#8DA2BD" }}>{c.partner}</span> },
          { key: "disb", header: "Disbursed", align: "right", render: (c) => inr(c.disbursed_amount) },
          { key: "pct", header: "Payout %", align: "right", render: (c) => c.payout_pct.toFixed(2) + "%" },
          { key: "dsa", header: "DSA Payout", align: "right", render: (c) => <span style={{ fontWeight: 600 }}>{inr(c.dsa_payout_amt)}</span> },
          { key: "mis", header: "MIS", render: (c) => <StatusPill status={c.mis_status} /> },
          { key: "bill", header: "Billing", render: (c) => <StatusPill status={c.billing_status} /> },
          { key: "date", header: "Disbursed", align: "right", render: (c) => (c.disbursed_date ? fmtDate(c.disbursed_date) : "—") },
        ]}
      />
    </>
  );
}
