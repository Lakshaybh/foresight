"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  access_expires_at: string | null;
  admin_notes: string | null;
  plan: string;
  requested_plan: string | null;
  profile: BusinessProfile | null;
};

const PLAN_PRICES: Record<string, number> = { starter: 20, growth: 100, enterprise: 200 };
const PLANS = Object.keys(PLAN_PRICES) as (keyof typeof PLAN_PRICES)[];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  ecommerce: "Small e-commerce",
  distributor: "Distributor",
  manufacturer: "Manufacturer",
  retail_chain: "Retail chain",
  import_export: "Import / export",
  other: "Other",
};

const DURATION_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
];

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

function AccessBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) {
    return <span className="text-xs text-[var(--bone-dim)]">Unlimited access</span>;
  }
  const expired = new Date(expiresAt) < new Date();
  const date = new Date(expiresAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  return expired ? (
    <span className="text-xs text-[var(--orange)]">Access expired {date}</span>
  ) : (
    <span className="text-xs text-[var(--teal)]">Active until {date}</span>
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

function GrantAccessPanel({
  userId,
  defaultAmount,
  onDone,
}: {
  userId: string;
  defaultAmount?: string;
  onDone: (patch: Partial<Account>) => void;
}) {
  const [days, setDays] = useState(30);
  const [amount, setAmount] = useState(defaultAmount ?? "");
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  async function submit() {
    setBusy(true);
    const { error } = await supabase.rpc("grant_access", {
      p_user_id: userId,
      p_duration_days: days,
      p_amount: amount ? Number(amount) : null,
      p_currency: currency,
      p_note: note || null,
    });
    setBusy(false);
    if (!error) {
      onDone({ status: "approved", access_expires_at: new Date(Date.now() + days * 86400000).toISOString() });
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-[var(--line)] bg-[var(--bone)]/[0.02] p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Duration</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--void-2)] px-2.5 py-2 text-sm text-[var(--bone)] outline-none focus:border-[var(--accent)]/50"
          >
            {DURATION_PRESETS.map((p) => (
              <option key={p.days} value={p.days}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--void-2)] px-2.5 py-2 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--accent)]/50"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Currency</label>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--void-2)] px-2.5 py-2 text-sm text-[var(--bone)] outline-none focus:border-[var(--accent)]/50"
          />
        </div>
      </div>
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Note</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Paid via UPI, 1-month plan"
          className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--void-2)] px-2.5 py-2 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--accent)]/50"
        />
      </div>
      <button
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--void)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Recording…" : "Record payment & grant access"}
      </button>
    </div>
  );
}

