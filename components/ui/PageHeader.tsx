import type { ReactNode } from "react";

export default function PageHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-wide text-brand">{eyebrow}</div>
        <h1 className="font-display text-[24px] font-bold tracking-tight text-slate-900 mt-0.5">{title}</h1>
      </div>
      {right && <div className="flex items-center gap-2.5">{right}</div>}
    </div>
  );
}
