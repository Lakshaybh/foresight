import Link from "next/link";

// Minimal, on-brand shell for every screen between login and the real app
// (onboarding, terms, pending) — same palette/tokens as the marketing
// site, deliberately without the animated background or any of its
// motion: this is a short functional flow, not a pitch.
//
// `topRight` is optional so pages that don't need an action there (most of
// them) render exactly as before. `theme` defaults to the product-wide
// cream theme; only screens deliberately redesigned to match the new
// dark/green marketing system (currently just onboarding) opt into "volt".
export function AuthShell({
  children,
  maxWidth = "max-w-2xl",
  topRight,
  theme = "cream",
}: {
  children: React.ReactNode;
  maxWidth?: string;
  topRight?: React.ReactNode;
  theme?: "cream" | "volt";
}) {
  return (
    <div className={`theme-${theme} min-h-screen bg-[var(--void)] font-[family-name:var(--font-display)]`}>
      <div className="flex items-center justify-between p-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-medium tracking-tight text-[var(--bone-strong)]"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
          Foresight
        </Link>
        {topRight}
      </div>
      <main className={`mx-auto ${maxWidth} px-4 pb-16 pt-4 sm:pt-8`}>{children}</main>
    </div>
  );
}
