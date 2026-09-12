import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { DecisionsPanel } from "@/components/decisions-panel";
import { ImpersonationBanner } from "@/components/impersonation-banner";

// Auth is already guaranteed by dashboard/layout.tsx (which redirects to
// /login before this page ever renders) — no need to re-check here.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ as_tenant?: string; tenant_email?: string }>;
}) {
  const { as_tenant, tenant_email } = await searchParams;

  return (
    <>
      <PageHeader
        title="Overview"
        actions={
          !as_tenant && (
            <Link
              href="/dashboard/upload"
              className="rounded-[6px] border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05]"
            >
              Connect / update data
            </Link>
          )
        }
      />
      <ImpersonationBanner email={tenant_email ?? null} />
      <DecisionsPanel asTenant={as_tenant ?? null} />
    </>
  );
}
