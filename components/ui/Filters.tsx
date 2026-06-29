"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type SelectFilter = {
  param: string;
  placeholder: string;
  options: { value: string; label: string }[];
};

const inputCls =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

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
    <div className="flex flex-wrap items-center gap-2.5">
      {showSearch && (
        <div className="flex w-60 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            defaultValue={params.get(searchParam) ?? ""}
            onChange={(e) => setParam(searchParam, e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border-none bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      )}
      {selects.map((s) => (
        <select
          key={s.param}
          defaultValue={params.get(s.param) ?? ""}
          onChange={(e) => setParam(s.param, e.target.value)}
          className={inputCls}
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
