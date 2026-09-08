"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const BUSINESS_TYPES = [
  { value: "ecommerce", label: "Small e-commerce" },
  { value: "distributor", label: "Distributor" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "retail_chain", label: "Retail chain" },
  { value: "import_export", label: "Import / export" },
  { value: "other", label: "Other" },
];

const TEAM_SIZES = ["1-5", "6-20", "21-50", "51+"];

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
    router.push("/pending");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Tell us about your business</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This is what the administrator reviews to approve your access — the
        more specific, the faster your request can be judged.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="businessName">
            Business name
          </label>
          <input
            id="businessName"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Acme Distribution Co."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="businessType">
            What type of business is it?
          </label>
          <select
            id="businessType"
            required
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" disabled>
              Select one
            </option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="whatYouDo">
            What does your business do?
          </label>
          <textarea
            id="whatYouDo"
            required
            rows={2}
            value={whatYouDo}
            onChange={(e) => setWhatYouDo(e.target.value)}
            placeholder="e.g. We import electronics components and distribute them to regional retailers."
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="teamSize">
            Team size
          </label>
          <select
            id="teamSize"
            required
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" disabled>
              Select one
            </option>
            {TEAM_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} people
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="primaryChallenge">
            What&apos;s the biggest supplier or inventory problem you&apos;re facing today?
          </label>
          <textarea
            id="primaryChallenge"
            required
            rows={3}
            value={primaryChallenge}
            onChange={(e) => setPrimaryChallenge(e.target.value)}
            placeholder="e.g. We find out about supplier delays only after a customer complains, and by then it's too late to reorder."
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="country">
              Country / region <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="United States"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="website">
              Website <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full sm:w-auto" disabled={!canSubmit || submitting}>
          {submitting ? "Submitting..." : "Submit for review"}
        </Button>
      </form>
    </main>
  );
}
