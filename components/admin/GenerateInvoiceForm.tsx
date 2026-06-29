"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateInvoiceAction } from "@/app/(app)/invoices/actions";
import { MONTHS } from "@/lib/format";
import Panel from "@/components/dashboard/Panel";
import Button from "@/components/ui/Button";

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "mb-1.5 block text-[11px] font-semibold text-slate-600";

export default function GenerateInvoiceForm({ partners }: { partners: { id: number; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dsa, setDsa] = useState(partners[0]?.id ?? 0);
  const [month, setMonth] = useState("2026-05");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await generateInvoiceAction({ dsaPartnerId: Number(dsa), billingMonth: month });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: res.message ?? "Generated" } : { ok: false, text: res.error ?? "Failed" });
    if (res.ok) router.refresh();
  }

  if (!open) return <Button onClick={() => setOpen(true)}>+ Generate invoice</Button>;

  return (
    <div className="mb-5 w-full">
      <Panel>
        <form onSubmit={submit}>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-slate-900">Generate invoice / PO</h3>
            <button type="button" onClick={() => setOpen(false)} className="text-[18px] text-slate-400 hover:text-slate-600">×</button>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div>
              <label className={labelCls}>DSA partner</label>
              <select className={inputCls} value={dsa} onChange={(e) => setDsa(Number(e.target.value))}>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Billing month</label>
              <select className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTHS.filter((m) => m.value !== "all").map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy}>{busy ? "Generating…" : "Generate"}</Button>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400">Rolls all billed, un-invoiced cases for the DSA + month into one PO with GST. Blocked if open disputes exist.</p>
          {msg && <div className={`mt-2 text-[12px] ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</div>}
        </form>
      </Panel>
    </div>
  );
}
