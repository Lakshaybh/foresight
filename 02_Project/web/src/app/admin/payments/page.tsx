import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

// Auth is already guaranteed by admin/layout.tsx — no need to re-check here.
export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const [{ data: payments }, { data: accounts }] = await Promise.all([
    supabase
      .from("payment_log")
      .select("payment_id, user_id, amount, currency, duration_days, note, granted_by_user_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_account").select("user_id, email"),
  ]);

  const emailByUserId = new Map((accounts ?? []).map((a) => [a.user_id, a.email]));

  return (
    <>
      <PageHeader title="Payments" />
      <p className="mb-4 text-sm text-[var(--bone-dim)]">
        Every manually recorded payment, newest first — the audit trail behind each access grant.
      </p>

      {!payments || payments.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--bone-dim)]">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-[var(--line)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[11px] uppercase tracking-wide text-[var(--bone-dim)]">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium">Granted by</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.payment_id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 text-[var(--bone)]">{emailByUserId.get(p.user_id) ?? p.user_id}</td>
                  <td className="px-4 py-3 text-[var(--bone)]">
                    {p.amount != null ? `${p.currency} ${Number(p.amount).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--bone-dim)]">{p.duration_days} days</td>
                  <td className="px-4 py-3 text-[var(--bone-dim)]">{p.note || "—"}</td>
                  <td className="px-4 py-3 text-[var(--bone-dim)]">{emailByUserId.get(p.granted_by_user_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--bone-dim)]">
                    {new Date(p.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
