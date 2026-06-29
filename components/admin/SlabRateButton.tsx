"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setLenderRateAction } from "@/app/(app)/slabs/actions";
import Button from "@/components/ui/Button";

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "mb-1.5 block text-[11px] font-semibold text-slate-600";

export default function SlabRateButton({
  lenderId,
  lenderName,
  currentRate,
}: {
  lenderId: number;
  lenderName: string;
  currentRate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rate, setRate] = useState("");
  const [eff, setEff] = useState("2026-06-01");

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await setLenderRateAction({ lenderId, rate: Number(rate), effectiveFrom: eff });
    setBusy(false);
    if (res.ok) { setOpen(false); router.refresh(); } else setErr(res.error ?? "Failed");
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => { setRate(""); setOpen(true); }}>Edit rate</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-[400px] max-w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xl text-left" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 font-display text-[15px] font-bold text-slate-900">Set payout rate</div>
            <div className="mb-3 text-[12px] text-slate-500">{lenderName} · current {currentRate}</div>
            <label className={labelCls}>New payout rate %</label>
            <input className={inputCls} type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 3.00" autoFocus />
            <label className={`${labelCls} mt-3`}>Effective from</label>
            <input className={inputCls} type="date" value={eff} onChange={(e) => setEff(e.target.value)} />
            {err && <div className="mt-2 text-[12px] text-rose-600">{err}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={busy || !rate}>{busy ? "Saving…" : "Save rate"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
