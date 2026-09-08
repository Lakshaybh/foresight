import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminUserList } from "@/components/admin-user-list";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: accounts } = await supabase
    .from("user_account")
    .select("user_id, email, role, status, created_at, terms_accepted_at, access_expires_at, admin_notes")
    .order("created_at", { ascending: false });

  const { data: profiles } = await supabase
    .from("business_profile")
    .select(
      "user_id, business_name, business_type, what_you_do, team_size, primary_challenge, country, website"
    );

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const accountsWithProfile = (accounts ?? []).map((a) => ({
    ...a,
    profile: profileByUserId.get(a.user_id) ?? null,
  }));

  return (
    <AppShell title="Command Center" email={user.email}>
      <p className="-mt-6 mb-8 text-sm text-[var(--bone-dim)]">
        Approve or reject accounts waiting for access.
      </p>
      <AdminUserList initialAccounts={accountsWithProfile} />
    </AppShell>
  );
}
