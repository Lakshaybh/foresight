"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { TrendChart } from "@/components/trend-chart";
import { apiFetch, withTenant } from "@/lib/api";

type Supplier = {
  supplier_id: string;
  name: string;
  order_count: number;
  avg_lead_time_days: number | null;
  latest_drift_days: number | null;
  latest_drift_detected_at: string | null;
  faster_alternative_name: string | null;
  faster_alternative_lead_time_days: number | null;
};

type DeliveryPoint = { order_date: string; delay_days: number };

function ReliabilityBadge({ supplier }: { supplier: Supplier }) {
  if (supplier.order_count === 0) {
    return <span className="text-xs text-[var(--bone-dim)]">No orders yet</span>;
  }
  if (supplier.latest_drift_days && supplier.latest_drift_days > 0) {
    return (
      <span className="rounded-full bg-[var(--orange)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--orange)]">
        Slowing down
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--teal)]">
      Reliable
    </span>
  );
}

function DeliveryHistory({ supplierId, asTenant }: { supplierId: string; asTenant: string | null }) {
  const [points, setPoints] = useState<DeliveryPoint[] | null>(null);

  useEffect(() => {
    apiFetch<DeliveryPoint[]>(withTenant(`/suppliers/${supplierId}/deliveries`, asTenant))
      .then(setPoints)
      .catch(() => setPoints([]));
  }, [supplierId, asTenant]);

  if (points === null) return <p className="text-xs text-[var(--bone-dim)]">Loading trend…</p>;

  return (
    <div className="mt-3 border-t border-[var(--line)] pt-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">
        Delivery delay per order, over time (positive = late)
      </p>
      <TrendChart
        points={points.map((p) => ({ label: p.order_date.slice(5), value: p.delay_days }))}
        color="var(--orange)"
        unit="d"
      />
    </div>
  );
}

function SuppliersPageInner() {
  const searchParams = useSearchParams();
  const asTenant = searchParams.get("as_tenant");
  const tenantEmail = searchParams.get("tenant_email");

  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Supplier[]>(withTenant("/suppliers", asTenant))
      .then(setSuppliers)
      .catch((e) => setError((e as Error).message));
  }, [asTenant]);

  return (
    <>
      <PageHeader title="Suppliers" />
      <ImpersonationBanner email={tenantEmail} />

      <p className="mb-6 text-sm text-[var(--bone-dim)]">
        Who you buy from, and how reliable each one has actually been.
      </p>

      {error && <p className="text-sm text-[var(--orange)]">{error}</p>}
      {!error && suppliers === null && <p className="text-sm text-[var(--bone-dim)]">Loading…</p>}
      {suppliers && suppliers.length === 0 && (
        <p className="text-sm text-[var(--bone-dim)]">
          No suppliers yet — upload your suppliers &amp; purchase orders from the upload page.
        </p>
      )}

      {suppliers && suppliers.length > 0 && (
        <div className="space-y-3">
          {suppliers.map((s) => (
            <div key={s.supplier_id} className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--bone)]">{s.name}</p>
                <ReliabilityBadge supplier={s} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Orders</p>
                  <p className="mt-0.5 text-sm text-[var(--bone)]">{s.order_count}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Usual lead time</p>
                  <p className="mt-0.5 text-sm text-[var(--bone)]">
                    {s.avg_lead_time_days != null ? `${s.avg_lead_time_days} days` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Latest drift</p>
                  <p className="mt-0.5 text-sm text-[var(--bone)]">
                    {s.latest_drift_days != null ? `+${s.latest_drift_days} days` : "None detected"}
                  </p>
                </div>
              </div>

              {s.faster_alternative_name && (
                <div className="mt-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-wash)] px-3 py-2 text-xs text-[var(--bone)]">
                  <strong className="text-[var(--accent)]">{s.faster_alternative_name}</strong> delivers similar
                  products {(s.avg_lead_time_days! - s.faster_alternative_lead_time_days!).toFixed(1)} days faster on
                  average — worth considering for your next order.
                </div>
              )}

              {s.order_count > 0 && (
                <button
                  onClick={() => setExpanded(expanded === s.supplier_id ? null : s.supplier_id)}
                  className="mt-3 text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  {expanded === s.supplier_id ? "Hide delivery trend" : "Show delivery trend"}
                </button>
              )}
              {expanded === s.supplier_id && <DeliveryHistory supplierId={s.supplier_id} asTenant={asTenant} />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--bone-dim)]">Loading…</div>}>
      <SuppliersPageInner />
    </Suspense>
  );
}
