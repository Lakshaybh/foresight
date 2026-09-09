import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DashboardNav } from "@/components/dashboard-nav";
import { DecisionsPanel } from "@/components/decisions-panel";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ as_tenant?: string; tenant_email?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { as_tenant, tenant_email } = await searchParams;

  return (
    <AppShell title="Dashboard" email={user.email} nav={<DashboardNav />}>
      <ImpersonationBanner email={tenant_email ?? null} />
      {!as_tenant && (
        <div className="-mt-6 mb-8 flex justify-end">
          <Link
            href="/dashboard/upload"
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05]"
          >
            Connect / update data
          </Link>
        </div>
      )}
      <DecisionsPanel asTenant={as_tenant ?? null} />
    </AppShell>
  );
}
