import Link from "next/link";

// Minimal, dark, on-brand shell for every screen between login and the
// real app (onboarding, terms, pending) — same palette/tokens as the
// marketing site, deliberately without the animated background or any of
// its motion: this is a short functional flow, not a pitch.
export function AuthShell({ children, maxWidth = "max-w-2xl" }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <div className="marketing-dark min-h-screen bg-[var(--void)] font-[family-name:var(--font-display)]">
      <Link
        href="/"
        className="flex items-center gap-2 p-6 font-mono text-sm font-medium tracking-tight text-[var(--bone)]"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
        Foresight
      </Link>
      <main className={`mx-auto ${maxWidth} px-4 pb-16 pt-4 sm:pt-8`}>{children}</main>
    </div>
  );
}
