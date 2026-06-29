import Icon from "@/components/dashboard/Icon";

export type Stat = {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  glow?: string;
  icFg?: string;
};

export function StatCard({ label, value, sub, icon, glow, icFg }: Stat) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: "18px 20px",
        background:
          "linear-gradient(158deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 24px 50px -28px rgba(0,0,0,0.8)",
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: glow,
            filter: "blur(34px)",
            opacity: 0.45,
          }}
        />
      )}
      <div style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8DA2BD" }}>
            {label}
          </span>
          {icon && (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                background: "rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: icFg ?? "#7CA8FF",
              }}
            >
              <Icon path={icon} size={14} />
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sora), sans-serif",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.6px",
            color: "#F4F8FE",
            marginTop: 12,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "#7E93B0", marginTop: 6 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

export function StatGrid({ stats, cols = 4 }: { stats: Stat[]; cols?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols},1fr)`,
        gap: 16,
        marginBottom: 18,
        animation: "riseIn .4s ease",
      }}
    >
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
