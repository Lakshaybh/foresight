import { cn } from "cn";

export function BezelCard({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] bg-black/[0.03] p-1.5 ring-1 ring-black/[0.04]",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-[calc(1.75rem-0.375rem)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(18,26,41,0.04)] ring-1 ring-black/[0.03]",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
