"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardNav } from "@/components/dashboard-nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { apiFetch, withTenant } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type ProductSales = { product_name: string; units_sold: number; revenue: number };
type SalesSummary = { period_days: number; total_revenue: number; total_units: number; top_products: ProductSales[] };

function SalesPageInner() {
  const searchParams = useSearchParams();
  const asTenant = searchParams.get("as_tenant");
  const tenantEmail = searchParams.get("tenant_email");

  const [email, setEmail] = useState<string | undefined>();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email));

    apiFetch<SalesSummary>(withTenant("/sales/summary?days=30", asTenant))
      .then(setSummary)
      .catch((e) => setError((e as Error).message));
  }, [asTenant]);

  return (
    <AppShell title="Sales" email={email}>
      <DashboardNav />
      <ImpersonationBanner email={tenantEmail} />

      <p className="mb-6 text-sm text-[var(--bone-dim)]">
        How much you&apos;ve sold in the last 30 days.
      </p>

      {error && <p className="text-sm text-[var(--orange)]">{error}</p>}
      {!error && summary === null && <p className="text-sm text-[var(--bone-dim)]">Loading…</p>}

      {summary && summary.total_units === 0 && (
        <p className="text-sm text-[var(--bone-dim)]">
          No sales recorded yet — upload your sales data from the upload page.
        </p>
      )}

      {summary && summary.total_units > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">
                Revenue (last {summary.period_days} days)
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--bone)]">${summary.total_revenue.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Units sold</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--bone)]">{summary.total_units.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Best sellers</p>
            <div className="mt-3 space-y-3">
              {summary.top_products.map((p) => {
                const max = summary.top_products[0]?.revenue || 1;
                return (
                  <div key={p.product_name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--bone)]">{p.product_name}</span>
                      <span className="font-mono text-xs text-[var(--bone-dim)]">
                        {p.units_sold} units · ${p.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[var(--bone)]/10">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(4, (p.revenue / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--bone-dim)]">Loading…</div>}>
      <SalesPageInner />
    </Suspense>
  );
}
