import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/format";

// ---------------- Lenders ----------------

export type Lender = {
  id: number;
  name: string;
  short_code: string | null;
  slab_type: string;
  color: string;
  is_active: boolean;
};

export async function getLenders(): Promise<Lender[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("lenders")
    .select("id,name,short_code,slab_type,color,is_active")
    .order("name");
  return (data as Lender[]) ?? [];
}

export type LenderSlab = { id: number; lender_id: number; slab_config: unknown; effective_from: string; effective_to: string | null };

export async function getLenderSlabs(): Promise<LenderSlab[]> {
  const supabase = createClient();
  const { data } = await supabase.from("lender_slabs").select("*").order("lender_id");
  return (data as LenderSlab[]) ?? [];
}

// ---------------- Cases ----------------

export type CaseRow = {
  id: number;
  lan_id: string;
  customer_name: string | null;
  loan_type: string | null;
  disbursed_amount: number;
  payout_pct: number;
  payout_amt: number;
  dsa_payout_amt: number;
  bl_margin_amt: number;
  mis_status: string;
  billing_status: string;
  variance_flag: string | null;
  billing_month: string | null;
  disbursed_date: string | null;
  lender: string;
  lenderColor: string;
  partner: string;
  po_number: string | null;
};

export async function getCases(opts: {
  q?: string;
  status?: string;
  billing?: string;
  month?: string;
  limit?: number;
}): Promise<CaseRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("loan_cases")
    .select(
      "id,lan_id,customer_name,loan_type,disbursed_amount,payout_pct,payout_amt,dsa_payout_amt,bl_margin_amt,mis_status,billing_status,variance_flag,billing_month,disbursed_date,lenders(name,color),dsa_partners(name),invoices(po_number)"
    )
    .order("disbursed_date", { ascending: false, nullsFirst: false })
    .limit(opts.limit ?? 400);

  const range = monthRange(opts.month);
  if (range) query = query.gte("disbursed_date", range[0]).lt("disbursed_date", range[1]);
  if (opts.status && opts.status !== "all") query = query.eq("mis_status", opts.status);
  if (opts.billing && opts.billing !== "all") query = query.eq("billing_status", opts.billing);
  if (opts.q) {
    const t = `%${opts.q}%`;
    query = query.or(`lan_id.ilike.${t},customer_name.ilike.${t}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getCases: ${error.message}`);
  return ((data as unknown as Array<Record<string, unknown>>) ?? []).map((c) => {
    const l = c.lenders as { name: string; color: string } | null;
    const p = c.dsa_partners as { name: string } | null;
    return {
      id: c.id as number,
      lan_id: c.lan_id as string,
      customer_name: (c.customer_name as string) ?? null,
      loan_type: (c.loan_type as string) ?? null,
      disbursed_amount: Number(c.disbursed_amount),
      payout_pct: Number(c.payout_pct),
      payout_amt: Number(c.payout_amt),
      dsa_payout_amt: Number(c.dsa_payout_amt),
      bl_margin_amt: Number(c.bl_margin_amt),
      mis_status: c.mis_status as string,
      billing_status: c.billing_status as string,
      variance_flag: (c.variance_flag as string) ?? null,
      billing_month: (c.billing_month as string) ?? null,
      disbursed_date: (c.disbursed_date as string) ?? null,
      lender: l?.name ?? "—",
      lenderColor: l?.color ?? "#94a3b8",
      partner: p?.name ?? "—",
      po_number: (c.invoices as { po_number: string } | null)?.po_number ?? null,
    };
  });
}

// Lightweight scoped fetch for aggregation (dashboard, P&L, reports).
export type AggCase = {
  disbursed_amount: number;
  payout_amt: number;
  dsa_payout_amt: number;
  bl_margin_amt: number;
  billing_status: string;
  mis_status: string;
  variance_flag: string | null;
  billing_month: string | null;
  disbursed_date: string | null;
  lender_id: number;
  dsa_partner_id: number;
};

/** The latest month present in the data (YYYY-MM) — used as the default "current month". */
export async function getLatestMonth(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("loan_cases")
    .select("disbursed_date")
    .order("disbursed_date", { ascending: false })
    .limit(1);
  const d = (data?.[0]?.disbursed_date as string) ?? null;
  return d ? d.slice(0, 7) : "2026-06";
}

