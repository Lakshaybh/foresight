import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { DarkSignOutButton } from "@/components/dark-sign-out-button";
import { PaymentLinkRequestButton } from "@/components/payment-link-request-button";

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
    <AuthShell maxWidth="max-w-sm">
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full space-y-5 text-center">
          <span
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              rejected ? "bg-[var(--orange)]/10" : "bg-[var(--accent)]/10"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${rejected ? "bg-[var(--orange)]" : "bg-[var(--accent)]"}`}
              style={!rejected ? { animation: "pulse-dot 1.8s ease-in-out infinite" } : undefined}
            />
          </span>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--bone)]">
              {rejected ? "Access not granted" : "Awaiting approval"}
            </h1>
            <p className="text-sm leading-relaxed text-[var(--bone-dim)]">
              {rejected
                ? "An administrator has not approved this account. If you believe this is a mistake, please contact the platform owner."
                : "Your account has been created and is waiting for an administrator to approve access. You'll be able to sign in normally once approved."}
            </p>
          </div>

          {!rejected && <PaymentLinkRequestButton />}
          <DarkSignOutButton />
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </AuthShell>
  );
}
