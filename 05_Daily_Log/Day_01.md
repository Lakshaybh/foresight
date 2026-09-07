# Day 01

## Did today
- Read the full Foresight blueprint and created `CLAUDE.md` to set engineering
  principles, tech direction, and working culture for the project.
- Reviewed the blueprint critically; researched the decision-intelligence market and
  competitors (Gartner leaders, supply-chain risk vendors) to sanity-check positioning.
- Defined the gated, admin-approved onboarding model (homepage, login page with
  Google/LinkedIn/Email + separate Admin Login, T&C acceptance, pending-approval flow)
  and added it to both the blueprint and `CLAUDE.md`.
- Confirmed Brevo as the transactional email provider for the approval flow; added to
  both documents.
- Drafted a long-form and then a shorter, casual pitch message for an experienced
  mentor/reviewer.
- Built a one-page visual project overview (problem, flow diagram, real example,
  competitive comparison, roadmap, timeline) — first as an artifact, then as a local
  HTML file, then converted to a Word document (`Foresight_Overview.docx`).
- Built `Foresight_Proposal_and_Timetable.docx` — objectives, scope, confirmed tech
  stack, a realistic 10-week timetable, milestones, and risks.
- Defined and confirmed the target customer: small e-commerce companies, small
  distributors, small manufacturers, small retail chains, and trading/import-export
  business owners. Added this to both the blueprint and `CLAUDE.md`.
- Set up the project folder structure: `01_Documents`, `02_Project`, `03_Shareable`,
  `04_What_We_Are_Building`, `05_Daily_Log`.
- Researched real dataset options (DataCo Smart Supply Chain, and several newer
  Kaggle supply-chain/inventory datasets) and rated them; recommended and locked the
  MVP dataset decision: DataCo as the real backbone + a clearly-labeled synthetic
  supplier/inventory extension.
- Locked the one MVP decision workflow: supplier-lead-time drift leading to a
  stockout, and what the ops manager should do about it.
- Wrote `01_Documents/Entities_KPIs_Decision_Catalog.md` — the full entity list,
  baseline KPI formulas, and the 5-item decision catalog (Reorder now / Escalate
  supplier / Shift to backup supplier / Review demand forecast / Monitor). Recorded
  the same lock-in, condensed, in `CLAUDE.md` and as blueprint §25.
- Discussed account strategy: one new dedicated identity for GitHub, Vercel, Supabase,
  and Brevo (not split across personal + new). Explained how to get personal GitHub
  contribution-graph credit on the new project repo via collaborator access + commit
  author email, without needing to "link" accounts (GitHub has no such feature).

## Pending
- User to create the new GitHub, Vercel, Supabase, and Brevo accounts under one
  dedicated project identity (their task, at their own pace).
- Decide notification details for the approval flow (what exactly the user sees while
  pending, what the approval email says).
- Get the pitch in front of the mentor/reviewer and bring back their feedback.

## Next
- Once the new accounts exist: create the GitHub repo, connect Vercel, create the
  Supabase project — Phase 2 / Week 2 (data foundation: upload pipeline, schema,
  Postgres) starts only after that.
- Continue to await explicit go-ahead before writing any application code in
  `02_Project/`.
