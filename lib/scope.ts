import type { Profile } from "@/lib/auth";
import type { Role } from "@/lib/roles";
import type { Department } from "@/lib/departments";

// Who sees everything (both departments, all teams): super admin + admins.
const SEES_ALL: Role[] = ["bl_dsa_admin_bl", "bl_dsa_admin_pl", "tech_super_admin"];
// Team Manager level — scoped to their own team only.
const TEAM_MANAGER: Role = "bl_dsa_manager";

export type DataScope = {
  /** super admin / admin — no restriction, sees both departments. */
  allData: boolean;
  /** the user's department (null = unrestricted). */
  department: Department | null;
  /** Call-Center Team Manager: the roster TL name whose agents they may see. */
  ccTeam: string | null;
  /** DSA Team Manager: their user id (manages a set of DSA partners). */
  dsaManagerId: string | null;
};

export function scopeFor(p: Profile): DataScope {
  if (SEES_ALL.includes(p.role)) {
    return { allData: true, department: null, ccTeam: null, dsaManagerId: null };
  }
  const isTM = p.role === TEAM_MANAGER;
  return {
    allData: false,
    department: p.department,
    ccTeam: isTM && p.department === "call_center" ? p.team_name ?? p.name : null,
    dsaManagerId: isTM && p.department === "dsa" ? p.id : null,
  };
}

/** True when the shared page should show the Call-Center section for this scope. */
export const showsCallCenter = (s: DataScope) => s.allData || s.department === "call_center";
/** True when the shared page should show the DSA section for this scope. */
export const showsDsa = (s: DataScope) => s.allData || s.department === "dsa";
