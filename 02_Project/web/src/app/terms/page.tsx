"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleAccept() {
    setSubmitting(true);
    await supabase.rpc("accept_terms");
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Terms &amp; Conditions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Please read before continuing. This is a pre-launch beta agreement — a
        full legal review happens before general availability.
      </p>

      <div className="mt-6 max-h-96 space-y-4 overflow-y-auto rounded-md border border-border p-5 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-medium">1. Beta Service</h2>
          <p>
            Foresight is currently in a private beta. Features, data models, and
            availability may change without notice, and the service is
            provided &quot;as is&quot; without warranty of any kind while in this
            phase.
          </p>
        </section>
        <section>
          <h2 className="font-medium">2. Access Is Reviewed</h2>
          <p>
            Every new account is reviewed by the platform administrator before
            access is granted. Access may be approved, rejected, or revoked at
            the administrator&apos;s discretion during the beta period.
          </p>
        </section>
        <section>
          <h2 className="font-medium">3. Your Data</h2>
          <p>
            Any operational data you upload (orders, inventory, supplier
            records, or similar) is used solely to provide the service to you.
            It is not sold, shared with other customers, or used to train
            models for other accounts.
          </p>
        </section>
        <section>
          <h2 className="font-medium">4. Acceptable Use</h2>
          <p>
            You agree not to use the service to upload unlawful content,
            attempt to access another account&apos;s data, or interfere with
            the platform&apos;s normal operation.
          </p>
        </section>
        <section>
          <h2 className="font-medium">5. No Financial or Legal Advice</h2>
          <p>
            Recommendations produced by the platform are decision support, not
            financial, legal, or professional advice. You remain responsible
            for decisions made in your business.
          </p>
        </section>
        <section>
          <h2 className="font-medium">6. Changes</h2>
          <p>
            These terms may be updated as the product moves out of beta. You
            will be asked to review and re-accept material changes.
          </p>
        </section>
      </div>

      <label className="mt-6 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        <span>I have read and agree to the Terms &amp; Conditions above.</span>
      </label>

      <Button
        className="mt-4 w-full sm:w-auto"
        disabled={!agreed || submitting}
        onClick={handleAccept}
      >
        {submitting ? "Continuing..." : "Agree and continue"}
      </Button>
    </main>
  );
}
