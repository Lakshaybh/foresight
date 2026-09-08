// Turns the raw evidence JSON into a plain sentence plus a simple two-bar
// comparison — the same numbers, but readable at a glance instead of a
// JSON dump nobody outside engineering can parse.

function ComparisonBars({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  unit,
  alert,
}: {
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
  unit: string;
  alert: boolean;
}) {
  const max = Math.max(leftValue, rightValue, 1);
  return (
    <div className="space-y-2.5">
      {[
        { label: leftLabel, value: leftValue, color: "var(--bone-dim)" },
        { label: rightLabel, value: rightValue, color: alert ? "var(--orange)" : "var(--teal)" },
      ].map((row) => (
        <div key={row.label}>
          <div className="flex items-center justify-between text-xs text-[var(--bone-dim)]">
            <span>{row.label}</span>
            <span className="font-mono text-[var(--bone)]">{row.value} {unit}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--bone)]/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%`, background: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function projectedRunOutDate(daysRemaining: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(daysRemaining));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Real numbers only — computed by the API from this product's own unit
// cost/list price and current demand rate, never invented. Renders
// nothing if the engine didn't have enough data to compute it (e.g. no
// inventory snapshot yet), rather than showing a fake $0.
function FinancialFraming({ evidence }: { evidence: Record<string, unknown> }) {
  const reorderCost = evidence.reorder_cost as number | undefined;
  const lostRevenue = evidence.lost_revenue_if_no_action as number | undefined;
  const reorderUnits = evidence.reorder_units as number | undefined;
  const lostUnits = evidence.lost_units_if_no_action as number | undefined;

  if (reorderCost == null || lostRevenue == null) return null;

  const worseToWait = lostRevenue > reorderCost;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bone)]/[0.02] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">What this actually costs</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[var(--bone)]/[0.03] p-3">
          <p className="text-[11px] text-[var(--bone-dim)]">Reorder now ({reorderUnits} units)</p>
          <p className="mt-0.5 text-lg font-semibold text-[var(--bone)]">{money(reorderCost)}</p>
        </div>
        <div
          className="rounded-lg p-3"
          style={{ background: worseToWait ? "color-mix(in srgb, var(--orange) 10%, transparent)" : "var(--bone)/[0.03]" }}
        >
          <p className="text-[11px] text-[var(--bone-dim)]">If you do nothing ({lostUnits} units unsold)</p>
          <p className={`mt-0.5 text-lg font-semibold ${worseToWait ? "text-[var(--orange)]" : "text-[var(--bone)]"}`}>
            {money(lostRevenue)}
          </p>
        </div>
      </div>
      {worseToWait && (
        <p className="mt-2.5 text-xs text-[var(--orange)]">
          Waiting costs {money(lostRevenue - reorderCost)} more than acting now.
        </p>
      )}
    </div>
  );
}

export function DecisionEvidence({
  evidence,
  entityName,
}: {
  evidence: Record<string, unknown>;
  entityName?: string | null;
}) {
  const metric = evidence.metric as string;

  if (metric === "lead_time_drift_days") {
    const baseline = Number(evidence.baseline_value);
    const observed = Number(evidence.observed_value);
    const name = entityName ?? "This supplier";
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--bone)]/90">
          <strong className="text-[var(--bone)]">{name}</strong> usually delivers in <strong>{baseline} days</strong>,
          but the last delivery took <strong className="text-[var(--orange)]">{observed} days</strong> — a real
          slowdown, not normal variation. Based on this trend, expect similar delays until you follow up with them.
        </p>
        <ComparisonBars
          leftLabel="Usual lead time"
          leftValue={baseline}
          rightLabel="Latest lead time"
          rightValue={observed}
          unit="days"
          alert
        />
      </div>
    );
  }

  if (metric === "stockout_risk") {
    const remaining = Number(evidence.days_of_stock_remaining);
    const required = Number(evidence.required_days);
    const name = entityName ?? "This product";
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--bone)]/90">
          <strong className="text-[var(--bone)]">{name}</strong> has{" "}
          <strong className="text-[var(--orange)]">{remaining} days</strong> of stock left, but restocking normally
          takes <strong>{required} days</strong> — at this rate, you&apos;ll run out around{" "}
          <strong className="text-[var(--orange)]">{projectedRunOutDate(remaining)}</strong>, before the next
          delivery could arrive.
        </p>
        <ComparisonBars
          leftLabel="Days needed to restock"
          leftValue={required}
          rightLabel="Days of stock remaining"
          rightValue={remaining}
          unit="days"
          alert={remaining < required}
        />
        <FinancialFraming evidence={evidence} />
      </div>
    );
  }

  // Fallback for any future metric type not covered above yet.
  return (
    <pre className="overflow-x-auto rounded-lg bg-[var(--bone)]/[0.03] p-3 text-xs text-[var(--bone-dim)]">
      {JSON.stringify(evidence, null, 2)}
    </pre>
  );
}
