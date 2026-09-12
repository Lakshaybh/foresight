"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { apiFetch, withTenant } from "@/lib/api";

const LINKS = [
  { href: "/dashboard", label: "Overview", entityType: null },
  { href: "/dashboard/suppliers", label: "Suppliers", entityType: "supplier" },
  { href: "/dashboard/sales", label: "Sales", entityType: null },
  { href: "/dashboard/inventory", label: "Inventory", entityType: "product" },
] as const;

type DecisionRow = { status: string; evidence: { entity_type?: string } };

// Left-hand panel of stacked capsules — one per dashboard section. Mirrors
// AdminNav's vertical-panel treatment so retailer/supplier tenants and
// admins get the same navigation pattern. Suppliers/Inventory also carry a
// live count of open decisions touching that entity type, so the nav
// itself surfaces signal instead of being pure navigation.
function DashboardNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const asTenant = searchParams.get("as_tenant");
  const tenantEmail = searchParams.get("tenant_email");
  const suffix = asTenant
    ? `?as_tenant=${asTenant}${tenantEmail ? `&tenant_email=${encodeURIComponent(tenantEmail)}` : ""}`
    : "";

  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    apiFetch<DecisionRow[]>(withTenant("/decisions", asTenant))
      .then((rows) => {
        const tally: Record<string, number> = {};
        for (const r of rows) {
          if (r.status !== "open") continue;
          const entityType = r.evidence?.entity_type;
          if (entityType) tally[entityType] = (tally[entityType] ?? 0) + 1;
        }
        setCounts(tally);
      })
      .catch(() => setCounts({}));
  }, [asTenant]);

  return (
    <nav className="flex flex-col gap-0.5 border-l border-[var(--line)]">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(l.href);
        const count = l.entityType ? counts?.[l.entityType] : undefined;
        return (
          <Link
            key={l.href}
            href={`${l.href}${suffix}`}
            className={`-ml-px flex items-center justify-between gap-2 border-l-2 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
              active
                ? "border-[var(--accent)] text-[var(--bone-strong)]"
                : "border-transparent text-[var(--bone-dim)] hover:text-[var(--bone)]"
            }`}
          >
            <span>{l.label}</span>
            {!!count && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--orange)]/15 text-[var(--orange)]"
                }`}
              >
                {count}
              </span>
            )}
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
    <Suspense fallback={<div className="flex flex-col gap-2.5"><div className="h-10 rounded-[6px] border border-[var(--line)] bg-[var(--bone)]/[0.02]" /></div>}>
      <DashboardNavInner />
    </Suspense>
  );
}
