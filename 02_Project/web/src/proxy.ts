import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public: no session required at all.
const PUBLIC_PATHS = new Set(["/", "/login", "/login/admin", "/auth/callback"]);

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
    if (path !== "/pending") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    return response;
  }

  // Approved from here on.
  if (path === "/terms" || path === "/pending") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (path.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
