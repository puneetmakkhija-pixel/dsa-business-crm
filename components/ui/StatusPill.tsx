import { STATUS_META } from "@/lib/format";

export default function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    fg: "#7E93B0",
    bg: "rgba(255,255,255,0.06)",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 7,
        background: meta.bg,
        color: meta.fg,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: meta.fg,
        }}
      />
      {meta.label}
    </span>
  );
}
