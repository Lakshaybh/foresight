"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DecisionEvidence } from "@/components/decision-evidence";

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

const ACTION_ICONS: Record<string, React.ReactNode> = {
  reorder_now: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 7v10l9 4 9-4V7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  escalate_supplier: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 4L22 20H2L12 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 10.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  ),
  shift_to_backup_supplier: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 12h11M11 7l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  review_demand_forecast: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] px-6 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-[var(--accent)]">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
      <h2 className="mt-4 text-base font-medium text-[var(--bone)]">Nothing to watch yet</h2>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--bone-dim)]">
        Once your supplier and inventory data is connected, early-warning
        signals and recommended actions will show up here.
      </p>
      <Link
        href="/dashboard/upload"
        className="mt-5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all hover:brightness-110"
      >
        Connect your data
      </Link>
    </div>
  );
}

export function DecisionsPanel() {
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [outcomeDrafts, setOutcomeDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    apiFetch<Decision[]>("/decisions")
      .then(setDecisions)
      .catch((e) => {
        // A customer shouldn't see an internal "API not deployed" error —
        // that reads the same as "nothing here yet" from their side.
        console.error("Failed to load decisions:", e);
        setDecisions([]);
      });
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
      console.error(e);
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
      console.error(e);
    }
    setBusyId(null);
  }

  if (decisions === null) return <p className="text-sm text-[var(--bone-dim)]">Loading…</p>;
  if (decisions.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      {decisions.map((d) => (
        <div key={d.decision_id} className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                {ACTION_ICONS[d.action_type]}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--bone)]">{ACTION_LABELS[d.action_type] ?? d.action_type}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <StatusPill status={d.status} />
                  <span className="text-xs text-[var(--bone-dim)]">confidence {(d.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
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

          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <DecisionEvidence evidence={d.evidence} />
          </div>

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
  );
}
