import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminNav } from "@/components/admin-nav";
import { AdminStatCard } from "@/components/admin-stat-card";
import { AdminUserList } from "@/components/admin-user-list";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: accounts }, { data: profiles }, { data: payments }] = await Promise.all([
    supabase
      .from("user_account")
      .select("user_id, email, role, status, created_at, terms_accepted_at, access_expires_at, admin_notes")
      .order("created_at", { ascending: false }),
    supabase
      .from("business_profile")
      .select("user_id, business_name, business_type, what_you_do, team_size, primary_challenge, country, website"),
    supabase.from("payment_log").select("amount, currency"),
  ]);

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const accountsWithProfile = (accounts ?? []).map((a) => ({
    ...a,
    profile: profileByUserId.get(a.user_id) ?? null,
  }));

  const now = new Date();
  const pendingCount = (accounts ?? []).filter((a) => a.status === "pending").length;
  const activeCount = (accounts ?? []).filter(
    (a) => a.status === "approved" && (!a.access_expires_at || new Date(a.access_expires_at) > now)
  ).length;

  // Sums per currency rather than fake-converting everything into one —
  // real revenue in whatever currencies were actually recorded.
  const revenueByCurrency = new Map<string, number>();
  for (const p of payments ?? []) {
    if (p.amount == null) continue;
    revenueByCurrency.set(p.currency, (revenueByCurrency.get(p.currency) ?? 0) + Number(p.amount));
  }
  const revenueDisplay =
    revenueByCurrency.size === 0
      ? "—"
      : [...revenueByCurrency.entries()].map(([c, amt]) => `${c} ${amt.toLocaleString()}`).join(" · ");

  return (
    <AppShell title="Command Center" email={user.email}>
      <AdminNav />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard label="Total accounts" value={accounts?.length ?? 0} />
        <AdminStatCard label="Pending review" value={pendingCount} />
        <AdminStatCard label="Active access" value={activeCount} />
        <AdminStatCard label="Recorded revenue" value={revenueDisplay} />
      </div>

      <p className="mb-4 text-sm text-[var(--bone-dim)]">
        Approve or reject accounts waiting for access.
      </p>
      <AdminUserList initialAccounts={accountsWithProfile} />
    </AppShell>
  );
}
