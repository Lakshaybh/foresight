import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminUserList } from "@/components/admin-user-list";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: accounts } = await supabase
    .from("user_account")
    .select("user_id, email, role, status, created_at, terms_accepted_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin — Access Requests</h1>
        <SignOutButton />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Approve or reject accounts waiting for access.
      </p>

      <AdminUserList initialAccounts={accounts ?? []} />
    </main>
  );
}
