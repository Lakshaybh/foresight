import { createClient } from "@/lib/supabase/client";

// Base URL of the FastAPI decision-intelligence service. Not set until
// that service is actually deployed somewhere (Railway/Render/Fly, etc.) —
// until then, calls here fail loudly rather than silently doing nothing.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiNotConfiguredError extends Error {
  constructor() {
    super("NEXT_PUBLIC_API_URL is not set — the decision-intelligence API isn't deployed yet.");
    this.name = "ApiNotConfiguredError";
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new ApiNotConfiguredError();

  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
