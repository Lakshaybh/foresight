import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth-shell";
import { DarkSignOutButton } from "@/components/dark-sign-out-button";

const ADMIN_EMAIL = "lakshaymsharma@gmail.com";

export default async function AccessExpiredPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subject = "Foresight — renewing my access";
  const body = `Hi,\n\nMy access has expired and I'd like to renew my subscription.\n\nAccount email: ${user?.email ?? ""}\n`;
  const mailtoHref = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <AuthShell maxWidth="max-w-sm">
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full space-y-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--orange)]/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-[var(--orange)]">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 7.5v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--bone)]">Access has expired</h1>
            <p className="text-sm leading-relaxed text-[var(--bone-dim)]">
              Your access period has ended. Request a renewal below, or
              contact the platform owner directly — you&apos;ll be back in
              as soon as it&apos;s extended.
            </p>
          </div>

          <div className="space-y-2.5">
            <a
              href={mailtoHref}
              className="block w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all duration-300 hover:brightness-110"
            >
              Email for a new subscription
            </a>
            <DarkSignOutButton />
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
