"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { saveIncentiveConfig, saveLenderRate, savePlMonth } from "./actions";
import type { IncentiveConfig, LenderRate, PlMonthRaw } from "@/lib/crm-queries";

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const lbl = "mb-1.5 block text-[11px] font-semibold text-slate-600";
const p100 = (f: number) => String(+(f * 100).toFixed(4));

function Note({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return <span className={`text-[12px] ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</span>;
}

/* ---------- 1. Incentive config ---------- */
function ConfigSection({ cfg }: { cfg: IncentiveConfig }) {
  const router = useRouter();
  const [f, setF] = useState({
    revenue_pct: p100(cfg.revenue_pct),
    slab1_pct: p100(cfg.slab1_pct),
    slab2_pct: p100(cfg.slab2_pct),
    slab_break: cfg.slab_break.toString(),
    lap_weight: p100(cfg.lap_weight),
    pl_head_margin_pct: p100(cfg.pl_head_margin_pct),
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true); setMsg(null);
    const res = await saveIncentiveConfig({
      revenue_pct: Number(f.revenue_pct) / 100, slab1_pct: Number(f.slab1_pct) / 100, slab2_pct: Number(f.slab2_pct) / 100,
      slab_break: Number(f.slab_break), lap_weight: Number(f.lap_weight) / 100, pl_head_margin_pct: Number(f.pl_head_margin_pct) / 100,
    });
    setBusy(false); setMsg({ ok: res.ok, text: res.ok ? res.message ?? "Saved" : res.error ?? "Failed" });
    if (res.ok) router.refresh();
  }

  const F = [
    ["revenue_pct", "Blended revenue % (fallback)"], ["slab1_pct", "Incentive % ≤ ₹50L"], ["slab2_pct", "Incentive % > ₹50L"],
    ["slab_break", "Slab break (₹)"], ["lap_weight", "LAP/secured weight %"], ["pl_head_margin_pct", "P&L Head % of margin"],
  ] as const;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="font-display text-[15px] font-bold text-slate-900">Incentive & revenue config</h3>
      <span className="text-[11.5px] text-slate-500">The locked formula parameters. Percentages entered as whole numbers (e.g. 0.65).</span>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {F.map(([k, label]) => (
          <div key={k}>
            <label className={lbl}>{label}</label>
            <input className={input} type="number" step="0.0001" value={f[k]} onChange={set(k)} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save config"}</Button>
        <Note msg={msg} />
      </div>
    </div>
  );
}

/* ---------- 2. Lender payout rates ---------- */
function RatesSection({ rates }: { rates: LenderRate[] }) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<number, string>>(
    Object.fromEntries(rates.map((r) => [r.lender_id, r.payout_pct == null ? "" : p100(r.payout_pct)]))
  );
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(lenderId: number) {
    setBusy(lenderId); setMsg(null);
    const res = await saveLenderRate({ lenderId, payoutPct: Number(vals[lenderId]) / 100 });
    setBusy(null); setMsg({ ok: res.ok, text: res.ok ? res.message ?? "Saved" : res.error ?? "Failed" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="font-display text-[15px] font-bold text-slate-900">Lender payout rates (revenue)</h3>
      <span className="text-[11.5px] text-slate-500">Revenue = disbursal × rate, per lender. Enter as % (e.g. 2.75).</span>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rates.map((r) => (
          <div key={r.lender_id} className="flex items-center gap-2 border-t border-slate-50 py-2">
            <span className="flex-1 text-[13px] text-slate-700">
              {r.lender_name}
              {r.is_placeholder && <span className="ml-1.5 text-[10px] text-amber-600">(est)</span>}
            </span>
            <input
              className={`${input} w-24`} type="number" step="0.01"
              value={vals[r.lender_id] ?? ""} onChange={(e) => setVals({ ...vals, [r.lender_id]: e.target.value })}
            />
            <span className="text-[12px] text-slate-400">%</span>
            <Button size="sm" variant="ghost" onClick={() => save(r.lender_id)} disabled={busy === r.lender_id}>
              {busy === r.lender_id ? "…" : "Save"}
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-2"><Note msg={msg} /></div>
    </div>
  );
}

/* ---------- 3. Monthly P&L entry ---------- */
function PlSection({ months }: { months: PlMonthRaw[] }) {
  const router = useRouter();
  const [f, setF] = useState({ period: "", kind: "actual", revenue: "", spends_excl_bdl: "", spends_incl_bdl: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function pick(m: PlMonthRaw) {
    setF({ period: m.period, kind: m.kind, revenue: String(m.revenue), spends_excl_bdl: String(m.spends_excl_bdl), spends_incl_bdl: String(m.spends_incl_bdl) });
  }
  async function save() {
    setBusy(true); setMsg(null);
    const period = f.period.length === 7 ? f.period + "-01" : f.period;
    const res = await savePlMonth({
      period, kind: f.kind, revenue: Number(f.revenue), spends_excl_bdl: Number(f.spends_excl_bdl), spends_incl_bdl: Number(f.spends_incl_bdl),
    });
    setBusy(false); setMsg({ ok: res.ok, text: res.ok ? res.message ?? "Saved" : res.error ?? "Failed" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="font-display text-[15px] font-bold text-slate-900">Monthly P&amp;L — add / edit a month</h3>
      <span className="text-[11.5px] text-slate-500">Enter revenue &amp; spends per month. Click a month below to edit it.</span>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {months.map((m) => (
          <button key={m.period} onClick={() => pick(m)}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200">
            {m.period.slice(0, 7)}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div><label className={lbl}>Month</label><input className={input} type="month" value={f.period.slice(0, 7)} onChange={(e) => setF({ ...f, period: e.target.value })} /></div>
        <div><label className={lbl}>Kind</label>
          <select className={input} value={f.kind} onChange={set("kind")}>
            <option value="actual">actual</option><option value="projection">projection</option><option value="plan">plan</option>
          </select>
        </div>
        <div><label className={lbl}>Revenue (₹)</label><input className={input} type="number" value={f.revenue} onChange={set("revenue")} /></div>
        <div><label className={lbl}>Spends excl BDL (₹)</label><input className={input} type="number" value={f.spends_excl_bdl} onChange={set("spends_excl_bdl")} /></div>
        <div><label className={lbl}>Spends incl BDL (₹)</label><input className={input} type="number" value={f.spends_incl_bdl} onChange={set("spends_incl_bdl")} /></div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={busy || !f.period || !f.revenue}>{busy ? "Saving…" : "Save month"}</Button>
        <Note msg={msg} />
      </div>
    </div>
  );
}

export default function AssumptionsEditor({ config, rates, months }: { config: IncentiveConfig | null; rates: LenderRate[]; months: PlMonthRaw[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {config && <ConfigSection cfg={config} />}
      <RatesSection rates={rates} />
      <PlSection months={months} />
    </div>
  );
}
