"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { processMisAction, sampleMisRowsAction, type MisRow } from "@/app/(app)/mis/actions";
import Panel from "@/components/dashboard/Panel";
import { MONTHS } from "@/lib/format";

const field: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 12.5,
  color: "#0f172a",
  outline: "none",
  width: "100%",
};
const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" };

function normDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export default function MisUploadForm({ lenders }: { lenders: { id: number; name: string }[] }) {
  const router = useRouter();
  const [type, setType] = useState<"daily" | "billing">("daily");
  const [lenderId, setLenderId] = useState(lenders[0]?.id ?? 0);
  const [misDate, setMisDate] = useState("2026-05-31");
  const [billingMonth, setBillingMonth] = useState("2026-05");
  const [rows, setRows] = useState<MisRow[]>([]);
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; summary?: { total: number; matched: number; unmatched: number; disputed: number } } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    const parsed: MisRow[] = json
      .map((r) => {
        const keys = Object.keys(r);
        const lanK = keys.find((k) => /lan/i.test(k)) ?? keys[0];
        const amtK = keys.find((k) => /amount|amt|disb/i.test(k)) ?? keys[1];
        const dateK = keys.find((k) => /date/i.test(k)) ?? keys[2];
        return {
          lan: String(r[lanK] ?? "").trim(),
          amount: Number(String(r[amtK] ?? "").replace(/[^0-9.\-]/g, "")) || null,
          date: normDate(r[dateK]),
        };
      })
      .filter((r) => r.lan);
    setRows(parsed);
  }

  async function process() {
    setBusy(true);
    setResult(null);
    const res = await processMisAction({
      type,
      lenderId: Number(lenderId),
      misDate: type === "daily" ? misDate : null,
      billingMonth: type === "billing" ? billingMonth : null,
      filename,
      rows,
    });
    setBusy(false);
    if (res.ok && res.summary) {
      setResult({ ok: true, text: "Processed", summary: res.summary });
      setRows([]);
      setFilename("");
      router.refresh();
    } else {
      setResult({ ok: false, text: res.error ?? "Failed" });
    }
  }

  async function downloadSample() {
    const sample = await sampleMisRowsAction(Number(lenderId));
    const csv = ["LAN,Amount,Date", ...sample.map((r) => `${r.lan},${r.amount},${r.date}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample-mis-${lenderId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
      <Panel>
        <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-sora), sans-serif", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Upload MIS file</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={label}>Type</label>
            <select style={field} value={type} onChange={(e) => setType(e.target.value as "daily" | "billing")}>
              <option value="daily">Daily MIS</option>
              <option value="billing">Billing MIS</option>
            </select>
          </div>
          <div>
            <label style={label}>Lender</label>
            <select style={field} value={lenderId} onChange={(e) => setLenderId(Number(e.target.value))}>
              {lenders.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {type === "daily" ? (
            <div>
              <label style={label}>MIS date</label>
              <input style={field} type="date" value={misDate} onChange={(e) => setMisDate(e.target.value)} />
            </div>
          ) : (
            <div>
              <label style={label}>Billing month</label>
              <select style={field} value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)}>
                {MONTHS.filter((m) => m.value !== "all").map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={label}>File (.csv / .xlsx)</label>
            <input style={{ ...field, padding: "8px 10px" }} type="file" accept=".csv,.xlsx,.xls" onChange={onFile} />
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 11.5, color: "#64748b" }}>
          {rows.length > 0 ? `${rows.length} rows parsed from ${filename}` : "Columns auto-detected: LAN, Amount, Date."}
          {" · "}
          <button onClick={downloadSample} style={{ background: "none", border: "none", color: "#7CA8FF", cursor: "pointer", fontSize: 11.5, padding: 0, textDecoration: "underline" }}>
            download sample for this lender
          </button>
        </div>

        {result && !result.ok && <div style={{ marginTop: 10, fontSize: 12, color: "#FB7185" }}>{result.text}</div>}

        <button onClick={process} disabled={busy || rows.length === 0} style={{ marginTop: 14, padding: "10px 18px", borderRadius: 11, border: "none", cursor: busy || rows.length === 0 ? "default" : "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)", opacity: busy || rows.length === 0 ? 0.5 : 1 }}>
          {busy ? "Processing…" : `Process ${type} MIS`}
        </button>
      </Panel>

      <Panel>
        <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-sora), sans-serif", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Result</h3>
        {result?.summary ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { k: "Total rows", v: result.summary.total, c: "#0f172a" },
              { k: "Matched", v: result.summary.matched, c: "#34D399" },
              { k: "Unmatched", v: result.summary.unmatched, c: "#7CA8FF" },
              { k: "Auto-disputed", v: result.summary.disputed, c: "#FB7185" },
            ].map((s) => (
              <div key={s.k} style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, color: "#475569" }}>{s.k}</div>
                <div style={{ fontFamily: "var(--font-sora), sans-serif", fontSize: 24, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6 }}>
            Upload a file and process it to see how many rows matched booked cases, how many were unmatched, and how many auto-raised a dispute (amount diff &gt; ₹100 on daily, or &gt; 3% variance on billing).
          </div>
        )}
      </Panel>
    </div>
  );
}
