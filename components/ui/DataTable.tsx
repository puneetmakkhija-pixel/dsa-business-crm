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
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-slate-400">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                    <span className="text-[12.5px] font-medium text-slate-500">{empty}</span>
                  </div>
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
