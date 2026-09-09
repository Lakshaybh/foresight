-- Drops the free "trial" tier — every plan is now a real paid tier.
-- Existing accounts on 'trial' (there shouldn't be any real ones yet,
-- this feature just shipped) move to 'starter' rather than being left on
-- a value the constraint no longer allows.

update user_account set plan = 'starter' where plan = 'trial';

alter table user_account drop constraint user_account_plan_check;
alter table user_account add constraint user_account_plan_check
  check (plan in ('starter', 'growth', 'enterprise'));
alter table user_account alter column plan set default 'starter';

create or replace function public.admin_set_plan(p_user_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can set a plan';
  end if;
  if p_plan not in ('starter', 'growth', 'enterprise') then
    raise exception 'Invalid plan: %', p_plan;
  end if;

  update public.user_account set plan = p_plan where user_id = p_user_id;
  perform public.log_admin_action('set_plan', p_user_id, jsonb_build_object('plan', p_plan));
end;
$$;
