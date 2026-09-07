-- Support for the gated, admin-approved onboarding flow (CLAUDE.md "Access
-- model" section / blueprint SS23).
--
-- Design choice, consistent with "never let a model write directly to
-- critical business tables without a controlled service layer" (CLAUDE.md):
-- clients never UPDATE user_account directly. A new row is created only by
-- a trigger when someone signs up; terms acceptance goes through a narrow
-- RPC that can only ever touch the caller's own row; approve/reject goes
-- through the backend API using the service-role key, never the client.

alter table user_account add column terms_accepted_at timestamptz;

-- Auto-create a pending user_account row whenever someone signs up via
-- Supabase Auth (Google, LinkedIn, or email) — SECURITY DEFINER so it can
-- write to user_account despite the caller having no direct insert grant.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_account (user_id, email, role, status)
  values (new.id, new.email, 'user', 'pending');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Lets an authenticated user accept the Terms & Conditions for themselves
-- only — never anyone else's row, and never any other column (role/status
-- are not touched here).
create function public.accept_terms()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_account
  set terms_accepted_at = now()
  where user_id = auth.uid();
end;
$$;

-- Helper used by RLS policies below — SECURITY DEFINER so checking "is this
-- caller an admin" doesn't itself recurse into the RLS it's used inside.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_account
    where user_id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

-- RLS: a user can read their own account row (to know their own status);
-- an admin can read every row (to see who's pending). No client-side
-- UPDATE/INSERT/DELETE policy exists at all — those go through the RPC
-- above or the backend service layer only.
create policy "user can read own account"
  on user_account for select
  using (auth.uid() = user_id);

create policy "admin can read all accounts"
  on user_account for select
  using (public.is_admin());

grant execute on function public.accept_terms() to authenticated;
grant execute on function public.is_admin() to authenticated;
