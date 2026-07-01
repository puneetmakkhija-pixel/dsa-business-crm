import Icon from "@/components/dashboard/Icon";

export type Stat = {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  tone?: "blue" | "violet" | "green" | "amber" | "rose";
};

const TONES: Record<string, { chip: string; fg: string }> = {
  blue: { chip: "bg-gradient-to-br from-blue-50 to-blue-100", fg: "text-blue-600" },
  violet: { chip: "bg-gradient-to-br from-violet-50 to-violet-100", fg: "text-violet-600" },
  green: { chip: "bg-gradient-to-br from-emerald-50 to-emerald-100", fg: "text-emerald-600" },
  amber: { chip: "bg-gradient-to-br from-amber-50 to-amber-100", fg: "text-amber-600" },
  rose: { chip: "bg-gradient-to-br from-rose-50 to-rose-100", fg: "text-rose-600" },
};

export function StatCard({ label, value, sub, icon, tone = "blue", delay }: Stat & { delay?: number }) {
  const t = TONES[tone];
  return (
    <div
      className="animate-rise rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-cardhover"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-start justify-between">
        <span className="text-[12px] font-medium text-slate-500">{label}</span>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-black/[0.04] ${t.chip} ${t.fg}`}>
            <Icon path={icon} size={15} />
          </div>
        )}
      </div>
      <div className="mt-3 font-display text-[24px] font-bold tracking-tight tabular-nums text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function StatGrid({ stats, cols = 4 }: { stats: Stat[]; cols?: number }) {
  const colClass = cols === 4 ? "lg:grid-cols-4" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <div className={`mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 ${colClass}`}>
      {stats.map((s, i) => (
        <StatCard key={s.label} {...s} delay={i * 60} />
      ))}
    </div>
  );
}
