"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { OnboardingSignOutButton } from "@/components/onboarding-signout-button";
import { RevealSection } from "@/components/marketing/reveal-section";
import { IconInput, fieldClass } from "@/components/icon-input";

const BUSINESS_TYPES = [
  { value: "ecommerce", label: "Small e-commerce" },
  { value: "distributor", label: "Distributor" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "retail_chain", label: "Retail chain" },
  { value: "import_export", label: "Import / export" },
  { value: "other", label: "Other" },
];

const TEAM_SIZES = ["1-5", "6-20", "21-50", "51+"];

const PLANS = [
  { value: "starter", label: "Starter", price: "$20/mo" },
  { value: "growth", label: "Growth", price: "$100/mo" },
  { value: "enterprise", label: "Enterprise", price: "$200/mo" },
];

function BuildingMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="4" y="4" width="10" height="17" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="9" width="6" height="12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8h1M10 8h1M7 12h1M10 12h1M7 16h1M10 16h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function GlobeMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 4 5.3 4 8.5s-1.5 6.2-4 8.5c-2.5-2.3-4-5.3-4-8.5s1.5-6.2 4-8.5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function LinkMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M9.5 14.5 14.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 7.5 12.3 6.2a3.2 3.2 0 0 1 4.5 4.5L15.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 16.5 11.7 17.8a3.2 3.2 0 0 1-4.5-4.5L8.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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
    <div data-reveal className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--bone)]" htmlFor={htmlFor}>
        {label} {optional && <span className="font-normal text-[var(--bone-dim)]">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [whatYouDo, setWhatYouDo] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [primaryChallenge, setPrimaryChallenge] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [plan, setPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const requiredFields = [businessName, businessType, whatYouDo, teamSize, primaryChallenge, plan];
  const filledCount = requiredFields.filter(Boolean).length;
  const canSubmit = filledCount === requiredFields.length;

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

    if (error) {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const { error: planError } = await supabase.rpc("submit_requested_plan", { p_plan: plan });
    setSubmitting(false);
    if (planError) {
      setError("Something went wrong. Please try again.");
      return;
    }
    router.push("/pending");
    router.refresh();
  }

  return (
    <AuthShell topRight={<OnboardingSignOutButton />}>
      <RevealSection stagger={0.06}>
        <div data-reveal className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]">
              <BuildingMark />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--bone)]">Tell us about your business</h1>
              <p className="text-sm text-[var(--bone-dim)]">
                The more specific, the faster your request gets judged.
              </p>
            </div>
          </div>

          {/* Live completion progress — small, real feedback instead of a
              static wall of fields with no sense of how far along you are. */}
          <div className="mt-6">
            <div className="h-1.5 rounded-full bg-[var(--bone)]/10">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
                style={{ width: `${(filledCount / requiredFields.length) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-[var(--bone-dim)]">
              {filledCount} of {requiredFields.length} required fields
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <Field label="Business name" htmlFor="businessName">
              <IconInput
                icon={<BuildingMark />}
                id="businessName"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Distribution Co."
              />
            </Field>

            <Field label="What type of company do you have?" htmlFor="businessType">
              <select
                id="businessType"
                required
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className={fieldClass}
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
                className={`${fieldClass} resize-none`}
              />
            </Field>

            <Field label="Team size" htmlFor="teamSize">
              <select
                id="teamSize"
                required
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className={fieldClass}
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
                className={`${fieldClass} resize-none`}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Country / region" htmlFor="country" optional>
                <IconInput
                  icon={<GlobeMark />}
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United States"
                />
              </Field>
              <Field label="Website" htmlFor="website" optional>
                <IconInput
                  icon={<LinkMark />}
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </Field>
            </div>

            <Field label="Which plan would you like?" htmlFor="plan">
              <div data-reveal className="grid gap-2.5 sm:grid-cols-3">
                {PLANS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlan(p.value)}
                    className={`rounded-xl border px-3.5 py-3 text-left transition-all duration-300 ${
                      plan === p.value
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--line)] hover:border-[var(--bone)]/30"
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--bone)]">{p.label}</p>
                    <p className="text-xs text-[var(--bone-dim)]">{p.price}</p>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-[var(--bone-dim)]">
                This tells us what to set you up with — the admin confirms it when granting access.
              </p>
            </Field>

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
      </RevealSection>
    </AuthShell>
  );
}
