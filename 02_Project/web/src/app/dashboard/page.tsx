import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DashboardNav } from "@/components/dashboard-nav";
import { DecisionsPanel } from "@/components/decisions-panel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AppShell title="Dashboard" email={user.email}>
      <DashboardNav />
      <div className="-mt-6 mb-8 flex justify-end">
        <Link
          href="/dashboard/upload"
          className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05]"
        >
          Connect / update data
        </Link>
      </div>
      <DecisionsPanel />
    </AppShell>
  );
}
