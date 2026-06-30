"use server";

import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BulkCaseRow, BulkResult } from "@/app/(app)/cases/actions";

/** Convert any Google Sheets URL into a CSV export URL for the chosen tab. */
function toCsvUrl(input: string): string | null {
  const trimmed = input.trim();
  if (/output=csv|format=csv/.test(trimmed)) return trimmed; // already a CSV/published URL
  const id = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) return null;
  const gid = trimmed.match(/[?&#]gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function normDate(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const [, dd, mm, yy] = m;
    const yyyy = yy.length === 2 ? "20" + yy : yy;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

type ParseOut = { error?: string; rows: BulkCaseRow[]; headers: string[]; totalRows: number };

async function parseSheet(url: string): Promise<ParseOut> {
  const csvUrl = toCsvUrl(url);
  if (!csvUrl) return { error: "Not a valid Google Sheets URL.", rows: [], headers: [], totalRows: 0 };

  let res: Response;
  try {
    res = await fetch(csvUrl, { redirect: "follow", cache: "no-store" });
  } catch {
    return { error: "Could not reach the sheet.", rows: [], headers: [], totalRows: 0 };
  }
  const text = await res.text();
  if (!res.ok || text.trimStart().startsWith("<!DOCTYPE html") || text.includes("google-site-verification") || text.includes("Sign in")) {
    return {
      error: "The sheet isn't publicly readable. In Google Sheets → Share → 'Anyone with the link' → Viewer, then retry.",
      rows: [], headers: [], totalRows: 0,
    };
  }

  const wb = XLSX.read(text, { type: "string" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  if (json.length === 0) return { error: "No rows found in that tab.", rows: [], headers: [], totalRows: 0 };

  const headers = Object.keys(json[0]);
  const find = (re: RegExp) => headers.find((h) => re.test(h));
  const lanK = find(/\blan\s*id\b|\blan_id\b|^lan$/i) ?? find(/\blan\b/i);
  const custK = find(/customer/i);
  const bankK = find(/bank\s*name|lender/i);
  const amtK = find(/disbursed\s*amount/i) ?? find(/^amount$/i) ?? find(/amount/i);
  const dateK = find(/disbursed\s*date|disbursal[_\s]*date/i) ?? find(/consider\s*date/i) ?? find(/date/i);
  const prodK = find(/product/i);

  if (!lanK || !bankK || !amtK) {
    return {
      error: `Couldn't find required columns. Need LAN ID, Bank Name/Lender, Amount. Found: ${headers.join(", ")}`,
      rows: [], headers, totalRows: json.length,
    };
  }

  const rows: BulkCaseRow[] = json
    .map((r) => ({
      lan: String(r[lanK] ?? "").trim(),
      customer: custK ? String(r[custK] ?? "").trim() : "",
      lender: String(r[bankK] ?? "").trim(),
      amount: Number(String(r[amtK] ?? "").replace(/[^0-9.\-]/g, "")) || 0,
      date: dateK ? normDate(r[dateK]) : "",
      loan_type: prodK ? String(r[prodK] ?? "BL").trim() || "BL" : "BL",
    }))
    .filter((r) => r.lan && r.lender && r.amount > 0);

  return { rows, headers, totalRows: json.length };
}

export type PreviewResult = {
  ok: boolean;
  error?: string;
  headers?: string[];
  totalRows?: number;
  usableRows?: number;
  sample?: BulkCaseRow[];
};

export async function previewSheetAction(url: string): Promise<PreviewResult> {
  const p = await parseSheet(url);
  if (p.error) return { ok: false, error: p.error, headers: p.headers };
  return { ok: true, headers: p.headers, totalRows: p.totalRows, usableRows: p.rows.length, sample: p.rows.slice(0, 5) };
}

export async function importSheetAction(url: string, dsaPartnerId: number): Promise<BulkResult> {
  const p = await parseSheet(url);
  if (p.error) return { ok: false, error: p.error };
  if (p.rows.length === 0) return { ok: false, error: "No importable rows found." };
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_cases_bulk", { p_rows: p.rows, p_dsa: dsaPartnerId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/cases");
  return { ok: true, summary: data as BulkResult["summary"] };
}
