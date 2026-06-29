import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import PageHeader from "@/components/ui/PageHeader";
import PhaseNote from "@/components/ui/PhaseNote";

export const dynamic = "force-dynamic";

export default async function MisPage() {
  await requireRole(["bl_dsa_mis", "bl_accounts", ...ADMIN_ROLES]);
  return (
    <>
      <PageHeader eyebrow="Reconciliation" title="MIS Upload" />
      <PhaseNote
        phase="Phase 3"
        title="Daily & Billing MIS upload"
        desc="Upload a lender's daily or monthly MIS Excel/CSV. The matching engine reconciles each row against booked cases by LAN + lender, sets MIS/billing status, computes variance, and auto-raises disputes beyond the 3% threshold. The data model (cases, mis_uploads, disputes) and reconciliation views are already live — file ingestion lands in Phase 3."
        icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
      />
    </>
  );
}
