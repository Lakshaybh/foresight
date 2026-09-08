import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AppShell title="Dashboard" email={user.email}>
      {/* Honest empty state — no fabricated signals/numbers until the
          detection pipeline is actually wired to this account's data. */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] px-6 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-[var(--accent)]">
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        <h2 className="mt-4 text-base font-medium text-[var(--bone)]">Nothing to watch yet</h2>
        <p className="mt-1.5 max-w-sm text-sm text-[var(--bone-dim)]">
          Once your supplier and inventory data is connected, early-warning
          signals and recommended actions will show up here.
        </p>
      </div>
    </AppShell>
  );
}
