// The 8 CRM roles (mirrors the crm.user_role Postgres enum).
export type Role =
  | "dsa_agent"
  | "dsa_owner"
  | "bl_dsa_manager"
  | "bl_dsa_mis"
  | "bl_accounts"
  | "bl_dsa_admin_bl"
  | "bl_dsa_admin_pl"
  | "tech_super_admin";

export const ROLE_LABELS: Record<Role, string> = {
  dsa_agent: "DSA Agent",
  dsa_owner: "DSA Owner",
  bl_dsa_manager: "BL Manager",
  bl_dsa_mis: "BL MIS",
  bl_accounts: "BL Accounts",
  bl_dsa_admin_bl: "Admin (BL)",
  bl_dsa_admin_pl: "Admin (PL)",
  tech_super_admin: "Tech Super Admin",
};

export const BL_ROLES: Role[] = [
  "bl_dsa_manager",
  "bl_dsa_mis",
  "bl_accounts",
  "bl_dsa_admin_bl",
  "bl_dsa_admin_pl",
  "tech_super_admin",
];

export const ADMIN_ROLES: Role[] = [
  "bl_dsa_admin_bl",
  "bl_dsa_admin_pl",
  "tech_super_admin",
];

export const ALL_ROLES: Role[] = [
  "dsa_agent",
  "dsa_owner",
  ...BL_ROLES,
];

export const isBL = (role: Role) => BL_ROLES.includes(role);
export const isAdmin = (role: Role) => ADMIN_ROLES.includes(role);
export const isDSA = (role: Role) => role === "dsa_agent" || role === "dsa_owner";

/** Roles a given role is allowed to create (mirrors crm.create_user in the DB). */
export function creatableRoles(caller: Role): Role[] {
  if (caller === "tech_super_admin") return ALL_ROLES; // anyone, incl. admins
  if (caller === "bl_dsa_admin_bl" || caller === "bl_dsa_admin_pl")
    return ["dsa_agent", "dsa_owner", "bl_dsa_manager", "bl_dsa_mis", "bl_accounts"];
  if (caller === "bl_dsa_manager") return ["dsa_agent", "dsa_owner"];
  return [];
}

export const canOnboardPartner = (caller: Role): boolean =>
  ["bl_dsa_manager", "bl_dsa_admin_bl", "bl_dsa_admin_pl", "tech_super_admin"].includes(caller);
