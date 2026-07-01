import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES, ROLE_LABELS, creatableRoles, type Role } from "@/lib/roles";
import { getUsers, getPartners } from "@/lib/crm-queries";
import { DEPT_LABELS, type Department } from "@/lib/departments";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import CreateUserForm from "@/components/admin/CreateUserForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await requireRole(ADMIN_ROLES);
  const [rows, partners] = await Promise.all([getUsers(), getPartners()]);

  return (
    <>
      <PageHeader eyebrow="Administration" title="Users & Roles" />
      <CreateUserForm
        allowedRoles={creatableRoles(profile.role)}
        partners={partners.map((p) => ({ id: p.id, name: p.name }))}
        managers={rows.filter((u) => u.is_active).map((u) => ({ id: u.id, name: u.name }))}
      />
      <DataTable
        title={`${rows.length} users`}
        subtitle="CRM accounts across DSA-side and BL-side roles"
        rows={rows}
        rowKey={(u) => u.id}
        columns={[
          { key: "name", header: "Name", render: (u) => <span style={{ fontWeight: 600 }}>{u.name}</span> },
          { key: "email", header: "Email", render: (u) => <span style={{ color: "#64748b" }}>{u.email}</span> },
          { key: "dept", header: "Department", render: (u) => (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 7, background: u.department === "call_center" ? "#ede9fe" : u.department === "dsa" ? "#dcfce7" : "#f1f5f9", color: u.department === "call_center" ? "#7c3aed" : u.department === "dsa" ? "#15803d" : "#64748b" }}>
              {u.department ? DEPT_LABELS[u.department as Department] : "Both"}
            </span>
          ) },
          { key: "role", header: "Role", render: (u) => (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 7, background: "#dbeafe", color: "#1d4ed8" }}>
              {ROLE_LABELS[u.role as Role] ?? u.role}
            </span>
          ) },
          { key: "dsa", header: "DSA Scope", render: (u) => <span style={{ color: "#94a3b8" }}>{u.dsa_partner_id ? `Partner #${u.dsa_partner_id}` : "All (BL)"}</span> },
          { key: "status", header: "Status", align: "right", render: (u) => <StatusPill status={u.is_active ? "active" : "inactive"} /> },
        ]}
      />
    </>
  );
}
