// Shared route-level loading state for dashboard/admin pages. Next.js
// renders this automatically (App Router's loading.tsx convention) the
// instant a navigation starts, so the shell — sidebar, header, page shape —
// appears immediately instead of a frozen screen while data loads. This
// only improves perceived speed; it doesn't make the backend faster.
export function LoadingSkeleton({ withNav = true }: { withNav?: boolean }) {
  return (
    <div className="marketing-dark min-h-screen bg-[var(--void)] font-[family-name:var(--font-display)]">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            <span className="font-mono text-sm font-medium tracking-tight text-[var(--bone)]">Foresight</span>
          </div>
          <div className="h-8 w-20 animate-pulse rounded-full bg-[var(--bone)]/[0.06]" />
        </div>
      </header>

      <div className={withNav ? "mx-auto flex max-w-5xl gap-8 px-4 py-10 sm:px-6" : "mx-auto max-w-5xl px-4 py-10 sm:px-6"}>
        {withNav && (
          <aside className="w-44 shrink-0 space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-full border border-[var(--line)] bg-[var(--bone)]/[0.03]" />
            ))}
          </aside>
        )}

        <main className="min-w-0 flex-1">
          <div className="h-7 w-40 animate-pulse rounded-md bg-[var(--bone)]/[0.08]" />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--bone)]/[0.03]" />
            ))}
          </div>
          <div className="mt-6 space-y-2.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl border border-[var(--line)] bg-[var(--bone)]/[0.03]" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
