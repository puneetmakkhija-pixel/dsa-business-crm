"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_USERS, ROLE_SWITCHER_ENABLED } from "@/lib/demo-roles";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e_: string, p: string) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: e_, password: p });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // Full reload so the server renders the role-scoped shell.
    window.location.assign("/");
  }

  const field: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 13.5,
    color: "#E8EEF6",
    outline: "none",
    marginTop: 8,
  };

  return (
    <div style={{ width: 380, maxWidth: "92vw" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          signIn(email, password);
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 600, color: "#8DA2BD" }}>Email</label>
        <input
          style={field}
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
        <label style={{ fontSize: 12, fontWeight: 600, color: "#8DA2BD", display: "block", marginTop: 16 }}>
          Password
        </label>
        <input
          style={field}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        {error && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#FB7185" }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={busy}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            cursor: busy ? "default" : "pointer",
            fontSize: 13.5,
            fontWeight: 700,
            color: "#fff",
            background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {ROLE_SWITCHER_ENABLED && (
        <div style={{ marginTop: 22 }}>
          <div
            style={{
              fontSize: 11,
              color: "#6E84A3",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Demo logins — click a role to sign in
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DEMO_USERS.map((u) => (
              <button
                key={u.role}
                onClick={() => signIn(u.email, u.password)}
                disabled={busy}
                style={{
                  textAlign: "left",
                  padding: "9px 11px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  color: "#E8EEF6",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{u.label}</div>
                <div style={{ fontSize: 10.5, color: "#7E93B0" }}>{u.blurb}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
