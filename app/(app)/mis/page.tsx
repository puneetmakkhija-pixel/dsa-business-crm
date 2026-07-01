import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { getLenders, getMisUploads } from "@/lib/crm-queries";
import { fmtDate } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import MisUploadForm from "@/components/admin/MisUploadForm";
import PullMisFromEmail from "@/components/admin/PullMisFromEmail";

export const dynamic = "force-dynamic";

export default async function MisPage() {
  await requireRole(["bl_dsa_mis", "bl_accounts", ...ADMIN_ROLES]);
  const [lenders, uploads] = await Promise.all([getLenders(), getMisUploads()]);

  return (
    <>
      <PageHeader eyebrow="Reconciliation" title="MIS Upload" />
      <PullMisFromEmail />
      <MisUploadForm lenders={lenders.map((l) => ({ id: l.id, name: l.name }))} />
      <DataTable
        title="Recent uploads"
        subtitle="Daily & billing MIS files processed"
        rows={uploads}
        rowKey={(u) => u.id}
        empty="No MIS files uploaded yet — try the sample above."
        columns={[
          { key: "file", header: "File", render: (u) => <span style={{ fontWeight: 600 }}>{u.filename}</span> },
          { key: "type", header: "Type", render: (u) => <span style={{ textTransform: "capitalize" }}>{u.upload_type}</span> },
          { key: "lender", header: "Lender", render: (u) => u.lender },
          { key: "period", header: "Period", render: (u) => u.billing_month ?? (u.mis_date ? fmtDate(u.mis_date) : "—") },
          { key: "total", header: "Rows", align: "right", render: (u) => u.total_rows },
          { key: "matched", header: "Matched", align: "right", render: (u) => <span style={{ color: "#34D399" }}>{u.matched_rows}</span> },
          { key: "unmatched", header: "Unmatched", align: "right", render: (u) => <span style={{ color: "#7CA8FF" }}>{u.unmatched_rows}</span> },
          { key: "disputed", header: "Disputed", align: "right", render: (u) => <span style={{ color: "#FB7185" }}>{u.disputed_rows}</span> },
          { key: "status", header: "Status", align: "right", render: (u) => <StatusPill status={u.status === "completed" ? "resolved" : u.status} /> },
        ]}
      />
    </>
  );
}
