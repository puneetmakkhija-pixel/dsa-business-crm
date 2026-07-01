// Lead scoring — feature inputs & outputs.
//
// The engine consumes ALREADY-NORMALIZED features (not raw API payloads).
// Raw GST/bureau/bank-statement API responses are mapped into these shapes by
// per-source adapters (see adapters.ts) so the engine stays pure & testable and
// isn't coupled to any provider's JSON. Every field is optional: a lead may
// arrive with any subset of the four pillars.

export type Pillar = "gst" | "bureau" | "banking" | "engagement";

export type GstFeatures = {
  status?: "active" | "inactive" | "suspended" | "cancelled";
  vintageMonths?: number; // months since GST registration
  filing?: "regular" | "irregular" | "defaulter";
  annualTurnover?: number; // ₹
  source?: "db_scrub" | "api";
  asOf?: string; // ISO date of the data
};

export type BureauFeatures = {
  score?: number | null; // 300–900; null = no-hit / new-to-credit
  maxDpd?: number; // worst current days-past-due across trades
  activeUnsecured?: number; // count of active unsecured loans
  hardEnquiries6m?: number;
  writeOffOrSettled?: boolean; // any written-off / settled account
  vintageMonths?: number; // age of oldest trade
  source?: "db_scrub" | "api";
  asOf?: string;
};

export type BankingFeatures = {
  avgBalance?: number; // ₹ average monthly balance
  monthlyCredits?: number; // ₹ avg monthly credits (turnover proxy)
  creditStability?: number; // 0–1, higher = steadier inflows
  bounceRatio?: number; // 0–1, returns ÷ total debits
  negativeDays?: number; // days with negative/zero balance in the window
  foir?: number; // 0–1, existing EMI outflow ÷ inflow
  monthsCovered?: number; // statement window length
  source?: "api";
  asOf?: string;
};

export type EngagementFeatures = {
  source?: "inbound" | "campaign" | "cold_list";
  contactable?: boolean;
  intent?: "high" | "medium" | "low";
};

export type LeadScoringInput = {
  leadId?: string | number;
  gst?: GstFeatures | null;
  bureau?: BureauFeatures | null;
  banking?: BankingFeatures | null;
  engagement?: EngagementFeatures | null;
};

export type Reason = {
  pillar: Pillar;
  label: string; // human-readable, e.g. "GST active 3.2 yr"
  impact: number; // signed, roughly -20..+20 — magnitude drives ranking
};

export type PillarResult = {
  pillar: Pillar;
  available: boolean;
  subScore: number; // 0–100
  weightUsed: number; // renormalized weight (0 if unavailable)
  reasons: Reason[];
  knockout?: string; // set = hard decline reason
  stale?: boolean;
};

export type Grade = "A" | "B" | "C" | "D" | "DECLINE" | "INSUFFICIENT";

export type LeadScore = {
  leadId?: string | number;
  score: number; // 0–100 blended priority score (0 when DECLINE/INSUFFICIENT)
  grade: Grade;
  completeness: number; // 0–1, share of total weight that had data
  confidence: "high" | "medium" | "low";
  pillars: PillarResult[];
  knockouts: string[]; // hard-decline reasons, if any
  reasons: Reason[]; // top ± drivers, ranked by |impact|
  modelVersion: string;
};
