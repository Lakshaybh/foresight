-- Audit trail of admin actions — who approved/rejected/revoked/granted
-- access to whom, and when. Only matters once there's more than one admin,
-- but the log needs to start now so history isn't missing later.
--
-- Forces every account-status change through a SECURITY DEFINER RPC (never
-- a direct client UPDATE) so logging can never be silently bypassed — same
-- controlled-service-layer pattern as every other admin action so far.

create table admin_audit_log (
  log_id                uuid primary key default gen_random_uuid(),
  action                text not null,
  target_user_id        uuid not null references user_account(user_id) on delete cascade,
  performed_by_user_id  uuid not null references user_account(user_id),
  detail                jsonb,
  created_at            timestamptz not null default now()
);

alter table admin_audit_log enable row level security;

create policy "admin can read audit log"
  on admin_audit_log for select
  using (public.is_admin());

-- Internal helper, not exposed directly — called by the admin action RPCs
-- below and reused by 0010's functions via a follow-up call from the app.
create function public.log_admin_action(p_action text, p_target_user_id uuid, p_detail jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into admin_audit_log (action, target_user_id, performed_by_user_id, detail)
  values (p_action, p_target_user_id, auth.uid(), p_detail);
end;
$$;

-- Replaces the direct client UPDATE the admin panel used for approve/reject
-- — that path never logged anything and let status changes bypass every
-- other admin action's audit trail.
create function public.admin_set_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can change account status';
  end if;
  if p_status not in ('approved', 'rejected') then
    raise exception 'Invalid status: %', p_status;
  end if;

  update public.user_account set status = p_status where user_id = p_user_id;
  perform public.log_admin_action(p_status, p_user_id, null);
end;
$$;

grant execute on function public.admin_set_status(uuid, text) to authenticated;

-- The old direct-update policy let the client bypass admin_set_status (and
-- therefore the audit log) entirely — remove it now that every status
-- change has a real RPC.
drop policy if exists "admin can update account status" on user_account;

-- Redefine 0010's three functions to also log — they predate the audit
-- log, so this is a straight replace rather than a new function.
create or replace function public.grant_access(
  p_user_id uuid,
  p_duration_days integer,
  p_amount numeric,
  p_currency text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can grant access';
  end if;

  insert into public.payment_log (user_id, amount, currency, duration_days, note, granted_by_user_id)
  values (p_user_id, p_amount, p_currency, p_duration_days, p_note, auth.uid());

  update public.user_account
  set status = 'approved',
      access_expires_at = greatest(coalesce(access_expires_at, now()), now()) + (p_duration_days || ' days')::interval
  where user_id = p_user_id;

  perform public.log_admin_action(
    'grant_access', p_user_id,
    jsonb_build_object('duration_days', p_duration_days, 'amount', p_amount, 'currency', p_currency, 'note', p_note)
  );
end;
$$;

create or replace function public.revoke_access(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can revoke access';
  end if;

  update public.user_account
  set access_expires_at = now()
  where user_id = p_user_id;

  perform public.log_admin_action('revoke_access', p_user_id, null);
end;
$$;

create or replace function public.set_admin_notes(p_user_id uuid, p_notes text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can set notes';
  end if;

  update public.user_account set admin_notes = p_notes where user_id = p_user_id;
  perform public.log_admin_action('set_admin_notes', p_user_id, jsonb_build_object('notes', p_notes));
end;
$$;
