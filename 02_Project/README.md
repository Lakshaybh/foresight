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
- [x] DataCo CSV ingestion script (dry-run verified against the real file)
- [ ] Synthetic supplier/inventory/purchase-order layer
- [ ] Detection, forecasting, decision engine
- [ ] Gated onboarding (homepage, login, admin approval)
