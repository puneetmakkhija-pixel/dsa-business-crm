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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 22,
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#7E93B0", letterSpacing: "0.3px" }}>
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sora), sans-serif",
            fontSize: 25,
            fontWeight: 800,
            letterSpacing: "-0.6px",
            color: "#F4F8FE",
            marginTop: 3,
          }}
        >
          {title}
        </div>
      </div>
      {right && <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{right}</div>}
    </div>
  );
}
