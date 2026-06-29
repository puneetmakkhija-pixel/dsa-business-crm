import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { getLenders, getLenderSlabs } from "@/lib/crm-queries";
import { fmtDate } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

function rateLabel(cfg: unknown): string {
  if (Array.isArray(cfg)) return cfg.map((b: { min_cr: number; max_cr: number | null; rate: number }) => `${b.rate}%`).join(" / ") + " (volume)";
  if (cfg && typeof cfg === "object" && "rate" in (cfg as object)) return `${(cfg as { rate: number }).rate}%`;
  return "—";
}

export default async function SlabsPage() {
  await requireRole(ADMIN_ROLES);
  const [lenders, slabs] = await Promise.all([getLenders(), getLenderSlabs()]);
  const slabByLender = new Map(slabs.map((s) => [s.lender_id, s]));

  const rows = lenders.map((l) => ({ ...l, slab: slabByLender.get(l.id) }));

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Slabs / Rates" />
      <DataTable
        title={`${lenders.length} lenders`}
        subtitle="Active payout slab per lender — flat or volume-based"
        rows={rows}
        rowKey={(l) => l.id}
        columns={[
          { key: "name", header: "Lender", render: (l) => <span style={{ fontWeight: 600 }}>{l.name}</span> },
          { key: "code", header: "Code", render: (l) => <span style={{ color: "#64748b" }}>{l.short_code}</span> },
          { key: "type", header: "Slab Type", render: (l) => <span style={{ textTransform: "capitalize" }}>{l.slab_type.replace("_", " ")}</span> },
          { key: "rate", header: "Payout Rate", render: (l) => <span style={{ fontWeight: 600, color: "#1d4ed8" }}>{l.slab ? rateLabel(l.slab.slab_config) : "—"}</span> },
          { key: "eff", header: "Effective From", align: "right", render: (l) => (l.slab ? fmtDate(l.slab.effective_from) : "—") },
          { key: "active", header: "Status", align: "right", render: (l) => <StatusPill status={l.is_active ? "active" : "inactive"} /> },
        ]}
      />
    </>
  );
}
