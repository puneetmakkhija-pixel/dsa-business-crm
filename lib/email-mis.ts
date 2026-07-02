import "server-only";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import * as XLSX from "xlsx";

// Pulls the daily lender MIS Excel straight from a Gmail inbox over IMAP.
// Each lender emails its MIS from a known sender address; LENDER_MIS_SENDERS
// maps sender → lender name so ingestion can match by LAN + lender.
//
// Required env (set in .env.local and Vercel):
//   GMAIL_IMAP_USER            the mailbox address (e.g. you@gmail.com)
//   GMAIL_IMAP_APP_PASSWORD    a Gmail app password (needs 2-Step Verification)
//   LENDER_MIS_SENDERS         JSON: {"mis@abfl.com":"ABFL","x@lk.com":"LendingKart"}
//   GMAIL_IMAP_HOST            optional, defaults to imap.gmail.com

export type MisRow = { lan: string; amount: number | null; date: string | null };

export type LenderMisBatch = {
  uid: number;
  from: string;
  lenderName: string;
  filename: string;
  misDate: string | null;
  rows: MisRow[];
  skippedReason?: string;
};

// Known BuddyLoan lender-MIS senders → CRM lender name. Values are matched to
// crm.lenders leniently (case-insensitive, substring either way), so "Bajaj"
// resolves to "Bajaj Finserv". Override/extend via the LENDER_MIS_SENDERS env
// (JSON {sender: lenderName}); env entries win on key collision.
const DEFAULT_SENDERS: Record<string, string> = {
  "aman.sahoo@indificapital.com": "Indifi",
  "aditya.puraswani@ayefin.com": "Aye Finance",
  "blsmeps@bajajfinserv.in": "Bajaj",
  "metabasealerts@protium.co.in": "Protium",
  "reports@flexiloans.com": "Flexiloans",
  "aman.inder@partner.creditsaison-in.com": "Credit Saison",
  "gvidya.cbsl@tatacapital.com": "Tata Capital",
  "aishwarya.shinde3@poonawallafincorp.com": "Poonawalla",
};

function senderMap(): Record<string, string> {
  const lower = (obj: Record<string, string>) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.trim().toLowerCase(), v]));
  const base = lower(DEFAULT_SENDERS);
  const raw = process.env.LENDER_MIS_SENDERS;
  if (!raw) return base;
  try {
    return { ...base, ...lower(JSON.parse(raw) as Record<string, string>) };
  } catch {
    return base;
  }
}

function isoDate(v: unknown): string | null {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    yy = yy.length === 2 ? "20" + yy : yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // skip anything over 25 MB
const MAX_SHEET_ROWS = 20000; // bound parse work so a giant/malformed sheet can't hang us

/** Parse an xlsx/csv buffer into MIS rows ({lan, amount, date}). */
function parseMisWorkbook(buf: Buffer): MisRow[] {
  // sheetRows caps how many rows are read — protects against a runaway/huge sheet.
  const wb = XLSX.read(buf, { type: "buffer", sheetRows: MAX_SHEET_ROWS });
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  if (json.length === 0) return [];
  const h = Object.keys(json[0]);
  const find = (re: RegExp) => h.find((x) => re.test(x));
  const kLan = find(/\blan\s*id\b|\blan_id\b|^lan$/i) ?? find(/\blan\b/i);
  const kAmt = find(/disbursed\s*amount/i) ?? find(/^amount$/i) ?? find(/amount/i);
  const kDate = find(/mis\s*dis\s*date|disbursed\s*date|disbursal/i) ?? find(/date/i);
  if (!kLan) return [];
  return json
    .map((r) => ({
      lan: String(r[kLan] ?? "").trim(),
      amount: kAmt ? Number(String(r[kAmt] ?? "").replace(/[^0-9.\-]/g, "")) || null : null,
      date: kDate ? isoDate(r[kDate]) : null,
    }))
    .filter((r) => r.lan);
}

const XLSX_RE = /\.(xlsx|xls|csv)$/i;

/**
 * Connect to the inbox and return one batch per unseen lender-MIS email.
 * When markSeen is true, successfully parsed emails are flagged \Seen so the
 * next run doesn't re-ingest them (use false for a dry run / preview).
 */
export async function fetchLenderMisEmails(opts: { markSeen: boolean; sinceDays?: number } = { markSeen: false }): Promise<
  { ok: true; batches: LenderMisBatch[] } | { ok: false; error: string }
> {
  const user = process.env.GMAIL_IMAP_USER;
  const pass = process.env.GMAIL_IMAP_APP_PASSWORD;
  const host = process.env.GMAIL_IMAP_HOST || "imap.gmail.com";
  const senders = senderMap();

  if (!user || !pass) return { ok: false, error: "GMAIL_IMAP_USER / GMAIL_IMAP_APP_PASSWORD not configured" };
  if (Object.keys(senders).length === 0) return { ok: false, error: "LENDER_MIS_SENDERS not configured (map sender→lender)" };

  const client = new ImapFlow({ host, port: 993, secure: true, auth: { user, pass }, logger: false });
  const batches: LenderMisBatch[] = [];
  const since = new Date(Date.now() - (opts.sinceDays ?? 7) * 86400_000);

  try {
    await client.connect();
  } catch (e) {
    return { ok: false, error: `IMAP connect failed: ${(e as Error).message}` };
  }

  const lock = await client.getMailboxLock("INBOX");
  try {
    for (const [addr, lenderName] of Object.entries(senders)) {
      const found = await client.search({ seen: false, from: addr, since }, { uid: true });
      if (!found || found.length === 0) continue;
      // Daily report — only the most recent few unseen messages per sender.
      const uids = found.sort((a, b) => b - a).slice(0, 5);
      for (const uid of uids) {
        const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const att = (parsed.attachments ?? []).find((a) => XLSX_RE.test(a.filename ?? ""));
        const misDate = parsed.date ? parsed.date.toISOString().slice(0, 10) : null;
        const base = { uid, from: addr, lenderName, misDate };
        if (!att) {
          batches.push({ ...base, filename: "(no spreadsheet attachment)", rows: [], skippedReason: "no .xlsx/.csv attachment" });
          continue;
        }
        const buf = att.content as Buffer;
        if (buf.length > MAX_ATTACHMENT_BYTES) {
          batches.push({ ...base, filename: att.filename ?? "mis.xlsx", rows: [], skippedReason: `attachment too large (${(buf.length / 1e6).toFixed(0)} MB)` });
          continue;
        }
        let rows: MisRow[] = [];
        let parseErr: string | undefined;
        try {
          rows = parseMisWorkbook(buf);
        } catch (e) {
          parseErr = `parse failed: ${(e as Error).message}`;
        }
        batches.push({
          ...base,
          filename: att.filename ?? "mis.xlsx",
          rows,
          skippedReason: parseErr ?? (rows.length === 0 ? "no LAN rows detected" : undefined),
        });
        if (opts.markSeen && rows.length > 0) {
          await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
        }
      }
    }
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }

  return { ok: true, batches };
}
