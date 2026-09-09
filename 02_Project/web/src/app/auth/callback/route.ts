import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Handles the redirect back from OAuth (Google/LinkedIn), email magic-link
// sign-in, and password-recovery links — all use the PKCE `code` exchange.
// Supabase tags a recovery link with `type=recovery` so it can be routed to
// the reset-password form instead of the normal onboarding path.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      // Terms are now agreed to via the checkbox on /login, before this
      // sign-in was even initiated — record that acceptance the moment we
      // have a real authenticated user to attach it to, rather than making
      // them tick the same box again as a separate onboarding step.
      await supabase.rpc("accept_terms");
      // proxy.ts will forward on to /pending as needed once this step is
      // done — this is just the correct first stop for anyone new.
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
