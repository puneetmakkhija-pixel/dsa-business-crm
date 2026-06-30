"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { previewSheetAction, importSheetAction, type PreviewResult } from "@/app/(app)/sync/actions";
import type { BulkResult } from "@/app/(app)/cases/actions";
import Panel from "@/components/dashboard/Panel";
import Button from "@/components/ui/Button";

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "mb-1.5 block text-[11px] font-semibold text-slate-600";

export default function SheetSync({ partners }: { partners: { id: number; name: string }[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [dsa, setDsa] = useState(partners[0]?.id ?? 0);
  const [busy, setBusy] = useState<"" | "preview" | "import">("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);

  async function doPreview() {
    setBusy("preview"); setResult(null); setPreview(null);
    setPreview(await previewSheetAction(url));
    setBusy("");
  }
  async function doImport() {
    setBusy("import"); setResult(null);
    const res = await importSheetAction(url, Number(dsa));
    setResult(res);
    setBusy("");
    if (res.ok) router.refresh();
  }

  return (
    <Panel>
      <h3 className="font-display text-[15px] font-bold text-slate-900">Sync from Google Sheet</h3>
      <p className="mb-4 text-[12px] text-slate-500">
        Paste a link to a <b>case-level</b> tab (columns: LAN ID, Bank Name, Amount, Disbursed Date, Customer, Product).
        The sheet must be shared <b>Anyone with the link → Viewer</b>.
      </p>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1fr_220px]">
        <div>
          <label className={labelCls}>Google Sheet URL (specific tab)</label>
          <input className={inputCls} value={url} onChange={(e) => { setUrl(e.target.value); setPreview(null); setResult(null); }} placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=…" />
        </div>
        <div>
          <label className={labelCls}>Import under DSA</label>
          <select className={inputCls} value={dsa} onChange={(e) => setDsa(Number(e.target.value))}>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" onClick={doPreview} disabled={!url || busy !== ""}>{busy === "preview" ? "Fetching…" : "Fetch & preview"}</Button>
        {preview?.ok && preview.usableRows ? (
          <Button onClick={doImport} disabled={busy !== ""}>{busy === "import" ? "Importing…" : `Import ${preview.usableRows} cases`}</Button>
        ) : null}
      </div>

      {preview && !preview.ok && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{preview.error}</div>}

      {preview?.ok && (
        <div className="mt-4">
          <div className="text-[12px] text-slate-600">
            Detected <b>{preview.usableRows}</b> usable rows of {preview.totalRows}. Columns: {preview.headers?.join(", ")}
          </div>
          {preview.sample && preview.sample.length > 0 && (
            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-[12px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>{["LAN", "Customer", "Lender", "Amount", "Date"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.sample.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">{r.lan}</td>
                      <td className="px-3 py-1.5">{r.customer || "—"}</td>
                      <td className="px-3 py-1.5">{r.lender}</td>
                      <td className="px-3 py-1.5">{r.amount.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-1.5">{r.date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {result && !result.ok && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{result.error}</div>}
      {result?.summary && (
        <div className="mt-3 flex gap-4 text-[12.5px]">
          <span className="font-semibold text-emerald-600">Imported {result.summary.inserted}</span>
          <span className="text-slate-500">Skipped (duplicate) {result.summary.skipped}</span>
          <span className="text-rose-600">Errors {result.summary.errors}</span>
        </div>
      )}
    </Panel>
  );
}
