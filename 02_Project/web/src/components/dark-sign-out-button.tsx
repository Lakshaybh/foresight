"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DarkSignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--bone)] transition-colors hover:bg-[var(--bone)]/[0.05]"
    >
      Sign out
    </button>
  );
}
