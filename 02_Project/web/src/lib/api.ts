import { createClient } from "@/lib/supabase/client";

// Base URL of the FastAPI decision-intelligence service. Not set until
// that service is actually deployed somewhere (Railway/Render/Fly, etc.) —
// until then, calls here fail loudly rather than silently doing nothing.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

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

// Admin support/debugging: appends ?as_tenant=<id> so a read endpoint
// returns another tenant's data — enforced server-side (require the
// caller to actually be an admin), this is just the URL plumbing.
export function withTenant(path: string, asTenant: string | null): string {
  if (!asTenant) return path;
  return `${path}${path.includes("?") ? "&" : "?"}as_tenant=${asTenant}`;
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

// Separate from apiFetch because a file upload must NOT set its own
// Content-Type — the browser needs to set it (with the multipart
// boundary) itself when the body is a FormData.
export async function apiUpload<T>(path: string, file: File): Promise<T> {
  if (!API_BASE_URL) throw new ApiNotConfiguredError();

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
