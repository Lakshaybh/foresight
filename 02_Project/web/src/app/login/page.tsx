"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import { apiFetchPublic } from "@/lib/api";
import { AbstractBackground } from "@/components/marketing/abstract-background";
import { HeroScene } from "@/components/marketing/hero-scene";
import { RevealSection } from "@/components/marketing/reveal-section";
import { LoginInfographic } from "@/components/marketing/login-infographic";
import { TermsModal } from "@/components/terms-modal";
import { IconInput } from "@/components/icon-input";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[17px] w-[17px]">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function MailMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 6.5l8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ShieldMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 3.5 19 6.3v5.4c0 4.4-3 7.9-7 9.3-4-1.4-7-4.9-7-9.3V6.3l7-2.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12.3l2 2 4-4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AuthButton({
  onClick,
  children,
  icon,
  type = "button",
  disabled,
  primary = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? "flex w-full items-center justify-center gap-3 rounded-[6px] bg-[var(--accent)] py-3 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          : "flex w-full items-center justify-center gap-3 rounded-[6px] border border-[var(--line)] bg-transparent py-3 text-sm font-medium text-[var(--bone)] transition-all duration-300 hover:bg-[var(--bone)]/[0.05] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
      }
    >
      {icon}
      {children}
    </button>
  );
}

const submitClass =
  "w-full rounded-[6px] bg-[var(--accent)] py-3 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

type EmailStep = "closed" | "email" | "otp" | "set-password" | "password";

