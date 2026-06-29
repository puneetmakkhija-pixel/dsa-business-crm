"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import SignOutButton from "@/components/auth/SignOutButton";
import type { NavItem } from "@/lib/nav";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
    <aside
      style={{
        width: 78,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "22px 0",
        gap: 6,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <Link
        href="/"
        aria-label="Dashboard"
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          background: "linear-gradient(135deg,#5B8DEF,#7C5BEF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          flexShrink: 0,
          boxShadow: "0 8px 22px -6px rgba(91,141,239,0.6)",
        }}
      >
        <Icon path="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" size={22} stroke="#fff" strokeWidth={2.4} />
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", flex: 1 }}>
        {items.map((r) => {
          const active = r.href === "/" ? pathname === "/" : pathname.startsWith(r.href);
          return (
            <Link
              key={r.key}
              href={r.href}
              title={r.label}
              aria-current={active ? "page" : undefined}
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: active ? "#fff" : "#7E93B0",
                background: active ? "linear-gradient(135deg,#5B8DEF,#7C5BEF)" : "transparent",
                transition: "color .15s, background .15s",
                flexShrink: 0,
              }}
            >
              <Icon path={r.icon} size={20} />
            </Link>
          );
        })}
      </nav>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 8 }}>
        <SignOutButton />
        <div
          title={`${name} · ${roleLabel}`}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#E8B873,#D08A3E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3A2406",
            fontWeight: 800,
            fontSize: 12.5,
          }}
        >
          {initials(name)}
        </div>
      </div>
    </aside>
  );
}
