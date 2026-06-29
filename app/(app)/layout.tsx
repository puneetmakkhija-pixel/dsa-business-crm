import { requireProfile } from "@/lib/auth";
import { navForRole } from "@/lib/nav";
import { ROLE_LABELS } from "@/lib/roles";
import { ROLE_SWITCHER_ENABLED } from "@/lib/demo-roles";
import Sidebar from "@/components/dashboard/Sidebar";
import RoleSwitcher from "@/components/auth/RoleSwitcher";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const items = navForRole(profile.role);

  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      <Sidebar items={items} name={profile.name} roleLabel={ROLE_LABELS[profile.role]} />
      <main className="min-w-0 flex-1 px-7 py-6 lg:px-9">{children}</main>
      {ROLE_SWITCHER_ENABLED && <RoleSwitcher currentRole={profile.role} />}
    </div>
  );
}
