"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { OnboardingSteps } from "@/components/onboarding-steps";

const BUSINESS_TYPES = [
  { value: "ecommerce", label: "Small e-commerce" },
  { value: "distributor", label: "Distributor" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "retail_chain", label: "Retail chain" },
  { value: "import_export", label: "Import / export" },
  { value: "other", label: "Other" },
];

const TEAM_SIZES = ["1-5", "6-20", "21-50", "51+"];

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--bone)]" htmlFor={htmlFor}>
        {label} {optional && <span className="font-normal text-[var(--bone-dim)]">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--bone)]/[0.03] px-3.5 py-2.5 text-sm text-[var(--bone)] outline-none transition-shadow placeholder:text-[var(--bone-dim)] focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20";

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [whatYouDo, setWhatYouDo] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [primaryChallenge, setPrimaryChallenge] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const canSubmit = businessName && businessType && whatYouDo && teamSize && primaryChallenge;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.rpc("submit_business_profile", {
      p_business_name: businessName,
      p_business_type: businessType,
      p_what_you_do: whatYouDo,
      p_team_size: teamSize,
      p_primary_challenge: primaryChallenge,
      p_country: country || null,
      p_website: website || null,
    });

    setSubmitting(false);
    if (error) {
      setError("Something went wrong. Please try again.");
      return;
    }
    router.push("/terms");
    router.refresh();
  }

  return (
    <AuthShell>
      <OnboardingSteps current={1} />

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-8 sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--bone)]">Tell us about your business</h1>
        <p className="mt-1.5 text-sm text-[var(--bone-dim)]">
          This is what gets reviewed to approve your access — the more
          specific, the faster your request can be judged.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Field label="Business name" htmlFor="businessName">
            <input
              id="businessName"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Distribution Co."
              className={inputClass}
            />
          </Field>

          <Field label="What type of company do you have?" htmlFor="businessType">
            <select
              id="businessType"
              required
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled className="bg-[var(--void-2)]">
                Select one
              </option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-[var(--void-2)]">
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="What does your business do?" htmlFor="whatYouDo">
            <textarea
              id="whatYouDo"
              required
              rows={2}
              value={whatYouDo}
              onChange={(e) => setWhatYouDo(e.target.value)}
              placeholder="e.g. We import electronics components and distribute them to regional retailers."
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Team size" htmlFor="teamSize">
            <select
              id="teamSize"
              required
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled className="bg-[var(--void-2)]">
                Select one
              </option>
              {TEAM_SIZES.map((size) => (
                <option key={size} value={size} className="bg-[var(--void-2)]">
                  {size} people
                </option>
              ))}
            </select>
          </Field>

          <Field label="What help do you want from Foresight?" htmlFor="primaryChallenge">
            <textarea
              id="primaryChallenge"
              required
              rows={3}
              value={primaryChallenge}
              onChange={(e) => setPrimaryChallenge(e.target.value)}
              placeholder="e.g. We find out about supplier delays only after a customer complains, and by then it's too late to reorder."
              className={`${inputClass} resize-none`}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Country / region" htmlFor="country" optional>
              <input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United States"
                className={inputClass}
              />
            </Field>
            <Field label="Website" htmlFor="website" optional>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className={inputClass}
              />
            </Field>
          </div>

          {error && <p className="text-sm text-[var(--orange)]">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Continue"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
