import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminNav } from "@/components/admin-nav";

// Same rationale as dashboard/layout.tsx — one persistent shell for every
// /admin page instead of each page re-rendering its own. The role gate
// itself still lives in proxy.ts (middleware), which already redirects a
// non-admin away before this layout ever renders.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AppShell theme="volt" email={user.email} nav={<AdminNav />}>
      {children}
    </AppShell>
  );
}
