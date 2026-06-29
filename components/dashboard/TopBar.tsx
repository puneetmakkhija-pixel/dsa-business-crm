export default function TopBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 26,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "#7E93B0",
            letterSpacing: "0.3px",
          }}
        >
          Good morning, Arjun
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
          DSA Command Center
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            width: 260,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7E93B0"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span style={{ fontSize: 12.5, color: "#7E93B0" }}>
            Search LAN, vendor, customer…
          </span>
        </div>

        {/* Month selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 12.5,
            fontWeight: 600,
            color: "#CFDCEC",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#34D399",
            }}
          />
          May 2026
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7E93B0"
            strokeWidth={2.5}
            strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
