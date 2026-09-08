"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AbstractBackground } from "@/components/marketing/abstract-background";
import { RevealSection } from "@/components/marketing/reveal-section";
import { LoginInfographic } from "@/components/marketing/login-infographic";
import { AdminLoginModal } from "@/components/marketing/admin-login-modal";

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[17px] w-[17px] text-[var(--bone)]">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function MailMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px] text-[var(--bone)]">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 6.5l8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AuthButton({
  onClick,
  children,
  icon,
  type = "button",
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bone)]/[0.03] py-3 text-sm font-medium text-[var(--bone)] transition-all duration-300 hover:bg-[var(--bone)]/[0.07] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
    >
      {icon}
      {children}
    </button>
  );
}

const STEPS = ["Sign in", "Connect your data", "Get your first signal within days"];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [showAdminModal, setShowAdminModal] = useState(false);

  const supabase = createClient();

  async function signInWithProvider(provider: "google" | "linkedin_oidc") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="marketing-dark relative flex h-[100dvh] flex-col overflow-hidden font-[family-name:var(--font-display)]">
      <AbstractBackground />

      <Link
        href="/"
        className="absolute left-6 top-6 z-30 flex items-center gap-2 font-mono text-sm font-medium tracking-tight text-[var(--bone)]"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
        Foresight
      </Link>

      <button
        type="button"
        onClick={() => setShowAdminModal(true)}
        className="absolute right-6 top-6 z-30 text-xs text-[var(--bone-dim)]/60 transition-colors hover:text-[var(--bone-dim)]"
      >
        Admin Login
      </button>

      <AdminLoginModal open={showAdminModal} onClose={() => setShowAdminModal(false)} />

      {/* Top half — brand / pitch content, freed up by moving the form down */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-6 pb-56 pt-20 sm:pb-48">
        <RevealSection className="max-w-lg text-center" stagger={0.07}>
          <div data-reveal className="font-mono text-[11px] tracking-[0.3em] text-[var(--accent)]">
            DETECT · EXPLAIN · RECOMMEND · TRACK
          </div>
          {/* Before / after infographic — icon-only, animated, no text */}
          <div data-reveal>
            <LoginInfographic />
          </div>

          {/* Segment reminder — context for anyone landing here directly */}
          <p
            data-reveal
            className="mx-auto mt-4 inline-block max-w-md text-balance rounded-full border border-[var(--line)] bg-[var(--bone)]/[0.03] px-4 py-1.5 text-xs text-[var(--bone-dim)]"
          >
            Built for small distributors, manufacturers, and retailers who
            can&apos;t justify a full-time analyst.
          </p>

          {/* What happens after you sign in */}
          <div data-reveal className="mt-6 flex items-center justify-center gap-2 sm:gap-3">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 font-mono text-[10px] text-[var(--accent)]">
                    {i + 1}
                  </span>
                  <span className="whitespace-nowrap text-xs text-[var(--bone-dim)]">{step}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="text-[var(--bone-dim)]/40">→</span>
                )}
              </div>
            ))}
          </div>

        </RevealSection>
      </div>

      {/* Bottom panel — floats over the page, fixed to the viewport so it never adds scroll */}
      <RevealSection className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-0" y={32}>
        <div
          data-reveal
          className="max-h-[70dvh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] border border-b-0 border-[var(--line)] bg-[var(--void-2)]/90 px-6 pb-8 pt-7 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-10"
        >
          <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--bone)]/15" />
          <div className="mx-auto max-w-md">
            <p className="text-center text-sm text-[var(--bone-dim)]">
              New accounts are reviewed before access is granted.
            </p>

            <div className="mt-5 space-y-2.5 sm:flex sm:gap-2.5 sm:space-y-0">
              <AuthButton icon={<GoogleMark />} onClick={() => signInWithProvider("google")}>
                Google
              </AuthButton>
              <AuthButton icon={<LinkedInMark />} onClick={() => signInWithProvider("linkedin_oidc")}>
                LinkedIn
              </AuthButton>
              {!showEmailForm && (
                <AuthButton icon={<MailMark />} onClick={() => setShowEmailForm(true)}>
                  Email
                </AuthButton>
              )}
            </div>

            {showEmailForm && (
              <form onSubmit={sendMagicLink} className="mt-3 space-y-2.5">
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--bone)]/[0.03] px-4 py-3 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "sending" ? "Sending…" : "Send magic link"}
                </button>
                {status === "sent" && (
                  <p className="text-center text-xs text-[var(--teal)]">
                    Check your email for a sign-in link.
                  </p>
                )}
                {status === "error" && (
                  <p className="text-center text-xs text-[var(--orange)]">
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            )}

            <p className="mt-5 text-center text-[11px] leading-relaxed text-[var(--bone-dim)]">
              By continuing you agree to our{" "}
              <Link href="/terms" className="text-[var(--bone)] underline underline-offset-2 hover:text-[var(--accent)]">
                Terms
              </Link>
              . You&apos;ll be notified once your account is reviewed.
            </p>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
