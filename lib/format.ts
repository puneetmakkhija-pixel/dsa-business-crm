// Shared formatting helpers. All monetary amounts in the DB are in ₹ Lakh.

/** ₹ value given a Lakh amount, auto-scaling to Cr above 100 L. */
export function money(lakh: number): string {
  if (Math.abs(lakh) >= 100) return "₹" + (lakh / 100).toFixed(2) + " Cr";
  return "₹" + lakh.toFixed(2) + " L";
}

export function lakh(n: number): string {
  return "₹" + n.toFixed(2) + " L";
}

export function cr(lakhValue: number): string {
  return "₹" + (lakhValue / 100).toFixed(2) + " Cr";
}

export function pct(n: number): string {
  return n.toFixed(2) + "%";
}

export function signedLakh(n: number): string {
  return (n >= 0 ? "+" : "−") + "₹" + Math.abs(n).toFixed(2) + " L";
}

export function fmtDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ----- Months available for filtering (data spans Mar–May 2026) -----

export type MonthOption = { value: string; label: string };

export const MONTHS: MonthOption[] = [
  { value: "all", label: "All months" },
  { value: "2026-07", label: "July 2026" },
  { value: "2026-06", label: "June 2026" },
  { value: "2026-05", label: "May 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-01", label: "January 2026" },
];

export function monthLabel(value: string | undefined): string {
  return MONTHS.find((m) => m.value === value)?.label ?? "All months";
}

/** Returns [startISO, endISO) for a YYYY-MM value, or null for "all". */
export function monthRange(value: string | undefined): [string, string] | null {
  if (!value || value === "all") return null;
  const [y, m] = value.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

const GREEN = { fg: "#34D399", bg: "rgba(52,211,153,0.14)" };
const AMBER = { fg: "#E8B873", bg: "rgba(232,184,115,0.14)" };
const ROSE = { fg: "#FB7185", bg: "rgba(251,113,133,0.14)" };
const BLUE = { fg: "#7CA8FF", bg: "rgba(91,141,239,0.14)" };
const VIOLET = { fg: "#B6A0FF", bg: "rgba(124,91,239,0.16)" };

export const STATUS_META: Record<
  string,
  { label: string; fg: string; bg: string }
> = {
  // legacy dsa-dashboard statuses
  disbursed: { label: "Disbursed", ...GREEN },
  unmatched: { label: "Unmatched", ...BLUE },
  paid: { label: "Paid", ...GREEN },
  awaiting_utr: { label: "Awaiting UTR", ...AMBER },
  processing: { label: "Processing", ...BLUE },
  // mis_status
  awaited: { label: "Awaited", ...BLUE },
  pending: { label: "Pending", ...AMBER },
  confirmed: { label: "Confirmed", ...GREEN },
  disputed: { label: "Disputed", ...ROSE },
  dispute: { label: "Dispute", ...ROSE },
  // billing_status
  unbilled: { label: "Unbilled", ...BLUE },
  billed: { label: "Billed", ...AMBER },
  released: { label: "Released", ...GREEN },
  // variance_flag
  match: { label: "Match", ...GREEN },
  minor: { label: "Minor", ...AMBER },
  review: { label: "Review", ...ROSE },
  // invoice_status
  draft: { label: "Draft", ...BLUE },
  raised: { label: "Raised", ...AMBER },
  cancelled: { label: "Cancelled", ...ROSE },
  // dispute_status
  open: { label: "Open", ...ROSE },
  under_review: { label: "Under Review", ...AMBER },
  resolved: { label: "Resolved", ...GREEN },
  rejected: { label: "Rejected", ...VIOLET },
  // partner_status
  active: { label: "Active", ...GREEN },
  inactive: { label: "Inactive", ...AMBER },
  suspended: { label: "Suspended", ...ROSE },
};

// ----- Rupee formatting (crm stores true rupees) -----

export function inr(rupees: number): string {
  const n = Number(rupees) || 0;
  if (Math.abs(n) >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (Math.abs(n) >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function inrCr(rupees: number): string {
  return "₹" + ((Number(rupees) || 0) / 1e7).toFixed(2) + " Cr";
}

export function inrL(rupees: number): string {
  return "₹" + ((Number(rupees) || 0) / 1e5).toFixed(2) + " L";
}
