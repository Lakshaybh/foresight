"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/suppliers", label: "Suppliers" },
  { href: "/dashboard/sales", label: "Sales" },
  { href: "/dashboard/inventory", label: "Inventory" },
];

function DashboardNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const asTenant = searchParams.get("as_tenant");
  const tenantEmail = searchParams.get("tenant_email");
  const suffix = asTenant
    ? `?as_tenant=${asTenant}${tenantEmail ? `&tenant_email=${encodeURIComponent(tenantEmail)}` : ""}`
    : "";

  return (
    <div className="mb-8 flex gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bone)]/[0.02] p-1">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={`${l.href}${suffix}`}
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

// useSearchParams requires a Suspense boundary during static generation —
// wrapped here once so every page using DashboardNav doesn't need to
// remember to add its own.
export function DashboardNav() {
  return (
    <Suspense fallback={<div className="mb-8 h-10 rounded-full border border-[var(--line)] bg-[var(--bone)]/[0.02]" />}>
      <DashboardNavInner />
    </Suspense>
  );
}
