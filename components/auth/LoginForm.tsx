"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const fieldCls =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-slate-400";

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
    window.location.assign("/");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        signIn(email, password);
      }}
    >
      <label className="text-[12px] font-semibold text-slate-600">Email</label>
      <input className={fieldCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
      <label className="mt-4 block text-[12px] font-semibold text-slate-600">Password</label>
      <input className={fieldCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
      {error && <div className="mt-3 text-[12px] text-rose-600">{error}</div>}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-lg bg-brand px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
