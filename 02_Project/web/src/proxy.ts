import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Public: no session required at all.
const PUBLIC_PATHS = new Set(["/", "/login", "/auth/callback"]);

// Verifies the session's JWT signature locally against Supabase's public
// JWKS (same asymmetric-key trust used by the FastAPI backend's own
// get_current_user_id, see api/app/auth.py) instead of calling
// supabase.auth.getUser(), which round-trips to Supabase's Auth server on
// every single request. createRemoteJWKSet caches the public keys across
// invocations, so this becomes a real network call only occasionally
// (cache miss / key rotation), not on every navigation — the actual fix
// for the multi-hundred-ms lag between pages this middleware runs on.
const jwks = createRemoteJWKSet(new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

async function verifiedUserId(accessToken: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(accessToken, jwks, {
      issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // The homepage never gates on auth state either way, so there's nothing
  // for this proxy to decide here — skip it outright rather than paying a
  // real network round trip to Supabase's Auth server on every visit.
  if (path === "/") {
    return NextResponse.next({ request });
  }

  // A Supabase session cookie is only ever set after a real sign-in, so its
  // absence means "definitely not authenticated" with zero ambiguity — no
  // need to ask Supabase to confirm that over the network. This is the
  // common case for anonymous visitors (e.g. clicking "Request access"),
  // and skipping the round trip here is what actually fixes the multi-second
  // lag on every navigation, not a build/npm issue.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasAuthCookie) {
    if (!PUBLIC_PATHS.has(path)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({ request });
  }

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

  // getSession() reads the already-parsed cookie with no network call;
  // jwtVerify above supplies the cryptographic proof that getUser() would
  // otherwise fetch from Supabase's server on every request.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session ? await verifiedUserId(session.access_token) : null;

  // Setting a new password is orthogonal to onboarding status — a recovery
  // link creates a session before terms/approval have anything to say about
  // it, so this path is exempt from every gate below. No session at all
  // means the link was invalid/expired; send them to log in normally.
  if (path === "/auth/reset-password") {
    return userId ? response : NextResponse.redirect(new URL("/login", request.url));
  }

  if (!userId) {
    if (!PUBLIC_PATHS.has(path)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Authenticated from here on — look up their gating status. Onboarding
  // order is: business profile -> terms acceptance -> admin approval, so a
  // brand-new sign-in always meets the "tell us about your business" form
  // before anything else, per the product's own onboarding sequence.
  const [{ data: account }, { data: profile }] = await Promise.all([
    supabase
      .from("user_account")
      .select("role, status, terms_accepted_at, access_expires_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("business_profile").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  // The signup trigger runs synchronously on auth.users insert, but be
  // defensive: no row yet reads the same as "not started onboarding."
  const role = account?.role ?? "user";
  const status = account?.status ?? "pending";
  const termsAccepted = Boolean(account?.terms_accepted_at);
  const hasProfile = Boolean(profile);
  const isApprovedAdmin = role === "admin" && status === "approved";
  const homePath = isApprovedAdmin ? "/admin" : "/dashboard";
  // An admin is the platform operator, not a customer — they never fill
  // out a business-profile form about themselves. Only a regular account
  // needs to clear the full onboarding funnel before counting as approved.
  const isFullyApproved = isApprovedAdmin || (hasProfile && termsAccepted && status === "approved");

  // No access_expires_at at all means unlimited (an account approved
  // without a time-limited grant); admins are never subject to this.
  const isExpired =
    !isApprovedAdmin && Boolean(account?.access_expires_at) && new Date(account!.access_expires_at!) < new Date();

  // Where someone who isn't fully onboarded/approved yet belongs. Terms are
  // accepted at login (see auth/callback), not as a separate onboarding
  // step — termsAccepted is still checked in isFullyApproved above as a
  // real safety net, it just never routes anyone here directly anymore.
  const nextStep = !hasProfile ? "/onboarding" : "/pending";

  if (path === "/login") {
    return NextResponse.redirect(new URL(isExpired ? "/access-expired" : isFullyApproved ? homePath : nextStep, request.url));
  }

  if (isFullyApproved && isExpired) {
    if (path !== "/access-expired") {
      return NextResponse.redirect(new URL("/access-expired", request.url));
    }
    return response;
  }

  if (!isFullyApproved) {
    if (path !== nextStep) {
      return NextResponse.redirect(new URL(nextStep, request.url));
    }
    return response;
  }

  // Fully onboarded, approved, and not expired from here on.
  if (path === "/onboarding" || path === "/pending" || path === "/access-expired") {
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  if (path.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
