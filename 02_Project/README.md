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
- [x] Gated onboarding — homepage, login (Google/LinkedIn/Email + separate
  Admin Login), T&C acceptance, pending-approval gate, and an admin
  approve/reject screen. Enforced by `src/proxy.ts` (route protection) and
  Supabase RLS (`is_admin()`), not client-trusted checks. See "Remaining
  setup" below for what's not wired yet.
- [x] Homepage v2 — cinematic dark "command center" rebuild: GSAP + Lenis
  smooth scroll, scroll-triggered reveals, scramble-text hero subtitle, a
  canvas particle atmosphere. Teal/amber/orange palette mirrors the
  decision catalog's own severity language (normal/monitor/escalate), not
  arbitrary color choice. Scoped to `.marketing-dark` in `globals.css` —
  the authenticated app keeps its light theme.
- [x] Homepage v3 — copy rewritten as a direct, second-person pitch instead
  of a feature description; added a real CSS 3D-transformed pipeline
  flowchart (`Flow3D`) with mouse-parallax tilt, showing the actual 6-step
  running pipeline rather than a flat marketing diagram.

## Remaining setup for onboarding to fully work

- **Google OAuth**: create an OAuth app in Google Cloud Console, add the
  client ID/secret to Supabase (Authentication -> Providers -> Google).
- **LinkedIn OAuth**: create an app in the LinkedIn Developer Portal, add
  credentials to Supabase (Authentication -> Providers -> LinkedIn (OIDC)).
- **Email**: works out of the box via Supabase's default email provider for
  magic links; swap in Brevo as the SMTP provider (Authentication -> Emails
  -> SMTP Settings) when ready for real deliverability.
- **First admin account**: sign up once via the app (creates a pending
  `user_account` row), then manually set that row's `role='admin',
  status='approved'` directly in Supabase — there's no self-service way to
  become an admin, by design.
- [ ] Gated onboarding (homepage, login, admin approval)
- [ ] Human review UI (approve/reject/snooze a decision) and outcome tracking
