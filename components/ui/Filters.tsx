"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type SelectFilter = {
  param: string;
  placeholder: string;
  options: { value: string; label: string }[];
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 11,
  padding: "9px 12px",
  fontSize: 12.5,
  color: "#CFDCEC",
  outline: "none",
};

export default function Filters({
  searchParam = "q",
  searchPlaceholder = "Search…",
  selects = [],
  showSearch = true,
}: {
  searchParam?: string;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
  showSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {showSearch && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          width: 240,
          ...inputStyle,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7E93B0" strokeWidth={2} strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          defaultValue={params.get(searchParam) ?? ""}
          onChange={(e) => setParam(searchParam, e.target.value)}
          placeholder={searchPlaceholder}
          style={{ border: "none", background: "transparent", outline: "none", color: "#E8EEF6", fontSize: 12.5, width: "100%" }}
        />
      </div>
      )}
      {selects.map((s) => (
        <select
          key={s.param}
          defaultValue={params.get(s.param) ?? ""}
          onChange={(e) => setParam(s.param, e.target.value)}
          style={inputStyle}
        >
          <option value="">{s.placeholder}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