export async function getAggCases(month?: string): Promise<AggCase[]> {
  const supabase = createClient();
  let query = supabase
    .from("loan_cases")
    .select(
      "disbursed_amount,payout_amt,dsa_payout_amt,bl_margin_amt,billing_status,mis_status,variance_flag,billing_month,disbursed_date,lender_id,dsa_partner_id"
    )
    .limit(2000);
  const range = monthRange(month);
  if (range) query = query.gte("disbursed_date", range[0]).lt("disbursed_date", range[1]);
  const { data } = await query;
  return ((data as unknown as AggCase[]) ?? []).map((c) => ({
    ...c,
    disbursed_amount: Number(c.disbursed_amount),
    payout_amt: Number(c.payout_amt),
    dsa_payout_amt: Number(c.dsa_payout_amt),
    bl_margin_amt: Number(c.bl_margin_amt),
  }));
}

// ---------------- Partners ----------------

export type PartnerRow = {
  id: number;
  name: string;
  vendor_code: string;
  status: string;
  bl_margin_pct: number;
  gst_no: string | null;
  manager_user_id: string | null;
  manager: string | null;
};

export async function getPartners(): Promise<PartnerRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dsa_partners")
    .select("id,name,vendor_code,status,bl_margin_pct,gst_no,manager_user_id,manager:users!dsa_partners_manager_user_id_fkey(name)")
    .order("name");
  return ((data as unknown as Array<Record<string, unknown>>) ?? []).map((p) => ({
    id: p.id as number,
    name: p.name as string,
    vendor_code: p.vendor_code as string,
    status: p.status as string,
    bl_margin_pct: Number(p.bl_margin_pct),
    gst_no: (p.gst_no as string) ?? null,
    manager_user_id: (p.manager_user_id as string) ?? null,
    manager: (p.manager as { name: string } | null)?.name ?? null,
  }));
}

export type ManagerOption = { id: string; name: string; role: string };

export async function getManagers(): Promise<ManagerOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id,name,role")
    .in("role", ["bl_dsa_manager", "bl_dsa_admin_bl", "bl_dsa_admin_pl", "tech_super_admin"])
    .order("name");
  return (data as ManagerOption[]) ?? [];
}

// ---------------- Invoices ----------------

export type InvoiceRow = {
  id: number;
  po_number: string;
  billing_month: string;
  gross_lender_payout: number;
  total_dsa_payout: number;
  bl_margin_total: number;
  gst_amount: number;
  net_bl_margin: number;
  case_count: number;
  status: string;
  partner: string;
};

export async function getInvoices(): Promise<InvoiceRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id,po_number,billing_month,gross_lender_payout,total_dsa_payout,bl_margin_total,gst_amount,net_bl_margin,case_count,status,dsa_partners(name)"
    )
    .order("billing_month", { ascending: false });
  if (error) throw new Error(`getInvoices: ${error.message}`);
  return ((data as unknown as Array<Record<string, unknown>>) ?? []).map((i) => ({
    id: i.id as number,
    po_number: i.po_number as string,
    billing_month: i.billing_month as string,
    gross_lender_payout: Number(i.gross_lender_payout),
    total_dsa_payout: Number(i.total_dsa_payout),
    bl_margin_total: Number(i.bl_margin_total),
    gst_amount: Number(i.gst_amount),
    net_bl_margin: Number(i.net_bl_margin),
    case_count: i.case_count as number,
    status: i.status as string,
    partner: (i.dsa_partners as { name: string } | null)?.name ?? "—",
  }));
}

// ---------------- Disputes ----------------

export type DisputeRow = {
  id: number;
  type: string;
  reason: string;
  status: string;
  auto_raised: boolean;
  created_at: string;
  lan_id: string;
};

export async function getDisputes(): Promise<DisputeRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("id,type,reason,status,auto_raised,created_at,loan_cases(lan_id)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getDisputes: ${error.message}`);
  return ((data as unknown as Array<Record<string, unknown>>) ?? []).map((d) => ({
    id: d.id as number,
    type: d.type as string,
    reason: d.reason as string,
    status: d.status as string,
    auto_raised: d.auto_raised as boolean,
    created_at: d.created_at as string,
    lan_id: (d.loan_cases as { lan_id: string } | null)?.lan_id ?? "—",
  }));
}

