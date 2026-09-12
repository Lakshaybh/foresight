import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardNav } from "@/components/dashboard-nav";

// Renders the header + sidebar once per section — the App Router keeps
// this subtree mounted across client-side navigations between /dashboard
// pages, so the shell (and the signed-in user's email) isn't re-fetched or
// re-rendered on every click the way it was when each page rendered its
// own AppShell.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AppShell theme="volt" email={user.email} nav={<DashboardNav />}>
      {children}
    </AppShell>
  );
}
