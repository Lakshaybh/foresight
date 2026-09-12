import { cn } from "cn";

// Hairline-bordered card, no shadow — the brand's only elevation mode.
// `emphasis` thickens the border to the brand accent (2px) to mark the one
// or two cards per page that should read as the important one, instead of
// every card competing with its own glow.
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
        "rounded-[8px] bg-[var(--void-2)] border",
        emphasis ? "border-2 border-[var(--accent)]" : "border-[var(--line)]",
        className
      )}
    >
      <div className={cn("h-full", innerClassName)}>{children}</div>
    </div>
  );
}
