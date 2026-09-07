# FORESIGHT — Working Agreement for Claude

## What this project is

Foresight is a B2B decision-intelligence platform: it converts operational data into
early warnings, forecasts, explanations, and recommended actions. It answers five
questions in one workflow — what's happening, what changed, why, what happens next,
what should we do.

MVP wedge: supply-chain / operations early-warning intelligence. Ingest orders,
inventory, supplier performance, lead times, demand history → detect anomalies →
forecast near-term shortages/delays → explain drivers → produce a ranked, evidence-backed
action queue that a human approves.

**This is not a student project, a tutorial, or a demo to make impressive-looking.**
It is being built with the seriousness of a real product a real company could trust,
because it is directly tied to the user's career and professional growth. Every
decision should be one a professional engineering team would be willing to defend.
Full product/business context lives in
`01_Documents/Decision_Intelligence_Project_Blueprint (1).docx` — read it before making
product or architecture calls that aren't covered here.

## Folder structure

- **`01_Documents/`** — planning documents: the blueprint, the proposal & timetable.
  Source-of-truth reference material, not for editing casually.
- **`02_Project/`** — where the actual application (frontend, backend, everything
  buildable) will live once development is authorized. Empty during pre-development —
  do not scaffold it early (see Current phase below).
- **`03_Shareable/`** — polished, external-facing material safe to hand to someone
  outside the project (pitch documents, the visual overview, anything for a mentor,
  advisor, or early pilot conversation).
- **`04_What_We_Are_Building/`** — the concept/product definition itself: what the
  thing is, who it's for, why it matters. Keep this current as the product definition
  evolves; it's the fast-orientation folder for "what is this, again?"
- **`05_Daily_Log/`** — one file per work session (`Day_01.md`, `Day_02.md`, ...),
  each recording what was done that day, what's still pending, and what's next. Update
  this at the end of any session with real progress — see Working culture below.

## Daily log responsibility

At the end of a work session that makes real progress (not idle chat), add or update
the next `Day_NN.md` file in `05_Daily_Log/` with three short sections: **Did today**,
**Pending**, **Next**. Keep entries brief — a working log, not a report. Number days
sequentially regardless of calendar gaps between sessions.

## Target customer

Foresight is sold to **small, operations-heavy businesses** — not enterprises, not
solo/micro businesses. Confirmed target segments:

- Small e-commerce companies
- Small distributors
- Small manufacturers
- Small retail chains
- Trading / import-export business owners

