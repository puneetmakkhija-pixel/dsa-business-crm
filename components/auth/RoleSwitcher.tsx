"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_USERS } from "@/lib/demo-roles";
import type { Role } from "@/lib/roles";

export default function RoleSwitcher({ currentRole }: { currentRole: Role }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function switchTo(email: string, password: string) {
    setBusy(email);
    const supabase = createClient();
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(null);
      return;
    }
    // Full reload so the server re-renders the role-scoped shell (nav + avatar).
    window.location.assign("/");
  }

  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 50 }}>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 52,
            right: 0,
            width: 250,
            padding: 10,
            borderRadius: 16,
            background: "rgba(11,29,54,0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 30px 60px -24px rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ fontSize: 10.5, color: "#6E84A3", padding: "4px 8px 8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
            Demo · switch role
          </div>
          {DEMO_USERS.map((u) => {
            const active = u.role === currentRole;
            return (
              <button
                key={u.role}
                onClick={() => switchTo(u.email, u.password)}
                disabled={!!busy}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 9,
                  border: "none",
                  marginBottom: 2,
                  cursor: "pointer",
                  background: active ? "rgba(91,141,239,0.18)" : "transparent",
                  color: "#E8EEF6",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? "#7CA8FF" : "#E8EEF6" }}>
                  {u.label}
                  {busy === u.email ? " …" : ""}
                </div>
                <div style={{ fontSize: 10, color: "#7E93B0" }}>{u.blurb}</div>
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Switch demo role"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 12px 30px -10px rgba(91,141,239,0.7)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12" />
        </svg>
        Switch role
      </button>
    </div>
  );
}
