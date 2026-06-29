import Panel from "./Panel";
import type { VendorRow } from "@/lib/dashboard-data";

export default function VendorLeaderboard({
  vendorRows,
}: {
  vendorRows: VendorRow[];
}) {
  return (
    <Panel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-sora), sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#F4F8FE",
          }}
        >
          Top DSA Partners
        </h3>
        <span style={{ fontSize: 11, color: "#7E93B0" }}>
          by disbursed volume · May
        </span>
      </div>

      {vendorRows.map((v) => (
        <div key={v.name} style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 7,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontFamily: "var(--font-sora), sans-serif",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#6E84A3",
                  width: 18,
                }}
              >
                {v.rank}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#E8EEF6" }}>
                {v.name}
              </span>
              <span style={{ fontSize: 10.5, color: "#6E84A3" }}>
                {v.cases} cases
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: "var(--font-sora), sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#F4F8FE",
                }}
              >
                {v.disb}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 62,
                  textAlign: "right",
                  color: v.mFg,
                }}
              >
                {v.margin}
              </span>
            </div>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: v.pct,
                borderRadius: 6,
                background: "linear-gradient(90deg,#5B8DEF,#7C5BEF)",
              }}
            />
          </div>
        </div>
      ))}
    </Panel>
  );
}