The common thread: each depends daily on inventory and supplier timing, none can
justify enterprise software (SAP/Oracle-scale contracts and IT teams), and none have a
dedicated analyst watching the data full-time. The real problem being solved is not
"lack of data" — it's a **noticing problem**: nobody has time to watch every supplier
and every stock level every day, so early warning signs get missed until they become
an expensive surprise (a stockout, a late shipment, a shrinking margin). Every product
and design decision should be legible to this buyer: a busy owner or ops manager, not
a data scientist. Avoid enterprise jargon in-product ("decision intelligence platform")
in favor of plain language ("a daily watch on your stock and suppliers that warns you
before something goes wrong").

## MVP dataset & decision workflow (locked)

This was an open decision in earlier planning; it is now settled. Do not relitigate
without the user explicitly reopening it.

- **Dataset:** DataCo Smart Supply Chain Dataset (Kaggle) as the real backbone —
  genuine order, shipping, product, and customer data. Layered with a clearly-labeled
  **synthetic** supplier and inventory extension (DataCo has no supplier/inventory
  data natively), built to stay consistent with DataCo's real order volumes. Every
  synthetic field must be documented and tagged as such — never presented as real.
- **The one decision this MVP proves:** whether a supplier's slowing performance is
  about to cause a stockout, and what the operations manager should do about it.
  No other signal type ships until this one works end-to-end.
- Full entity list, KPI formulas, and the exact 5-item decision catalog (the only
  actions the system may ever recommend for MVP) live in
  `01_Documents/Entities_KPIs_Decision_Catalog.md` — treat that file as the working
  spec for the data and decision engine. Any new signal or action must map to that
  catalog or the catalog must be deliberately updated first, not worked around.

## Current phase

**Pre-development.** Do not scaffold the app, install dependencies, create schemas,
write API routes, or generate any application/placeholder code until the user
explicitly says development has started. Right now the job is planning documents,
architecture decisions, and this file only.

## Non-negotiable engineering principles

- **No fake functionality.** Never hardcode an analytical result, mock a model output
  as if it were real, or stub something in a way that looks finished but isn't. If
  something isn't built yet, say so plainly — don't paper over it.
- **No complexity for appearance.** Don't add a technology, pattern, or abstraction
  because it looks advanced. Every dependency and architectural layer must solve a
  real, current problem. Three similar lines beat a premature abstraction; a missing
  feature beats a fake one.
- **Baseline before advanced.** For every model (anomaly detection, forecasting, risk
  scoring), implement and show the simple baseline (z-score/IQR, seasonal naive,
  weighted rules) next to the advanced option. Only prefer the advanced model if it
  changes the actual business decision, not just a benchmark number.
- **Evidence and auditability by default.** Every recommendation the system produces
  must persist its inputs, model version, confidence, timestamp, and eventual outcome.
  Low-confidence output becomes "monitor," never false certainty.
- **Human-in-the-loop.** The system recommends; a person approves, rejects, or snoozes.
  Never let a model write directly to critical business tables — always through a
  controlled service layer.
- **Typed boundaries everywhere.** Upload → normalized table → feature table → model
  input → decision record — each transition should be typed and validated (Pydantic /
  TypeScript types), not implicit.
- **Security and correctness are not optional polish.** RBAC from day one, tenant
  isolation via `tenant_id`, idempotent ingestion, safe file upload validation, secrets
  only in untracked `.env` files with a committed `.env.example`. Don't defer these to
  "later" once the app already has real data flowing through it.

## Access model: gated, admin-approved onboarding

This is not open self-serve signup. The product uses an invite/approval gate:

- **Public homepage** (pre-login): very high-production, fancy, professional/corporate
  visual design — this is the "looks great from far away" surface. Full visual polish
  investment goes here and into the post-login command center; the backend stays simple
  and honest underneath.
- **Login page**: three regular sign-in options — Google, LinkedIn, Email — plus a
  small, visually low-key **"Admin Login"** link in the bottom-right corner. The admin
  path is a separate credential flow (not Google/LinkedIn/email signup) restricted to
  the platform manager (the user) and anyone they explicitly grant admin access to.
  Keep the Admin Login control deliberately unobtrusive — small and quiet, not a
  prominent button — this is a real security practice, not just aesthetics.
- **New user flow**: sign up via Google/LinkedIn/Email → must read and accept a Terms &
  Conditions document (explicit checkbox/acceptance, stored with timestamp) → account
  enters a **pending** state → the platform manager (admin) is notified and must
  manually approve or reject the account → only an approved account can log in and use
  the platform.
- **Manager/admin role**: a distinct role with full control over who is allowed access
  — approve, reject, revoke. This is a real authorization gate, not cosmetic; treat
  pending/approved/rejected as an actual account status enforced server-side, never a
  frontend-only check.
- Build this with Supabase Auth (OAuth providers for Google/LinkedIn, email auth) plus
  a `status` field (`pending` / `approved` / `rejected`) and a `role` field (`user` /
  `admin`) on the user/profile record — no new heavyweight auth system needed.
- **Transactional email: Brevo (brevo.com).** Used for the account-approval flow only —
  welcome/T&C-confirmation email, "pending approval" notice to the user, new-signup
  alert to the admin, and approval/rejection notice. This is a notification layer, not
  part of the core decision engine, and carries no dependency risk to the product's
  intelligence.

## Technology direction (already decided — don't relitigate without cause)

- Frontend: Next.js + TypeScript, deployed on Vercel. Tailwind + shadcn/ui.
- Data/ML services: separate Python + FastAPI service, Pydantic contracts.
- Database/auth/storage: Supabase (managed Postgres, Auth, Storage).
- Analytics: Polars + DuckDB. ML: scikit-learn, XGBoost/LightGBM where justified,
  statsmodels for forecasting, SHAP for explainability.
- **No Docker in the normal workflow.** Native Node.js + Python venv + Supabase only.
  Docker may be introduced later only if a genuine infrastructure need appears and the
  user explicitly decides to add it — never by default, never for appearances.
- **No paid AI API in the core product.** Intelligence comes from data engineering,
  statistics, and classical ML — deterministic and explainable. An optional local LLM
  layer for natural-language querying may be considered much later, but the decision
  engine must never depend on it.
- Path to AWS/GCP exists but is not adopted until real scale, compliance, or enterprise
  requirements justify it. Don't build toward hypothetical infrastructure now.

## Working culture

Behave like a senior engineering partner, not a code generator:

1. Understand the requirement before touching anything.
2. Think through architectural consequences, not just the immediate ask.
3. Choose the simplest reliable approach that meets the actual requirement.
4. Implement professionally — no half-finished paths, no unnecessary error handling
   for cases that can't occur, no speculative flags.
5. Test the behavior that matters.
6. Review before calling it done.
7. Briefly explain the reasoning behind non-obvious decisions so the user learns the
   professional judgment behind the choice — teach through the work, don't lecture.

**Push back.** If an instruction would introduce fake data, unnecessary complexity,
a security gap, or a shortcut that undermines the "evidence-first, auditable" premise
of the product, say so directly and propose the better alternative before implementing.
Don't silently comply with a decision that would weaken the product's credibility.

## Do not

- Do not start coding the application until explicitly told development has begun.
- Do not introduce Docker, Kubernetes, microservices, or cloud infra preemptively.
- Do not add AI/LLM API calls to the core decision engine.
- Do not fabricate benchmark numbers, model metrics, or demo data dressed up as real.
- Do not scope-creep the MVP beyond the one supply-chain/operations wedge defined in
  the blueprint's Compact MVP Scope (§12) until that wedge is proven.
