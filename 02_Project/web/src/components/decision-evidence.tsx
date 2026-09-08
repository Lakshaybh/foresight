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

export function DecisionEvidence({ evidence }: { evidence: Record<string, unknown> }) {
  const metric = evidence.metric as string;

  if (metric === "lead_time_drift_days") {
    const baseline = Number(evidence.baseline_value);
    const observed = Number(evidence.observed_value);
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--bone)]/90">
          This supplier usually delivers in <strong>{baseline} days</strong>, but the last delivery took{" "}
          <strong className="text-[var(--orange)]">{observed} days</strong> — a real slowdown, not normal variation.
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
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--bone)]/90">
          This product has <strong className="text-[var(--orange)]">{remaining} days</strong> of stock left, but
          restocking takes <strong>{required} days</strong> — you&apos;ll run out before the next delivery arrives.
        </p>
        <ComparisonBars
          leftLabel="Days needed to restock"
          leftValue={required}
          rightLabel="Days of stock remaining"
          rightValue={remaining}
          unit="days"
          alert={remaining < required}
        />
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
