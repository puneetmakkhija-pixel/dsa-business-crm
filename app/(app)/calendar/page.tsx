import { requireProfile } from "@/lib/auth";
import { getTasks, getCaseOptions, getAssignableUsers } from "@/lib/crm-queries";
import PageHeader from "@/components/ui/PageHeader";
import TaskCalendar from "@/components/calendar/TaskCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireProfile();
  const [tasks, caseOptions, assignees] = await Promise.all([
    getTasks(),
    getCaseOptions(),
    getAssignableUsers(),
  ]);

  // Server "now" in IST so "today" / "overdue" match the user's timezone.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <>
      <PageHeader eyebrow="Operations" title="Follow-up Calendar" />
      <TaskCalendar tasks={tasks} caseOptions={caseOptions} assignees={assignees} today={today} />
    </>
  );
}
