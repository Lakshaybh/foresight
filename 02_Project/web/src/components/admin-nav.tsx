"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Accounts" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/audit", label: "Audit log" },
];

// Left-hand panel of section links — flat hairline rows with a left accent
// bar on the active item, matching DashboardNav's treatment so admin and
// tenant screens share one sidebar language.
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 border-l border-[var(--line)]">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`-ml-px border-l-2 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
              active
                ? "border-[var(--accent)] text-[var(--bone-strong)]"
                : "border-transparent text-[var(--bone-dim)] hover:text-[var(--bone)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
