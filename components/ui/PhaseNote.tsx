import Panel from "@/components/dashboard/Panel";

/** Placeholder panel for modules landing in a later phase. */
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
    <Panel style={{ padding: "40px 36px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 15,
            flexShrink: 0,
            background: "rgba(91,141,239,0.14)",
            color: "#7CA8FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
        <div>
          <div style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#E8B873", background: "rgba(232,184,115,0.14)", padding: "3px 9px", borderRadius: 6, marginBottom: 8 }}>
            {phase}
          </div>
          <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-sora), sans-serif", fontSize: 17, fontWeight: 700, color: "#F4F8FE" }}>{title}</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#9FB2CC", maxWidth: 560, lineHeight: 1.55 }}>{desc}</p>
        </div>
      </div>
    </Panel>
  );
}
