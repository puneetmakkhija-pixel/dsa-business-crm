// Lead scoring engine — pure functions, no I/O. Given normalized features for
// any subset of pillars, produces a blended 0–100 priority score, an A–D grade
// (or DECLINE / INSUFFICIENT), a completeness/confidence read, and ranked
// reason codes. See types.ts for shapes and config.ts for tunables.

import {
  MODEL_VERSION,
  PILLAR_WEIGHTS,
  MIN_COMPLETENESS,
  GRADE_BANDS,
  CONFIDENCE_BANDS,
  RECENCY_DAYS,
  BUREAU_SCORE_BANDS,
} from "./config";
import type {
  BankingFeatures,
  BureauFeatures,
  EngagementFeatures,
  GstFeatures,
  LeadScore,
  LeadScoringInput,
  PillarResult,
  Reason,
} from "./types";

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const has = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);

function isStale(pillar: keyof typeof RECENCY_DAYS, asOf?: string, today = new Date()): boolean {
  const days = RECENCY_DAYS[pillar];
  if (!days || !asOf) return false;
  const t = Date.parse(asOf);
  if (Number.isNaN(t)) return false;
  return (today.getTime() - t) / 86_400_000 > days;
}

// ── GST / Business ──────────────────────────────────────────────────────────
function scoreGst(f: GstFeatures): PillarResult {
  const reasons: Reason[] = [];
  let s = 50;
  let knockout: string | undefined;

  if (f.status === "cancelled" || f.status === "suspended") {
    knockout = `GST ${f.status}`;
  } else if (f.status === "active") {
    s += 18;
    reasons.push({ pillar: "gst", label: "GST active", impact: 18 });
  } else if (f.status === "inactive") {
    s -= 15;
    reasons.push({ pillar: "gst", label: "GST inactive", impact: -15 });
  }

  if (has(f.vintageMonths)) {
    const yrs = f.vintageMonths / 12;
    const pts = f.vintageMonths >= 36 ? 14 : f.vintageMonths >= 12 ? 7 : 2;
    s += pts;
    reasons.push({ pillar: "gst", label: `GST vintage ${yrs.toFixed(1)} yr`, impact: pts });
  }
  if (f.filing) {
    const pts = f.filing === "regular" ? 14 : f.filing === "irregular" ? -6 : -16;
    s += pts;
    reasons.push({ pillar: "gst", label: `filing ${f.filing}`, impact: pts });
  }
  if (has(f.annualTurnover)) {
    const t = f.annualTurnover;
    const pts = t >= 5e7 ? 12 : t >= 1e7 ? 9 : t >= 4e6 ? 5 : 2;
    s += pts;
    reasons.push({ pillar: "gst", label: `turnover ₹${(t / 1e7).toFixed(2)} Cr`, impact: pts });
  }

  return { pillar: "gst", available: true, subScore: clamp(s), weightUsed: 0, reasons, knockout, stale: isStale("gst", f.asOf) };
}

// ── Bureau / Credit ─────────────────────────────────────────────────────────
function scoreBureau(f: BureauFeatures): PillarResult {
  const reasons: Reason[] = [];
  let knockout: string | undefined;

  if (f.writeOffOrSettled) knockout = "written-off / settled account";
  if (has(f.maxDpd) && f.maxDpd >= 90) knockout = `${f.maxDpd} DPD on an active trade`;

  let s: number;
  if (f.score == null) {
    s = 45; // new-to-credit / no-hit — neutral-low, not a decline
    reasons.push({ pillar: "bureau", label: "new to credit (no bureau hit)", impact: -5 });
  } else {
    const band = BUREAU_SCORE_BANDS.find((b) => f.score! >= b.min)!;
    s = band.base;
    reasons.push({ pillar: "bureau", label: `CIBIL ${f.score} (${band.label})`, impact: Math.round((band.base - 50) / 2) });
  }

  if (has(f.maxDpd) && f.maxDpd > 0 && f.maxDpd < 90) {
    const pts = f.maxDpd >= 30 ? -12 : -5;
    s += pts;
    reasons.push({ pillar: "bureau", label: `${f.maxDpd} DPD`, impact: pts });
  }
  if (has(f.hardEnquiries6m) && f.hardEnquiries6m > 1) {
    const pts = f.hardEnquiries6m > 4 ? -8 : -3;
    s += pts;
    reasons.push({ pillar: "bureau", label: `${f.hardEnquiries6m} enquiries / 6m`, impact: pts });
  }
  if (has(f.activeUnsecured) && f.activeUnsecured > 5) {
    s -= 6;
    reasons.push({ pillar: "bureau", label: `${f.activeUnsecured} active unsecured loans`, impact: -6 });
  }

  return { pillar: "bureau", available: true, subScore: clamp(s), weightUsed: 0, reasons, knockout, stale: isStale("bureau", f.asOf) };
}

