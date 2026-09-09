"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardNav } from "@/components/dashboard-nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { TrendChart } from "@/components/trend-chart";
import { apiFetch, withTenant } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type InventoryItem = {
  product_id: string;
  product_name: string;
  warehouse_name: string;
  snapshot_date: string;
  stock_on_hand: number;
  safety_stock_level: number;
  avg_daily_demand: number;
  days_remaining: number | null;
};

type StockPoint = { snapshot_date: string; stock_on_hand: number };

function StockBadge({ item }: { item: InventoryItem }) {
  if (item.stock_on_hand <= item.safety_stock_level) {
    return (
      <span className="rounded-full bg-[var(--orange)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--orange)]">
        Low stock
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--teal)]">
      Healthy
    </span>
  );
}

function StockHistory({ productId, asTenant }: { productId: string; asTenant: string | null }) {
  const [points, setPoints] = useState<StockPoint[] | null>(null);

  useEffect(() => {
    apiFetch<StockPoint[]>(withTenant(`/inventory/${productId}/history`, asTenant))
      .then(setPoints)
      .catch(() => setPoints([]));
  }, [productId, asTenant]);

  if (points === null) return <p className="p-3 text-xs text-[var(--bone-dim)]">Loading trend…</p>;

  return (
    <div className="border-t border-[var(--line)] bg-[var(--bone)]/[0.015] p-4">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Stock on hand over time</p>
      <TrendChart
        points={points.map((p) => ({ label: p.snapshot_date.slice(5), value: p.stock_on_hand }))}
        color="var(--teal)"
        unit=" units"
      />
    </div>
  );
}

function InventoryPageInner() {
  const searchParams = useSearchParams();
  const asTenant = searchParams.get("as_tenant");
  const tenantEmail = searchParams.get("tenant_email");

  const [email, setEmail] = useState<string | undefined>();
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email));

    apiFetch<InventoryItem[]>(withTenant("/inventory", asTenant))
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [asTenant]);

  return (
    <AppShell title="Inventory" email={email} nav={<DashboardNav />}>
      <ImpersonationBanner email={tenantEmail} />

      <p className="mb-6 text-sm text-[var(--bone-dim)]">
        Current stock levels — this is the data your early-warning signals are computed from. Click a row to see its trend.
      </p>

      {error && <p className="text-sm text-[var(--orange)]">{error}</p>}
      {!error && items === null && <p className="text-sm text-[var(--bone-dim)]">Loading…</p>}
      {items && items.length === 0 && (
        <p className="text-sm text-[var(--bone-dim)]">
          No inventory data yet — upload your stock levels from the upload page.
        </p>
      )}

      {items && items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[11px] uppercase tracking-wide text-[var(--bone-dim)]">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Warehouse</th>
                <th className="px-4 py-3 font-medium">In stock</th>
                <th className="px-4 py-3 font-medium">Safety level</th>
                <th className="px-4 py-3 font-medium">Days remaining</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <React.Fragment key={`${item.product_name}-${item.warehouse_name}`}>
                  <tr
                    onClick={() => setExpanded(expanded === item.product_id ? null : item.product_id)}
                    className="cursor-pointer border-b border-[var(--line)] transition-colors hover:bg-[var(--bone)]/[0.02] last:border-0"
                  >
                    <td className="px-4 py-3 text-[var(--bone)]">{item.product_name}</td>
                    <td className="px-4 py-3 text-[var(--bone-dim)]">{item.warehouse_name}</td>
                    <td className="px-4 py-3 text-[var(--bone)]">{item.stock_on_hand}</td>
                    <td className="px-4 py-3 text-[var(--bone-dim)]">{item.safety_stock_level}</td>
                    <td className="px-4 py-3 text-[var(--bone)]">
                      {item.days_remaining != null ? `${item.days_remaining} days` : "—"}
                    </td>
                    <td className="px-4 py-3"><StockBadge item={item} /></td>
                  </tr>
                  {expanded === item.product_id && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <StockHistory productId={item.product_id} asTenant={asTenant} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--bone-dim)]">Loading…</div>}>
      <InventoryPageInner />
    </Suspense>
  );
}
