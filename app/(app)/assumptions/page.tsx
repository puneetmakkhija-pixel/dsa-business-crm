import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { getIncentiveConfig, getLenderPayoutRates, getPlMonthsRaw } from "@/lib/crm-queries";
import PageHeader from "@/components/ui/PageHeader";
import AssumptionsEditor from "./AssumptionsEditor";

export const dynamic = "force-dynamic";

export default async function AssumptionsPage() {
  await requireRole(ADMIN_ROLES);
  const [config, rates, months] = await Promise.all([getIncentiveConfig(), getLenderPayoutRates(), getPlMonthsRaw()]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Assumptions & Rates" />
      <p className="mb-4 max-w-3xl text-[13px] text-slate-500">
        Enter or update the values that drive Incentives, PIP and P&amp;L. Everything recalculates automatically after
        saving. These are the numbers otherwise loaded from sheets — edit them here whenever they change.
      </p>
      <AssumptionsEditor config={config} rates={rates} months={months} />
    </>
  );
}
