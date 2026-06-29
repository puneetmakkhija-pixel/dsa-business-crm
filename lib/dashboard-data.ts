// View-models for the DSA Command Center dashboard, sourced live from Supabase
// (schema `dsa` in the smecircle project). The static `rail` is pure nav config
// and stays in code; everything else is fetched at request time.

import { supabase } from "./supabase";

// ----- Static nav (not business data) -----

export type RailItem = {
  label: string;
  icon: string;
  on?: boolean;
};

export const rail: RailItem[] = [
  { label: "Dashboard", icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z", on: true },
  { label: "Cases", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
  { label: "Partners", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { label: "Billing", icon: "M23 4v6h-6M3.51 9a9 9 0 0 1 14.85-3.36L23 10" },
  { label: "Invoices", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
  { label: "P&L", icon: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
  { label: "Reports", icon: "M12 20V10M18 20V4M6 20v-4" },
];

// ----- Types (view-models consumed by components) -----

export type Kpi = {
  label: string;
  value: string;
  delta: string;
  chipBg: string;
  chipFg: string;
  sub: string;
  glow: string;
  icFg: string;
  icon: string;
};

export type Lender = { name: string; disb: number; color: string };

export type Trend = { months: string[]; disAmt: number[]; spentM: number[] };

export type VendorRow = {
  rank: string;
  name: string;
  cases: number;
  disb: string;
  pct: string;
  margin: string;
  mFg: string;
};

export type Alert = {
  title: string;
  sub: string;
  val: string;
  bg: string;
  fg: string;
  icon: string;
};

export type DashboardData = {
  heroKpis: Kpi[];
  lenders: Lender[];
  trend: Trend;
  vendorRows: VendorRow[];
  alerts: Alert[];
};

// ----- Fetch + map -----

export async function getDashboardData(): Promise<DashboardData> {
  const [kpiRes, lenderRes, trendRes, partnerRes, alertRes] = await Promise.all([
    supabase
      .from("kpis")
      .select("label,value,delta,chip_bg,chip_fg,sub,glow,ic_fg,icon")
      .order("sort"),
    supabase.from("lenders").select("name,disb,color").order("sort"),
    supabase
      .from("monthly_trend")
      .select("month,disbursed_lakh,payout_lakh")
      .order("sort"),
    supabase.from("partners").select("name,cases,disb,margin").order("sort"),
    supabase
      .from("alerts")
      .select("title,sub,val,bg,fg,icon")
      .order("sort"),
  ]);

  const firstError =
    kpiRes.error || lenderRes.error || trendRes.error || partnerRes.error || alertRes.error;
  if (firstError) {
    throw new Error(`Failed to load dashboard data: ${firstError.message}`);
  }

  const heroKpis: Kpi[] = (kpiRes.data ?? []).map((k) => ({
    label: k.label,
    value: k.value,
    delta: k.delta,
    chipBg: k.chip_bg,
    chipFg: k.chip_fg,
    sub: k.sub,
    glow: k.glow,
    icFg: k.ic_fg,
    icon: k.icon,
  }));

  const lenders: Lender[] = (lenderRes.data ?? []).map((l) => ({
    name: l.name,
    disb: Number(l.disb),
    color: l.color,
  }));

  const trendRows = trendRes.data ?? [];
  const trend: Trend = {
    months: trendRows.map((t) => t.month),
    disAmt: trendRows.map((t) => Number(t.disbursed_lakh)),
    spentM: trendRows.map((t) => Number(t.payout_lakh)),
  };

  const partners = (partnerRes.data ?? []).map((p) => ({
    name: p.name,
    cases: p.cases,
    disb: Number(p.disb),
    margin: Number(p.margin),
  }));
  const maxDisb = partners.length ? Math.max(...partners.map((v) => v.disb)) : 1;
  const vendorRows: VendorRow[] = partners.map((v, i) => ({
    rank: "0" + (i + 1),
    name: v.name,
    cases: v.cases,
    disb: "₹" + v.disb.toFixed(0) + "L",
    pct: Math.round((v.disb / maxDisb) * 100) + "%",
    margin: (v.margin >= 0 ? "+" : "−") + "₹" + Math.abs(v.margin).toFixed(2) + "L",
    mFg: v.margin >= 0 ? "#34D399" : "#FB7185",
  }));

  const alerts: Alert[] = (alertRes.data ?? []).map((a) => ({
    title: a.title,
    sub: a.sub,
    val: a.val,
    bg: a.bg,
    fg: a.fg,
    icon: a.icon,
  }));

  return { heroKpis, lenders, trend, vendorRows, alerts };
}
