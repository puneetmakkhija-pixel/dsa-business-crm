import { describe, it, expect } from "vitest";
import { scoreLead } from "./engine";
import type { LeadScoringInput } from "./types";

// A strong lead with all four pillars present.
const strong: LeadScoringInput = {
  leadId: "L-strong",
  gst: { status: "active", vintageMonths: 48, filing: "regular", annualTurnover: 8e7 },
  bureau: { score: 790, maxDpd: 0, hardEnquiries6m: 1, activeUnsecured: 1 },
  banking: { avgBalance: 6e5, monthlyCredits: 12e5, creditStability: 0.8, bounceRatio: 0, negativeDays: 0, foir: 0.3, monthsCovered: 6 },
  engagement: { source: "inbound", contactable: true, intent: "high" },
};

describe("scoreLead — full data", () => {
  it("grades a strong all-pillar lead as A with high confidence", () => {
    const r = scoreLead(strong);
    expect(r.grade).toBe("A");
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.completeness).toBe(1);
    expect(r.confidence).toBe("high");
    expect(r.knockouts).toHaveLength(0);
    expect(r.reasons.length).toBeGreaterThan(0);
  });
});

describe("missing sources", () => {
  it("renormalizes weights across available pillars (GST + banking only)", () => {
    const r = scoreLead({ gst: strong.gst, banking: strong.banking });
    // gst (0.25) + banking (0.25) => each renormalizes to 0.5
    const gst = r.pillars.find((p) => p.pillar === "gst")!;
    const banking = r.pillars.find((p) => p.pillar === "banking")!;
    expect(gst.weightUsed).toBeCloseTo(0.5, 5);
    expect(banking.weightUsed).toBeCloseTo(0.5, 5);
    expect(r.completeness).toBeCloseTo(0.5, 5); // (0.25+0.25)/1.0
    expect(r.confidence).toBe("low");
    expect(r.grade).not.toBe("INSUFFICIENT"); // 0.5 >= MIN_COMPLETENESS (0.45)
  });

  it("flags INSUFFICIENT when coverage is below the minimum (GST only)", () => {
    const r = scoreLead({ gst: strong.gst });
    expect(r.completeness).toBeCloseTo(0.25, 5);
    expect(r.grade).toBe("INSUFFICIENT");
  });

  it("absent pillars are reported as unavailable, not scored as zero", () => {
    const r = scoreLead({ bureau: strong.bureau, banking: strong.banking, engagement: strong.engagement });
    const gst = r.pillars.find((p) => p.pillar === "gst")!;
    expect(gst.available).toBe(false);
    expect(gst.weightUsed).toBe(0);
    // dropping GST should NOT drag the score down toward zero
    expect(r.score).toBeGreaterThan(60);
  });
});

describe("knockouts override the score", () => {
  it("declines a cancelled GST regardless of otherwise-strong data", () => {
    const r = scoreLead({ ...strong, gst: { status: "cancelled" } });
    expect(r.grade).toBe("DECLINE");
    expect(r.score).toBe(0);
    expect(r.knockouts).toContain("GST cancelled");
  });

  it("declines a bureau write-off / settlement", () => {
    const r = scoreLead({ ...strong, bureau: { score: 810, writeOffOrSettled: true } });
    expect(r.grade).toBe("DECLINE");
    expect(r.knockouts.some((k) => /written-off/.test(k))).toBe(true);
  });

  it("declines 90+ DPD", () => {
    const r = scoreLead({ ...strong, bureau: { score: 720, maxDpd: 120 } });
    expect(r.grade).toBe("DECLINE");
  });
});

describe("new-to-credit is scored, not declined", () => {
  it("treats a no-hit bureau as neutral-low, not a knockout", () => {
    const r = scoreLead({ ...strong, bureau: { score: null } });
    expect(r.grade).not.toBe("DECLINE");
    const bureau = r.pillars.find((p) => p.pillar === "bureau")!;
    expect(bureau.available).toBe(true);
    expect(bureau.subScore).toBeLessThan(strong.bureau!.score! ? 90 : 100);
  });
});

describe("staleness", () => {
  it("uses stale data but flags it", () => {
    const r = scoreLead({ gst: { status: "active", asOf: "2020-01-01" }, banking: strong.banking });
    const gst = r.pillars.find((p) => p.pillar === "gst")!;
    expect(gst.stale).toBe(true);
    expect(gst.available).toBe(true); // still used
  });
});

describe("ranking", () => {
  it("orders leads sensibly by score", () => {
    const weak = scoreLead({
      gst: { status: "active", vintageMonths: 6, filing: "irregular" },
      bureau: { score: 610, maxDpd: 20, hardEnquiries6m: 6 },
      banking: { avgBalance: 15e3, monthlyCredits: 8e4, bounceRatio: 0.12, negativeDays: 8 },
      engagement: { source: "cold_list", contactable: true, intent: "low" },
    });
    const strongScore = scoreLead(strong).score;
    expect(strongScore).toBeGreaterThan(weak.score);
  });
});
