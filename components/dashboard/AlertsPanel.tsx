import Panel from "./Panel";
import Icon from "./Icon";
import type { Alert } from "@/lib/dashboard-data";

export default function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <Panel>
      <h3
        style={{
          margin: "0 0 16px",
          fontFamily: "var(--font-sora), sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: "#F4F8FE",
        }}
      >
        Needs Attention
      </h3>

      {alerts.map((a) => (
        <div
          key={a.title}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "11px 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: a.bg,
              color: a.fg,
            }}
          >
            <Icon path={a.icon} size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#E8EEF6" }}>
              {a.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#7E93B0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {a.sub}
            </div>
          </div>
          <span
            style={{
              fontFamily: "var(--font-sora), sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: a.fg,
            }}
          >
            {a.val}
          </span>
        </div>
      ))}
    </Panel>
  );
}
