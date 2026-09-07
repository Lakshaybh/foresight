import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("user_account")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const rejected = account?.status === "rejected";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          {rejected ? "Access not granted" : "Awaiting approval"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {rejected
            ? "An administrator has not approved this account. If you believe this is a mistake, please contact the platform owner."
            : "Your account has been created and is waiting for an administrator to approve access. You'll be able to sign in normally once approved."}
        </p>
        <SignOutButton />
      </div>
    </main>
  );
}
