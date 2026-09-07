import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Handles the redirect back from both OAuth (Google/LinkedIn) and email
// magic-link sign-in — both use the PKCE `code` exchange.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/terms`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
