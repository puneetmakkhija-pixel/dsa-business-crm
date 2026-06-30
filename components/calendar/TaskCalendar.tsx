"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  createTaskAction,
  setTaskStatusAction,
  deleteTaskAction,
} from "@/app/(app)/calendar/actions";
import type { TaskRow, CaseOption, AssigneeOption } from "@/lib/crm-queries";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "payout", label: "Payout" },
  { value: "mis", label: "MIS" },
  { value: "dispute", label: "Dispute" },
  { value: "invoice", label: "Invoice / PO" },
  { value: "partner", label: "Partner" },
  { value: "collection", label: "Collection" },
];
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

const PRIORITY: Record<string, { dot: string; chip: string; label: string }> = {
  high: { dot: "bg-rose-500", chip: "bg-rose-50 text-rose-700 border-rose-200", label: "High" },
  medium: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200", label: "Medium" },
  low: { dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700 border-blue-200", label: "Low" },
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = Number(h);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

type Draft = {
  title: string;
  dueDate: string;
  dueTime: string;
  priority: "low" | "medium" | "high";
  category: string;
  caseId: string;
  assignedTo: string;
  notes: string;
};

export default function TaskCalendar({
  tasks,
  caseOptions,
  assignees,
  today,
}: {
  tasks: TaskRow[];
  caseOptions: CaseOption[];
  assignees: AssigneeOption[];
  today: string; // YYYY-MM-DD (server "now", IST)
}) {
  const router = useRouter();
  const initial = new Date(today + "T00:00:00");
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth()); // 0-based

  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<TaskRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft(today));

  function blankDraftFor(date: string): Draft {
    return { ...blankDraft(date) };
  }

  // group tasks by due date
  const byDay = useMemo(() => {
    const m = new Map<string, TaskRow[]>();
    for (const t of tasks) {
      const arr = m.get(t.due_date) ?? [];
      arr.push(t);
      m.set(t.due_date, arr);
    }
    return m;
  }, [tasks]);

  // build the 6x7 grid for the displayed month
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = first.getDay(); // 0=Sun
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [year, month]);

  // summary stats (across all tasks, not just visible month)
  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending");
    const dueToday = pending.filter((t) => t.due_date === today).length;
    const overdue = pending.filter((t) => t.due_date < today).length;
    const done = tasks.filter((t) => t.status === "done").length;
    const open = pending.length;
    return { dueToday, overdue, done, open };
  }, [tasks, today]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }
  function goToday() {
    setYear(initial.getFullYear());
    setMonth(initial.getMonth());
  }

  function openNew(date: string) {
    setDraft(blankDraftFor(date));
    setErr(null);
    setFormOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await createTaskAction({
      title: draft.title,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime || null,
      priority: draft.priority,
      category: draft.category,
      notes: draft.notes || null,
      caseId: draft.caseId ? Number(draft.caseId) : null,
      assignedTo: draft.assignedTo || null,
    });
    setBusy(false);
    if (res.ok) {
      setFormOpen(false);
      router.refresh();
    } else {
      setErr(res.error ?? "Failed");
    }
  }

  async function toggleStatus(t: TaskRow) {
    setBusy(true);
    const res = await setTaskStatusAction({
      id: t.id,
      status: t.status === "done" ? "pending" : "done",
    });
    setBusy(false);
    if (res.ok) {
      setDetail(null);
      router.refresh();
    } else {
      setErr(res.error ?? "Failed");
    }
  }

  async function remove(t: TaskRow) {
    setBusy(true);
    const res = await deleteTaskAction({ id: t.id });
    setBusy(false);
    if (res.ok) {
      setDetail(null);
      router.refresh();
    } else {
      setErr(res.error ?? "Failed");
    }
  }

  const monthTasks = tasks
    .filter((t) => t.due_date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
    .sort((a, b) => (a.due_date + (a.due_time ?? "")).localeCompare(b.due_date + (b.due_time ?? "")));

  return (
    <>
      {/* Stat row */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Open follow-ups" value={stats.open} tone="blue" />
        <MiniStat label="Due today" value={stats.dueToday} tone="amber" />
        <MiniStat label="Overdue" value={stats.overdue} tone="rose" />
        <MiniStat label="Completed" value={stats.done} tone="green" />
      </div>

      {/* Calendar card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <button onClick={() => shiftMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Previous month">‹</button>
            <div className="min-w-[170px] text-center font-display text-[17px] font-bold text-slate-900">
              {MONTH_NAMES[month]} {year}
            </div>
            <button onClick={() => shiftMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Next month">›</button>
            <Button variant="ghost" size="sm" className="ml-1" onClick={goToday}>Today</Button>
          </div>
          <Button size="sm" onClick={() => openNew(today)}>+ Add follow-up</Button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center">{w}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const key = ymd(d);
            const inMonth = d.getMonth() === month;
            const isToday = key === today;
            const dayTasks = byDay.get(key) ?? [];
            return (
              <div
                key={i}
                onClick={() => openNew(key)}
                className={`group min-h-[112px] cursor-pointer border-b border-r border-slate-100 p-1.5 transition-colors hover:bg-slate-50 ${
                  inMonth ? "bg-white" : "bg-slate-50/40"
                } ${i % 7 === 0 ? "border-l" : ""}`}
              >
                <div className="mb-1 flex items-center justify-between px-1">
                  <span
                    className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full text-[12px] font-semibold ${
                      isToday
                        ? "bg-brand text-white"
                        : inMonth
                        ? "text-slate-700"
                        : "text-slate-300"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <span className="text-[15px] leading-none text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">+</span>
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((t) => {
                    const overdue = t.status === "pending" && t.due_date < today;
                    return (
                      <button
                        key={t.id}
                        onClick={(e) => { e.stopPropagation(); setErr(null); setDetail(t); }}
                        className={`flex w-full items-center gap-1 truncate rounded-md border px-1.5 py-1 text-left text-[11px] font-medium transition-colors ${
                          t.status === "done"
                            ? "border-slate-200 bg-slate-50 text-slate-400 line-through"
                            : PRIORITY[t.priority].chip
                        } ${overdue ? "ring-1 ring-rose-300" : ""}`}
                        title={t.title}
                      >
                        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${t.status === "done" ? "bg-slate-300" : PRIORITY[t.priority].dot}`} />
                        {t.due_time && <span className="flex-shrink-0 tabular-nums opacity-70">{fmtTime(t.due_time).replace(" ", "")}</span>}
                        <span className="truncate">{t.title}</span>
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="px-1.5 text-[10px] font-medium text-slate-400">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda for the displayed month */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-3 font-display text-[14px] font-bold text-slate-900">
          {MONTH_NAMES[month]} agenda · {monthTasks.length} follow-up{monthTasks.length === 1 ? "" : "s"}
        </div>
        {monthTasks.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-slate-400">No follow-ups this month. Click any day to add one.</div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {monthTasks.map((t) => {
              const overdue = t.status === "pending" && t.due_date < today;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => { setErr(null); setDetail(t); }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50"
                  >
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${t.status === "done" ? "bg-emerald-400" : PRIORITY[t.priority].dot}`} />
                    <div className="w-[92px] flex-shrink-0 text-[12px] font-semibold text-slate-500">
                      {new Date(t.due_date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      {t.due_time && <span className="ml-1 font-normal text-slate-400">{fmtTime(t.due_time)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[13px] font-semibold ${t.status === "done" ? "text-slate-400 line-through" : "text-slate-800"}`}>{t.title}</div>
                      <div className="truncate text-[11px] text-slate-400">
                        {CATEGORY_LABEL[t.category] ?? t.category}
                        {t.lan_id && ` · LAN ${t.lan_id}`}
                        {t.assignee && ` · ${t.assignee}`}
                      </div>
                    </div>
                    {overdue && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">Overdue</span>}
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY[t.priority].chip}`}>{PRIORITY[t.priority].label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add form modal */}
      {formOpen && (
        <Modal onClose={() => setFormOpen(false)}>
          <form onSubmit={submit}>
            <div className="mb-3 font-display text-[16px] font-bold text-slate-900">New follow-up</div>
            <Field label="Title">
              <input className={INPUT} value={draft.title} required autoFocus placeholder="e.g. Follow up payout release"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due date">
                <input type="date" className={INPUT} value={draft.dueDate} required
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
              </Field>
              <Field label="Time (optional)">
                <input type="time" className={INPUT} value={draft.dueTime}
                  onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })} />
              </Field>
              <Field label="Priority">
                <select className={INPUT} value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: e.target.value as Draft["priority"] })}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </Field>
              <Field label="Category">
                <select className={INPUT} value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Related case (optional)">
                <select className={INPUT} value={draft.caseId}
                  onChange={(e) => setDraft({ ...draft, caseId: e.target.value })}>
                  <option value="">— none —</option>
                  {caseOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.lan_id}{c.customer_name ? ` · ${c.customer_name}` : ""}</option>
                  ))}
                </select>
              </Field>
              <Field label="Assign to (optional)">
                <select className={INPUT} value={draft.assignedTo}
                  onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value })}>
                  <option value="">— me —</option>
                  {assignees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes (optional)">
              <textarea rows={2} className={INPUT} value={draft.notes} placeholder="Context, what needs doing…"
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </Field>
            {err && <div className="mt-1 text-[12px] text-rose-600">{err}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)} disabled={busy}>Cancel</Button>
              <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Schedule"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Task detail modal */}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="mb-1 flex items-start gap-2">
            <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${detail.status === "done" ? "bg-emerald-400" : PRIORITY[detail.priority].dot}`} />
            <div className={`font-display text-[16px] font-bold ${detail.status === "done" ? "text-slate-400 line-through" : "text-slate-900"}`}>{detail.title}</div>
          </div>
          <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
            <Tag>{new Date(detail.due_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}{detail.due_time ? ` · ${fmtTime(detail.due_time)}` : ""}</Tag>
            <span className={`rounded-full border px-2 py-0.5 font-semibold ${PRIORITY[detail.priority].chip}`}>{PRIORITY[detail.priority].label} priority</span>
            <Tag>{CATEGORY_LABEL[detail.category] ?? detail.category}</Tag>
            {detail.status === "done" && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Done</span>}
          </div>
          <dl className="space-y-1.5 text-[12.5px]">
            {detail.lan_id && <Row k="Case">LAN {detail.lan_id}</Row>}
            {detail.partner && <Row k="Partner">{detail.partner}</Row>}
            {detail.assignee && <Row k="Assignee">{detail.assignee}</Row>}
            {detail.notes && <Row k="Notes">{detail.notes}</Row>}
          </dl>
          {err && <div className="mt-2 text-[12px] text-rose-600">{err}</div>}
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="danger" size="sm" onClick={() => remove(detail)} disabled={busy}>Delete</Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDetail(null)} disabled={busy}>Close</Button>
              <Button variant={detail.status === "done" ? "ghost" : "success"} size="sm" onClick={() => toggleStatus(detail)} disabled={busy}>
                {detail.status === "done" ? "Reopen" : "Mark done"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function blankDraft(date: string): Draft {
  return { title: "", dueDate: date, dueTime: "", priority: "medium", category: "general", caseId: "", assignedTo: "", notes: "" };
}

const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-[72px] flex-shrink-0 font-semibold text-slate-400">{k}</dt>
      <dd className="min-w-0 flex-1 text-slate-700">{children}</dd>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{children}</span>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-[480px] max-w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  blue: "text-blue-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
  green: "text-emerald-600",
};

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="text-[12px] font-medium text-slate-500">{label}</div>
      <div className={`mt-1 font-display text-[24px] font-bold tracking-tight ${TONES[tone]}`}>{value}</div>
    </div>
  );
}
