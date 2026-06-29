"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(app)/admin/actions";

export async function createPartnerAction(input: {
  name: string;
  vendorCode: string;
  gst?: string;
  pan?: string;
  blMarginPct?: number;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("create_partner", {
    p_name: input.name,
    p_vendor_code: input.vendorCode,
    p_gst: input.gst ?? null,
    p_pan: input.pan ?? null,
    p_bl_margin_pct: input.blMarginPct ?? 7.5,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/partners");
  return { ok: true, message: `Onboarded ${input.name}` };
}

export async function updatePartnerAction(input: {
  id: number;
  managerUserId: string | null;
  blMarginPct: number | null;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("update_partner", {
    p_id: input.id,
    p_manager_user_id: input.managerUserId,
    p_bl_margin_pct: input.blMarginPct,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/partners");
  return { ok: true, message: "Partner updated" };
}
