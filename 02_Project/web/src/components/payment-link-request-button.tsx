"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

// Lets a still-pending user nudge the admin for a payment link before
// their account is even approved — real server-side email via the FastAPI
// /access/request-payment-link endpoint, same Brevo pattern as the other
// notify flows, not a mailto: link.
export function PaymentLinkRequestButton() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    setStatus("sending");
    try {
      const res = await apiFetch<{ sent: boolean }>("/access/request-payment-link", { method: "POST" });
      setStatus(res.sent ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="rounded-lg bg-[var(--teal)]/10 py-2.5 text-center text-sm text-[var(--teal)]">
        Sent — the admin will follow up with a payment link.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={send}
        disabled={status === "sending"}
        className="block w-full rounded-lg border border-[var(--accent)]/40 py-2.5 text-sm font-medium text-[var(--accent)] transition-all duration-300 hover:bg-[var(--accent)]/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Email admin for a payment link"}
      </button>
      {status === "error" && (
        <p className="mt-1.5 text-center text-xs text-[var(--orange)]">
          Couldn&apos;t send that automatically — email{" "}
          <a href="mailto:lakshaymsharma@gmail.com" className="underline underline-offset-2">
            lakshaymsharma@gmail.com
          </a>{" "}
          directly instead.
        </p>
      )}
    </div>
  );
}
