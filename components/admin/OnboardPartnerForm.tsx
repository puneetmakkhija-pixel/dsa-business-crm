"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPartnerAction } from "@/app/(app)/partners/actions";
import Panel from "@/components/dashboard/Panel";

const field: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 12.5,
  color: "#E8EEF6",
  outline: "none",
  width: "100%",
};
const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#8DA2BD", marginBottom: 6, display: "block" };

export default function OnboardPartnerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", vendorCode: "", gst: "", pan: "", blMarginPct: 7.5 });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await createPartnerAction(form);
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: res.message ?? "Onboarded" });
      setForm({ name: "", vendorCode: "", gst: "", pan: "", blMarginPct: 7.5 });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error ?? "Failed" });
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ padding: "10px 16px", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)" }}
      >
        + Onboard DSA
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <Panel>
        <form onSubmit={submit}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-sora), sans-serif", fontSize: 15, fontWeight: 700, color: "#F4F8FE" }}>Onboard a DSA partner</h3>
            <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#7E93B0", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={label}>DSA name</label>
              <input style={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={label}>Vendor code</label>
              <input style={field} value={form.vendorCode} onChange={(e) => setForm({ ...form, vendorCode: e.target.value })} required placeholder="V-XXXX" />
            </div>
            <div>
              <label style={label}>BL margin %</label>
              <input style={field} type="number" step="0.01" value={form.blMarginPct} onChange={(e) => setForm({ ...form, blMarginPct: Number(e.target.value) })} />
            </div>
            <div>
              <label style={label}>GST no (optional)</label>
              <input style={field} value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
            </div>
            <div>
              <label style={label}>PAN (optional)</label>
              <input style={field} value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
            </div>
          </div>
          {msg && <div style={{ marginTop: 12, fontSize: 12, color: msg.ok ? "#34D399" : "#FB7185" }}>{msg.text}</div>}
          <button type="submit" disabled={busy} style={{ marginTop: 16, padding: "10px 18px", borderRadius: 11, border: "none", cursor: busy ? "default" : "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Onboarding…" : "Onboard DSA"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
