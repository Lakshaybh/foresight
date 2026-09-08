import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public: no session required at all.
const PUBLIC_PATHS = new Set(["/", "/login", "/login/admin", "/auth/callback"]);

// Supabase stamps every access token with an `amr` (authentication methods
// reference) claim recording how the session was actually established —
// "password", "oauth", "otp", etc. This is the real signal for "did this
// person come through the dedicated Admin Login form," independent of
// whatever role their row happens to carry — a Google-authenticated session
// can never satisfy this, even for an account with role = 'admin'.
function wasPasswordAuthenticated(accessToken: string | undefined): boolean {
  if (!accessToken) return false;
  try {
    const payload = accessToken.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    const amr = decoded.amr as { method: string }[] | undefined;
    return amr?.some((entry) => entry.method === "password") ?? false;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  // Setting a new password is orthogonal to onboarding status — a recovery
  // link creates a session before terms/approval have anything to say about
  // it, so this path is exempt from every gate below. No session at all
  // means the link was invalid/expired; send them to log in normally.
  if (path === "/auth/reset-password") {
    return user ? response : NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user) {
    if (!PUBLIC_PATHS.has(path)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Authenticated from here on — look up their gating status.
  const { data: account } = await supabase
    .from("user_account")
    .select("role, status, terms_accepted_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // The signup trigger runs synchronously on auth.users insert, but be
  // defensive: no row yet reads the same as "not started onboarding."
  const role = account?.role ?? "user";
  const status = account?.status ?? "pending";
  const termsAccepted = Boolean(account?.terms_accepted_at);

  if (path === "/login" || path === "/login/admin") {
    return NextResponse.redirect(new URL(termsAccepted && status === "approved" ? "/dashboard" : "/terms", request.url));
  }

  if (!termsAccepted) {
    if (path !== "/terms") {
      return NextResponse.redirect(new URL("/terms", request.url));
    }
    return response;
  }

  if (status !== "approved") {
    // The admin needs more than an email to judge a request — gate on the
    // business-profile form before an account is allowed to sit in "pending."
    const { data: profile } = await supabase
      .from("business_profile")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const hasProfile = Boolean(profile);

    if (!hasProfile) {
      if (path !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return response;
    }

    if (path !== "/pending") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    return response;
  }

  // Approved from here on.
  if (path === "/terms" || path === "/pending" || path === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (path.startsWith("/admin")) {
    // Command-center access requires BOTH the admin role AND a session that
    // was actually established through the dedicated Admin Login form —
    // an admin who signs in via Google/LinkedIn/email still only reaches
    // the normal dashboard, never /admin.
    if (role !== "admin" || !wasPasswordAuthenticated(session?.access_token)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
