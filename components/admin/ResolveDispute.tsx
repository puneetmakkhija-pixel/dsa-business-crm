"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveDisputeAction } from "@/app/(app)/disputes/actions";
import Button from "@/components/ui/Button";

export default function ResolveDispute({ id, lan }: { id: number; lan: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function act(status: "resolved" | "rejected") {
    setBusy(true);
    setErr(null);
    const res = await resolveDisputeAction({ id, status, note });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setNote("");
      router.refresh();
    } else {
      setErr(res.error ?? "Failed");
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Resolve</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-[420px] max-w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 font-display text-[15px] font-bold text-slate-900">Resolve dispute</div>
            <div className="mb-3 text-[12px] text-slate-500">LAN {lan}</div>
            <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">Resolution note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What was decided / corrected…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            {err && <div className="mt-2 text-[12px] text-rose-600">{err}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => act("rejected")} disabled={busy}>Reject</Button>
              <Button variant="success" size="sm" onClick={() => act("resolved")} disabled={busy}>Resolve</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
