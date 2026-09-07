import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
        <SignOutButton />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Signed in as {user.email}. This is a placeholder — signals, forecasts,
        and decisions from the API will surface here next.
      </p>
    </main>
  );
}
