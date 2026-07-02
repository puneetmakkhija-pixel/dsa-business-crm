/**
 * Diagnostic: connect to the real inbox over IMAP and report, per lender sender,
 * what unseen mail + attachments exist and whether we can parse LAN/amount/date.
 * Read-only — never marks anything seen. Not part of the app.
 *
 *   npx tsx scripts/test-email-mis.ts
 *
 * Loads GMAIL_IMAP_USER / GMAIL_IMAP_APP_PASSWORD from .env.local.
 */
import { readFileSync } from "node:fs";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import * as XLSX from "xlsx";

// minimal .env.local loader
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const SENDERS: Record<string, string> = {
  "aman.sahoo@indificapital.com": "Indifi",
  "aditya.puraswani@ayefin.com": "Aye Finance",
  "blsmeps@bajajfinserv.in": "Bajaj",
  "metabasealerts@protium.co.in": "Protium",
  "reports@flexiloans.com": "Flexiloans",
  "aman.inder@partner.creditsaison-in.com": "Credit Saison",
  "gvidya.cbsl@tatacapital.com": "Tata Capital",
  "aishwarya.shinde3@poonawallafincorp.com": "Poonawalla",
};
const XLSX_RE = /\.(xlsx|xls|csv)$/i;

async function main() {
  const user = process.env.GMAIL_IMAP_USER!;
  const pass = process.env.GMAIL_IMAP_APP_PASSWORD!;
  console.log(`connecting as ${user} …`);
  const client = new ImapFlow({ host: "imap.gmail.com", port: 993, secure: true, auth: { user, pass }, logger: false });
  await client.connect();
  console.log("connected ✓\n");
  const since = new Date(Date.now() - 14 * 86400_000);
  const lock = await client.getMailboxLock("INBOX");
  try {
    for (const [addr, lender] of Object.entries(SENDERS)) {
      const uids = await client.search({ from: addr, since }, { uid: true });
      const unseen = await client.search({ from: addr, since, seen: false }, { uid: true });
      console.log(`── ${lender}  <${addr}>`);
      console.log(`   ${(uids || []).length} in last 14d · ${(unseen || []).length} unread`);
      const pick = (unseen && unseen.length ? unseen : uids || []).sort((a, b) => b - a).slice(0, 1);
      for (const uid of pick) {
        const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        console.log(`   subj: ${parsed.subject}`);
        const atts = parsed.attachments ?? [];
        if (!atts.length) console.log("   (no attachments)");
        for (const a of atts) {
          const isSheet = XLSX_RE.test(a.filename ?? "");
          const sizeMB = ((a.content as Buffer).length / 1e6).toFixed(2);
          console.log(`   • ${a.filename ?? "?"}  [${a.contentType}]  ${sizeMB} MB${isSheet ? "  ← sheet" : ""}`);
          if (!isSheet) continue;
          try {
            const wb = XLSX.read(a.content as Buffer, { type: "buffer", sheetRows: 20000 });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
            const headers = json.length ? Object.keys(json[0]) : [];
            console.log(`     sheets: ${wb.SheetNames.join(", ")}`);
            console.log(`     rows: ${json.length} · headers: ${headers.slice(0, 12).join(" | ")}`);
          } catch (e) {
            console.log(`     PARSE ERROR: ${(e as Error).message}`);
          }
        }
      }
      console.log("");
    }
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
