// Light status pills (TRD §16: rounded pill, colour-coded per status enum).
const GREEN = "bg-emerald-100 text-emerald-700";
const AMBER = "bg-amber-100 text-amber-700";
const ROSE = "bg-rose-100 text-rose-700";
const BLUE = "bg-blue-100 text-blue-700";
const VIOLET = "bg-violet-100 text-violet-700";
const SLATE = "bg-slate-100 text-slate-600";

const MAP: Record<string, { label: string; cls: string }> = {
  // mis_status
  awaited: { label: "Awaited", cls: BLUE },
  pending: { label: "Pending", cls: AMBER },
  confirmed: { label: "Confirmed", cls: GREEN },
  disputed: { label: "Disputed", cls: ROSE },
  dispute: { label: "Dispute", cls: ROSE },
  // billing_status
  unbilled: { label: "Unbilled", cls: SLATE },
  billed: { label: "Billed", cls: AMBER },
  released: { label: "Released", cls: GREEN },
  // variance_flag
  match: { label: "Match", cls: GREEN },
  minor: { label: "Minor", cls: AMBER },
  review: { label: "Review", cls: ROSE },
  // invoice_status
  draft: { label: "Draft", cls: SLATE },
  raised: { label: "Raised", cls: AMBER },
  cancelled: { label: "Cancelled", cls: ROSE },
  // dispute_status
  open: { label: "Open", cls: ROSE },
  under_review: { label: "Under Review", cls: AMBER },
  resolved: { label: "Resolved", cls: GREEN },
  rejected: { label: "Rejected", cls: VIOLET },
  // partner / generic
  active: { label: "Active", cls: GREEN },
  inactive: { label: "Inactive", cls: SLATE },
  suspended: { label: "Suspended", cls: ROSE },
  completed: { label: "Completed", cls: GREEN },
  processing: { label: "Processing", cls: BLUE },
  failed: { label: "Failed", cls: ROSE },
};

export default function StatusPill({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, cls: SLATE };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </span>
  );
}
