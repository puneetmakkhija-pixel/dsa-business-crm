"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/app/(app)/admin/actions";
import { ROLE_LABELS, type Role } from "@/lib/roles";
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

export default function CreateUserForm({
  allowedRoles,
  partners,
}: {
  allowedRoles: Role[];
  partners: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [role, setRole] = useState<Role>(allowedRoles[0]);
  const [form, setForm] = useState({ name: "", email: "", password: "", dsaPartnerId: partners[0]?.id ?? 0 });

  const isDsaRole = role === "dsa_agent" || role === "dsa_owner";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await createUserAction({
      name: form.name,
      email: form.email,
      password: form.password,
      role,
      dsaPartnerId: isDsaRole ? form.dsaPartnerId : null,
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: res.message ?? "Created" });
      setForm({ name: "", email: "", password: "", dsaPartnerId: partners[0]?.id ?? 0 });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error ?? "Failed" });
    }
  }

  if (allowedRoles.length === 0) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{ padding: "10px 16px", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)" }}
        >
          + New user
        </button>
      ) : (
        <Panel>
          <form onSubmit={submit}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-sora), sans-serif", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Create a user</h3>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={label}>Full name</label>
                <input style={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={label}>Email</label>
                <input style={field} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label style={label}>Temporary password</label>
                <input style={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div>
                <label style={label}>Role</label>
                <select style={field} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              {isDsaRole && (
                <div>
                  <label style={label}>DSA partner</label>
                  <select style={field} value={form.dsaPartnerId} onChange={(e) => setForm({ ...form, dsaPartnerId: Number(e.target.value) })}>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {msg && <div style={{ marginTop: 12, fontSize: 12, color: msg.ok ? "#34D399" : "#FB7185" }}>{msg.text}</div>}
            <button type="submit" disabled={busy} style={{ marginTop: 16, padding: "10px 18px", borderRadius: 11, border: "none", cursor: busy ? "default" : "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)", opacity: busy ? 0.7 : 1 }}>
              {busy ? "Creating…" : "Create user"}
            </button>
          </form>
        </Panel>
      )}
    </div>
  );
}
