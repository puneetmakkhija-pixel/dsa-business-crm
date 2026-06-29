import Icon from "./Icon";
import { rail } from "@/lib/dashboard-data";

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 78,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "22px 0",
        gap: 8,
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Brand mark */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          boxShadow: "0 8px 22px -6px rgba(91,141,239,0.6)",
        }}
      >
        <Icon
          path="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5"
          size={22}
          stroke="#fff"
          strokeWidth={2.4}
        />
      </div>

      {rail.map((r) => (
        <div
          key={r.label}
          title={r.label}
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: r.on ? "#fff" : "#7E93B0",
            background: r.on
              ? "linear-gradient(135deg,#5B8DEF,#7C5BEF)"
              : "transparent",
            position: "relative",
          }}
        >
          <Icon path={r.icon} size={20} />
        </div>
      ))}

      {/* Avatar */}
      <div
        style={{
          marginTop: "auto",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#E8B873,#D08A3E)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3A2406",
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        AS
      </div>
    </aside>
  );
}
