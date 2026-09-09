import Link from "next/link";

export function ImpersonationBanner({ email }: { email: string | null }) {
  if (!email) return null;
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-[var(--amber)]/30 bg-[var(--amber)]/10 px-4 py-2.5 text-sm">
      <span className="text-[var(--amber)]">
        Viewing as <strong>{email}</strong> — this is their data, not yours.
      </span>
      <Link href="/admin" className="font-medium text-[var(--bone)] hover:underline">
        Exit
      </Link>
    </div>
  );
}
