import { BezelCard } from "@/components/marketing/bezel-card";

const BARS = [2, 2, 3, 4, 5, 7, 9];

export function ProductPreview() {
  return (
    <BezelCard className="w-full" glow>
      <div className="grid gap-px overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-[var(--line)] sm:grid-cols-5">
        {/* Attention queue */}
        <div className="col-span-2 space-y-3 bg-[var(--void-2)] p-5">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--bone-dim)]">
            Attention queue
          </p>
          <div className="space-y-2">
            <div className="rounded-xl border border-[var(--orange)]/30 bg-[var(--orange)]/[0.08] p-3">
              <p className="text-xs font-medium text-[var(--bone)]">Cedar Sourcing Ltd.</p>
              <p className="mt-0.5 text-[11px] text-[var(--orange)]">Lead time drifting — 3 weeks</p>
            </div>
            <div className="rounded-xl border border-[var(--amber)]/20 bg-[var(--amber)]/[0.05] p-3">
              <p className="text-xs font-medium text-[var(--bone)]">SKU-2291 reorder point</p>
              <p className="mt-0.5 text-[11px] text-[var(--amber)]">Monitor</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] p-3 opacity-50">
              <p className="text-xs font-medium text-[var(--bone)]">Q3 demand review</p>
              <p className="mt-0.5 text-[11px] text-[var(--bone-dim)]">Monitor</p>
            </div>
          </div>
        </div>

        {/* Signal detail */}
        <div className="col-span-3 space-y-4 bg-[var(--void-2)] p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--bone-dim)]">
              Signal detail
            </p>
            <span className="rounded-full bg-[var(--orange)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--orange)]">
              High confidence
            </span>
          </div>

          <div className="flex items-end gap-1.5">
            {BARS.map((h, i) => (
              <div
                key={i}
                className="w-full rounded-t-sm bg-[var(--teal)]/25 last:bg-[var(--orange)]"
                style={{ height: `${h * 6}px` }}
              />
            ))}
          </div>
          <p className="text-[11px] text-[var(--bone-dim)]">Supplier delivery delay, days — 7 weeks</p>

          <div className="rounded-xl bg-[var(--bone)]/[0.04] p-3 text-xs leading-relaxed text-[var(--bone)]/80">
            Lead time has risen for 3 straight weeks. At this rate, stockout in
            ~9 days.
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--line)] p-3">
            <div>
              <p className="text-xs font-medium text-[var(--bone)]">Recommended: Reorder now</p>
              <p className="text-[11px] text-[var(--bone-dim)]">Owner: Ops manager</p>
            </div>
            <div className="flex gap-1.5">
              <span className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-[11px] font-medium text-[var(--void)]">
                Approve
              </span>
              <span className="rounded-md border border-[var(--line)] px-2.5 py-1 text-[11px] text-[var(--bone-dim)]">
                Snooze
              </span>
            </div>
          </div>
        </div>
      </div>
    </BezelCard>
  );
}
