import { requireProfile } from "@/lib/auth";
import { canAddCase, isBL } from "@/lib/roles";
import { getCases, getLenders, getPartners } from "@/lib/crm-queries";
import { inr, fmtDate, MONTHS } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Filters from "@/components/ui/Filters";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import AddCaseForm from "@/components/admin/AddCaseForm";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; billing?: string; month?: string };

export default async function CasesPage({ searchParams }: { searchParams: SP }) {
  const profile = await requireProfile();
  const canAdd = canAddCase(profile.role);
  const [rows, lenders, partners] = await Promise.all([
    getCases({
      q: searchParams.q,
      status: searchParams.status,
      billing: searchParams.billing,
      month: searchParams.month,
    }),
    canAdd ? getLenders() : Promise.resolve([]),
    canAdd && isBL(profile.role) ? getPartners() : Promise.resolve([]),
  ]);

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
      {canAdd && (
        <AddCaseForm
          lenders={lenders.map((l) => ({ id: l.id, name: l.name }))}
          partners={partners.map((p) => ({ id: p.id, name: p.name }))}
          showPartner={isBL(profile.role)}
        />
      )}
      <DataTable
        title={`${rows.length} cases`}
        subtitle="Every disbursed case, scoped to your access"
        rows={rows}
        rowKey={(c) => c.id}
        columns={[
          { key: "lan", header: "LAN", render: (c) => <span className="font-semibold text-slate-800">{c.lan_id}</span> },
          { key: "cust", header: "Customer", render: (c) => <span className="text-slate-700">{c.customer_name ?? "—"}</span> },
          { key: "lender", header: "Lender", render: (c) => (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.lenderColor }} />
              {c.lender}
            </span>
          ) },
          { key: "partner", header: "DSA", render: (c) => <span className="text-slate-500">{c.partner}</span> },
          { key: "disb", header: "Disbursed", align: "right", render: (c) => inr(c.disbursed_amount) },
          { key: "pct", header: "Payout %", align: "right", render: (c) => c.payout_pct.toFixed(2) + "%" },
          { key: "dsa", header: "DSA Payout", align: "right", render: (c) => <span className="font-semibold text-slate-800">{inr(c.dsa_payout_amt)}</span> },
          { key: "mis", header: "MIS", render: (c) => <StatusPill status={c.mis_status} /> },
          { key: "bill", header: "Billing", render: (c) => <StatusPill status={c.billing_status} /> },
          { key: "po", header: "PO / Invoice", render: (c) => c.po_number ? <span className="font-mono text-[11.5px] text-brand">{c.po_number}</span> : <span className="text-slate-400">—</span> },
          { key: "date", header: "Disbursed", align: "right", render: (c) => (c.disbursed_date ? fmtDate(c.disbursed_date) : "—") },
        ]}
      />
    </>
  );
}
