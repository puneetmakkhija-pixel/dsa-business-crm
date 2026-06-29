import type { ReactNode } from "react";
import Panel from "@/components/dashboard/Panel";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  width?: number | string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  title?: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: string;
  right?: ReactNode;
};

export default function DataTable<T>({
  title,
  subtitle,
  columns,
  rows,
  rowKey,
  empty = "No records match the current filters.",
  right,
}: Props<T>) {
  return (
    <Panel style={{ padding: "20px 22px" }}>
      {(title || right) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontFamily: "var(--font-sora), sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#F4F8FE",
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <span style={{ fontSize: 11.5, color: "#7E93B0" }}>{subtitle}</span>
            )}
          </div>
          {right}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12.5,
          }}
        >
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    textAlign: c.align ?? "left",
                    padding: "0 14px 10px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                    color: "#6E84A3",
                    width: c.width,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: "28px 14px", textAlign: "center", color: "#7E93B0" }}
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        textAlign: c.align ?? "left",
                        padding: "12px 14px",
                        color: "#E8EEF6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
