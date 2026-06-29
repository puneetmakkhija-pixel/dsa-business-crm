"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import SignOutButton from "@/components/auth/SignOutButton";
import type { NavItem } from "@/lib/nav";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function Sidebar({
  items,
  name,
  roleLabel,
}: {
  items: NavItem[];
  name: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[248px] flex-shrink-0 flex-col bg-navy-900 sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
          <Icon path="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" size={20} stroke="#fff" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">BuddyLoan</div>
          <div className="font-display text-[15px] font-bold text-white">Partner CRM</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {items.map((r) => {
          const active = r.href === "/" ? pathname === "/" : pathname.startsWith(r.href);
          return (
            <Link
              key={r.key}
              href={r.href}
              aria-current={active ? "page" : undefined}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon path={r.icon} size={18} />
              {r.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[12px] font-bold text-amber-950">
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[12.5px] font-semibold text-white">{name}</div>
          <div className="truncate text-[11px] text-white/50">{roleLabel}</div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
