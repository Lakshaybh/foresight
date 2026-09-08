"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm({ onClose }: { onClose?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError("Invalid credentials.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div className="space-y-1 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--bone-dim)]">
          Restricted
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--bone)]">
          Admin sign-in
        </h1>
      </div>

      <div className="space-y-2.5">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)]/[0.03] px-3.5 py-2.5 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--bone)]/30 focus:ring-1 focus:ring-[var(--bone)]/20"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)]/[0.03] px-3.5 py-2.5 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--bone)]/30 focus:ring-1 focus:ring-[var(--bone)]/20"
        />
      </div>

      {error && <p className="text-center text-xs text-[var(--orange)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)]/[0.05] py-2.5 text-sm font-medium text-[var(--bone)] transition-all duration-300 hover:bg-[var(--bone)]/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="block w-full text-center text-xs text-[var(--bone-dim)] hover:text-[var(--bone)]"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
