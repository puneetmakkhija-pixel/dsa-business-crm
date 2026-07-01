import { inr, pct } from "@/lib/format";
import type { AggCase, Lender } from "@/lib/crm-queries";
import Panel from "@/components/dashboard/Panel";
import { StatGrid, type Stat } from "@/components/ui/StatCard";

// ── Date-window helpers (ISO "YYYY-MM-DD" strings sort lexicographically) ──
function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-based; day 0 of next month
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

type Window = { disb: number; rev: number };
const empty = (): Window => ({ disb: 0, rev: 0 });
const add = (w: Window, c: AggCase) => {
  w.disb += c.disbursed_amount;
  w.rev += c.payout_amt;
};
const rate = (w: Window) => (w.disb > 0 ? (w.rev / w.disb) * 100 : 0);
const delta = (cur: number, base: number) => (base > 0 ? ((cur - base) / base) * 100 : null);

// Channel of a case. No channel dimension exists yet (all imported business is
// DSA); the Call Center side lights up once the lead funnel writes CC-tagged
// loan_cases. Forward-compatible: reads a `channel` field when present.
type Channel = "cc" | "dsa";
const channelOf = (c: AggCase): Channel =>
  (c as { channel?: string }).channel === "call_center" ? "cc" : "dsa";

export default function BusinessLoansCompiled({ cases, lenders }: { cases: AggCase[]; lenders: Lender[] }) {
  const dated = cases.filter((c) => c.disbursed_date);
  const asOf = dated.reduce((mx, c) => (c.disbursed_date! > mx ? c.disbursed_date! : mx), "0000-00-00");
  const [ay, am, ad] = asOf.split("-").map(Number);

  const monthStart = `${ay}-${pad(am)}-01`;
  // Last month, same day-of-month (capped to that month's length).
  const pm = am === 1 ? 12 : am - 1;
  const py = am === 1 ? ay - 1 : ay;
  const lmDay = Math.min(ad, daysInMonth(py, pm));
  const lmStart = `${py}-${pad(pm)}-01`;
  const lmEnd = `${py}-${pad(pm)}-${pad(lmDay)}`;

  const inFtd = (d: string) => d === asOf;
  const inMtd = (d: string) => d >= monthStart && d <= asOf;
  const inLmsd = (d: string) => d >= lmStart && d <= lmEnd;

  // Totals per window, and per window split by channel.
  const ftd = empty(), mtd = empty(), lmsd = empty();
  const mtdByChannel: Record<Channel, Window> = { cc: empty(), dsa: empty() };
  // Per-lender per-window disbursal + MTD revenue.
  const perLender = new Map<number, { ftd: number; mtd: Window; lmsd: number }>();

  for (const c of dated) {
    const d = c.disbursed_date!;
    const isF = inFtd(d), isM = inMtd(d), isL = inLmsd(d);
    if (isF) add(ftd, c);
    if (isM) {
      add(mtd, c);
      add(mtdByChannel[channelOf(c)], c);
    }
    if (isL) add(lmsd, c);
    if (isF || isM || isL) {
      const e = perLender.get(c.lender_id) ?? { ftd: 0, mtd: empty(), lmsd: 0 };
      if (isF) e.ftd += c.disbursed_amount;
      if (isM) add(e.mtd, c);
      if (isL) e.lmsd += c.disbursed_amount;
      perLender.set(c.lender_id, e);
    }
  }

  const lenderName = new Map(lenders.map((l) => [l.id, l.name]));
  const lenderRows = [...perLender.entries()]
    .map(([id, e]) => ({ id, name: lenderName.get(id) ?? "—", ...e }))
    .sort((a, b) => b.mtd.disb - a.mtd.disb);

  const dDisb = delta(mtd.disb, lmsd.disb);
  const dRev = delta(mtd.rev, lmsd.rev);
  const deltaSub = (d: number | null, label: string) =>
    d == null ? `no ${label} baseline` : `${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(1)}% vs ${label}`;

  const stats: Stat[] = [
    { label: "MTD Disbursal", value: inr(mtd.disb), sub: deltaSub(dDisb, "LMSD"), tone: (dDisb ?? 0) >= 0 ? "blue" : "rose", icon: "M3 3v18h18M7 14l4-4 4 4 5-6" },
    { label: "MTD Revenue", value: inr(mtd.rev), sub: `${pct(rate(mtd))} rate · ${deltaSub(dRev, "LMSD")}`, tone: (dRev ?? 0) >= 0 ? "green" : "rose", icon: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
    { label: "FTD Disbursal", value: inr(ftd.disb), sub: `${asOf} · ${inr(ftd.rev)} revenue`, tone: "violet", icon: "M12 8v8m-4-4h8M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" },
    { label: "Blended Revenue Rate", value: pct(rate(mtd)), sub: "MTD revenue ÷ disbursal", tone: "amber", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  ];

  const cc = mtdByChannel.cc, dsa = mtdByChannel.dsa;
  const splitRows: { ch: string; w: Window; note?: string }[] = [
    { ch: "Call Center", w: cc, note: cc.disb === 0 ? "awaiting lead funnel" : undefined },
    { ch: "DSA", w: dsa },
  ];

  const th = "px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500";
  const td = "px-4 py-2.5 text-[13px] text-slate-700";
  const num = "text-right tabular-nums";

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-brand">
          <span className="h-3.5 w-1 rounded-full bg-brand" />
          Business Loans · CC + DSA
        </div>
        <h1 className="mt-1 font-display text-[24px] font-bold tracking-tight text-slate-900">Consolidated Command Center</h1>
        <p className="mt-0.5 text-[12.5px] text-slate-500">
          As of {asOf} · FTD / MTD / LMSD across Call Center + DSA · all amounts in ₹
        </p>
      </div>

      <StatGrid stats={stats} />

      {/* CC vs DSA split — MTD */}
      <Panel className="mb-5">
        <h3 className="font-display text-[15px] font-bold text-slate-900">Channel split — MTD</h3>
        <span className="text-[11.5px] text-slate-500">Disbursal &amp; revenue by channel, month-to-date</span>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className={`${th} text-left`}>Channel</th>
                <th className={`${th} ${num}`}>Disbursal</th>
                <th className={`${th} ${num}`}>Revenue</th>
                <th className={`${th} ${num}`}>Rev rate</th>
                <th className={`${th} ${num}`}>% of disbursal</th>
              </tr>
            </thead>
            <tbody>
              {splitRows.map((r) => (
                <tr key={r.ch} className="border-t border-slate-100">
                  <td className={td}>
                    <span className="font-semibold text-slate-800">{r.ch}</span>
                    {r.note && <span className="ml-2 text-[11px] text-amber-600">{r.note}</span>}
                  </td>
                  <td className={`${td} ${num} font-semibold text-slate-900`}>{inr(r.w.disb)}</td>
                  <td className={`${td} ${num}`}>{inr(r.w.rev)}</td>
                  <td className={`${td} ${num}`}>{r.w.disb > 0 ? pct(rate(r.w)) : "—"}</td>
                  <td className={`${td} ${num}`}>{mtd.disb > 0 ? ((r.w.disb / mtd.disb) * 100).toFixed(1) + "%" : "—"}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200">
                <td className={`${td} font-bold text-slate-900`}>Total</td>
                <td className={`${td} ${num} font-display font-bold text-slate-900`}>{inr(mtd.disb)}</td>
                <td className={`${td} ${num} font-bold text-slate-900`}>{inr(mtd.rev)}</td>
                <td className={`${td} ${num} font-bold text-brand`}>{pct(rate(mtd))}</td>
                <td className={`${td} ${num} text-slate-400`}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Lender-wise disbursal + revenue */}
      <Panel>
        <h3 className="font-display text-[15px] font-bold text-slate-900">Lender-wise disbursal &amp; revenue</h3>
        <span className="text-[11.5px] text-slate-500">
          FTD ({asOf}) · MTD ({monthStart} → {asOf}) · LMSD ({lmStart} → {lmEnd}) · revenue = what lenders pay us
        </span>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className={`${th} text-left`}>Lender</th>
                <th className={`${th} ${num}`}>FTD disb</th>
                <th className={`${th} ${num}`}>MTD disb</th>
                <th className={`${th} ${num}`}>LMSD disb</th>
                <th className={`${th} ${num}`}>MTD vs LMSD</th>
                <th className={`${th} ${num}`}>Rev rate</th>
                <th className={`${th} ${num}`}>MTD revenue</th>
              </tr>
            </thead>
            <tbody>
              {lenderRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12.5px] text-slate-400">No disbursals in the current windows.</td>
                </tr>
              ) : (
                lenderRows.map((l) => {
                  const d = delta(l.mtd.disb, l.lmsd);
                  return (
                    <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className={`${td} font-semibold text-slate-900`}>{l.name}</td>
                      <td className={`${td} ${num}`}>{l.ftd ? inr(l.ftd) : "—"}</td>
                      <td className={`${td} ${num} font-semibold text-slate-900`}>{inr(l.mtd.disb)}</td>
                      <td className={`${td} ${num} text-slate-500`}>{inr(l.lmsd)}</td>
                      <td className={`${td} ${num}`}>
                        {d == null ? <span className="text-slate-300">—</span> : (
                          <span className={d >= 0 ? "text-emerald-600" : "text-rose-500"}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}%</span>
                        )}
                      </td>
                      <td className={`${td} ${num} text-slate-500`}>{l.mtd.disb > 0 ? pct(rate(l.mtd)) : "—"}</td>
                      <td className={`${td} ${num} font-display font-bold text-slate-900`}>{inr(l.mtd.rev)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {lenderRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className={`${td} font-bold text-slate-900`}>Total</td>
                  <td className={`${td} ${num} font-bold text-slate-900`}>{ftd.disb ? inr(ftd.disb) : "—"}</td>
                  <td className={`${td} ${num} font-bold text-slate-900`}>{inr(mtd.disb)}</td>
                  <td className={`${td} ${num} font-bold text-slate-500`}>{inr(lmsd.disb)}</td>
                  <td className={`${td} ${num}`}>
                    {dDisb == null ? <span className="text-slate-300">—</span> : (
                      <span className={`font-bold ${dDisb >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{dDisb >= 0 ? "▲" : "▼"} {Math.abs(dDisb).toFixed(1)}%</span>
                    )}
                  </td>
                  <td className={`${td} ${num} font-bold text-brand`}>{pct(rate(mtd))}</td>
                  <td className={`${td} ${num} font-display font-bold text-slate-900`}>{inr(mtd.rev)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Panel>
    </>
  );
}
