"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: boolean; error?: string; message?: string };

export async function createUserAction(input: {
  name: string;
  email: string;
  password: string;
  role: string;
  dsaPartnerId?: number | null;
  department?: string | null;
  reportManagerId?: string | null;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("create_user", {
    p_email: input.email,
    p_password: input.password,
    p_name: input.name,
    p_role: input.role,
    p_dsa_partner_id: input.dsaPartnerId ?? null,
    p_department: input.department ?? null,
    p_report_manager_id: input.reportManagerId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true, message: `Created ${input.email}` };
}
