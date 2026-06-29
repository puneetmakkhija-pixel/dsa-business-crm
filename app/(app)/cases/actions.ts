"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(app)/admin/actions";

export async function createCaseAction(input: {
  lan: string;
  lenderId: number;
  customer: string;
  loanType: string;
  disbursedAmount: number;
  disbursedDate: string;
  dsaPartnerId?: number | null;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_case", {
    p_lan: input.lan,
    p_lender_id: input.lenderId,
    p_customer: input.customer,
    p_loan_type: input.loanType,
    p_disbursed_amount: input.disbursedAmount,
    p_disbursed_date: input.disbursedDate,
    p_dsa_partner_id: input.dsaPartnerId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  const pct = (data as { payout_pct?: number })?.payout_pct;
  revalidatePath("/cases");
  return { ok: true, message: `Case ${input.lan} added${pct ? ` · payout ${pct}%` : ""}` };
}
