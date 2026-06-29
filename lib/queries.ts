import { supabase } from "./supabase";
import { monthRange } from "./format";

// ---------- Cases ----------

export type CaseRow = {
  id: number;
  lan: string;
  customer: string;
  disbursed: number;
  payout_pct: number;
  payout: number;
  status: string;
  booked_on: string;
  lender: string;
  lenderColor: string;
  partner: string;
};

type RawCase = {
  id: number;
  lan: string;
  customer: string;
  disbursed: number;
  payout_pct: number;
  payout: number;
  status: string;
  booked_on: string;
  lenders: { name: string; color: string } | null;
  partners: { name: string } | null;
};

function mapCase(c: RawCase): CaseRow {
  return {
    id: c.id,
    lan: c.lan,
    customer: c.customer,
    disbursed: Number(c.disbursed),
    payout_pct: Number(c.payout_pct),
    payout: Number(c.payout),
    status: c.status,
    booked_on: c.booked_on,
    lender: c.lenders?.name ?? "—",
    lenderColor: c.lenders?.color ?? "#7E93B0",
    partner: c.partners?.name ?? "—",
  };
}

export async function getCases(opts: {
  q?: string;
  month?: string;
  status?: string;
  limit?: number;
}): Promise<CaseRow[]> {
  let query = supabase
    .from("cases")
    .select(
      "id,lan,customer,disbursed,payout_pct,payout,status,booked_on,lenders(name,color),partners(name)"
    )
    .order("booked_on", { ascending: false })
    .limit(opts.limit ?? 300);

  const range = monthRange(opts.month);
  if (range) query = query.gte("booked_on", range[0]).lt("booked_on", range[1]);
  if (opts.status && opts.status !== "all") query = query.eq("status", opts.status);
  if (opts.q) {
    const term = `%${opts.q}%`;
    query = query.or(`lan.ilike.${term},customer.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getCases: ${error.message}`);
  return (data as unknown as RawCase[]).map(mapCase);
}

// ---------- Aggregations (fetched once, reduced in JS) ----------

export type AllCase = {
  disbursed: number;
  payout: number;
  status: string;
  booked_on: string;
  lender_id: number;
  partner_id: number;
};

export async function getAllCases(month?: string): Promise<AllCase[]> {
  let query = supabase
    .from("cases")
    .select("disbursed,payout,status,booked_on,lender_id,partner_id")
    .limit(2000);
  const range = monthRange(month);
  if (range) query = query.gte("booked_on", range[0]).lt("booked_on", range[1]);
  const { data, error } = await query;
  if (error) throw new Error(`getAllCases: ${error.message}`);
  return (data ?? []).map((c) => ({
    disbursed: Number(c.disbursed),
    payout: Number(c.payout),
    status: c.status,
    booked_on: c.booked_on,
    lender_id: c.lender_id,
    partner_id: c.partner_id,
  }));
}

export type CaseStats = {
  count: number;
  disbursed: number; // ₹L
  payout: number; // ₹L
  avgPct: number;
  byStatus: Record<string, number>;
};

export function caseStats(cases: AllCase[]): CaseStats {
  const disbursed = cases.reduce((s, c) => s + c.disbursed, 0);
  const payout = cases.reduce((s, c) => s + c.payout, 0);
  const byStatus: Record<string, number> = {};
  for (const c of cases) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  return {
    count: cases.length,
    disbursed,
    payout,
    avgPct: disbursed ? (payout / disbursed) * 100 : 0,
    byStatus,
  };
}

// ---------- Partners ----------

export type PartnerMeta = {
  id: number;
  name: string;
  share_pct: number;
  sort: number;
};

export async function getPartners(): Promise<PartnerMeta[]> {
  const { data, error } = await supabase
    .from("partners")
    .select("id,name,share_pct,sort")
    .order("sort");
  if (error) throw new Error(`getPartners: ${error.message}`);
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    share_pct: Number(p.share_pct),
    sort: p.sort,
  }));
}

export type PartnerStat = {
  id: number;
  name: string;
  cases: number;
  disbursed: number;
  revenue: number; // commission we earn on their cases
  cost: number; // what we pay them
  margin: number; // revenue - cost
};

export function partnerStats(
  partners: PartnerMeta[],
  cases: AllCase[]
): PartnerStat[] {
  return partners
    .map((p) => {
      const own = cases.filter((c) => c.partner_id === p.id);
      const disbursed = own.reduce((s, c) => s + c.disbursed, 0);
      const revenue = own.reduce((s, c) => s + c.payout, 0);
      const cost = revenue * (p.share_pct / 100);
      return {
        id: p.id,
        name: p.name,
        cases: own.length,
        disbursed,
        revenue,
        cost,
        margin: revenue - cost,
      };
    })
    .sort((a, b) => b.disbursed - a.disbursed);
}

// ---------- Lenders ----------

export type LenderMeta = {
  id: number;
  name: string;
  color: string;
  payout_pct: number;
};

export async function getLenders(): Promise<LenderMeta[]> {
  const { data, error } = await supabase
    .from("lenders")
    .select("id,name,color,payout_pct")
    .order("sort");
  if (error) throw new Error(`getLenders: ${error.message}`);
  return (data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    payout_pct: Number(l.payout_pct),
  }));
}

// ---------- Invoices ----------

export type InvoiceRow = {
  id: number;
  invoice_no: string;
  amount: number;
  cases_count: number;
  status: string;
  utr: string | null;
  raised_on: string;
  lender: string;
  lenderColor: string;
};

export async function getInvoices(opts: { status?: string } = {}): Promise<InvoiceRow[]> {
  let query = supabase
    .from("invoices")
    .select("id,invoice_no,amount,cases_count,status,utr,raised_on,lenders(name,color)")
    .order("amount", { ascending: false });
  if (opts.status && opts.status !== "all") query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(`getInvoices: ${error.message}`);
  return (data as unknown as Array<Record<string, unknown>>).map((i) => {
    const lender = i.lenders as { name: string; color: string } | null;
    return {
      id: i.id as number,
      invoice_no: i.invoice_no as string,
      amount: Number(i.amount),
      cases_count: i.cases_count as number,
      status: i.status as string,
      utr: (i.utr as string | null) ?? null,
      raised_on: i.raised_on as string,
      lender: lender?.name ?? "—",
      lenderColor: lender?.color ?? "#7E93B0",
    };
  });
}
