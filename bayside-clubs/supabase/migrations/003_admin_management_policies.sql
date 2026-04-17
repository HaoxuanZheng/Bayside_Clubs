-- Admin management extensions:
-- 1) soft-deactivation flag on profiles
-- 2) RLS policies required for admin workflows

alter table public.profiles
  add column if not exists is_active boolean not null default true;

create policy if not exists profiles_update_admin
  on public.profiles for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  )
  with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy if not exists memberships_insert_global_admin
  on public.memberships for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy if not exists memberships_update_admins
  on public.memberships for update
  using (
    exists (
      select 1
      from public.memberships m
      where m.club_id = public.memberships.club_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.club_id = public.memberships.club_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy if not exists events_delete_club_admin
  on public.events for delete
  using (
    exists (
      select 1
      from public.memberships m
      where m.club_id = public.events.club_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

