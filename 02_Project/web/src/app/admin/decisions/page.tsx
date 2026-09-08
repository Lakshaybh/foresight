"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AdminNav } from "@/components/admin-nav";
import { apiFetch, ApiNotConfiguredError } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

type Decision = {
  decision_id: string;
  signal_id: string;
  action_type: string;
  evidence: Record<string, unknown>;
  confidence: number;
  status: string;
  owner_role: string;
  created_at: string;
  resolved_at: string | null;
  outcome: string | null;
};

const ACTION_LABELS: Record<string, string> = {
  reorder_now: "Reorder now",
  escalate_supplier: "Escalate supplier",
  shift_to_backup_supplier: "Shift to backup supplier",
  review_demand_forecast: "Review demand forecast",
  monitor: "Monitor",
};

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-[var(--amber)]/15 text-[var(--amber)]",
    approved: "bg-[var(--teal)]/15 text-[var(--teal)]",
    rejected: "bg-[var(--orange)]/15 text-[var(--orange)]",
    snoozed: "bg-[var(--bone)]/10 text-[var(--bone-dim)]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status] ?? styles.snoozed}`}>
      {status}
    </span>
  );
}

export default function AdminDecisionsPage() {
  const [email, setEmail] = useState<string | undefined>();
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [outcomeDrafts, setOutcomeDrafts] = useState<Record<string, string>>({});

  async function load() {
    setError(null);
    try {
      const data = await apiFetch<Decision[]>("/decisions");
      setDecisions(data);
    } catch (e) {
      setError(e instanceof ApiNotConfiguredError ? e.message : `Couldn't load decisions: ${(e as Error).message}`);
    }
  }

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function review(id: string, status: "approved" | "rejected" | "snoozed") {
    setBusyId(id);
    try {
      const updated = await apiFetch<Decision>(`/decisions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setDecisions((prev) => prev?.map((d) => (d.decision_id === id ? updated : d)) ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyId(null);
  }

  async function submitOutcome(id: string) {
    const outcome = outcomeDrafts[id];
    if (!outcome) return;
    setBusyId(id);
    try {
      const updated = await apiFetch<Decision>(`/decisions/${id}/outcome`, {
        method: "PATCH",
        body: JSON.stringify({ outcome }),
      });
      setDecisions((prev) => prev?.map((d) => (d.decision_id === id ? updated : d)) ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyId(null);
  }

  return (
    <AppShell title="Command Center" email={email}>
      <AdminNav />

      <p className="mb-4 text-sm text-[var(--bone-dim)]">
        Signals the detection engine has already scored — approve, reject, or snooze each one.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-[var(--orange)]/30 bg-[var(--orange)]/10 px-4 py-3 text-sm text-[var(--orange)]">
          {error}
        </div>
      )}

      {!error && decisions === null && <p className="text-sm text-[var(--bone-dim)]">Loading…</p>}

      {decisions && decisions.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--bone-dim)]">No decisions yet.</p>
      )}

      {decisions && decisions.length > 0 && (
        <div className="space-y-3">
          {decisions.map((d) => (
            <div key={d.decision_id} className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-medium text-[var(--bone)]">{ACTION_LABELS[d.action_type] ?? d.action_type}</p>
                  <StatusPill status={d.status} />
                  <span className="text-xs text-[var(--bone-dim)]">confidence {(d.confidence * 100).toFixed(0)}%</span>
                </div>
                {d.status === "open" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      disabled={busyId === d.decision_id}
                      onClick={() => review(d.decision_id, "approved")}
                      className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--void)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === d.decision_id}
                      onClick={() => review(d.decision_id, "snoozed")}
                      className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Snooze
                    </button>
                    <button
                      disabled={busyId === d.decision_id}
                      onClick={() => review(d.decision_id, "rejected")}
                      className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--bone)]/[0.03] p-3 text-xs text-[var(--bone-dim)]">
                {JSON.stringify(d.evidence, null, 2)}
              </pre>

              {d.status !== "open" && (
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  {d.outcome ? (
                    <p className="text-sm text-[var(--bone)]">
                      <span className="text-[var(--bone-dim)]">Outcome: </span>
                      {d.outcome}
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={outcomeDrafts[d.decision_id] ?? ""}
                        onChange={(e) => setOutcomeDrafts((prev) => ({ ...prev, [d.decision_id]: e.target.value }))}
                        placeholder="What actually happened?"
                        className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bone)]/[0.03] px-3 py-1.5 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--accent)]/50"
                      />
                      <button
                        disabled={busyId === d.decision_id || !outcomeDrafts[d.decision_id]}
                        onClick={() => submitOutcome(d.decision_id)}
                        className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Record outcome
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
