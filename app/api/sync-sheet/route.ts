import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONTHS: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };

function toCsvUrl(input: string): string | null {
  if (/output=csv|format=csv/.test(input)) return input;
  const id = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) return null;
  const gid = input.match(/[?&#]gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}
function isoDate(v: unknown): string | null {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (m) { let [, dd, mm, yy] = m; yy = yy.length === 2 ? "20" + yy : yy; return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`; }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function ymFrom(v: unknown): string | null {
  const k = String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const mon = k.slice(0, 3);
  if (!MONTHS[mon]) return null;
  const yr = (k.match(/(\d{2,4})/)?.[1] ?? "26");
  return `20${yr.slice(-2)}-${MONTHS[mon]}`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const manual = url.searchParams.get("secret");
  if (cronSecret && auth !== `Bearer ${cronSecret}` && manual !== cronSecret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const sheetUrl = process.env.SHEET_SYNC_URL;
  const syncSecret = process.env.SYNC_SECRET;
  if (!sheetUrl) return NextResponse.json({ ok: false, error: "SHEET_SYNC_URL not configured" }, { status: 400 });
  if (!syncSecret) return NextResponse.json({ ok: false, error: "SYNC_SECRET not configured" }, { status: 400 });

  const csvUrl = toCsvUrl(sheetUrl);
  if (!csvUrl) return NextResponse.json({ ok: false, error: "invalid sheet URL" }, { status: 400 });

  const res = await fetch(csvUrl, { redirect: "follow", cache: "no-store" });
  const text = await res.text();
  if (!res.ok || text.trimStart().startsWith("<!DOCTYPE html") || text.includes("Sign in")) {
    return NextResponse.json({ ok: false, error: "sheet not publicly readable — share the tab as Anyone-with-link → Viewer" }, { status: 400 });
  }

  const wb = XLSX.read(text, { type: "string" });
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  if (json.length === 0) return NextResponse.json({ ok: false, error: "no rows" }, { status: 400 });

  const h = Object.keys(json[0]);
  const find = (re: RegExp) => h.find((x) => re.test(x));
  const K = {
    lan: find(/\blan\s*id\b|\blan_id\b|^lan$/i) ?? find(/\blan\b/i),
    cust: find(/customer/i),
    bank: find(/bank\s*name|lender/i),
    amt: find(/disbursed\s*amount/i) ?? find(/^amount$/i) ?? find(/amount/i),
    date: find(/mis\s*dis\s*date|disbursed\s*date|disbursal/i) ?? find(/date/i),
    dsa: find(/po.*company|company\s*name|^dsa$|vendor/i),
    off: find(/offered\s*rate/i),
    len: find(/lender\s*rate/i),
    month: find(/^month$/i) ?? find(/billing\s*month/i),
  };
  if (!K.lan || !K.bank || !K.amt || !K.dsa || !K.len) {
    return NextResponse.json({ ok: false, error: `missing columns. found: ${h.join(", ")}` }, { status: 400 });
  }

  const rows = json
    .map((r) => {
      const ym = (K.month && ymFrom(r[K.month])) || null;
      let d = K.date ? isoDate(r[K.date]) : null;
      if (ym && (!d || d.slice(0, 7) !== ym || d > "2027-01-01")) d = ym + "-15";
      return {
        lan: String(r[K.lan!] ?? "").trim(),
        customer: K.cust ? String(r[K.cust] ?? "").replace(/^-$/, "").trim() : "",
        bank: String(r[K.bank!] ?? "").trim(),
        dsa: String(r[K.dsa!] ?? "").trim(),
        amount: Number(String(r[K.amt!] ?? "").replace(/[^0-9.\-]/g, "")) || 0,
        ddate: d ?? "",
        offered: K.off ? Number(r[K.off]) || 0 : 0,
        lender: Number(r[K.len!]) || 0,
        bmonth: ym ?? (d ? d.slice(0, 7) : ""),
      };
    })
    .filter((r) => r.lan && r.bank && r.dsa && r.amount > 0 && r.ddate);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: "crm" } });
  const { data, error } = await supabase.rpc("sync_import_rows", { p_secret: syncSecret, p_rows: rows });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, parsed: rows.length, ...((data as object) ?? {}) });
}
