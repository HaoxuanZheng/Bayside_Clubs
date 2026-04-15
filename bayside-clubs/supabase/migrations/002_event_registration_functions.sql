-- Functions to serialize event registrations and prevent oversubscription.

create or replace function public.register_for_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_capacity integer;
  v_is_published boolean;
  v_confirmed_count integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select capacity, is_published
    into v_capacity, v_is_published
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  if not v_is_published then
    raise exception 'Event is not published';
  end if;

  if exists (
    select 1
    from public.registrations
    where event_id = p_event_id
      and user_id = v_user_id
      and status = 'confirmed'
  ) then
    raise exception 'Already registered';
  end if;

  select count(*)
    into v_confirmed_count
  from public.registrations
  where event_id = p_event_id
    and status = 'confirmed';

  if v_capacity is not null and v_confirmed_count >= v_capacity then
    raise exception 'Event is full';
  end if;

  insert into public.registrations (event_id, user_id, status)
  values (p_event_id, v_user_id, 'confirmed');

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.cancel_registration(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id
    into v_registration_id
  from public.registrations
  where event_id = p_event_id
    and user_id = v_user_id
    and status = 'confirmed'
  for update;

  if not found then
    raise exception 'You are not registered';
  end if;

  update public.registrations
  set status = 'cancelled'
  where id = v_registration_id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.register_for_event(uuid) to authenticated;
grant execute on function public.cancel_registration(uuid) to authenticated;
