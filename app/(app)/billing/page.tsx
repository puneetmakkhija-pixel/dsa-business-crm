import { requireRole } from "@/lib/auth";
import { BL_ROLES } from "@/lib/roles";
import { getCases } from "@/lib/crm-queries";
import { inr } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { StatGrid, type Stat } from "@/components/ui/StatCard";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  await requireRole(BL_ROLES);
  const all = await getCases({ limit: 1000 });
  const reconciled = all.filter((c) => c.variance_flag);

  const flag = (f: string) => reconciled.filter((c) => c.variance_flag === f).length;
  const stats: Stat[] = [
    { label: "Match", value: String(flag("match")), sub: "zero variance", tone: "green", icon: "M20 6L9 17l-5-5" },
    { label: "Minor Variance", value: String(flag("minor")), sub: "< 3% accepted", tone: "amber", icon: "M12 8v4M12 16h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" },
    { label: "Review / Disputed", value: String(flag("review")), sub: "> 3% — auto-disputed", tone: "rose", icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" },
    { label: "Reconciled Cases", value: String(reconciled.length), sub: "billing MIS matched", tone: "blue", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  ];

  return (
    <>
      <PageHeader eyebrow="Reconciliation" title="Billing MIS" />
      <StatGrid stats={stats} />
      <DataTable
        title="Variance review"
        subtitle="Cases with a billing-vs-daily MIS variance"
        rows={reconciled.sort((a, b) => (a.variance_flag === "review" ? -1 : 1))}
        rowKey={(c) => c.id}
        empty="No reconciled cases yet."
        columns={[
          { key: "lan", header: "LAN", render: (c) => <span style={{ fontWeight: 600 }}>{c.lan_id}</span> },
          { key: "lender", header: "Lender", render: (c) => c.lender },
          { key: "disb", header: "Booked", align: "right", render: (c) => inr(c.disbursed_amount) },
          { key: "flag", header: "Variance", render: (c) => <StatusPill status={c.variance_flag ?? "match"} /> },
          { key: "bill", header: "Billing", render: (c) => <StatusPill status={c.billing_status} /> },
          { key: "month", header: "Month", align: "right", render: (c) => c.billing_month ?? "—" },
        ]}
      />
    </>
  );
}
