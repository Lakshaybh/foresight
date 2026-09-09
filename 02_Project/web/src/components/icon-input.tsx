// Same field chrome everywhere it's used (login, onboarding) — a leading
// icon so a row of inputs reads at a glance instead of all looking
// identical. Shared so the two auth-adjacent flows don't drift apart.
export const fieldClass =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--bone-dim)] focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20";

export function IconInput({
  icon,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--bone-dim)]">{icon}</span>
      <input {...props} className={`${fieldClass} pl-11 ${className}`} />
    </div>
  );
}
