import { requireProfile } from "@/lib/auth";
import { getDisputes } from "@/lib/crm-queries";
import { fmtDate } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { StatGrid, type Stat } from "@/components/ui/StatCard";

export const dynamic = "force-dynamic";

export default async function DisputesPage() {
  await requireProfile();
  const rows = await getDisputes();

  const count = (s: string) => rows.filter((d) => d.status === s).length;
  const stats: Stat[] = [
    { label: "Open", value: String(count("open")), tone: "rose", icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" },
    { label: "Under Review", value: String(count("under_review")), tone: "amber", icon: "M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" },
    { label: "Resolved", value: String(count("resolved")), tone: "green", icon: "M20 6L9 17l-5-5" },
    { label: "Auto-Raised", value: String(rows.filter((d) => d.auto_raised).length), tone: "violet", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  ];

  return (
    <>
      <PageHeader eyebrow="Operations" title="Disputes" />
      <StatGrid stats={stats} />
      <DataTable
        title={`${rows.length} disputes`}
        rows={rows}
        rowKey={(d) => d.id}
        empty="No disputes raised."
        columns={[
          { key: "lan", header: "LAN", render: (d) => <span style={{ fontWeight: 600 }}>{d.lan_id}</span> },
          { key: "type", header: "Type", render: (d) => <span style={{ color: "#334155" }}>{d.type.replace(/_/g, " ")}</span> },
          { key: "reason", header: "Reason", render: (d) => <span style={{ color: "#475569" }}>{d.reason}</span> },
          { key: "src", header: "Source", render: (d) => <span style={{ color: "#64748b", fontSize: 11 }}>{d.auto_raised ? "Auto" : "Manual"}</span> },
          { key: "date", header: "Raised", align: "right", render: (d) => fmtDate(d.created_at) },
          { key: "status", header: "Status", align: "right", render: (d) => <StatusPill status={d.status} /> },
        ]}
      />
    </>
  );
}
