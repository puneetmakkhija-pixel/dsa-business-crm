import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { getPartners } from "@/lib/crm-queries";
import PageHeader from "@/components/ui/PageHeader";
import SheetSync from "@/components/admin/SheetSync";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  await requireRole(["bl_dsa_manager", ...ADMIN_ROLES]);
  const partners = await getPartners();
  return (
    <>
      <PageHeader eyebrow="Data" title="Google Sheet Sync" />
      <SheetSync partners={partners.map((p) => ({ id: p.id, name: p.name }))} />
    </>
  );
}
