"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(app)/admin/actions";

// Revalidate everything the assumptions feed into.
function revalidateAll() {
  for (const p of ["/assumptions", "/bl-pnl", "/incentives", "/pip", "/reports"]) revalidatePath(p);
}

export async function saveIncentiveConfig(input: {
  revenue_pct: number; slab1_pct: number; slab2_pct: number;
  slab_break: number; lap_weight: number; pl_head_margin_pct: number;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("incentive_config").update({
    revenue_pct: input.revenue_pct, slab1_pct: input.slab1_pct, slab2_pct: input.slab2_pct,
    slab_break: input.slab_break, lap_weight: input.lap_weight, pl_head_margin_pct: input.pl_head_margin_pct,
  }).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, message: "Incentive config saved" };
}

export async function saveLenderRate(input: { lenderId: number; payoutPct: number }): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("lender_payout_rate")
    .update({ payout_pct: input.payoutPct, is_placeholder: false, updated_at: new Date().toISOString() })
    .eq("lender_id", input.lenderId);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, message: "Rate saved" };
}

export async function savePlMonth(input: {
  period: string; kind: string; revenue: number; spends_excl_bdl: number; spends_incl_bdl: number;
}): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-01$/.test(input.period)) return { ok: false, error: "Period must be the 1st of a month (YYYY-MM-01)" };
  const supabase = createClient();
  const { error } = await supabase.from("pl_monthly").upsert({
    period: input.period, kind: input.kind, revenue: input.revenue,
    spends_excl_bdl: input.spends_excl_bdl, spends_incl_bdl: input.spends_incl_bdl,
  }, { onConflict: "period" });
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, message: `Saved ${input.period.slice(0, 7)}` };
}
