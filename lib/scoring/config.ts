// Tunable scoring configuration. In production this moves to a versioned
// crm.scoring_config row so business can tune weights/cut-offs without a
// deploy; for now it's a typed constant. Bump MODEL_VERSION on any change so
// stored scores remain traceable to the config that produced them.

import type { Pillar } from "./types";

export const MODEL_VERSION = "v1-scorecard-2026.07";

// Blended priority: eligibility (bureau + banking + gst ≈ 80%) + effort-worthiness
// (engagement ≈ 20%). Weights are over the FULL set; the engine renormalizes
// across whichever pillars actually have data for a given lead.
export const PILLAR_WEIGHTS: Record<Pillar, number> = {
  bureau: 0.3,
  banking: 0.25,
  gst: 0.25,
  engagement: 0.2,
};

// A real (non-provisional) grade needs at least this share of total weight.
export const MIN_COMPLETENESS = 0.45;

// Grade cut-offs on the 0–100 blended score (evaluated high→low).
export const GRADE_BANDS: { min: number; grade: "A" | "B" | "C" | "D" }[] = [
  { min: 80, grade: "A" },
  { min: 65, grade: "B" },
  { min: 50, grade: "C" },
  { min: 0, grade: "D" },
];

// Confidence from completeness.
export const CONFIDENCE_BANDS: { min: number; level: "high" | "medium" | "low" }[] = [
  { min: 0.8, level: "high" },
  { min: 0.55, level: "medium" },
  { min: 0, level: "low" },
];

// Staleness windows (days) — beyond these, a source is used but flagged stale.
export const RECENCY_DAYS: Partial<Record<Pillar, number>> = { gst: 15, bureau: 30, banking: 45 };

// Bureau score band → base sub-score (0–100). null score (no-hit) handled separately.
export const BUREAU_SCORE_BANDS: { min: number; base: number; label: string }[] = [
  { min: 800, base: 92, label: "excellent" },
  { min: 750, base: 80, label: "strong" },
  { min: 700, base: 64, label: "good" },
  { min: 650, base: 48, label: "fair" },
  { min: 600, base: 34, label: "weak" },
  { min: 0, base: 20, label: "poor" },
];
