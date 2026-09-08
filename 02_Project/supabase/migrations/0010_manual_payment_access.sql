-- Manual, off-platform payment tracking with time-limited access. Payment
-- itself happens outside the product (bank transfer, UPI, cash, whatever) —
-- this only records that it happened and translates it into an expiry the
-- app can enforce, per CLAUDE.md's "no fake functionality": we're not
-- pretending to process a payment, just giving the admin an honest way to
-- log a real one and gate access on it.
--
-- access_expires_at lives on user_account (single source of truth the
-- gate checks); payment_log is the append-only audit trail of how it got
-- there — same "controlled service layer, never a direct client write to
-- the account row's sensitive fields" pattern as 0007/0009.

alter table user_account add column access_expires_at timestamptz;
alter table user_account add column admin_notes text;

create table payment_log (
  payment_id          uuid primary key default gen_random_uuid(),
  user_id             uuid not null references user_account(user_id) on delete cascade,
  amount              numeric(12,2),
  currency            text not null default 'USD',
  duration_days       integer not null check (duration_days > 0),
  note                text,
  granted_by_user_id  uuid not null references user_account(user_id),
  created_at          timestamptz not null default now()
);

alter table payment_log enable row level security;

create policy "admin can read payment log"
  on payment_log for select
  using (public.is_admin());

-- No direct insert policy — writes only happen through grant_access()
-- below, which validates the caller is an admin itself.

-- Records a payment and extends access in one atomic step. Renewals stack
-- onto whatever time is left rather than wasting it (a renewal granted
-- before the old grant expires starts counting from the old expiry, not
-- from now). Also marks the account approved — receiving payment implies
-- the admin has decided to grant access, so this doubles as approval for
-- an account that was still pending.
create function public.grant_access(
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
end;
$$;

grant execute on function public.grant_access(uuid, integer, numeric, text, text) to authenticated;

-- Immediately cuts off access — sets the expiry to now. Kept separate from
-- rejecting a pending request: this is for taking access away from
-- someone who already had it (stopped paying, misuse), which is a
-- different real-world action with a different audit trail than a
-- same-day approve/reject decision.
create function public.revoke_access(p_user_id uuid)
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
end;
$$;

grant execute on function public.revoke_access(uuid) to authenticated;

-- Lets an admin leave a note on any account without going through the
-- broader "admin can update account status" policy for a field that isn't
-- status-related.
create function public.set_admin_notes(p_user_id uuid, p_notes text)
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
end;
$$;

grant execute on function public.set_admin_notes(uuid, text) to authenticated;
