import Icon from "./Icon";
import type { Kpi } from "@/lib/dashboard-data";

export default function KpiCards({ heroKpis }: { heroKpis: Kpi[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 18,
        marginBottom: 18,
        animation: "riseIn .4s ease",
      }}
    >
      {heroKpis.map((k) => (
        <div
          key={k.label}
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            padding: "20px 22px",
            background:
              "linear-gradient(158deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 24px 50px -28px rgba(0,0,0,0.8)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: k.glow,
              filter: "blur(34px)",
              opacity: 0.5,
            }}
          />
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#8DA2BD",
                  letterSpacing: "0.3px",
                }}
              >
                {k.label}
              </span>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: "rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: k.icFg,
                }}
              >
                <Icon path={k.icon} size={15} />
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-sora), sans-serif",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.8px",
                color: "#F4F8FE",
                marginTop: 14,
                whiteSpace: "nowrap",
              }}
            >
              {k.value}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginTop: 9,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 7,
                  background: k.chipBg,
                  color: k.chipFg,
                }}
              >
                {k.delta}
              </span>
              <span style={{ fontSize: 11, color: "#7E93B0" }}>{k.sub}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
