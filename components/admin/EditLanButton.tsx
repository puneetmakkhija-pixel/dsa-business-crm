"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCaseLanAction } from "@/app/(app)/cases/actions";
import Button from "@/components/ui/Button";

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "mb-1.5 block text-[11px] font-semibold text-slate-600";

export default function EditLanButton({ caseId, currentLan }: { caseId: number; currentLan: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lan, setLan] = useState(currentLan);

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await updateCaseLanAction({ id: caseId, lan });
    setBusy(false);
    if (res.ok) { setOpen(false); router.refresh(); } else setErr(res.error ?? "Failed");
  }

  return (
    <>
      <button
        onClick={() => { setLan(currentLan); setErr(null); setOpen(true); }}
        title="Edit LAN ID"
        className="text-slate-400 transition-colors hover:text-brand"
        aria-label="Edit LAN ID"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-[400px] max-w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xl text-left" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 font-display text-[15px] font-bold text-slate-900">Edit LAN ID</div>
            <div className="mb-3 text-[12px] text-slate-500">Current: <span className="font-mono">{currentLan}</span></div>
            <label className={labelCls}>New LAN ID</label>
            <input
              className={inputCls}
              value={lan}
              onChange={(e) => setLan(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && lan.trim() && lan.trim() !== currentLan) save(); }}
              placeholder="e.g. ABFL000999"
              autoFocus
            />
            <div className="mt-2 text-[11px] text-slate-400">LAN IDs must be unique across all cases.</div>
            {err && <div className="mt-2 text-[12px] text-rose-600">{err}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={busy || !lan.trim() || lan.trim() === currentLan}>{busy ? "Saving…" : "Save LAN"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
