import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public: no session required at all.
const PUBLIC_PATHS = new Set(["/", "/login", "/auth/callback"]);

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

  // Authenticated from here on — look up their gating status. Onboarding
  // order is: business profile -> terms acceptance -> admin approval, so a
  // brand-new sign-in always meets the "tell us about your business" form
  // before anything else, per the product's own onboarding sequence.
  const [{ data: account }, { data: profile }] = await Promise.all([
    supabase.from("user_account").select("role, status, terms_accepted_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("business_profile").select("user_id").eq("user_id", user.id).maybeSingle(),
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

  // Where someone who isn't fully onboarded/approved yet belongs, in order.
  const nextStep = !hasProfile ? "/onboarding" : !termsAccepted ? "/terms" : "/pending";

  if (path === "/login") {
    return NextResponse.redirect(new URL(isFullyApproved ? homePath : nextStep, request.url));
  }

  if (!isFullyApproved) {
    if (path !== nextStep) {
      return NextResponse.redirect(new URL(nextStep, request.url));
    }
    return response;
  }

  // Fully onboarded and approved from here on.
  if (path === "/onboarding" || path === "/terms" || path === "/pending") {
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
