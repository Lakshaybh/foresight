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
`api/.env.example` and fill in the same Supabase values.

## Status

- [x] Next.js app scaffolded, builds cleanly, Supabase client wired
- [x] FastAPI backend scaffolded, health endpoint verified working
- [ ] Postgres schema (from `../01_Documents/Entities_KPIs_Decision_Catalog.md`)
- [ ] CSV ingestion pipeline (DataCo + synthetic supplier/inventory layer)
- [ ] Detection, forecasting, decision engine
- [ ] Gated onboarding (homepage, login, admin approval)
