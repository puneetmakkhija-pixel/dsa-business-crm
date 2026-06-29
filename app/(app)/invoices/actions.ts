"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(app)/admin/actions";

export async function generateInvoiceAction(input: {
  dsaPartnerId: number;
  billingMonth: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("generate_invoice", {
    p_dsa: input.dsaPartnerId,
    p_month: input.billingMonth,
  });
  if (error) return { ok: false, error: error.message };
  const d = data as { po?: string; cases?: number };
  revalidatePath("/invoices");
  return { ok: true, message: `Generated ${d?.po} · ${d?.cases} case(s)` };
}
