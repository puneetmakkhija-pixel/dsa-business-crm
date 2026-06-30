import { ALL_ROLES, BL_ROLES, ADMIN_ROLES, type Role } from "@/lib/roles";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  roles: Role[];
};

// Full navigation set with per-role visibility (TRD §4.2 / §16).
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z", roles: ALL_ROLES },
  { key: "partners", label: "DSA Partners", href: "/partners", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", roles: BL_ROLES },
  { key: "cases", label: "Cases", href: "/cases", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6", roles: ALL_ROLES },
  { key: "mis", label: "MIS Upload", href: "/mis", icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12", roles: ["bl_dsa_mis", "bl_accounts", ...ADMIN_ROLES] },
  { key: "billing", label: "Billing Recon", href: "/billing", icon: "M22 12h-4l-3 9L9 3l-3 9H2", roles: BL_ROLES },
  { key: "invoices", label: "Invoices / PO", href: "/invoices", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8", roles: ALL_ROLES },
  { key: "disputes", label: "Disputes", href: "/disputes", icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01", roles: ALL_ROLES },
  { key: "pnl", label: "Accounts / P&L", href: "/pnl", icon: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6", roles: ["bl_accounts", "bl_dsa_admin_pl", "bl_dsa_admin_bl", "tech_super_admin", "dsa_owner"] },
  { key: "reports", label: "Reports", href: "/reports", icon: "M12 20V10M18 20V4M6 20v-4", roles: BL_ROLES },
  { key: "sync", label: "Sheet Sync", href: "/sync", icon: "M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16", roles: ["bl_dsa_manager", ...ADMIN_ROLES] },
  { key: "slabs", label: "Slabs / Rates", href: "/slabs", icon: "M4 7V4h16v3M9 20h6M12 4v16", roles: ADMIN_ROLES },
  { key: "admin", label: "Admin / Users", href: "/admin", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 .01M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", roles: ADMIN_ROLES },
  { key: "audit", label: "Audit Log", href: "/audit", icon: "M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", roles: BL_ROLES },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}
