import type { CSSProperties, ReactNode } from "react";

/** Frosted card surface shared by the chart, leaderboard, and alert panels. */
export default function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: "22px 24px",
        background:
          "linear-gradient(158deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 50px -28px rgba(0,0,0,0.8)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