// The email path branches on whether this address has signed in before:
// a brand-new email gets a one-time code sent (proves they own the inbox)
// and is asked to set a password right after; an email that already has a
// password just signs in with it. Detecting which is which happens
// server-side (see /auth/check-email) — the client never gets to assume.
function EmailAuthFlow({ agreed }: { agreed: boolean }) {
  const [step, setStep] = useState<EmailStep>("closed");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  function reset() {
    setStep("email");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchPublic<{ exists: boolean; has_password: boolean }>("/auth/check-email", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (res.exists && res.has_password) {
        setStep("password");
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
        if (error) throw error;
        setStep("otp");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    setLoading(false);
    if (error) {
      setError("That code didn't work — check it and try again.");
      return;
    }
    setStep("set-password");
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }
    // Consent was already given via the checkbox before this flow started —
    // this is the first point there's a real authenticated user to attach
    // that acceptance to.
    await supabase.rpc("accept_terms");
    router.push("/onboarding");
    router.refresh();
  }

  async function submitPasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError("Incorrect email or password.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  if (step === "closed") {
    return (
      <AuthButton icon={<MailMark />} onClick={() => setStep("email")} disabled={!agreed}>
        Email
      </AuthButton>
    );
  }

  return (
    <div className="mt-2.5 basis-full space-y-2.5">
      {step === "email" && (
        <form onSubmit={submitEmail} className="space-y-2.5">
          <IconInput
            icon={<MailMark />}
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <button type="submit" disabled={loading || !agreed} className={submitClass}>
            {loading ? "Checking…" : "Continue"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="space-y-2.5">
          <p className="text-xs text-[var(--bone-dim)]">
            First time here — enter the code we sent to <span className="text-[var(--bone)]">{email}</span>.
          </p>
          <IconInput
            icon={<ShieldMark />}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
            // Not hardcoded to 6 — this Supabase project's configured OTP
            // length can differ (it's an 8-digit code here), and capping
            // input length here made it impossible to type the real code.
            maxLength={10}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="Code from your email"
            className="text-center font-mono text-lg tracking-[0.3em]"
          />
          <button type="submit" disabled={loading || otp.length < 4} className={submitClass}>
            {loading ? "Verifying…" : "Verify code"}
          </button>
        </form>
      )}

      {step === "set-password" && (
        <form onSubmit={submitNewPassword} className="space-y-2.5">
          <p className="text-xs text-[var(--bone-dim)]">
            Verified. Set a password for next time you sign in.
          </p>
          <IconInput
            icon={<LockMark />}
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
          />
          <IconInput
            icon={<LockMark />}
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />
          <button type="submit" disabled={loading} className={submitClass}>
            {loading ? "Saving…" : "Set password & continue"}
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={submitPasswordSignIn} className="space-y-2.5">
          <p className="text-xs text-[var(--bone-dim)]">
            Welcome back — sign in as <span className="text-[var(--bone)]">{email}</span>.
          </p>
          <IconInput
            icon={<LockMark />}
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="submit" disabled={loading} className={submitClass}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      {error && <p className="text-center text-xs text-[var(--orange)]">{error}</p>}

      <button type="button" onClick={reset} className="w-full text-center text-xs text-[var(--bone-dim)] underline underline-offset-2 hover:text-[var(--bone)]">
        Use a different email
      </button>
    </div>
  );
}

export default function LoginPage() {
  const [agreed, setAgreed] = useState(false);

  const supabase = createClient();

  async function signInWithProvider(provider: "google" | "linkedin_oidc") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className={`${inter.variable} theme-volt relative flex h-[100dvh] flex-col overflow-hidden font-[family-name:var(--font-display)]`}>
      <AbstractBackground />

      <Link
        href="/"
        className="page-intro absolute left-6 top-6 z-30 flex items-center gap-2 font-mono text-sm font-medium tracking-tight text-[var(--bone-strong)]"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
        Foresight
      </Link>

      {/* Top — one headline, the animated before/after infographic, and the
          same warehouse/truck/shop scene from the homepage filling the
          background so this screen doesn't read as bare purple space. */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-6 pb-64 pt-20 sm:pb-56">
        <HeroScene />
        <RevealSection className="max-w-md text-center" stagger={0.08}>
          <h1
            data-reveal
            className="text-[28px] font-normal leading-[1.05] tracking-[-0.02em] text-balance text-[var(--bone-strong)] sm:text-[36px]"
          >
            Know what happens{" "}
            <span style={{ color: "var(--accent)" }}>next.</span>
          </h1>
          <p data-reveal className="mx-auto mt-3 max-w-sm text-balance text-sm text-[var(--bone-dim)]">
            A daily watch on your stock and suppliers that catches a stockout
            weeks before it happens.
          </p>
          <div data-reveal className="mt-6">
            <LoginInfographic />
          </div>
        </RevealSection>
      </div>

      {/* Bottom panel — floats over the page, fixed to the viewport so it never adds scroll */}
      <RevealSection className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-0" y={32}>
        <div
          data-reveal
          className="max-h-[65dvh] w-full max-w-md overflow-y-auto rounded-t-[8px] border border-b-0 border-[var(--line)] bg-[var(--void-2)]/95 px-6 pb-6 pt-5 shadow-[0_-30px_70px_-20px_var(--accent-dim)] backdrop-blur-xl sm:px-9"
        >
          <p className="text-center text-sm text-[var(--bone-dim)]">
            New accounts are reviewed before access is granted.
          </p>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--line)] p-2.5 text-sm text-[var(--bone)] transition-colors has-[:checked]:border-[var(--accent)]/50 has-[:checked]:bg-[var(--accent-wash)]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              I agree to the{" "}
              <TermsModal
                trigger={(open) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                    className="underline underline-offset-2 hover:text-[var(--accent)]"
                  >
                    Terms &amp; Conditions
                  </button>
                )}
              />
              .
            </span>
          </label>

          <div className="mt-3 space-y-2">
            <AuthButton icon={<GoogleMark />} onClick={() => signInWithProvider("google")} disabled={!agreed} primary>
              Continue with Google
            </AuthButton>
            <div className="flex flex-wrap gap-2.5">
              <AuthButton icon={<LinkedInMark />} onClick={() => signInWithProvider("linkedin_oidc")} disabled={!agreed}>
                LinkedIn
              </AuthButton>
              <EmailAuthFlow agreed={agreed} />
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--bone-dim)]">
            You&apos;ll be notified once your account is reviewed.
          </p>
        </div>
      </RevealSection>
    </div>
  );
}
