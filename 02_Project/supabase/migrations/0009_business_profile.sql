-- Business profile, collected right after Terms acceptance and before an
-- account reaches "pending" — this is what an admin actually needs to judge
-- an access request (what the business is, what problem they have), not
-- just an email address and a timestamp.
--
-- One row per user_account (1:1), same pattern as accept_terms in
-- 0007_onboarding_support.sql: no direct client INSERT/UPDATE policy at all.
-- Submission goes through a narrow SECURITY DEFINER RPC that can only ever
-- touch the caller's own row, consistent with "never let a client write
-- directly to an account-adjacent table" (CLAUDE.md controlled service
-- layer principle).
--
-- business_type options mirror the target segments in CLAUDE.md ("Target
-- customer") exactly — keep these two lists in sync if either changes.

create table business_profile (
  user_id           uuid primary key references user_account(user_id) on delete cascade,
  business_name     text not null,
  business_type     text not null check (business_type in (
    'ecommerce',
    'distributor',
    'manufacturer',
    'retail_chain',
    'import_export',
    'other'
  )),
  what_you_do       text not null,
  team_size         text not null check (team_size in ('1-5', '6-20', '21-50', '51+')),
  primary_challenge text not null,
  country           text,
  website           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table business_profile enable row level security;

create policy "user can read own business profile"
  on business_profile for select
  using (auth.uid() = user_id);

create policy "admin can read all business profiles"
  on business_profile for select
  using (public.is_admin());

-- Upserts the caller's own profile only — business_type/team_size are
-- validated by the table's check constraints, so a bad value fails loudly
-- here rather than being silently stored.
create function public.submit_business_profile(
  p_business_name     text,
  p_business_type     text,
  p_what_you_do       text,
  p_team_size         text,
  p_primary_challenge text,
  p_country           text,
  p_website           text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_profile (
    user_id, business_name, business_type, what_you_do,
    team_size, primary_challenge, country, website
  )
  values (
    auth.uid(), p_business_name, p_business_type, p_what_you_do,
    p_team_size, p_primary_challenge, p_country, p_website
  )
  on conflict (user_id) do update set
    business_name     = excluded.business_name,
    business_type     = excluded.business_type,
    what_you_do       = excluded.what_you_do,
    team_size         = excluded.team_size,
    primary_challenge = excluded.primary_challenge,
    country           = excluded.country,
    website           = excluded.website,
    updated_at        = now();
end;
$$;

grant execute on function public.submit_business_profile(text, text, text, text, text, text, text) to authenticated;
