import { cn } from "cn";

// A plain bordered, elevated card — no colored glow. A soft neutral shadow
// (not a brand-color halo) is the only lift; `emphasis` swaps the border
// for the brand accent on the one or two cards per page that should read
// as the important one, instead of every "glow" card competing at once.
export function BezelCard({
  children,
  className,
  innerClassName,
  emphasis = false,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[var(--void-2)] ring-1 shadow-[0_1px_2px_rgba(28,26,23,0.04),0_16px_32px_-24px_rgba(28,26,23,0.18)]",
        emphasis ? "ring-[var(--accent)]/25" : "ring-[var(--line)]",
        className
      )}
    >
      <div className={cn("h-full", innerClassName)}>{children}</div>
    </div>
  );
}
