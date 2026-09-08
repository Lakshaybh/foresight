import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminNav } from "@/components/admin-nav";

const ACTION_LABELS: Record<string, string> = {
  approved: "Approved account",
  rejected: "Rejected account",
  grant_access: "Granted access",
  revoke_access: "Revoked access",
  set_admin_notes: "Updated notes",
};

export default async function AdminAuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: logs }, { data: accounts }] = await Promise.all([
    supabase
      .from("admin_audit_log")
      .select("log_id, action, target_user_id, performed_by_user_id, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("user_account").select("user_id, email"),
  ]);

  const emailByUserId = new Map((accounts ?? []).map((a) => [a.user_id, a.email]));

  return (
    <AppShell title="Command Center" email={user.email}>
      <AdminNav />

      <p className="mb-4 text-sm text-[var(--bone-dim)]">
        Every admin action, newest first — most recent 200.
      </p>

      {!logs || logs.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--bone-dim)]">No admin actions recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.log_id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--void-2)] px-4 py-3">
              <div>
                <p className="text-sm text-[var(--bone)]">
                  <span className="font-medium">{emailByUserId.get(l.performed_by_user_id) ?? "unknown"}</span>{" "}
                  {ACTION_LABELS[l.action] ?? l.action} for{" "}
                  <span className="font-medium">{emailByUserId.get(l.target_user_id) ?? l.target_user_id}</span>
                </p>
                {l.detail && (
                  <p className="mt-0.5 text-xs text-[var(--bone-dim)]">
                    {Object.entries(l.detail as Record<string, unknown>)
                      .filter(([, v]) => v !== null && v !== undefined)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-[var(--bone-dim)]">
                {new Date(l.created_at).toLocaleString(undefined, {
                  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
