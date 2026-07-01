import { ALL_ROLES, BL_ROLES, ADMIN_ROLES, type Role } from "@/lib/roles";
import type { Department } from "@/lib/departments";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  roles: Role[];
  depts: Department[];
};

const BOTH: Department[] = ["call_center", "dsa"];
const CC: Department[] = ["call_center"];
const DSA: Department[] = ["dsa"];

// Full navigation set — per-role AND per-department visibility.
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z", roles: ALL_ROLES, depts: BOTH },

  // ── Call Center ──
  { key: "bl-pnl", label: "P&L — Call Center", href: "/bl-pnl", icon: "M3 3v18h18M7 14l4-4 4 4 5-6", roles: ["bl_accounts", "bl_dsa_admin_pl", "bl_dsa_admin_bl", "tech_super_admin"], depts: CC },
  { key: "incentives", label: "Incentives", href: "/incentives", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", roles: BL_ROLES, depts: CC },
  { key: "pip", label: "PIP / Performance", href: "/pip", icon: "M22 12h-4l-3 9L9 3l-3 9H2M16 6l-4-4-4 4", roles: ["bl_dsa_manager", "bl_dsa_admin_pl", "bl_dsa_admin_bl", "tech_super_admin"], depts: CC },

  // ── DSA ──
  { key: "partners", label: "DSA Partners", href: "/partners", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", roles: BL_ROLES, depts: DSA },
  { key: "cases", label: "Cases", href: "/cases", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6", roles: ALL_ROLES, depts: DSA },
  { key: "calendar", label: "Follow-ups", href: "/calendar", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", roles: ALL_ROLES, depts: DSA },
  { key: "mis", label: "MIS Upload", href: "/mis", icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12", roles: ["bl_dsa_mis", "bl_accounts", ...ADMIN_ROLES], depts: DSA },
  { key: "billing", label: "Billing Recon", href: "/billing", icon: "M22 12h-4l-3 9L9 3l-3 9H2", roles: BL_ROLES, depts: DSA },
  { key: "invoices", label: "Invoices / PO", href: "/invoices", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", roles: ALL_ROLES, depts: DSA },
  { key: "disputes", label: "Disputes", href: "/disputes", icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01", roles: ALL_ROLES, depts: DSA },
  { key: "pnl", label: "Accounts / P&L", href: "/pnl", icon: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6", roles: ["bl_accounts", "bl_dsa_admin_pl", "bl_dsa_admin_bl", "tech_super_admin", "dsa_owner"], depts: DSA },
  { key: "sync", label: "Sheet Sync", href: "/sync", icon: "M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16", roles: ["bl_dsa_mis", ...ADMIN_ROLES], depts: DSA },
  { key: "slabs", label: "Slabs / Rates", href: "/slabs", icon: "M4 7V4h16v3M9 20h6M12 4v16", roles: ADMIN_ROLES, depts: DSA },

  // ── Shared ──
  { key: "reports", label: "Reports", href: "/reports", icon: "M12 20V10M18 20V4M6 20v-4", roles: BL_ROLES, depts: BOTH },
  { key: "bre", label: "Lender BRE", href: "/bre", icon: "M9 12l2 2 4-4M12 3l8 4v5c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7z", roles: BL_ROLES, depts: BOTH },
  { key: "assumptions", label: "Assumptions", href: "/assumptions", icon: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z", roles: ADMIN_ROLES, depts: CC },
  { key: "admin", label: "Admin / Users", href: "/admin", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 .01M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", roles: ADMIN_ROLES, depts: BOTH },
  { key: "audit", label: "Audit Log", href: "/audit", icon: "M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", roles: BL_ROLES, depts: BOTH },
];

// Visible items for a role + department. Super admins and department-less
// users (unrestricted) see every role-permitted item across both departments.
export function navFor(role: Role, department: Department | null): NavItem[] {
  return NAV_ITEMS.filter(
    (i) => i.roles.includes(role) && (role === "tech_super_admin" || department == null || i.depts.includes(department))
  );
}

export function navForRole(role: Role): NavItem[] {
  return navFor(role, null);
}
