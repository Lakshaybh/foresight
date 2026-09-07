# Foresight — Project

Development has started. This is the buildable project — the only thing tracked in
the GitHub repo.

## Structure

- `web/` — Next.js + TypeScript frontend (Tailwind, shadcn/ui, Supabase client)
- `api/` — FastAPI backend (health check only so far — real endpoints come with the
  data pipeline)

## Running locally

**Frontend:**
```bash
cd web
npm install
npm run dev
```
Runs at http://localhost:3000. Needs `web/.env.local` — copy `web/.env.example` and
fill in your Supabase project URL and publishable key.

**Backend:**
```bash
cd api
python -m venv .venv
./.venv/Scripts/activate   # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Runs at http://localhost:8000. Health check: `GET /health`. Needs `api/.env` — copy
`api/.env.example` and fill in the same Supabase values, plus `DATABASE_URL`
(Supabase dashboard -> Project Settings -> Database -> Connection string) if you're
running the ingestion scripts.

## Data

The real dataset (DataCo Smart Supply Chain) is not committed to git — it's a large,
third-party-licensed file. Fetch it yourself:

```bash
mkdir -p data/raw
curl -sL -o data/raw/DataCoSupplyChainDataset.csv \
  https://raw.githubusercontent.com/ashishpatel26/DataCo-SMART-SUPPLY-CHAIN-FOR-BIG-DATA-ANALYSIS/main/DataCoSupplyChainDataset.csv
```

Then, from `api/` with the venv active:
```bash
python scripts/ingest_dataco.py --dry-run   # verify transform, no DB writes
python scripts/ingest_dataco.py             # actually load into Postgres
```

## Status

- [x] Next.js app scaffolded, builds cleanly, Supabase client wired
- [x] FastAPI backend scaffolded, health endpoint verified working
- [x] Postgres schema (from `../01_Documents/Entities_KPIs_Decision_Catalog.md`)
- [x] DataCo CSV ingestion script — loaded live into Postgres and verified: 51
  categories, 11 departments, 20,652 customers, 118 products, 65,752 orders,
  180,519 order items, zero orphaned foreign keys
- [x] Synthetic supplier/inventory/purchase-order layer — rebuilt with a real
  stock-responsive (order-up-to-level) reorder policy after finding the first
  version let inventory balloon unrealistically. 5 warehouses, 131 suppliers,
  ~7,000 purchase orders, 19,116 inventory snapshots (see
  `scripts/generate_synthetic.py`).
- [x] Detection engine — supplier lead-time drift (modified z-score baseline).
  **6/6 engineered drift suppliers detected, zero false positives** (exact
  set match, verified). Live at `GET /signals` and
  `POST /signals/detect/supplier-lead-time`.
- [x] Forecast engine — stockout risk, using each product's supplier's
  detected drift as a direct input. Live at `GET /forecast/stockout-risk` and
  `POST /forecast/detect`.
- [x] Decision engine — maps every signal to one of the 5 catalog actions with
  evidence and confidence. Verified live end-to-end: 17 signals -> 17
  decisions (6 escalate_supplier at confidence 0.49-1.0, 11 reorder_now),
  idempotent re-run created 0 duplicates. Live at `GET /decisions` and
  `POST /decisions/run`.
- [ ] Gated onboarding (homepage, login, admin approval)
- [ ] Human review UI (approve/reject/snooze a decision) and outcome tracking
