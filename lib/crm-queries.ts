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
  partnerIds?: number[] | null;
}): Promise<CaseRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("loan_cases")
    .select(
      "id,lan_id,customer_name,loan_type,disbursed_amount,payout_pct,payout_amt,dsa_payout_amt,bl_margin_amt,mis_status,billing_status,variance_flag,billing_month,disbursed_date,lenders(name,color),dsa_partners(name),invoices(po_number)"
    )
    .order("disbursed_date", { ascending: false, nullsFirst: false })
    .limit(opts.limit ?? 400);

  if (opts.partnerIds) query = query.in("dsa_partner_id", opts.partnerIds.length ? opts.partnerIds : [-1]);
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
  channel: "call_center" | "dsa";
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

export async function getAggCases(month?: string, partnerIds?: number[] | null): Promise<AggCase[]> {
  const supabase = createClient();
  let query = supabase
    .from("loan_cases")
    .select(
      "disbursed_amount,payout_amt,dsa_payout_amt,bl_margin_amt,billing_status,mis_status,variance_flag,billing_month,disbursed_date,lender_id,dsa_partner_id,channel"
    )
    .limit(2000);
  if (partnerIds) query = query.in("dsa_partner_id", partnerIds.length ? partnerIds : [-1]);
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

/** DSA partner ids a Team Manager manages (empty array = manages none). */
export async function getManagedPartnerIds(managerId: string): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase.from("dsa_partners").select("id").eq("manager_user_id", managerId);
  return ((data as { id: number }[]) ?? []).map((r) => r.id);
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

export async function getInvoices(partnerIds?: number[] | null): Promise<InvoiceRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("invoices")
    .select(
      "id,po_number,billing_month,gross_lender_payout,total_dsa_payout,bl_margin_total,gst_amount,net_bl_margin,case_count,status,dsa_partners(name)"
    )
    .order("billing_month", { ascending: false });
  if (partnerIds) query = query.in("dsa_partner_id", partnerIds.length ? partnerIds : [-1]);
  const { data, error } = await query;
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

export async function getDisputes(partnerIds?: number[] | null): Promise<DisputeRow[]> {
  const supabase = createClient();
  // When scoped to a DSA manager, inner-join loan_cases so disputes are filtered
  // to that manager's partners; otherwise keep the plain (left) embed.
  const select = partnerIds
    ? "id,type,reason,status,auto_raised,created_at,loan_cases!inner(lan_id,dsa_partner_id)"
    : "id,type,reason,status,auto_raised,created_at,loan_cases(lan_id)";
  let query = supabase.from("disputes").select(select).order("created_at", { ascending: false });
  if (partnerIds) query = query.in("loan_cases.dsa_partner_id", partnerIds.length ? partnerIds : [-1]);
  const { data, error } = await query;
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
  department: string | null;
};

export async function getUsers(): Promise<UserRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id,name,email,role,is_active,dsa_partner_id,department")
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

// ---------------- Incentives & PIP (call-center BL agents) ----------------

export type AgentIncentive = {
  ecode: string;
  name: string;
  team_manager: string | null;
  status: string;
  billing_month: string;
  disbursed_value: number;
  salary: number | null;
  tenure_months: number | null;
  base_target: number | null;
  hit: boolean;
  total_payout: number;
  incentive: number;
};

/** Latest month present in the agent incentive data (YYYY-MM). */
export async function getLatestIncentiveMonth(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("v_agent_incentive")
    .select("billing_month")
    .order("billing_month", { ascending: false })
    .limit(1);
  return (data?.[0]?.billing_month as string) ?? "2026-05";
}

export async function getAgentIncentives(month: string, ccTeam?: string | null): Promise<AgentIncentive[]> {
  const supabase = createClient();
  let q = supabase
    .from("v_agent_incentive")
    .select(
      "ecode,name,team_manager,status,billing_month,disbursed_value,salary,tenure_months,base_target,hit,total_payout,incentive"
    )
    .eq("billing_month", month);
  if (ccTeam) q = q.eq("team_manager", ccTeam);
  const { data, error } = await q.order("incentive", { ascending: false });
  if (error) throw new Error(`getAgentIncentives: ${error.message}`);
  return ((data as unknown as AgentIncentive[]) ?? []).map((r) => ({
    ...r,
    disbursed_value: Number(r.disbursed_value),
    salary: r.salary == null ? null : Number(r.salary),
    base_target: r.base_target == null ? null : Number(r.base_target),
    total_payout: Number(r.total_payout),
    incentive: Number(r.incentive),
  }));
}

export type BlMonth = {
  billing_month: string;
  agents: number;
  disbursal: number;
  revenue_at_2_65: number;
  hitters: number;
  missers: number;
  hitter_cost: number;
  misser_salary: number;
  total_agent_cost: number;
};

export async function getBlMonths(): Promise<BlMonth[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("v_bl_month")
    .select("*")
    .order("billing_month", { ascending: true });
  return ((data as unknown as BlMonth[]) ?? []).map((m) => ({
    ...m,
    disbursal: Number(m.disbursal),
    revenue_at_2_65: Number(m.revenue_at_2_65),
    hitter_cost: Number(m.hitter_cost),
    misser_salary: Number(m.misser_salary),
    total_agent_cost: Number(m.total_agent_cost),
  }));
}

export type PipStatus = {
  ecode: string;
  name: string;
  tenure_months: number;
  miss_streak: number;
  pip_action: string;
  owner: string;
};

export async function getPipStatuses(ccTeam?: string | null): Promise<PipStatus[]> {
  const supabase = createClient();
  let q = supabase
    .from("v_pip_status")
    .select("ecode,name,tenure_months,miss_streak,pip_action,owner");
  if (ccTeam) q = q.eq("team_manager", ccTeam);
  const { data, error } = await q.order("miss_streak", { ascending: false });
  if (error) throw new Error(`getPipStatuses: ${error.message}`);
  return (data as unknown as PipStatus[]) ?? [];
}

// ---------------- BL Call-Center P&L (opex model; lender-wise revenue) ----------------

export type BlPnl = {
  period: string;
  kind: string;
  revenue: number;
  spends_excl_bdl: number;
  spends_incl_bdl: number;
  bdl_emp_cost: number;
  margin_excl_bdl: number;
  margin_pct_excl_bdl: number | null;
  margin_incl_bdl: number;
  margin_pct_incl_bdl: number | null;
  pl_head_incentive: number;
};

export async function getBlPnl(): Promise<BlPnl[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_pnl_bl")
    .select("*")
    .order("period", { ascending: true });
  if (error) throw new Error(`getBlPnl: ${error.message}`);
  return ((data as unknown as BlPnl[]) ?? []).map((r) => ({
    ...r,
    period: String(r.period).slice(0, 7),
    revenue: Number(r.revenue),
    spends_excl_bdl: Number(r.spends_excl_bdl),
    spends_incl_bdl: Number(r.spends_incl_bdl),
    bdl_emp_cost: Number(r.bdl_emp_cost),
    margin_excl_bdl: Number(r.margin_excl_bdl),
    margin_pct_excl_bdl: r.margin_pct_excl_bdl == null ? null : Number(r.margin_pct_excl_bdl),
    margin_incl_bdl: Number(r.margin_incl_bdl),
    margin_pct_incl_bdl: r.margin_pct_incl_bdl == null ? null : Number(r.margin_pct_incl_bdl),
    pl_head_incentive: Number(r.pl_head_incentive),
  }));
}

export type LenderRevenue = {
  lender: string;
  payout_pct: number | null;
  is_placeholder: boolean | null;
  disbursed: number;
  revenue: number;
};

/** Lender-wise revenue aggregated across all months (shows the blended rate emerging). */
export async function getLenderRevenue(): Promise<LenderRevenue[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_revenue_by_lender")
    .select("lender,payout_pct,is_placeholder,disbursed,revenue");
  if (error) throw new Error(`getLenderRevenue: ${error.message}`);
  const agg = new Map<string, LenderRevenue>();
  for (const r of (data as unknown as LenderRevenue[]) ?? []) {
    const k = r.lender;
    const cur = agg.get(k) ?? { lender: k, payout_pct: r.payout_pct == null ? null : Number(r.payout_pct), is_placeholder: r.is_placeholder, disbursed: 0, revenue: 0 };
    cur.disbursed += Number(r.disbursed);
    cur.revenue += Number(r.revenue);
    agg.set(k, cur);
  }
  return [...agg.values()].sort((a, b) => b.revenue - a.revenue);
}

// ---------------- BRE policy & routing ----------------

export type BreRule = {
  lender: string;
  product: string | null;
  category: string;
  feature: string;
  criteria: string;
};

export async function getBrePolicy(): Promise<BreRule[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bre_policy")
    .select("lender,product,category,feature,criteria")
    .order("category", { ascending: true })
    .order("feature", { ascending: true })
    .order("lender", { ascending: true })
    .limit(2000);
  if (error) throw new Error(`getBrePolicy: ${error.message}`);
  return (data as unknown as BreRule[]) ?? [];
}

export type PincodeServ = { lender: string; pincode_count: number };

export async function getPincodeServiceability(): Promise<PincodeServ[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("pincode_serviceability")
    .select("lender,pincode_count")
    .order("pincode_count", { ascending: false });
  return ((data as unknown as PincodeServ[]) ?? []).map((r) => ({ lender: r.lender, pincode_count: Number(r.pincode_count) }));
}

/** Lenders serviceable at a pincode (calls crm.lenders_for_pincode). */
export async function lendersForPincode(pincode: number): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("lenders_for_pincode", { p: pincode });
  if (error) throw new Error(`lendersForPincode: ${error.message}`);
  return (data as string[]) ?? [];
}

