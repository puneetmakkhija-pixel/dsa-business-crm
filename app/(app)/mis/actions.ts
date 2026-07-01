"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { fetchLenderMisEmails } from "@/lib/email-mis";

const MIS_ROLES = ["bl_dsa_mis", "bl_accounts", ...ADMIN_ROLES] as const;

export type MisRow = { lan: string; amount: number | null; date: string | null };

export type MisResult = {
  ok: boolean;
  error?: string;
  summary?: { total: number; matched: number; unmatched: number; disputed: number };
};

export async function processMisAction(input: {
  type: "daily" | "billing";
  lenderId: number;
  misDate: string | null;
  billingMonth: string | null;
  filename: string;
  rows: MisRow[];
}): Promise<MisResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("process_mis", {
    p_type: input.type,
    p_lender_id: input.lenderId,
    p_mis_date: input.misDate,
    p_billing_month: input.billingMonth,
    p_filename: input.filename,
    p_rows: input.rows,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mis");
  return { ok: true, summary: data as MisResult["summary"] };
}

export type EmailPullBatch = {
  lenderName: string;
  from: string;
  filename: string;
  misDate: string | null;
  rows: number;
  status: "ingested" | "preview" | "skipped";
  detail: string;
  summary?: MisResult["summary"];
};

export type EmailPullResult = { ok: boolean; error?: string; batches?: EmailPullBatch[] };

/**
 * Pull the daily lender MIS Excel directly from the inbox (IMAP) and ingest each
 * via process_mis, matching by LAN + lender (lender resolved from sender→name
 * config). dryRun=true previews what was found without ingesting or marking
 * emails read.
 */
export async function pullLenderMisFromEmailAction(dryRun: boolean): Promise<EmailPullResult> {
  await requireRole([...MIS_ROLES]);
  const res = await fetchLenderMisEmails({ markSeen: !dryRun });
  if (!res.ok) return { ok: false, error: res.error };
  if (res.batches.length === 0) return { ok: true, batches: [] };

  const supabase = createClient();
  const { data: lenders } = await supabase.from("lenders").select("id,name");
  const byName = new Map<string, number>((lenders ?? []).map((l) => [String(l.name).toLowerCase(), l.id as number]));
  const resolveLender = (name: string): number | null => {
    const n = name.toLowerCase();
    if (byName.has(n)) return byName.get(n)!;
    for (const [ln, id] of byName) if (ln.includes(n) || n.includes(ln)) return id;
    return null;
  };

  const out: EmailPullBatch[] = [];
  for (const b of res.batches) {
    const base = { lenderName: b.lenderName, from: b.from, filename: b.filename, misDate: b.misDate, rows: b.rows.length };
    if (b.rows.length === 0) {
      out.push({ ...base, status: "skipped", detail: b.skippedReason ?? "no rows" });
      continue;
    }
    const lenderId = resolveLender(b.lenderName);
    if (lenderId == null) {
      out.push({ ...base, status: "skipped", detail: `lender "${b.lenderName}" not found — add it or fix the sender map` });
      continue;
    }
    if (dryRun) {
      out.push({ ...base, status: "preview", detail: `${b.rows.length} rows ready to ingest for ${b.lenderName}` });
      continue;
    }
    const { data, error } = await supabase.rpc("process_mis", {
      p_type: "daily",
      p_lender_id: lenderId,
      p_mis_date: b.misDate,
      p_billing_month: null,
      p_filename: b.filename,
      p_rows: b.rows,
    });
    if (error) out.push({ ...base, status: "skipped", detail: `ingest failed: ${error.message}` });
    else out.push({ ...base, status: "ingested", detail: "reconciled via process_mis", summary: data as MisResult["summary"] });
  }
  revalidatePath("/mis");
  return { ok: true, batches: out };
}

/** Build a downloadable sample MIS (real LANs for a lender) so uploads can match. */
export async function sampleMisRowsAction(lenderId: number): Promise<MisRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("loan_cases")
    .select("lan_id,disbursed_amount,disbursed_date")
    .eq("lender_id", lenderId)
    .limit(40);
  return (data ?? []).map((c) => ({
    lan: c.lan_id as string,
    amount: Number(c.disbursed_amount),
    date: c.disbursed_date as string,
  }));
}
