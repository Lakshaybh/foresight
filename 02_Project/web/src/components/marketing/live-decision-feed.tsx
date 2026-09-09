"use client";

// Replaces the node-diagram illustration with something calmer and more
// elegant: a continuous feed of real-shaped decisions — the actual thing
// the product produces — instead of an abstract "data flowing" metaphor.
// Every action shown maps to one of the five catalog actions, nothing
// invented. Pure CSS marquee, no libraries, cheap to run.

const ACTIONS: Record<string, string> = {
  reorder: "var(--teal)",
  escalate: "var(--amber)",
  backup: "var(--orange)",
  forecast: "var(--accent)",
  monitor: "var(--bone-dim)",
};

const LABELS: Record<string, string> = {
  reorder: "Reorder now",
  escalate: "Escalate supplier",
  backup: "Shift to backup",
  forecast: "Review forecast",
  monitor: "Monitor",
};

const EVENTS = [
  { supplier: "Cedar Sourcing Ltd.", sku: "SKU-2291", detail: "Lead time drifting — 3 weeks running", action: "reorder", confidence: "92%" },
  { supplier: "Northbay Hardware Co.", sku: "SKU-1187", detail: "Delivery delay flagged, 2nd occurrence", action: "escalate", confidence: "78%" },
  { supplier: "Alder & Finch Supply", sku: "SKU-3042", detail: "Escalation unresolved after 9 days", action: "backup", confidence: "85%" },
  { supplier: "Q3 demand — Region West", sku: "Forecast", detail: "Actuals diverging from seasonal baseline", action: "forecast", confidence: "64%" },
  { supplier: "Marrow Steel Distributors", sku: "SKU-0568", detail: "Slight variance, within normal range", action: "monitor", confidence: "41%" },
  { supplier: "Cedar Sourcing Ltd.", sku: "SKU-2291", detail: "Approved — stock replenished on schedule", action: "reorder", confidence: "—" },
];

function Row({ e }: { e: (typeof EVENTS)[number] }) {
  const color = ACTIONS[e.action];
  return (
    <div className="flex items-center gap-4 border-b border-[var(--line)] px-6 py-4 last:border-b-0">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--bone)]">
          {e.supplier} <span className="text-[var(--bone-dim)]">· {e.sku}</span>
        </p>
        <p className="truncate text-xs text-[var(--bone-dim)]">{e.detail}</p>
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
      >
        {LABELS[e.action]}
      </span>
      <span className="w-10 shrink-0 text-right font-mono text-xs text-[var(--bone-dim)]">{e.confidence}</span>
    </div>
  );
}

export function LiveDecisionFeed() {
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] bg-[var(--void-2)] shadow-[0_1px_2px_rgba(28,26,23,0.04),0_30px_60px_-30px_rgba(28,26,23,0.22)]">
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-6 py-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--teal)] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--teal)]" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--bone-dim)]">Decision feed</span>
      </div>

      <div className="relative h-[340px] overflow-hidden">
        <div className="feed-scroll absolute inset-x-0 top-0">
          {[...EVENTS, ...EVENTS].map((e, i) => (
            <Row key={i} e={e} />
          ))}
        </div>
      </div>

      <style>{`
        .feed-scroll {
          animation: feed-scroll 22s linear infinite;
        }
        @keyframes feed-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .feed-scroll { animation: none; }
        }
      `}</style>
    </div>
  );
}
