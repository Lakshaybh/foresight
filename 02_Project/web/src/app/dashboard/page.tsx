import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DecisionsPanel } from "@/components/decisions-panel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AppShell title="Dashboard" email={user.email}>
      <DecisionsPanel />
    </AppShell>
  );
}
