"use client";

import { useEffect } from "react";
import { AdminLoginForm } from "@/components/marketing/admin-login-form";

export function AdminLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
        style={{ animation: "admin-modal-fade 0.25s ease-out" }}
      />
      <div
        className="relative w-full max-w-[340px] rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        style={{ animation: "admin-modal-pop 0.25s cubic-bezier(0.32,0.72,0,1)" }}
      >
        <AdminLoginForm onClose={onClose} />
      </div>

      <style>{`
        @keyframes admin-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes admin-modal-pop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
