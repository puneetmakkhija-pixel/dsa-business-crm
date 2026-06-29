"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addLenderAction } from "@/app/(app)/slabs/actions";
import Panel from "@/components/dashboard/Panel";
import Button from "@/components/ui/Button";

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "mb-1.5 block text-[11px] font-semibold text-slate-600";

export default function AddLenderForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", shortCode: "", rate: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await addLenderAction({ name: form.name, shortCode: form.shortCode, rate: Number(form.rate) });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: res.message ?? "Added" } : { ok: false, text: res.error ?? "Failed" });
    if (res.ok) { setForm({ name: "", shortCode: "", rate: "" }); router.refresh(); }
  }

  if (!open) return <Button onClick={() => setOpen(true)}>+ Add lender</Button>;

  return (
    <div className="mb-5 w-full">
      <Panel>
        <form onSubmit={submit}>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-slate-900">Add lender</h3>
            <button type="button" onClick={() => setOpen(false)} className="text-[18px] text-slate-400 hover:text-slate-600">×</button>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Lender name</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Short code</label>
              <input className={inputCls} value={form.shortCode} onChange={(e) => setForm({ ...form, shortCode: e.target.value })} required placeholder="ABFL" />
            </div>
            <div>
              <label className={labelCls}>Payout rate %</label>
              <input className={inputCls} type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required placeholder="2.50" />
            </div>
          </div>
          {msg && <div className={`mt-2.5 text-[12px] ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</div>}
          <div className="mt-4"><Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add lender"}</Button></div>
        </form>
      </Panel>
    </div>
  );
}
