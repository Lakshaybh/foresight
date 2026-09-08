import Link from "next/link";
import { AdminLoginForm } from "@/components/marketing/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="marketing-dark relative min-h-screen bg-[var(--void)] font-[family-name:var(--font-display)]">
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[320px] space-y-5">
          <AdminLoginForm />
          <div className="text-center">
            <Link href="/login" className="text-xs text-[var(--bone-dim)] hover:text-[var(--bone)]">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
