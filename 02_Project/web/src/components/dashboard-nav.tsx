"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/suppliers", label: "Suppliers" },
  { href: "/dashboard/sales", label: "Sales" },
  { href: "/dashboard/inventory", label: "Inventory" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <div className="mb-8 flex gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bone)]/[0.02] p-1">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex-1 rounded-full py-1.5 text-center text-xs font-medium transition-all duration-300 ${
              active ? "bg-[var(--accent)] text-[var(--void)]" : "text-[var(--bone-dim)] hover:text-[var(--bone)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
