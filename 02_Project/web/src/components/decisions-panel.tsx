"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, withTenant } from "@/lib/api";
import { DecisionEvidence } from "@/components/decision-evidence";

type Decision = {
  decision_id: string;
  signal_id: string;
  action_type: string;
  evidence: Record<string, unknown>;
  entity_name: string | null;
  confidence: number;
  status: string;
  owner_role: string;
  created_at: string;
  resolved_at: string | null;
  outcome: string | null;
};

// Urgency reuses the same severity language as the rest of the product
// (teal/amber/orange), driven by the model's own confidence rather than a
// separate hand-picked "urgent" flag — the number that's already there.
function urgency(confidence: number): { label: string; color: string } {
  if (confidence >= 0.8) return { label: "Urgent", color: "var(--orange)" };
  if (confidence >= 0.5) return { label: "Normal", color: "var(--amber)" };
  return { label: "Low", color: "var(--teal)" };
}

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

function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--void-2)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">{label}</p>
      <p className="mt-1.5 text-xl font-semibold" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-[var(--line)] px-6 py-20 text-center">
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
        className="mt-5 rounded-[6px] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all hover:brightness-110"
      >
        Connect your data
      </Link>
    </div>
  );
}

function DecisionCard({
  d,
  readOnly,
  busyId,
  outcomeDrafts,
  setOutcomeDrafts,
  review,
  submitOutcome,
}: {
  d: Decision;
  readOnly: boolean;
  busyId: string | null;
  outcomeDrafts: Record<string, string>;
  setOutcomeDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  review: (id: string, status: "approved" | "rejected" | "snoozed") => void;
  submitOutcome: (id: string) => void;
}) {
  const u = urgency(d.confidence);
  return (
    <div className="flex gap-3.5 rounded-[8px] border border-[var(--line)] bg-[var(--void-2)] p-5">
      <span className="w-1 shrink-0 rounded-full" style={{ background: u.color }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `color-mix(in srgb, ${u.color} 15%, transparent)`, color: u.color }}
            >
              {ACTION_ICONS[d.action_type]}
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--bone)]">{ACTION_LABELS[d.action_type] ?? d.action_type}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <StatusPill status={d.status} />
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  style={{ backgroundColor: `color-mix(in srgb, ${u.color} 15%, transparent)`, color: u.color }}
                >
                  {u.label}
                </span>
                <span className="font-mono text-xs text-[var(--bone-dim)]">confidence {(d.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          {d.status === "open" && !readOnly && (
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
          <DecisionEvidence evidence={d.evidence} entityName={d.entity_name} />
        </div>

        {d.status !== "open" && (
          <div className="mt-3 border-t border-[var(--line)] pt-3">
            {d.outcome ? (
              <p className="text-sm text-[var(--bone)]">
                <span className="text-[var(--bone-dim)]">Outcome: </span>
                {d.outcome}
              </p>
            ) : readOnly ? (
              <p className="text-xs text-[var(--bone-dim)]">No outcome recorded yet.</p>
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
    </div>
  );
}

const BANDS = [
  { key: "urgent", label: "Needs attention today", color: "var(--orange)", test: (c: number) => c >= 0.8 },
  { key: "normal", label: "Worth a look", color: "var(--amber)", test: (c: number) => c >= 0.5 && c < 0.8 },
  { key: "low", label: "Monitoring", color: "var(--teal)", test: (c: number) => c < 0.5 },
] as const;

export function DecisionsPanel({ asTenant = null }: { asTenant?: string | null }) {
  const readOnly = Boolean(asTenant);
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [outcomeDrafts, setOutcomeDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    apiFetch<Decision[]>(withTenant("/decisions", asTenant))
      .then(setDecisions)
      .catch((e) => {
        // A customer shouldn't see an internal "API not deployed" error —
        // that reads the same as "nothing here yet" from their side.
        console.error("Failed to load decisions:", e);
        setDecisions([]);
      });
  }, [asTenant]);

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

  const stats = useMemo(() => {
    if (!decisions) return null;
    const open = decisions.filter((d) => d.status === "open");
    const needsAttention = open.filter((d) => d.confidence >= 0.8).length;
    const exposure = open.reduce((sum, d) => sum + (Number(d.evidence.lost_revenue_if_no_action) || 0), 0);
    const reorderCost = open.reduce((sum, d) => sum + (Number(d.evidence.reorder_cost) || 0), 0);
    return { openCount: open.length, needsAttention, exposure, reorderCost };
  }, [decisions]);

  if (decisions === null) return <p className="text-sm text-[var(--bone-dim)]">Loading…</p>;
  if (decisions.length === 0) return <EmptyState />;

  const open = decisions.filter((d) => d.status === "open");
  const resolved = decisions.filter((d) => d.status !== "open");

  const cardProps = { readOnly, busyId, outcomeDrafts, setOutcomeDrafts, review, submitOutcome };

  return (
    <div>
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Open decisions" value={String(stats.openCount)} />
          <StatTile label="Needs attention" value={String(stats.needsAttention)} color="var(--orange)" />
          <StatTile label="Exposure flagged" value={money(stats.exposure)} color="var(--amber)" />
          <StatTile label="Reorder cost surfaced" value={money(stats.reorderCost)} color="var(--teal)" />
        </div>
      )}

      {BANDS.map((band) => {
        const items = open.filter((d) => band.test(d.confidence));
        if (items.length === 0) return null;
        return (
          <div key={band.key} className="mb-7">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-sm" style={{ background: band.color }} aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--bone-dim)]">{band.label}</p>
            </div>
            <div className="space-y-3">
              {items.map((d) => (
                <DecisionCard key={d.decision_id} d={d} {...cardProps} />
              ))}
            </div>
          </div>
        );
      })}

      {resolved.length > 0 && (
        <div>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--bone-dim)]">History</p>
          <div className="space-y-3">
            {resolved.map((d) => (
              <DecisionCard key={d.decision_id} d={d} {...cardProps} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
