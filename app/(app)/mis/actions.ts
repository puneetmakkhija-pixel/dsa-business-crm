"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
