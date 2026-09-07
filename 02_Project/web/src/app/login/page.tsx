"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const supabase = createClient();

  async function signInWithProvider(provider: "google" | "linkedin_oidc") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to Foresight</h1>
          <p className="text-sm text-muted-foreground">
            New accounts are reviewed before access is granted.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => signInWithProvider("google")}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => signInWithProvider("linkedin_oidc")}
          >
            Continue with LinkedIn
          </Button>

          {!showEmailForm ? (
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => setShowEmailForm(true)}
            >
              Continue with Email
            </Button>
          ) : (
            <form onSubmit={sendMagicLink} className="space-y-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" className="w-full" disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Send magic link"}
              </Button>
              {status === "sent" && (
                <p className="text-sm text-muted-foreground">
                  Check your email for a sign-in link.
                </p>
              )}
              {status === "error" && (
                <p className="text-sm text-destructive">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <Link
        href="/login/admin"
        className="absolute bottom-4 right-4 text-xs text-muted-foreground hover:text-foreground"
      >
        Admin Login
      </Link>
    </main>
  );
}
