"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(app)/admin/actions";

export async function createTaskAction(input: {
  title: string;
  dueDate: string;
  dueTime?: string | null;
  priority: "low" | "medium" | "high";
  category: string;
  notes?: string | null;
  caseId?: number | null;
  assignedTo?: string | null;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("create_task", {
    p_title: input.title,
    p_due_date: input.dueDate,
    p_priority: input.priority,
    p_category: input.category,
    p_notes: input.notes ?? null,
    p_case_id: input.caseId ?? null,
    p_assigned_to: input.assignedTo ?? null,
    p_due_time: input.dueTime || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendar");
  return { ok: true, message: "Follow-up scheduled" };
}

export async function setTaskStatusAction(input: {
  id: number;
  status: "pending" | "done";
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_task_status", {
    p_id: input.id,
    p_status: input.status,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendar");
  return { ok: true, message: input.status === "done" ? "Marked done" : "Reopened" };
}

export async function deleteTaskAction(input: { id: number }): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("delete_task", { p_id: input.id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendar");
  return { ok: true, message: "Deleted" };
}
