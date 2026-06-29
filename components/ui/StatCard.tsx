import Icon from "@/components/dashboard/Icon";

export type Stat = {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  tone?: "blue" | "violet" | "green" | "amber" | "rose";
};

const TONES: Record<string, { bg: string; fg: string }> = {
  blue: { bg: "bg-blue-50", fg: "text-blue-600" },
  violet: { bg: "bg-violet-50", fg: "text-violet-600" },
  green: { bg: "bg-emerald-50", fg: "text-emerald-600" },
  amber: { bg: "bg-amber-50", fg: "text-amber-600" },
  rose: { bg: "bg-rose-50", fg: "text-rose-600" },
};

export function StatCard({ label, value, sub, icon, tone = "blue" }: Stat) {
  const t = TONES[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-cardhover">
      <div className="flex items-start justify-between">
        <span className="text-[12px] font-medium text-slate-500">{label}</span>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.bg} ${t.fg}`}>
            <Icon path={icon} size={15} />
          </div>
        )}
      </div>
      <div className="mt-3 font-display text-[24px] font-bold tracking-tight text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function StatGrid({ stats, cols = 4 }: { stats: Stat[]; cols?: number }) {
  const colClass = cols === 4 ? "lg:grid-cols-4" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <div className={`mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 ${colClass} animate-rise`}>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
