import Link from "next/link";
import { DarkSignOutButton } from "@/components/dark-sign-out-button";

// Shared shell for the real, working screens (dashboard, admin) — a plain
// top bar instead of AuthShell's centered layout, since these pages hold
// actual content/tables rather than a single form.
//
// `nav` is optional: pages that don't pass it (dashboard) keep the original
// single-column layout unchanged. Pages that do (admin) get a left-hand
// sidebar panel instead — built specifically for AdminNav's capsule links,
// so it stays out of the way of every page that doesn't use it.
export function AppShell({
  title,
  email,
  nav,
  children,
}: {
  title: string;
  email?: string;
  nav?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="theme-cream min-h-screen bg-[var(--void)] font-[family-name:var(--font-display)]">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium tracking-tight text-[var(--bone)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            Foresight
          </Link>
          <div className="flex items-center gap-4">
            {email && <span className="hidden text-xs text-[var(--bone-dim)] sm:inline">{email}</span>}
            <DarkSignOutButton />
          </div>
        </div>
      </header>

      {nav ? (
        <div className="mx-auto flex max-w-5xl gap-8 px-4 py-10 sm:px-6">
          <aside className="w-44 shrink-0">{nav}</aside>
          <main className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--bone)]">{title}</h1>
            <div className="mt-8">{children}</div>
          </main>
        </div>
      ) : (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--bone)]">{title}</h1>
          <div className="mt-8">{children}</div>
        </main>
      )}
    </div>
  );
}
