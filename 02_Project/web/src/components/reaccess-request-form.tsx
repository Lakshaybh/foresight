"use client";

import { useState } from "react";
import { apiFetch, ApiNotConfiguredError } from "@/lib/api";

const PLANS = [
  { value: "starter", label: "Starter", price: "$20/mo" },
  { value: "growth", label: "Growth", price: "$100/mo" },
  { value: "enterprise", label: "Enterprise", price: "$200/mo" },
];

const ADMIN_EMAIL = "lakshaymsharma@gmail.com";

// Real server-side send (via the FastAPI /access/request-reaccess endpoint,
// which emails the admin over the same Brevo SMTP already used for urgent
// alerts) — not just a mailto: link that only opens the user's own mail
// client. Falls back to mailto: only if the API truly isn't reachable.
export function ReaccessRequestForm({ userEmail }: { userEmail: string | undefined }) {
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const subject = "Foresight — renewing my access";
  const body = `Hi,\n\nMy access has expired and I'd like to renew my subscription${plan ? ` (${plan} plan)` : ""}.\n\nAccount email: ${userEmail ?? ""}\n`;
  const mailtoHref = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  async function send() {
    if (!plan) return;
    setStatus("sending");
    try {
      await apiFetch("/access/request-reaccess", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      setStatus("sent");
    } catch (e) {
      setStatus(e instanceof ApiNotConfiguredError ? "error" : "error");
    }
  }

  return (
    <div className="space-y-3 text-left">
      <div>
        <p className="mb-1.5 text-center text-xs font-medium uppercase tracking-wide text-[var(--bone-dim)]">
          Which plan would you like next month?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlan(p.value)}
              className={`rounded-lg border px-2 py-2 text-center transition-all duration-300 ${
                plan === p.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--line)] hover:border-[var(--bone)]/30"
              }`}
            >
              <p className="text-xs font-medium text-[var(--bone)]">{p.label}</p>
              <p className="text-[10px] text-[var(--bone-dim)]">{p.price}</p>
            </button>
          ))}
        </div>
      </div>

      {status === "sent" ? (
        <p className="rounded-lg bg-[var(--teal)]/10 py-2.5 text-center text-sm text-[var(--teal)]">
          Request sent — you&apos;ll hear back once it&apos;s reviewed.
        </p>
      ) : (
        <button
          type="button"
          onClick={send}
          disabled={!plan || status === "sending"}
          className="block w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send renewal request"}
        </button>
      )}

      {status === "error" && (
        <p className="text-center text-xs text-[var(--orange)]">
          Couldn&apos;t send that automatically —{" "}
          <a href={mailtoHref} className="underline underline-offset-2">
            email {ADMIN_EMAIL} instead
          </a>
          .
        </p>
      )}
    </div>
  );
}
