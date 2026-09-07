"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Account = {
  user_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  terms_accepted_at: string | null;
};

export function AdminUserList({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  async function setStatus(userId: string, status: "approved" | "rejected") {
    setBusyId(userId);
    const { error } = await supabase.from("user_account").update({ status }).eq("user_id", userId);
    setBusyId(null);
    if (!error) {
      setAccounts((prev) => prev.map((a) => (a.user_id === userId ? { ...a, status } : a)));
    }
  }

  if (accounts.length === 0) {
    return <p className="mt-8 text-sm text-muted-foreground">No accounts yet.</p>;
  }

  return (
    <div className="mt-6 divide-y divide-border rounded-md border border-border">
      {accounts.map((a) => (
        <div key={a.user_id} className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium">{a.email}</p>
            <p className="text-xs text-muted-foreground">
              {a.role} · {a.status}
              {!a.terms_accepted_at && " · T&C not yet accepted"}
            </p>
          </div>
          {a.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busyId === a.user_id}
                onClick={() => setStatus(a.user_id, "approved")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === a.user_id}
                onClick={() => setStatus(a.user_id, "rejected")}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