export function AdminUserList({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const supabase = createClient();

  function patchAccount(userId: string, patch: Partial<Account>) {
    setAccounts((prev) => prev.map((a) => (a.user_id === userId ? { ...a, ...patch } : a)));
  }

  async function setStatus(userId: string, status: "approved" | "rejected") {
    setBusyId(userId);
    const { error } = await supabase.rpc("admin_set_status", { p_user_id: userId, p_status: status });
    setBusyId(null);
    if (!error) patchAccount(userId, { status });
  }

  async function revoke(userId: string) {
    setBusyId(userId);
    const { error } = await supabase.rpc("revoke_access", { p_user_id: userId });
    setBusyId(null);
    if (!error) patchAccount(userId, { access_expires_at: new Date().toISOString() });
  }

  async function saveNote(userId: string) {
    const notes = noteDrafts[userId] ?? "";
    setBusyId(userId);
    const { error } = await supabase.rpc("set_admin_notes", { p_user_id: userId, p_notes: notes || null });
    setBusyId(null);
    if (!error) patchAccount(userId, { admin_notes: notes || null });
  }

  async function setPlan(userId: string, plan: string) {
    setBusyId(userId);
    const { error } = await supabase.rpc("admin_set_plan", { p_user_id: userId, p_plan: plan });
    setBusyId(null);
    if (!error) patchAccount(userId, { plan });
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

  const byTab = tab === "all" ? accounts : accounts.filter((a) => a.status === tab);
  const q = query.trim().toLowerCase();
  const filtered = !q
    ? byTab
    : byTab.filter((a) =>
        [a.email, a.profile?.business_name, a.profile?.business_type && BUSINESS_TYPE_LABELS[a.profile.business_type]]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q))
      );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by email, business name, or type..."
        className="mb-4 w-full rounded-lg border border-[var(--line)] bg-[var(--bone)]/[0.03] px-3.5 py-2.5 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20"
      />
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
          {filtered.map((a) => {
            const hasActiveAccess = a.access_expires_at && new Date(a.access_expires_at) > new Date();
            return (
              <div key={a.user_id} className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <p className="text-sm font-medium text-[var(--bone)]">{a.profile?.business_name ?? a.email}</p>
                    <StatusBadge status={a.status} />
                    {a.role !== "admin" && (
                      <span className="rounded-full bg-[var(--bone)]/10 px-2 py-0.5 text-[10px] font-medium capitalize tracking-wide text-[var(--bone-dim)]">
                        {a.plan} · ${PLAN_PRICES[a.plan] ?? "?"}/mo
                      </span>
                    )}
                    {a.requested_plan && a.requested_plan !== a.plan && (
                      <span className="rounded-full bg-[var(--amber)]/15 px-2 py-0.5 text-[10px] font-medium capitalize tracking-wide text-[var(--amber)]">
                        wants {a.requested_plan}
                      </span>
                    )}
                    {a.role === "admin" && (
                      <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
                        admin
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.status === "pending" && (
                      <>
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
                      </>
                    )}
                    {a.role !== "admin" && (
                      <>
                        <Link
                          href={`/dashboard?as_tenant=${a.user_id}&tenant_email=${encodeURIComponent(a.email)}`}
                          className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05]"
                        >
                          View dashboard
                        </Link>
                        <button
                          onClick={() => setOpenPanel(openPanel === a.user_id ? null : a.user_id)}
                          className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05]"
                        >
                          {openPanel === a.user_id ? "Close" : "Manage access"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-xs text-[var(--bone-dim)]">
                    {a.email}
                    {!a.terms_accepted_at && " · T&C not yet accepted"}
                    {a.terms_accepted_at && !a.profile && " · profile not yet submitted"}
                  </p>
                  {a.role !== "admin" && <AccessBadge expiresAt={a.access_expires_at} />}
                </div>

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

                {openPanel === a.user_id && (
                  <>
                    <div className="mt-4">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Plan</label>
                      <select
                        value={a.plan}
                        disabled={busyId === a.user_id}
                        onChange={(e) => setPlan(a.user_id, e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--void-2)] px-2.5 py-2 text-sm capitalize text-[var(--bone)] outline-none focus:border-[var(--accent)]/50 sm:w-48"
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p} className="capitalize">
                            {p} — ${PLAN_PRICES[p]}/mo
                          </option>
                        ))}
                      </select>
                      {a.requested_plan && a.requested_plan !== a.plan && (
                        <button
                          disabled={busyId === a.user_id}
                          onClick={() => setPlan(a.user_id, a.requested_plan!)}
                          className="mt-1.5 text-xs font-medium text-[var(--amber)] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Apply requested plan ({a.requested_plan})
                        </button>
                      )}
                    </div>

                    <GrantAccessPanel
                      key={a.plan}
                      userId={a.user_id}
                      defaultAmount={String(PLAN_PRICES[a.requested_plan ?? a.plan] ?? "")}
                      onDone={(patch) => patchAccount(a.user_id, patch)}
                    />

                    {hasActiveAccess && (
                      <button
                        disabled={busyId === a.user_id}
                        onClick={() => revoke(a.user_id)}
                        className="mt-3 rounded-lg border border-[var(--orange)]/30 px-3 py-1.5 text-xs font-medium text-[var(--orange)] transition-all hover:bg-[var(--orange)]/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Revoke access now
                      </button>
                    )}

                    <div className="mt-4">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">
                        Admin notes
                      </label>
                      <textarea
                        rows={2}
                        defaultValue={a.admin_notes ?? ""}
                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [a.user_id]: e.target.value }))}
                        placeholder="Internal notes — payment method, agreement details, follow-ups..."
                        className="mt-1 w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--void-2)] px-2.5 py-2 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--accent)]/50"
                      />
                      <button
                        disabled={busyId === a.user_id}
                        onClick={() => saveNote(a.user_id)}
                        className="mt-2 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Save note
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
