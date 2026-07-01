// The two departments the CRM is bifurcated into. A user belongs to one;
// navigation and modules are scoped to it. Super admins (or users with no
// department) see both sides.
export type Department = "call_center" | "dsa";

export const DEPT_LABELS: Record<Department, string> = {
  call_center: "Call Center",
  dsa: "DSA",
};

export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: "call_center", label: "Call Center" },
  { value: "dsa", label: "DSA" },
];
