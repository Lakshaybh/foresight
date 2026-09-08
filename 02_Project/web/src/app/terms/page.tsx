"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { OnboardingSteps } from "@/components/onboarding-steps";

export default function TermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleAccept() {
    setSubmitting(true);
    await supabase.rpc("accept_terms");
    router.push("/pending");
    router.refresh();
  }

  return (
    <AuthShell>
      <OnboardingSteps current={2} />

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-8 sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--bone)]">Terms &amp; Conditions</h1>
        <p className="mt-1.5 text-sm text-[var(--bone-dim)]">
          Please read before continuing. This is a pre-launch beta agreement —
          a full legal review happens before general availability.
        </p>

        <div className="mt-6 max-h-80 space-y-5 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bone)]/[0.03] p-5 text-sm leading-relaxed text-[var(--bone)]/80">
          <section>
            <h2 className="font-medium text-[var(--bone)]">1. Beta Service</h2>
            <p className="mt-1">
              Foresight is currently in a private beta. Features, data models, and
              availability may change without notice, and the service is
              provided &quot;as is&quot; without warranty of any kind while in this
              phase.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-[var(--bone)]">2. Access Is Reviewed</h2>
            <p className="mt-1">
              Every new account is reviewed by the platform administrator before
              access is granted. Access may be approved, rejected, or revoked at
              the administrator&apos;s discretion during the beta period.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-[var(--bone)]">3. Your Data</h2>
            <p className="mt-1">
              Any operational data you upload (orders, inventory, supplier
              records, or similar) is used solely to provide the service to you.
              It is not sold, shared with other customers, or used to train
              models for other accounts.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-[var(--bone)]">4. Acceptable Use</h2>
            <p className="mt-1">
              You agree not to use the service to upload unlawful content,
              attempt to access another account&apos;s data, or interfere with
              the platform&apos;s normal operation.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-[var(--bone)]">5. No Financial or Legal Advice</h2>
            <p className="mt-1">
              Recommendations produced by the platform are decision support, not
              financial, legal, or professional advice. You remain responsible
              for decisions made in your business.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-[var(--bone)]">6. Changes</h2>
            <p className="mt-1">
              These terms may be updated as the product moves out of beta. You
              will be asked to review and re-accept material changes.
            </p>
          </section>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--line)] p-3.5 text-sm text-[var(--bone)] transition-colors has-[:checked]:border-[var(--accent)]/50 has-[:checked]:bg-[var(--accent-wash)]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <span>I have read and agree to the Terms &amp; Conditions above.</span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!agreed || submitting}
          className="mt-5 w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Continuing..." : "Continue"}
        </button>
      </div>
    </AuthShell>
  );
}
