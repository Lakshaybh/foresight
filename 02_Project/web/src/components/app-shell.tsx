import Link from "next/link";
import { DarkSignOutButton } from "@/components/dark-sign-out-button";

// Shared shell for the real, working screens (dashboard, admin) — a plain
// top bar instead of AuthShell's centered layout, since these pages hold
// actual content/tables rather than a single form.
export function AppShell({
  title,
  email,
  children,
}: {
  title: string;
  email?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-dark min-h-screen bg-[var(--void)] font-[family-name:var(--font-display)]">
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

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--bone)]">{title}</h1>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
