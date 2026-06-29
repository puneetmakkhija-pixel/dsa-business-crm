import type { ReactNode } from "react";

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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      {(title || right) && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h3 className="font-display text-[15px] font-bold text-slate-900">{title}</h3>}
            {subtitle && <span className="text-[12px] text-slate-500">{subtitle}</span>}
          </div>
          {right}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500"
                  style={{ textAlign: c.align ?? "left", width: c.width }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="border-t border-slate-100 hover:bg-slate-50/70">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className="whitespace-nowrap px-4 py-3 text-slate-700"
                      style={{ textAlign: c.align ?? "left" }}
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
    </div>
  );
}
