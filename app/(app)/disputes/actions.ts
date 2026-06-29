"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(app)/admin/actions";

export async function resolveDisputeAction(input: {
  id: number;
  status: "resolved" | "rejected";
  note: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("resolve_dispute", {
    p_id: input.id,
    p_status: input.status,
    p_note: input.note,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/disputes");
  return { ok: true, message: `Marked ${input.status}` };
}
