"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { apiFetch, apiUpload } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

type IngestResult = { inserted: number; errors: { row: number; message: string }[] };

function UploadCard({
  title,
  description,
  columns,
  example,
  endpoint,
}: {
  title: string;
  description: string;
  columns: string[];
  example: string;
  endpoint: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiUpload<IngestResult>(endpoint, file);
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-6">
      <h2 className="text-base font-medium text-[var(--bone)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--bone-dim)]">{description}</p>

      <div className="mt-4 rounded-lg bg-[var(--bone)]/[0.03] p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Required columns</p>
        <p className="mt-1 font-mono text-xs text-[var(--bone)]">{columns.join(", ")}</p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-[var(--bone-dim)]">Example row</p>
        <p className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-[var(--bone-dim)]">{example}</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="flex-1 text-sm text-[var(--bone-dim)] file:mr-3 file:rounded-lg file:border file:border-[var(--line)] file:bg-[var(--bone)]/[0.03] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--bone)]"
        />
        <button
          onClick={upload}
          disabled={!file || busy}
          className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--void)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--orange)]">{error}</p>}

      {result && (
        <div className="mt-3 text-sm">
          <p className="text-[var(--teal)]">{result.inserted} row(s) imported.</p>
          {result.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-[var(--orange)]">{result.errors.length} row(s) had problems:</p>
              {result.errors.map((e) => (
                <p key={e.row} className="text-xs text-[var(--bone-dim)]">
                  Row {e.row}: {e.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  const [email, setEmail] = useState<string | undefined>();
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email));
  }, []);

  async function runAnalysis() {
    setRunning(true);
    setRunMessage(null);
    try {
      await apiFetch("/signals/detect/supplier-lead-time", { method: "POST" });
      await apiFetch("/forecast/detect", { method: "POST" });
      const result = await apiFetch<{ created: number }>("/decisions/run", { method: "POST" });
      setRunMessage(`Analysis complete — ${result.created} new recommendation(s). Redirecting to your dashboard…`);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e) {
      setRunMessage(`Something went wrong: ${(e as Error).message}`);
    }
    setRunning(false);
  }

  return (
    <AppShell title="Connect your data" email={email}>
      <p className="-mt-6 mb-8 text-sm text-[var(--bone-dim)]">
        Upload your suppliers/orders first, then your inventory — inventory rows reference
        products that need to already exist from the suppliers file.
      </p>

      <div className="space-y-5">
        <UploadCard
          title="1. Suppliers & purchase orders"
          description="Every order you've placed with a supplier, including whether it arrived on time."
          columns={["supplier_name", "category_name", "product_name", "unit_cost", "list_price", "order_date", "expected_delivery_date", "actual_delivery_date", "quantity_ordered"]}
          example="Acme Supplies, Electronics, USB Cable, 2.50, 6.00, 2026-06-01, 2026-06-08, 2026-06-11, 100"
          endpoint="/ingest/suppliers"
        />
        <UploadCard
          title="2. Inventory"
          description="Current stock levels for each product — used to calculate how many days until you run out."
          columns={["product_name", "warehouse_name", "snapshot_date", "stock_on_hand", "safety_stock_level", "avg_daily_demand"]}
          example="USB Cable, Main Warehouse, 2026-09-01, 120, 20, 8.5"
          endpoint="/ingest/inventory"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-wash)] p-6 text-center">
        <h2 className="text-base font-medium text-[var(--bone)]">Ready to see your signals?</h2>
        <p className="mt-1 text-sm text-[var(--bone-dim)]">
          Once your files are uploaded, run the analysis to generate your first recommendations.
        </p>
        <button
          onClick={runAnalysis}
          disabled={running}
          className="mt-4 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Running…" : "Run analysis"}
        </button>
        {runMessage && <p className="mt-3 text-sm text-[var(--bone)]">{runMessage}</p>}
      </div>
    </AppShell>
  );
}
