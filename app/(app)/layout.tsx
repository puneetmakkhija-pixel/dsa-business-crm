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
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        background:
          "radial-gradient(1200px 600px at 18% -8%, #15315A 0%, #0B1D36 45%, #07111F 100%)",
      }}
    >
      <Sidebar items={items} name={profile.name} roleLabel={ROLE_LABELS[profile.role]} />
      <div style={{ flex: 1, minWidth: 0, padding: "26px 34px 40px" }}>{children}</div>
      {ROLE_SWITCHER_ENABLED && <RoleSwitcher currentRole={profile.role} />}
    </div>
  );
}
