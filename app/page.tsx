import Dashboard from "@/components/dashboard/Dashboard";
import { getDashboardData } from "@/lib/dashboard-data";

// Always render fresh from the database.
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}
