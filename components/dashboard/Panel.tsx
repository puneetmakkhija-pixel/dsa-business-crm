import type { CSSProperties, ReactNode } from "react";

/** White card surface (TRD §16: white bg, rounded-xl, subtle border + shadow). */
export default function Panel({
  children,
  style,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-card ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
