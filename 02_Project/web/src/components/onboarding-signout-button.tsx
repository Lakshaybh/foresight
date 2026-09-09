"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Distinct from the other sign-out buttons: goes to the public homepage,
// not /login — someone bailing out mid-onboarding hasn't necessarily
// decided to sign back in right away, so dropping them straight back on
// another sign-in screen would be pushy. Red because signing out here
// abandons whatever progress was made on the form.
export function OnboardingSignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20"
    >
      Log out
    </button>
  );
}
