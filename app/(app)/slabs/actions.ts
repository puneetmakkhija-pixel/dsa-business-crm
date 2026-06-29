"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(app)/admin/actions";

export async function addLenderAction(input: {
  name: string;
  shortCode: string;
  rate: number;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("add_lender", {
    p_name: input.name,
    p_short_code: input.shortCode,
    p_rate: input.rate,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/slabs");
  return { ok: true, message: `Added ${input.name}` };
}

export async function setLenderRateAction(input: {
  lenderId: number;
  rate: number;
  effectiveFrom: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_lender_rate", {
    p_lender_id: input.lenderId,
    p_rate: input.rate,
    p_effective_from: input.effectiveFrom || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/slabs");
  return { ok: true, message: `Rate updated to ${input.rate}%` };
}
