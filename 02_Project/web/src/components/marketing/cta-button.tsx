import Link from "next/link";
import { cn } from "cn";

export function CtaButton({
  href,
  children,
  size = "md",
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline";
  className?: string;
}) {
  const sizes = {
    sm: "py-1.5 pl-4 pr-1.5 text-sm",
    md: "py-2.5 pl-6 pr-2 text-sm",
    lg: "py-3.5 pl-8 pr-3 text-base",
  };
  const iconSizes = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-9 w-9" };

  return (
    <Link
      href={href}
      className={cn(
        "group/cta inline-flex items-center gap-3 rounded-[6px] font-medium",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]",
        variant === "primary"
          ? "bg-[var(--accent)] text-[var(--void)] shadow-[0_0_40px_-10px_var(--accent-dim)] hover:shadow-[0_0_50px_-8px_var(--accent-dim)] hover:brightness-110"
          : "border border-[var(--line)] bg-[var(--void)] text-[var(--bone)] hover:bg-[var(--bone)]/[0.06]",
        sizes[size],
        className
      )}
    >
      {children}
      <span
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 group-hover/cta:scale-105",
          variant === "primary" ? "bg-[var(--void)]/15" : "bg-[var(--bone)]/10",
          iconSizes[size]
        )}
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-[45%] w-[45%]">
          <path
            d="M4 12L12 4M12 4H5.5M12 4V10.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
