export default function PhaseNote({
  phase,
  title,
  desc,
  icon,
}: {
  phase: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-9 shadow-card">
      <div className="flex items-center gap-4">
        <div className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 p-3 text-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
        <div>
          <span className="mb-2 inline-block rounded-md bg-amber-100 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-amber-700">
            {phase}
          </span>
          <h3 className="font-display text-[17px] font-bold text-slate-900">{title}</h3>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-500">{desc}</p>
        </div>
      </div>
    </div>
  );
}
