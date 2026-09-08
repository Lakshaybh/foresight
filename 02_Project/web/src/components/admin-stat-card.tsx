export function AdminStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--void-2)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--bone)]">{value}</p>
    </div>
  );
}
