"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Accounts" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/audit", label: "Audit log" },
];

// Left-hand panel of three stacked capsules — one per admin section.
// Deliberately vertical, not the horizontal pill bar used elsewhere, so it
// reads as its own dedicated panel rather than a page-level tab strip.
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2.5">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full border px-4 py-2.5 text-center text-sm font-medium transition-all duration-300 ${
              active
                ? "border-transparent bg-[var(--accent)] text-[var(--void)] shadow-[0_0_24px_-6px_var(--accent-dim)]"
                : "border-[var(--line)] text-[var(--bone-dim)] hover:border-[var(--accent)]/40 hover:text-[var(--bone)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
