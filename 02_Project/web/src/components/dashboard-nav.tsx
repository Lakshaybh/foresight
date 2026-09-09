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

// Left-hand panel of stacked capsules — one per dashboard section. Mirrors
// AdminNav's vertical-panel treatment so retailer/supplier tenants and
// admins get the same navigation pattern.
function DashboardNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const asTenant = searchParams.get("as_tenant");
  const tenantEmail = searchParams.get("tenant_email");
  const suffix = asTenant
    ? `?as_tenant=${asTenant}${tenantEmail ? `&tenant_email=${encodeURIComponent(tenantEmail)}` : ""}`
    : "";

  return (
    <nav className="flex flex-col gap-2.5">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={`${l.href}${suffix}`}
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

// useSearchParams requires a Suspense boundary during static generation —
// wrapped here once so every page using DashboardNav doesn't need to
// remember to add its own.
export function DashboardNav() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-2.5"><div className="h-10 rounded-full border border-[var(--line)] bg-[var(--bone)]/[0.02]" /></div>}>
      <DashboardNavInner />
    </Suspense>
  );
}
