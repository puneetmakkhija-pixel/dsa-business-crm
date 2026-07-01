import { requireProfile } from "@/lib/auth";
import { navFor } from "@/lib/nav";
import { ROLE_LABELS } from "@/lib/roles";
import { DEPT_LABELS } from "@/lib/departments";
import Sidebar from "@/components/dashboard/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const items = navFor(profile.role, profile.department);
  const roleLabel = ROLE_LABELS[profile.role] + (profile.department ? " · " + DEPT_LABELS[profile.department] : "");

  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      <Sidebar items={items} name={profile.name} roleLabel={roleLabel} />
      <main className="min-w-0 flex-1 px-7 py-6 lg:px-9">{children}</main>
    </div>
  );
}
