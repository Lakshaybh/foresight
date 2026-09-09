-- Lets a user tell the admin which plan they want, separately from
-- user_account.plan (the ADMIN-controlled active plan, only settable via
-- admin_set_plan). Two different facts: what the user is asking for, and
-- what they're actually granted — conflating them would let a client
-- write its own entitlement, which CLAUDE.md's controlled-service-layer
-- rule forbids.
--
-- Reused for two moments in the product: the first plan choice made during
-- onboarding, and a renewal request made from /access-expired once access
-- has lapsed — both are just "the user's current plan ask," so one column
-- and one self-service RPC cover both.

alter table user_account add column requested_plan text
  check (requested_plan in ('starter', 'growth', 'enterprise'));

create function public.submit_requested_plan(p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_plan not in ('starter', 'growth', 'enterprise') then
    raise exception 'Invalid plan: %', p_plan;
  end if;

  update public.user_account set requested_plan = p_plan where user_id = auth.uid();
end;
$$;

grant execute on function public.submit_requested_plan(text) to authenticated;
