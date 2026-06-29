"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCaseAction } from "@/app/(app)/cases/actions";
import Panel from "@/components/dashboard/Panel";

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

export default function AddCaseForm({
  lenders,
  partners,
  showPartner,
}: {
  lenders: { id: number; name: string }[];
  partners: { id: number; name: string }[];
  showPartner: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({
    lan: "",
    customer: "",
    lenderId: lenders[0]?.id ?? 0,
    loanType: "BL",
    disbursedAmount: "",
    disbursedDate: "2026-05-15",
    dsaPartnerId: partners[0]?.id ?? 0,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await createCaseAction({
      lan: form.lan,
      lenderId: Number(form.lenderId),
      customer: form.customer,
      loanType: form.loanType,
      disbursedAmount: Number(form.disbursedAmount),
      disbursedDate: form.disbursedDate,
      dsaPartnerId: showPartner ? Number(form.dsaPartnerId) : null,
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: res.message ?? "Added" });
      setForm({ ...form, lan: "", customer: "", disbursedAmount: "" });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error ?? "Failed" });
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ padding: "10px 16px", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)" }}>
        + Add case
      </button>
    );
  }

  return (
    <div style={{ width: "100%", marginBottom: 18 }}>
      <Panel>
        <form onSubmit={submit}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-sora), sans-serif", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Add a case</h3>
            <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            <div>
              <label style={label}>LAN ID</label>
              <input style={field} value={form.lan} onChange={(e) => setForm({ ...form, lan: e.target.value })} required placeholder="e.g. ABFL000999" />
            </div>
            <div>
              <label style={label}>Customer</label>
              <input style={field} value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required />
            </div>
            <div>
              <label style={label}>Lender</label>
              <select style={field} value={form.lenderId} onChange={(e) => setForm({ ...form, lenderId: Number(e.target.value) })}>
                {lenders.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Loan type</label>
              <select style={field} value={form.loanType} onChange={(e) => setForm({ ...form, loanType: e.target.value })}>
                {["BL", "PL", "LAP", "HL"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Disbursed amount (₹)</label>
              <input style={field} type="number" value={form.disbursedAmount} onChange={(e) => setForm({ ...form, disbursedAmount: e.target.value })} required placeholder="1500000" />
            </div>
            <div>
              <label style={label}>Disbursed date</label>
              <input style={field} type="date" value={form.disbursedDate} onChange={(e) => setForm({ ...form, disbursedDate: e.target.value })} required />
            </div>
            {showPartner && (
              <div>
                <label style={label}>DSA partner</label>
                <select style={field} value={form.dsaPartnerId} onChange={(e) => setForm({ ...form, dsaPartnerId: Number(e.target.value) })}>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>Payout % is resolved automatically from the lender&apos;s active slab.</div>
          {msg && <div style={{ marginTop: 10, fontSize: 12, color: msg.ok ? "#34D399" : "#FB7185" }}>{msg.text}</div>}
          <button type="submit" disabled={busy} style={{ marginTop: 14, padding: "10px 18px", borderRadius: 11, border: "none", cursor: busy ? "default" : "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Adding…" : "Add case"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
