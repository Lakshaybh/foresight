"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

const TABS = ["pending", "approved", "rejected", "all"] as const;
type Tab = (typeof TABS)[number];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-[var(--amber)]/15 text-[var(--amber)]",
    approved: "bg-[var(--teal)]/15 text-[var(--teal)]",
    rejected: "bg-[var(--orange)]/15 text-[var(--orange)]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status] ?? "bg-[var(--bone)]/10 text-[var(--bone-dim)]"}`}>
      {status}
    </span>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">{label}</p>
      <p className="mt-0.5 text-sm text-[var(--bone)]/90">{children}</p>
    </div>
  );
}

export function AdminUserList({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const supabase = createClient();

  async function setStatus(userId: string, status: "approved" | "rejected") {
    setBusyId(userId);
    const { error } = await supabase.from("user_account").update({ status }).eq("user_id", userId);
    setBusyId(null);
    if (!error) {
      setAccounts((prev) => prev.map((a) => (a.user_id === userId ? { ...a, status } : a)));
    }
  }

  const counts = useMemo(
    () => ({
      pending: accounts.filter((a) => a.status === "pending").length,
      approved: accounts.filter((a) => a.status === "approved").length,
      rejected: accounts.filter((a) => a.status === "rejected").length,
      all: accounts.length,
    }),
    [accounts]
  );

  const filtered = tab === "all" ? accounts : accounts.filter((a) => a.status === tab);

  return (
    <div>
      <div className="flex gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bone)]/[0.02] p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-1.5 text-xs font-medium capitalize transition-all duration-300 ${
              tab === t ? "bg-[var(--accent)] text-[var(--void)]" : "text-[var(--bone-dim)] hover:text-[var(--bone)]"
            }`}
          >
            {t} <span className="opacity-70">({counts[t]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--bone-dim)]">No accounts in this list.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((a) => (
            <div key={a.user_id} className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-medium text-[var(--bone)]">{a.profile?.business_name ?? a.email}</p>
                  <StatusBadge status={a.status} />
                  {a.role === "admin" && (
                    <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
                      admin
                    </span>
                  )}
                </div>
                {a.status === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      disabled={busyId === a.user_id}
                      onClick={() => setStatus(a.user_id, "approved")}
                      className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--void)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === a.user_id}
                      onClick={() => setStatus(a.user_id, "rejected")}
                      className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-1 text-xs text-[var(--bone-dim)]">
                {a.email}
                {!a.terms_accepted_at && " · T&C not yet accepted"}
                {a.terms_accepted_at && !a.profile && " · profile not yet submitted"}
              </p>

              {a.profile && (
                <div className="mt-4 grid gap-x-6 gap-y-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
                  <Field label="Type">{BUSINESS_TYPE_LABELS[a.profile.business_type] ?? a.profile.business_type}</Field>
                  <Field label="Team size">{a.profile.team_size} people</Field>
                  <Field label="Country">{a.profile.country || "—"}</Field>
                  {a.profile.website && (
                    <Field label="Website">
                      <a
                        href={a.profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] underline underline-offset-2"
                      >
                        {a.profile.website}
                      </a>
                    </Field>
                  )}
                  <Field label="What they do" full>{a.profile.what_you_do}</Field>
                  <Field label="Primary challenge" full>{a.profile.primary_challenge}</Field>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
