import { requireRole } from "@/lib/auth";
import { BL_ROLES } from "@/lib/roles";
import PageHeader from "@/components/ui/PageHeader";
import PhaseNote from "@/components/ui/PhaseNote";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireRole(BL_ROLES);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Audit Log" />
      <PhaseNote
        phase="Phase 5"
        title="Immutable audit trail"
        desc="Every create, update, status change, upload, and login is recorded to crm.audit_logs with before/after snapshots, user, and IP. The table is already immutable at the database level (insert + select only, with a trigger blocking updates/deletes). The searchable viewer ships in Phase 5 once write actions across the modules are wired up."
        icon="M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"
      />
    </>
  );
}