// ---------------- Users (admin) ----------------

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  dsa_partner_id: number | null;
};

export async function getUsers(): Promise<UserRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id,name,email,role,is_active,dsa_partner_id")
    .order("role");
  return (data as UserRow[]) ?? [];
}

// ---------------- Follow-up tasks ----------------

export type TaskRow = {
  id: number;
  title: string;
  notes: string | null;
  due_date: string;
  due_time: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "done";
  category: string;
  case_id: number | null;
  lan_id: string | null;
  partner: string | null;
  assignee: string | null;
  assigned_to: string | null;
};

export async function getTasks(opts?: { from?: string; to?: string }): Promise<TaskRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("follow_up_tasks")
    .select(
      "id,title,notes,due_date,due_time,priority,status,category,case_id,assigned_to,loan_cases(lan_id),dsa_partners(name),assignee:users!follow_up_tasks_assigned_to_fkey(name)"
    )
    .order("due_date", { ascending: true })
    .order("due_time", { ascending: true, nullsFirst: true })
    .limit(1000);
  if (opts?.from) query = query.gte("due_date", opts.from);
  if (opts?.to) query = query.lt("due_date", opts.to);

  const { data, error } = await query;
  if (error) throw new Error(`getTasks: ${error.message}`);
  return ((data as unknown as Array<Record<string, unknown>>) ?? []).map((t) => ({
    id: t.id as number,
    title: t.title as string,
    notes: (t.notes as string) ?? null,
    due_date: t.due_date as string,
    due_time: (t.due_time as string) ?? null,
    priority: t.priority as TaskRow["priority"],
    status: t.status as TaskRow["status"],
    category: t.category as string,
    case_id: (t.case_id as number) ?? null,
    lan_id: (t.loan_cases as { lan_id: string } | null)?.lan_id ?? null,
    partner: (t.dsa_partners as { name: string } | null)?.name ?? null,
    assignee: (t.assignee as { name: string } | null)?.name ?? null,
    assigned_to: (t.assigned_to as string) ?? null,
  }));
}

export type CaseOption = { id: number; lan_id: string; customer_name: string | null };

export async function getCaseOptions(): Promise<CaseOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("loan_cases")
    .select("id,lan_id,customer_name")
    .order("disbursed_date", { ascending: false, nullsFirst: false })
    .limit(300);
  return (data as CaseOption[]) ?? [];
}

export type AssigneeOption = { id: string; name: string };

export async function getAssignableUsers(): Promise<AssigneeOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id,name")
    .eq("is_active", true)
    .order("name");
  return (data as AssigneeOption[]) ?? [];
}

// ---------------- MIS uploads ----------------

export type MisUploadRow = {
  id: number;
  upload_type: string;
  billing_month: string | null;
  mis_date: string | null;
  filename: string;
  total_rows: number;
  matched_rows: number;
  unmatched_rows: number;
  disputed_rows: number;
  status: string;
  created_at: string;
  lender: string;
};

export async function getMisUploads(): Promise<MisUploadRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("mis_uploads")
    .select("id,upload_type,billing_month,mis_date,filename,total_rows,matched_rows,unmatched_rows,disputed_rows,status,created_at,lenders(name)")
    .order("created_at", { ascending: false })
    .limit(20);
  return ((data as unknown as Array<Record<string, unknown>>) ?? []).map((u) => ({
    id: u.id as number,
    upload_type: u.upload_type as string,
    billing_month: (u.billing_month as string) ?? null,
    mis_date: (u.mis_date as string) ?? null,
    filename: u.filename as string,
    total_rows: u.total_rows as number,
    matched_rows: u.matched_rows as number,
    unmatched_rows: u.unmatched_rows as number,
    disputed_rows: u.disputed_rows as number,
    status: u.status as string,
    created_at: u.created_at as string,
    lender: (u.lenders as { name: string } | null)?.name ?? "—",
  }));
}
