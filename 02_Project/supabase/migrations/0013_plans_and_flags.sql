-- Foundation for a real pricing model, not a pricing model itself — a plan
-- name and a small set of per-tenant feature toggles an admin can set,
-- enforced nowhere yet beyond being visible and real. Building the actual
-- gating logic is deliberately deferred until there's a real plan
-- structure to gate against; this just makes the data honest and present.

alter table user_account add column plan text not null default 'trial'
  check (plan in ('trial', 'starter', 'growth', 'enterprise'));
alter table user_account add column feature_flags jsonb not null default '{}'::jsonb;

create function public.admin_set_plan(p_user_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can set a plan';
  end if;
  if p_plan not in ('trial', 'starter', 'growth', 'enterprise') then
    raise exception 'Invalid plan: %', p_plan;
  end if;

  update public.user_account set plan = p_plan where user_id = p_user_id;
  perform public.log_admin_action('set_plan', p_user_id, jsonb_build_object('plan', p_plan));
end;
$$;

grant execute on function public.admin_set_plan(uuid, text) to authenticated;

create function public.admin_set_feature_flags(p_user_id uuid, p_flags jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can set feature flags';
  end if;

  update public.user_account set feature_flags = p_flags where user_id = p_user_id;
  perform public.log_admin_action('set_feature_flags', p_user_id, p_flags);
end;
$$;

grant execute on function public.admin_set_feature_flags(uuid, jsonb) to authenticated;
