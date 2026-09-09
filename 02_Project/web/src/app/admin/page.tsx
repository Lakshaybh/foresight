import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminNav } from "@/components/admin-nav";
import { AdminStatCard } from "@/components/admin-stat-card";
import { AdminUserList } from "@/components/admin-user-list";

type PlatformImpact = {
  total_tenants: number;
  total_signals: number;
  total_open_decisions: number;
  total_flagged_exposure: number;
  total_reorder_cost: number;
};

async function fetchPlatformImpact(accessToken: string): Promise<PlatformImpact | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/admin/impact`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: accounts }, { data: profiles }, { data: payments }, impact] = await Promise.all([
    supabase
      .from("user_account")
      .select(
        "user_id, email, role, status, created_at, terms_accepted_at, access_expires_at, admin_notes, plan, requested_plan"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("business_profile")
      .select("user_id, business_name, business_type, what_you_do, team_size, primary_challenge, country, website"),
    supabase.from("payment_log").select("amount, currency"),
    session ? fetchPlatformImpact(session.access_token) : Promise.resolve(null),
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
    <AppShell title="Command Center" email={user.email} nav={<AdminNav />}>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard label="Total accounts" value={accounts?.length ?? 0} />
        <AdminStatCard label="Pending review" value={pendingCount} />
        <AdminStatCard label="Active access" value={activeCount} />
        <AdminStatCard label="Recorded revenue" value={revenueDisplay} />
      </div>

      <p className="mb-2 mt-6 text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">
        Platform-wide impact (across every tenant)
      </p>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard label="Businesses watched" value={impact?.total_tenants ?? "—"} />
        <AdminStatCard label="Signals caught" value={impact?.total_signals ?? "—"} />
        <AdminStatCard
          label="Exposure flagged"
          value={impact ? `$${impact.total_flagged_exposure.toLocaleString()}` : "—"}
        />
        <AdminStatCard
          label="Reorder cost surfaced"
          value={impact ? `$${impact.total_reorder_cost.toLocaleString()}` : "—"}
        />
      </div>
      {!impact && (
        <p className="-mt-6 mb-8 text-xs text-[var(--bone-dim)]">
          Platform-wide stats need the decision-intelligence API to be reachable — check NEXT_PUBLIC_API_URL.
        </p>
      )}

      <p className="mb-4 text-sm text-[var(--bone-dim)]">
        Approve or reject accounts waiting for access.
      </p>
      <AdminUserList initialAccounts={accountsWithProfile} />
    </AppShell>
  );
}
