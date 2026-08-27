-- Run after supabase/community.sql.
-- Room messages are public through the RPC below. Direct table reads stay limited
-- to authenticated Realtime subscribers so profile identity fields remain controlled.

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.community_rooms(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_messages_room_order_idx
  on public.community_messages (room_id, created_at, id)
  where deleted_at is null;

create index if not exists community_messages_user_idx
  on public.community_messages (user_id);

drop trigger if exists set_community_messages_updated_at
  on public.community_messages;
create trigger set_community_messages_updated_at
  before update on public.community_messages
  for each row execute procedure public.set_updated_at();

alter table public.community_messages enable row level security;

revoke all on table public.community_messages
  from public, anon, authenticated;
grant select on table public.community_messages
  to authenticated;

drop policy if exists "Authenticated users can receive room messages"
  on public.community_messages;
create policy "Authenticated users can receive room messages"
on public.community_messages
for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.community_rooms
    where community_rooms.id = community_messages.room_id
      and community_rooms.is_active
  )
);

drop function if exists public.list_community_messages(text);
create or replace function public.list_community_messages(
  selected_room_id text
)
returns table (
  id uuid,
  room_id text,
  profile_id uuid,
  full_name text,
  avatar_path text,
  role public.app_role,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  can_delete boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select
    community_messages.id,
    community_messages.room_id,
    profiles.id as profile_id,
    coalesce(
      nullif(trim(profiles.nickname), ''),
      nullif(trim(profiles.full_name), ''),
      'Member'
    ) as full_name,
    profiles.avatar_path,
    profiles.role,
    community_messages.body,
    community_messages.created_at,
    community_messages.updated_at,
    (
      auth.uid() = community_messages.user_id
      or coalesce(public.current_user_role() in ('admin', 'editor'), false)
    ) as can_delete
  from public.community_messages
  join public.community_rooms
    on community_rooms.id = community_messages.room_id
  join public.profiles
    on profiles.id = community_messages.user_id
  where community_messages.room_id = selected_room_id
    and community_rooms.is_active
    and community_messages.deleted_at is null
    and profiles.status = 'approved'
  order by community_messages.created_at asc, community_messages.id asc
  limit 200;
end;
$$;

drop function if exists public.create_community_message(text, text);
create or replace function public.create_community_message(
  selected_room_id text,
  message_body text
)
returns table (
  id uuid,
  room_id text,
  profile_id uuid,
  full_name text,
  avatar_path text,
  role public.app_role,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  can_delete boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  clean_body text;
  inserted_message_id uuid;
  room_is_staff_only boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_user_role() is null then
    raise exception 'Approved account required';
  end if;

  select community_rooms.is_staff_only
  into room_is_staff_only
  from public.community_rooms
  where community_rooms.id = selected_room_id
    and community_rooms.is_active
    and not community_rooms.is_locked;

  if not found then
    raise exception 'Community room not found or locked';
  end if;

  if room_is_staff_only
    and public.current_user_role() not in ('admin', 'editor')
  then
    raise exception 'Staff access required for this room';
  end if;

  clean_body := trim(coalesce(message_body, ''));

  if clean_body = '' then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(clean_body) > 1000 then
    raise exception 'Message must be 1000 characters or fewer';
  end if;

  insert into public.community_messages (room_id, user_id, body)
  values (selected_room_id, auth.uid(), clean_body)
  returning community_messages.id into inserted_message_id;

  return query
  select message_row.*
  from public.list_community_messages(selected_room_id) as message_row
  where message_row.id = inserted_message_id;
end;
$$;

drop function if exists public.delete_community_message(uuid);
create or replace function public.delete_community_message(
  selected_message_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select community_messages.user_id
  into owner_id
  from public.community_messages
  where community_messages.id = selected_message_id
    and community_messages.deleted_at is null;

  if owner_id is null then
    raise exception 'Message not found';
  end if;

  if owner_id <> auth.uid()
    and coalesce(public.current_user_role() in ('admin', 'editor'), false) = false
  then
    raise exception 'Not allowed to remove this message';
  end if;

  update public.community_messages
  set deleted_at = now(), deleted_by = auth.uid()
  where community_messages.id = selected_message_id
    and community_messages.deleted_at is null;

  return true;
end;
$$;

revoke all on function public.list_community_messages(text)
  from public;
revoke all on function public.create_community_message(text, text)
  from public, anon;
revoke all on function public.delete_community_message(uuid)
  from public, anon;

grant execute on function public.list_community_messages(text)
  to anon, authenticated;
grant execute on function public.create_community_message(text, text)
  to authenticated;
grant execute on function public.delete_community_message(uuid)
  to authenticated;

do $$
begin
  alter publication supabase_realtime
    add table public.community_messages;
exception
  when duplicate_object then null;
end;
$$;
