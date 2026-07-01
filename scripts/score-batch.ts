/**
 * Daily shadow-mode batch scorer.
 *
 * Feed it a JSON file of lead inputs (array of LeadScoringInput — any subset of
 * pillars per lead) and it scores every lead, prints a per-lead line + a
 * grade/score distribution, and optionally writes the full results to JSON.
 *
 * Usage:
 *   npm run score:batch -- scripts/sample-leads.json
 *   npm run score:batch -- path/to/daily.json --out=scored.json
 *
 * This is the shadow-testing harness: run it on real daily inputs, watch the
 * distribution and spot-check reason codes, and only wire the score into the
 * live funnel once you trust it. When the DB is reachable the same scoreLead()
 * runs off crm.leads instead of a file — no engine change.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { scoreLead } from "../lib/scoring/engine";
import type { LeadScoringInput } from "../lib/scoring/types";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const outArg = args.find((a) => a.startsWith("--out="))?.slice("--out=".length);

if (!file) {
  console.error("usage: npm run score:batch -- <leads.json> [--out=scored.json]");
  process.exit(1);
}

const leads = JSON.parse(readFileSync(file, "utf8")) as LeadScoringInput[];
if (!Array.isArray(leads)) {
  console.error("input must be a JSON array of lead inputs");
  process.exit(1);
}

const scored = leads.map((l) => scoreLead(l));

// Per-lead lines, best first.
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(pad("lead", 12) + pad("score", 7) + pad("grade", 13) + pad("compl.", 8) + "top reasons");
console.log("-".repeat(90));
for (const r of [...scored].sort((a, b) => b.score - a.score)) {
  const top = r.reasons.slice(0, 3).map((x) => `${x.impact >= 0 ? "+" : "−"}${x.label}`).join(", ");
  console.log(pad(r.leadId ?? "—", 12) + pad(r.score, 7) + pad(r.grade, 13) + pad(r.completeness.toFixed(2), 8) + (r.knockouts[0] ?? top));
}

// Distribution summary.
const byGrade = scored.reduce<Record<string, number>>((m, r) => ((m[r.grade] = (m[r.grade] ?? 0) + 1), m), {});
const scoreable = scored.filter((r) => r.grade !== "DECLINE" && r.grade !== "INSUFFICIENT");
const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);
console.log("\n" + "=".repeat(40));
console.log(`leads:          ${scored.length}`);
console.log(`by grade:       ${Object.entries(byGrade).map(([g, n]) => `${g}:${n}`).join("  ")}`);
console.log(`avg score:      ${avg(scoreable.map((r) => r.score)).toFixed(1)} (scoreable only)`);
console.log(`avg completeness: ${(avg(scored.map((r) => r.completeness)) * 100).toFixed(0)}%`);
console.log(`model:          ${scored[0]?.modelVersion ?? "—"}`);

if (outArg) {
  writeFileSync(outArg, JSON.stringify(scored, null, 2));
  console.log(`\nwrote ${scored.length} scored leads → ${outArg}`);
}