// ---------------- Editable assumptions (manual entry) ----------------

export type IncentiveConfig = {
  revenue_pct: number; slab1_pct: number; slab2_pct: number;
  slab_break: number; lap_weight: number; pl_head_margin_pct: number;
};

export async function getIncentiveConfig(): Promise<IncentiveConfig | null> {
  const supabase = createClient();
  const { data } = await supabase.from("incentive_config")
    .select("revenue_pct,slab1_pct,slab2_pct,slab_break,lap_weight,pl_head_margin_pct").eq("id", 1).single();
  return data ? {
    revenue_pct: Number(data.revenue_pct), slab1_pct: Number(data.slab1_pct), slab2_pct: Number(data.slab2_pct),
    slab_break: Number(data.slab_break), lap_weight: Number(data.lap_weight), pl_head_margin_pct: Number(data.pl_head_margin_pct),
  } : null;
}

export type LenderRate = { lender_id: number; lender_name: string; payout_pct: number | null; is_placeholder: boolean | null };

export async function getLenderPayoutRates(): Promise<LenderRate[]> {
  const supabase = createClient();
  const { data } = await supabase.from("lender_payout_rate")
    .select("lender_id,lender_name,payout_pct,is_placeholder").order("lender_name");
  return ((data as unknown as LenderRate[]) ?? []).map((r) => ({ ...r, payout_pct: r.payout_pct == null ? null : Number(r.payout_pct) }));
}

export type PlMonthRaw = { period: string; kind: string; revenue: number; spends_excl_bdl: number; spends_incl_bdl: number };

export async function getPlMonthsRaw(): Promise<PlMonthRaw[]> {
  const supabase = createClient();
  const { data } = await supabase.from("pl_monthly")
    .select("period,kind,revenue,spends_excl_bdl,spends_incl_bdl").order("period", { ascending: false });
  return ((data as unknown as PlMonthRaw[]) ?? []).map((r) => ({
    period: String(r.period).slice(0, 10), kind: r.kind,
    revenue: Number(r.revenue), spends_excl_bdl: Number(r.spends_excl_bdl), spends_incl_bdl: Number(r.spends_incl_bdl),
  }));
}
