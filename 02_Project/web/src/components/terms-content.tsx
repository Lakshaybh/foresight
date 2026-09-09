// Shared terms text — the single source of truth, used both by the
// onboarding accept-terms flow and the homepage's read-only preview modal,
// so the two never drift out of sync with each other.
export function TermsContent() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-[var(--bone)]/80">
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
  );
}
