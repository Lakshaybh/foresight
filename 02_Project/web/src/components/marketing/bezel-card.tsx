import { cn } from "cn";

export function BezelCard({
  children,
  className,
  innerClassName,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] bg-[var(--bone)]/[0.04] p-1.5 ring-1 ring-[var(--line)]",
        glow && "shadow-[0_0_60px_-15px_var(--accent-dim)]",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-[calc(1.75rem-0.375rem)] bg-[var(--void-2)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-[var(--line)]",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
