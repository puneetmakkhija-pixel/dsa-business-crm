import { requireRole } from "@/lib/auth";
import { BL_ROLES } from "@/lib/roles";
import { getBrePolicy, getPincodeServiceability, lendersForPincode } from "@/lib/crm-queries";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/dashboard/Panel";
import { StatGrid, type Stat } from "@/components/ui/StatCard";

export const dynamic = "force-dynamic";

const CAT_ORDER = ["PROFILE-BASED", "BANKING-BASED", "BUREAU-BASED"];

export default async function BrePage({ searchParams }: { searchParams: { lender?: string; pincode?: string } }) {
  await requireRole(BL_ROLES);

  const [policy, serv] = await Promise.all([getBrePolicy(), getPincodeServiceability()]);
  const lenders = [...new Set(policy.map((r) => r.lender))].sort();
  const selected = searchParams.lender && lenders.includes(searchParams.lender) ? searchParams.lender : lenders[0];

  const pin = (searchParams.pincode ?? "").replace(/\D/g, "").slice(0, 6);
  const validPin = pin.length === 6;
  const eligible = validPin ? await lendersForPincode(Number(pin)) : null;

  const rules = policy.filter((r) => r.lender === selected);
  const byCat = CAT_ORDER.map((cat) => ({ cat, rows: rules.filter((r) => r.category === cat) })).filter((g) => g.rows.length);

  const totalServ = serv.reduce((s, l) => s + l.pincode_count, 0);
  const stats: Stat[] = [
    { label: "Lenders (BRE)", value: String(lenders.length), sub: "live credit policy", tone: "blue", icon: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" },
    { label: "Policy criteria", value: String(policy.length), sub: "across profile/banking/bureau", tone: "violet", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
    { label: "Pincode serviceability", value: serv.length ? Math.max(...serv.map((s) => s.pincode_count)).toLocaleString("en-IN") : "—", sub: `${serv.length} lender maps`, tone: "green", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a2 2 0 1 0 0 .01" },
  ];

  const CHIP = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold";

  return (
    <>
      <PageHeader eyebrow="Risk / BRE" title="Lender BRE & Routing" />
      <StatGrid stats={stats} cols={3} />

      {/* Pincode routing tool */}
      <Panel className="mb-4">
        <h3 className="font-display text-[15px] font-bold text-slate-900">Pincode serviceability check</h3>
        <span className="text-[11.5px] text-slate-500">Enter a 6-digit pincode to see which lenders serve it.</span>
        <form method="get" className="mt-3 flex flex-wrap items-center gap-2.5">
          <input type="hidden" name="lender" value={selected} />
          <input
            name="pincode"
            defaultValue={pin}
            inputMode="numeric"
            placeholder="e.g. 504209"
            className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Check</button>
        </form>
        {eligible && (
          <div className="mt-4">
            <div className="text-[12px] text-slate-500">
              Pincode <span className="font-semibold text-slate-900">{pin}</span> — {eligible.length} serviceable lender{eligible.length === 1 ? "" : "s"}:
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {eligible.length === 0 ? (
                <span className={`${CHIP} bg-rose-100 text-rose-700`}>No lender services this pincode</span>
              ) : (
                eligible.map((l) => <span key={l} className={`${CHIP} bg-emerald-100 text-emerald-700`}>{l}</span>)
              )}
            </div>
          </div>
        )}
      </Panel>

      {/* Lender policy */}
      <Panel className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-[15px] font-bold text-slate-900">Lender credit policy</h3>
            <span className="text-[11.5px] text-slate-500">{rules.length} criteria for {selected}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {lenders.map((l) => (
            <a
              key={l}
              href={`/bre?lender=${encodeURIComponent(l)}${validPin ? `&pincode=${pin}` : ""}`}
              className={`${CHIP} ${l === selected ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {l}
            </a>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {byCat.map((g) => (
            <div key={g.cat} className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {g.cat.replace("-BASED", "")}
              </div>
              <div>
                {g.rows.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 border-t border-slate-50 px-4 py-2.5 first:border-t-0">
                    <span className="text-[12px] text-slate-500">{r.feature}</span>
                    <span className="text-[12.5px] font-semibold text-slate-900 text-right">{r.criteria}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Pincode serviceability counts */}
      <Panel>
        <h3 className="font-display text-[15px] font-bold text-slate-900">Pincode serviceability by lender</h3>
        <span className="text-[11.5px] text-slate-500">{totalServ.toLocaleString("en-IN")} lender-pincode mappings loaded</span>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
          {serv.map((s) => (
            <div key={s.lender} className="flex items-center justify-between border-t border-slate-50 py-2">
              <span className="text-[12.5px] text-slate-700">{s.lender}</span>
              <span className="font-display text-[12.5px] font-bold text-slate-900">{s.pincode_count.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
