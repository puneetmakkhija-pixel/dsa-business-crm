import type { Role } from "@/lib/roles";

/**
 * Demo identities for the role-switcher. These are seeded demo accounts only —
 * the switcher is gated behind NEXT_PUBLIC_ENABLE_ROLE_SWITCHER and absent in
 * real production, so exposing these passwords here is acceptable for the demo.
 */
export type DemoUser = {
  role: Role;
  label: string;
  email: string;
  password: string;
  blurb: string;
};

export const DEMO_PASSWORD = "demo12345";

export const DEMO_USERS: DemoUser[] = [
  { role: "dsa_agent", label: "DSA Agent", email: "agent@demo.bl", password: DEMO_PASSWORD, blurb: "Own cases only" },
  { role: "dsa_owner", label: "DSA Owner", email: "owner@demo.bl", password: DEMO_PASSWORD, blurb: "Own DSA + invoices" },
  { role: "bl_dsa_manager", label: "BL Manager", email: "manager@demo.bl", password: DEMO_PASSWORD, blurb: "All cases, onboard DSA" },
  { role: "bl_dsa_mis", label: "BL MIS", email: "mis@demo.bl", password: DEMO_PASSWORD, blurb: "Upload MIS, recon" },
  { role: "bl_accounts", label: "BL Accounts", email: "accounts@demo.bl", password: DEMO_PASSWORD, blurb: "Invoices, payouts" },
  { role: "bl_dsa_admin_bl", label: "Admin (BL)", email: "adminbl@demo.bl", password: DEMO_PASSWORD, blurb: "Slabs, full access" },
  { role: "bl_dsa_admin_pl", label: "Admin (PL)", email: "adminpl@demo.bl", password: DEMO_PASSWORD, blurb: "P&L, full access" },
  { role: "tech_super_admin", label: "Tech Super Admin", email: "super@demo.bl", password: DEMO_PASSWORD, blurb: "Everything + admins" },
];

export const ROLE_SWITCHER_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true";
