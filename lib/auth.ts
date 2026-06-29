import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/roles";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  dsa_partner_id: number | null;
};

/** Resolves the logged-in user's CRM profile (role + DSA scope), or null. */
export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id,name,email,role,dsa_partner_id")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Redirects to /login if not signed in; returns the profile otherwise. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Requires the session role to be in `allowed`, else redirects to dashboard. */
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) redirect("/");
  return profile;
}
