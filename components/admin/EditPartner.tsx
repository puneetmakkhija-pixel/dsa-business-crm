"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePartnerAction } from "@/app/(app)/partners/actions";
import Button from "@/components/ui/Button";

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "mb-1.5 block text-[11px] font-semibold text-slate-600";

export default function EditPartner({
  partner,
  managers,
}: {
  partner: { id: number; name: string; manager_user_id: string | null; bl_margin_pct: number };
  managers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manager, setManager] = useState(partner.manager_user_id ?? "");
  const [margin, setMargin] = useState(String(partner.bl_margin_pct));

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await updatePartnerAction({
      id: partner.id,
      managerUserId: manager || null,
      blMarginPct: margin === "" ? null : Number(margin),
    });
    setBusy(false);
    if (res.ok) { setOpen(false); router.refresh(); } else setErr(res.error ?? "Failed");
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Edit</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-[420px] max-w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 font-display text-[15px] font-bold text-slate-900">{partner.name}</div>
            <label className={labelCls}>DSA Manager</label>
            <select className={inputCls} value={manager} onChange={(e) => setManager(e.target.value)}>
              <option value="">— Unassigned —</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <label className={`${labelCls} mt-3`}>BL margin % (DSA-wise payout)</label>
            <input className={inputCls} type="number" step="0.01" value={margin} onChange={(e) => setMargin(e.target.value)} />
            <p className="mt-1.5 text-[11px] text-slate-400">Higher margin = BL keeps more, DSA payout share is lower. Applies to new cases.</p>
            {err && <div className="mt-2 text-[12px] text-rose-600">{err}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
