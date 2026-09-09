"use client";

import { useEffect, useState } from "react";
import { TermsContent } from "@/components/terms-content";

// Opens a read-only preview of the terms — not the accept-terms flow
// (acceptance now happens via the login checkbox, recorded server-side
// right after auth), just letting anyone read them. `trigger` lets callers
// supply their own clickable element (e.g. an inline underlined word inside
// a sentence); defaults to a small standalone pill button.
export function TermsModal({ trigger }: { trigger?: (open: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    // Lock background scroll while the modal is open so the page can't
    // shift underneath it — without this it was possible to scroll the
    // page behind the overlay, which read as the modal "jumping back" to
    // whatever was at the top of the scroll position (the sticky nav).
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-[var(--line)] bg-[var(--void-2)] px-3 py-1.5 text-xs font-medium text-[var(--bone-dim)] transition-all hover:border-[var(--accent)]/30 hover:text-[var(--bone)]"
        >
          Terms &amp; Conditions
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-16 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Terms and Conditions"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full w-full max-w-lg overflow-hidden rounded-2xl bg-[var(--void-2)] text-left font-[family-name:var(--font-display)] not-italic normal-case shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
              <h2 className="text-sm font-semibold text-[var(--bone)]">Terms &amp; Conditions</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--bone-dim)] transition-colors hover:bg-[var(--bone)]/[0.06] hover:text-[var(--bone)]"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <TermsContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
