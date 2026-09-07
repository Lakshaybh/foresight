import { BezelCard } from "@/components/marketing/bezel-card";

const BARS = [2, 2, 3, 4, 5, 7, 9];

export function ProductPreview() {
  return (
    <BezelCard className="w-full shadow-[0_1px_2px_rgba(18,26,41,0.04),0_40px_80px_-32px_rgba(18,26,41,0.35)]">
      <div className="grid gap-px overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-black/[0.04] sm:grid-cols-5">
        {/* Attention queue */}
        <div className="col-span-2 space-y-3 bg-white p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Attention queue
          </p>
          <div className="space-y-2">
            <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
              <p className="text-xs font-medium text-foreground">Cedar Sourcing Ltd.</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Lead time drifting — 3 weeks</p>
            </div>
            <div className="rounded-xl border border-black/5 p-3 opacity-60">
              <p className="text-xs font-medium text-foreground">SKU-2291 reorder point</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Monitor</p>
            </div>
            <div className="rounded-xl border border-black/5 p-3 opacity-40">
              <p className="text-xs font-medium text-foreground">Q3 demand review</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Monitor</p>
            </div>
          </div>
        </div>

        {/* Signal detail */}
        <div className="col-span-3 space-y-4 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Signal detail
            </p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              High confidence
            </span>
          </div>

          <div className="flex items-end gap-1.5">
            {BARS.map((h, i) => (
              <div
                key={i}
                className="w-full rounded-t-sm bg-primary/25 last:bg-primary"
                style={{ height: `${h * 6}px` }}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Supplier delivery delay, days — 7 weeks</p>

          <div className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-foreground/80">
            Lead time has risen for 3 straight weeks. At this rate, stockout in
            ~9 days.
          </div>

          <div className="flex items-center justify-between rounded-xl border border-black/5 p-3">
            <div>
              <p className="text-xs font-medium">Recommended: Reorder now</p>
              <p className="text-[11px] text-muted-foreground">Owner: Ops manager</p>
            </div>
            <div className="flex gap-1.5">
              <span className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                Approve
              </span>
              <span className="rounded-md border border-black/10 px-2.5 py-1 text-[11px] text-foreground/70">
                Snooze
              </span>
            </div>
          </div>
        </div>
      </div>
    </BezelCard>
  );
}
