"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type BusinessProfile = {
  user_id: string;
  business_name: string;
  business_type: string;
  what_you_do: string;
  team_size: string;
  primary_challenge: string;
  country: string | null;
  website: string | null;
};

type Account = {
  user_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  terms_accepted_at: string | null;
  profile: BusinessProfile | null;
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  ecommerce: "Small e-commerce",
  distributor: "Distributor",
  manufacturer: "Manufacturer",
  retail_chain: "Retail chain",
  import_export: "Import / export",
  other: "Other",
};

export function AdminUserList({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  async function setStatus(userId: string, status: "approved" | "rejected") {
    setBusyId(userId);
    const { error } = await supabase.from("user_account").update({ status }).eq("user_id", userId);
    setBusyId(null);
    if (!error) {
      setAccounts((prev) => prev.map((a) => (a.user_id === userId ? { ...a, status } : a)));
    }
  }

  if (accounts.length === 0) {
    return <p className="mt-8 text-sm text-muted-foreground">No accounts yet.</p>;
  }

  return (
    <div className="mt-6 divide-y divide-border rounded-md border border-border">
      {accounts.map((a) => (
        <div key={a.user_id} className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{a.email}</p>
              <p className="text-xs text-muted-foreground">
                {a.role} · {a.status}
                {!a.terms_accepted_at && " · T&C not yet accepted"}
                {a.terms_accepted_at && !a.profile && " · profile not yet submitted"}
              </p>
            </div>
            {a.status === "pending" && (
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  disabled={busyId === a.user_id}
                  onClick={() => setStatus(a.user_id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === a.user_id}
                  onClick={() => setStatus(a.user_id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>

          {a.profile && (
            <div className="grid gap-x-6 gap-y-2 rounded-md bg-muted/40 p-3.5 text-sm sm:grid-cols-2">
              <Field label="Business">{a.profile.business_name}</Field>
              <Field label="Type">{BUSINESS_TYPE_LABELS[a.profile.business_type] ?? a.profile.business_type}</Field>
              <Field label="Team size">{a.profile.team_size} people</Field>
              <Field label="Country">{a.profile.country || "—"}</Field>
              <Field label="What they do" full>{a.profile.what_you_do}</Field>
              <Field label="Primary challenge" full>{a.profile.primary_challenge}</Field>
              {a.profile.website && (
                <Field label="Website" full>
                  <a
                    href={a.profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    {a.profile.website}
                  </a>
                </Field>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground/90">{children}</p>
    </div>
  );
}
