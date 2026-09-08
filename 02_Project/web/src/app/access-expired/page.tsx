import { AuthShell } from "@/components/auth-shell";
import { DarkSignOutButton } from "@/components/dark-sign-out-button";

export default function AccessExpiredPage() {
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
              Your access period has ended. Contact the platform owner to
              renew — you&apos;ll be back in as soon as it&apos;s extended.
            </p>
          </div>

          <DarkSignOutButton />
        </div>
      </div>
    </AuthShell>
  );
}
