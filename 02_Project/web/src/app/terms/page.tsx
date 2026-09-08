"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
    <main className="min-h-screen bg-muted/30 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <OnboardingSteps current={2} />

        <div className="rounded-2xl border border-border bg-background p-8 shadow-sm sm:p-10">
          <div className="mb-2 inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Foresight</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Terms &amp; Conditions</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Please read before continuing. This is a pre-launch beta agreement —
            a full legal review happens before general availability.
          </p>

          <div className="mt-6 max-h-80 space-y-5 overflow-y-auto rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-foreground/90">
            <section>
              <h2 className="font-medium text-foreground">1. Beta Service</h2>
              <p className="mt-1">
                Foresight is currently in a private beta. Features, data models, and
                availability may change without notice, and the service is
                provided &quot;as is&quot; without warranty of any kind while in this
                phase.
              </p>
            </section>
            <section>
              <h2 className="font-medium text-foreground">2. Access Is Reviewed</h2>
              <p className="mt-1">
                Every new account is reviewed by the platform administrator before
                access is granted. Access may be approved, rejected, or revoked at
                the administrator&apos;s discretion during the beta period.
              </p>
            </section>
            <section>
              <h2 className="font-medium text-foreground">3. Your Data</h2>
              <p className="mt-1">
                Any operational data you upload (orders, inventory, supplier
                records, or similar) is used solely to provide the service to you.
                It is not sold, shared with other customers, or used to train
                models for other accounts.
              </p>
            </section>
            <section>
              <h2 className="font-medium text-foreground">4. Acceptable Use</h2>
              <p className="mt-1">
                You agree not to use the service to upload unlawful content,
                attempt to access another account&apos;s data, or interfere with
                the platform&apos;s normal operation.
              </p>
            </section>
            <section>
              <h2 className="font-medium text-foreground">5. No Financial or Legal Advice</h2>
              <p className="mt-1">
                Recommendations produced by the platform are decision support, not
                financial, legal, or professional advice. You remain responsible
                for decisions made in your business.
              </p>
            </section>
            <section>
              <h2 className="font-medium text-foreground">6. Changes</h2>
              <p className="mt-1">
                These terms may be updated as the product moves out of beta. You
                will be asked to review and re-accept material changes.
              </p>
            </section>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>I have read and agree to the Terms &amp; Conditions above.</span>
          </label>

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={!agreed || submitting}
            onClick={handleAccept}
          >
            {submitting ? "Continuing..." : "Continue"}
          </Button>
        </div>
      </div>
    </main>
  );
}
