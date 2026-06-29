"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { bulkCreateCasesAction, type BulkCaseRow, type BulkResult } from "@/app/(app)/cases/actions";
import Panel from "@/components/dashboard/Panel";
import Button from "@/components/ui/Button";

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const labelCls = "mb-1.5 block text-[11px] font-semibold text-slate-600";

function normDate(v: unknown): string {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export default function BulkUploadCases({
  partners,
  showPartner,
}: {
  partners: { id: number; name: string }[];
  showPartner: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<BulkCaseRow[]>([]);
  const [filename, setFilename] = useState("");
  const [dsa, setDsa] = useState(partners[0]?.id ?? 0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setResult(null);
    const wb = XLSX.read(await file.arrayBuffer());
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const parsed: BulkCaseRow[] = json
      .map((r) => {
        const k = Object.keys(r);
        const find = (re: RegExp, i: number) => k.find((x) => re.test(x)) ?? k[i];
        return {
          lan: String(r[find(/lan/i, 0)] ?? "").trim(),
          customer: String(r[find(/customer|name/i, 1)] ?? "").trim(),
          lender: String(r[find(/lender|bank/i, 2)] ?? "").trim(),
          amount: Number(String(r[find(/amount|amt|disb/i, 3)] ?? "").replace(/[^0-9.\-]/g, "")) || 0,
          date: normDate(r[find(/date/i, 4)]),
          loan_type: String(r[find(/type/i, 5)] ?? "BL").trim() || "BL",
        };
      })
      .filter((r) => r.lan && r.lender);
    setRows(parsed);
  }

  async function submit() {
    setBusy(true);
    setResult(null);
    const res = await bulkCreateCasesAction({ rows, dsaPartnerId: showPartner ? Number(dsa) : null });
    setBusy(false);
    setResult(res);
    if (res.ok) {
      setRows([]);
      setFilename("");
      router.refresh();
    }
  }

  function template() {
    const csv = "LAN,Customer,Lender,Amount,Date,LoanType\nABFL000777,Acme Traders,ABFL,1800000,2026-05-20,BL";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "cases-template.csv"; a.click(); URL.revokeObjectURL(url);
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}>Bulk upload</Button>;

  return (
    <div className="mb-5 w-full">
      <Panel>
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="font-display text-[15px] font-bold text-slate-900">Bulk upload cases</h3>
          <button onClick={() => setOpen(false)} className="text-[18px] text-slate-400 hover:text-slate-600">×</button>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {showPartner && (
            <div>
              <label className={labelCls}>DSA partner</label>
              <select className={inputCls} value={dsa} onChange={(e) => setDsa(Number(e.target.value))}>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>File (.csv / .xlsx)</label>
            <input className={`${inputCls} py-1.5`} type="file" accept=".csv,.xlsx,.xls" onChange={onFile} />
          </div>
          <div className="flex items-end">
            <Button onClick={submit} disabled={busy || rows.length === 0}>{busy ? "Uploading…" : `Upload ${rows.length || ""} cases`}</Button>
          </div>
        </div>
        <p className="mt-2.5 text-[11px] text-slate-400">
          Columns: LAN, Customer, Lender, Amount, Date, LoanType ·{" "}
          <button onClick={template} className="text-brand underline">download template</button>
          {filename && rows.length > 0 ? ` · ${rows.length} rows parsed from ${filename}` : ""}
        </p>
        {result && !result.ok && <div className="mt-2 text-[12px] text-rose-600">{result.error}</div>}
        {result?.summary && (
          <div className="mt-3 flex gap-3 text-[12px]">
            <span className="text-emerald-600">Inserted {result.summary.inserted}</span>
            <span className="text-slate-500">Skipped {result.summary.skipped}</span>
            <span className="text-rose-600">Errors {result.summary.errors}</span>
          </div>
        )}
      </Panel>
    </div>
  );
}
