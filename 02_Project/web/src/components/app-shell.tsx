import Link from "next/link";
import { Inter } from "next/font/google";
import { DarkSignOutButton } from "@/components/dark-sign-out-button";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Shared shell for the real, working screens (dashboard, admin) — a plain
// top bar instead of AuthShell's centered layout, since these pages hold
// actual content/tables rather than a single form.
//
// Rendered from each section's layout.tsx (not per-page) so the header and
// sidebar stay mounted across navigations within that section — React
// Router's client cache keeps this subtree alive, which is what makes
// switching between e.g. Payments and Audit log feel instant instead of a
// full reload, and avoids re-fetching the signed-in user's email on every
// click. Title/page-specific actions live in PageHeader, rendered by each
// page's own content instead.
//
// `nav` is optional: pages that don't pass it keep the single-column layout.
export function AppShell({
  email,
  nav,
  children,
  theme = "cream",
}: {
  email?: string;
  nav?: React.ReactNode;
  children: React.ReactNode;
  theme?: "cream" | "volt";
}) {
  return (
    <div className={`${theme === "volt" ? inter.variable : ""} theme-${theme} min-h-screen bg-[var(--void)] font-[family-name:var(--font-display)]`}>
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--void)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium tracking-tight text-[var(--bone-strong)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            Foresight
          </Link>
          <div className="flex items-center gap-4">
            {email && <span className="hidden text-xs text-[var(--mute)] sm:inline">{email}</span>}
            <DarkSignOutButton />
          </div>
        </div>
      </header>

      {nav ? (
        <div className="mx-auto flex max-w-6xl gap-10 px-4 py-10 sm:px-8">
          <aside className="w-52 shrink-0">{nav}</aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">{children}</main>
      )}
    </div>
  );
}
