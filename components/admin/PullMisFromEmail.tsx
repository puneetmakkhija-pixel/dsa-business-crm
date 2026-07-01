"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/dashboard/Panel";
import { pullLenderMisFromEmailAction, type EmailPullResult, type EmailPullBatch } from "@/app/(app)/mis/actions";

const STATUS_STYLE: Record<EmailPullBatch["status"], string> = {
  ingested: "bg-emerald-100 text-emerald-700",
  preview: "bg-blue-100 text-blue-700",
  skipped: "bg-amber-100 text-amber-700",
};

export default function PullMisFromEmail() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<EmailPullResult | null>(null);
  const [mode, setMode] = useState<"preview" | "ingest" | null>(null);

  const run = (dryRun: boolean) => {
    setMode(dryRun ? "preview" : "ingest");
    setResult(null);
    start(async () => setResult(await pullLenderMisFromEmailAction(dryRun)));
  };

  return (
    <Panel className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[15px] font-bold text-slate-900">Pull daily MIS from email</h3>
          <span className="text-[11.5px] text-slate-500">
            Fetches unread lender MIS attachments over IMAP and reconciles each by LAN + lender (sender → lender map).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(true)}>
            {pending && mode === "preview" ? "Checking…" : "Preview from email"}
          </Button>
          <Button size="sm" disabled={pending} onClick={() => run(false)}>
            {pending && mode === "ingest" ? "Pulling…" : "Pull & ingest now"}
          </Button>
        </div>
      </div>

      {result && !result.ok && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">{result.error}</div>
      )}

      {result?.ok && result.batches && (
        result.batches.length === 0 ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-500">
            No unread lender MIS emails found.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {result.batches.map((b, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-[13px]">{b.lenderName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                    {b.misDate && <span className="text-[11px] text-slate-400">{b.misDate}</span>}
                  </div>
                  <div className="truncate text-[11.5px] text-slate-500">{b.filename} · {b.from} · {b.detail}</div>
                </div>
                <div className="text-right text-[12px] tabular-nums text-slate-600">
                  {b.summary ? (
                    <span>
                      <span className="text-emerald-600 font-semibold">{b.summary.matched}</span> matched ·{" "}
                      <span className="text-blue-600">{b.summary.unmatched}</span> unmatched ·{" "}
                      <span className="text-rose-500">{b.summary.disputed}</span> disputed
                    </span>
                  ) : (
                    <span>{b.rows} rows</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Panel>
  );
}