// ── Banking ─────────────────────────────────────────────────────────────────
function scoreBanking(f: BankingFeatures): PillarResult {
  const reasons: Reason[] = [];
  let s = 50;
  let knockout: string | undefined;

  if (has(f.bounceRatio) && f.bounceRatio > 0.25) knockout = `high bounce ratio ${(f.bounceRatio * 100).toFixed(0)}%`;

  if (has(f.avgBalance)) {
    const pts = f.avgBalance >= 5e5 ? 15 : f.avgBalance >= 1e5 ? 10 : f.avgBalance >= 25e3 ? 5 : 1;
    s += pts;
    reasons.push({ pillar: "banking", label: `avg balance ₹${(f.avgBalance / 1e5).toFixed(2)} L`, impact: pts });
  }
  if (has(f.monthlyCredits)) {
    const pts = f.monthlyCredits >= 1e6 ? 12 : f.monthlyCredits >= 3e5 ? 8 : f.monthlyCredits >= 1e5 ? 4 : 1;
    s += pts;
    reasons.push({ pillar: "banking", label: `monthly credits ₹${(f.monthlyCredits / 1e5).toFixed(2)} L`, impact: pts });
  }
  if (has(f.creditStability)) {
    const pts = Math.round(f.creditStability * 10);
    s += pts;
    if (pts) reasons.push({ pillar: "banking", label: `inflow stability ${(f.creditStability * 100).toFixed(0)}%`, impact: pts });
  }
  if (has(f.bounceRatio) && f.bounceRatio > 0 && f.bounceRatio <= 0.25) {
    const pts = f.bounceRatio >= 0.1 ? -12 : -5;
    s += pts;
    reasons.push({ pillar: "banking", label: `bounces ${(f.bounceRatio * 100).toFixed(0)}%`, impact: pts });
  }
  if (has(f.negativeDays) && f.negativeDays > 5) {
    s -= 10;
    reasons.push({ pillar: "banking", label: `${f.negativeDays} negative-balance days`, impact: -10 });
  }
  if (has(f.foir)) {
    const pts = f.foir > 0.6 ? -12 : f.foir < 0.4 ? 6 : 0;
    if (pts) {
      s += pts;
      reasons.push({ pillar: "banking", label: `FOIR ${(f.foir * 100).toFixed(0)}%`, impact: pts });
    }
  }
  if (has(f.monthsCovered) && f.monthsCovered < 3) {
    reasons.push({ pillar: "banking", label: `thin statement (${f.monthsCovered} mo)`, impact: -4 });
    s -= 4;
  }

  return { pillar: "banking", available: true, subScore: clamp(s), weightUsed: 0, reasons, knockout, stale: isStale("banking", f.asOf) };
}

// ── Engagement / intent (the "priority" half of the blend) ──────────────────
function scoreEngagement(f: EngagementFeatures): PillarResult {
  const reasons: Reason[] = [];
  let s = 50;

  if (f.source) {
    const pts = f.source === "inbound" ? 16 : f.source === "campaign" ? 6 : -8;
    s += pts;
    reasons.push({ pillar: "engagement", label: `${f.source.replace("_", " ")} lead`, impact: pts });
  }
  if (typeof f.contactable === "boolean") {
    const pts = f.contactable ? 10 : -15;
    s += pts;
    reasons.push({ pillar: "engagement", label: f.contactable ? "contactable" : "not contactable", impact: pts });
  }
  if (f.intent) {
    const pts = f.intent === "high" ? 16 : f.intent === "medium" ? 6 : -6;
    s += pts;
    reasons.push({ pillar: "engagement", label: `${f.intent} intent`, impact: pts });
  }

  return { pillar: "engagement", available: true, subScore: clamp(s), weightUsed: 0, reasons };
}

/** Score a single lead from whatever subset of features is present. */
export function scoreLead(input: LeadScoringInput): LeadScore {
  const results: PillarResult[] = [];
  if (input.gst) results.push(scoreGst(input.gst));
  if (input.bureau) results.push(scoreBureau(input.bureau));
  if (input.banking) results.push(scoreBanking(input.banking));
  if (input.engagement) results.push(scoreEngagement(input.engagement));

  // Add placeholders for absent pillars so the UI can show what's missing.
  const presentPillars = new Set(results.map((r) => r.pillar));
  (["gst", "bureau", "banking", "engagement"] as const).forEach((p) => {
    if (!presentPillars.has(p)) results.push({ pillar: p, available: false, subScore: 0, weightUsed: 0, reasons: [] });
  });

  const available = results.filter((r) => r.available);
  const knockouts = available.map((r) => r.knockout).filter((k): k is string => !!k);

  // Completeness = share of total weight that had data.
  const totalWeight = Object.values(PILLAR_WEIGHTS).reduce((a, b) => a + b, 0);
  const availWeight = available.reduce((a, r) => a + PILLAR_WEIGHTS[r.pillar], 0);
  const completeness = totalWeight ? availWeight / totalWeight : 0;

  // Renormalize weights across available pillars.
  for (const r of available) r.weightUsed = availWeight ? PILLAR_WEIGHTS[r.pillar] / availWeight : 0;

  const rawScore = available.reduce((a, r) => a + r.subScore * r.weightUsed, 0);
  const reasons = available
    .flatMap((r) => r.reasons)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 6);

  const confidence = CONFIDENCE_BANDS.find((b) => completeness >= b.min)!.level;

  let grade: LeadScore["grade"];
  let score = Math.round(rawScore);
  if (knockouts.length) {
    grade = "DECLINE";
    score = 0;
  } else if (available.length === 0 || completeness < MIN_COMPLETENESS) {
    grade = "INSUFFICIENT";
    score = available.length ? Math.round(rawScore) : 0;
  } else {
    grade = GRADE_BANDS.find((b) => score >= b.min)!.grade;
  }

  return {
    leadId: input.leadId,
    score,
    grade,
    completeness: Math.round(completeness * 100) / 100,
    confidence,
    pillars: results,
    knockouts,
    reasons,
    modelVersion: MODEL_VERSION,
  };
}
