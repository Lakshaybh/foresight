-- Lets an admin approve/reject a pending account directly through Supabase
-- (RLS-enforced, not a client-trusted check) — simpler and just as safe as
-- routing this through the backend, since Postgres itself enforces
-- is_admin() on every attempt, not the client.

create policy "admin can update account status"
  on user_account for update
  using (public.is_admin())
  with check (public.is_admin());
