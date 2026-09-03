-- Run after supabase/community.sql.
-- Room messages are available only to approved signed-in members. Direct table
-- reads stay limited to approved authenticated Realtime subscribers.

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.community_rooms(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  reply_to_message_id uuid references public.community_messages(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_messages
  add column if not exists reply_to_message_id uuid
  references public.community_messages(id) on delete set null;

create index if not exists community_messages_room_order_idx
  on public.community_messages (room_id, created_at, id)
  where deleted_at is null;

create index if not exists community_messages_user_idx
  on public.community_messages (user_id);

create index if not exists community_messages_reply_target_idx
  on public.community_messages (reply_to_message_id)
  where reply_to_message_id is not null;

-- Chat attachments stay private. Metadata is exposed only through the protected
-- room RPC below, while Storage signs files for approved members on demand.
create table if not exists public.community_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null
    references public.community_messages(id) on delete cascade,
  user_id uuid not null
    references public.profiles(id) on delete cascade,
  storage_path text not null,
  file_name text not null
    check (char_length(trim(file_name)) between 1 and 255),
  mime_type text not null
    check (mime_type in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/heic',
      'image/heif',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now(),
  unique (message_id, storage_path)
);

create index if not exists community_message_attachments_message_idx
  on public.community_message_attachments (message_id, created_at, id);

create index if not exists community_message_attachments_user_idx
  on public.community_message_attachments (user_id, created_at desc);

alter table public.community_message_attachments enable row level security;

revoke all on table public.community_message_attachments
  from public, anon, authenticated;

create table if not exists public.community_message_mentions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null
    references public.community_messages(id) on delete cascade,
  mentioned_profile_id uuid not null
    references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, mentioned_profile_id)
);

create index if not exists community_message_mentions_profile_idx
  on public.community_message_mentions (mentioned_profile_id, created_at desc);

create index if not exists community_message_mentions_message_idx
  on public.community_message_mentions (message_id);

create table if not exists public.community_mention_notification_log (
  id bigint generated always as identity primary key,
  message_id uuid not null
    references public.community_messages(id) on delete cascade,
  mentioned_profile_id uuid not null
    references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0
    check (attempts >= 0),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, mentioned_profile_id)
);

create index if not exists community_mention_notification_log_status_idx
  on public.community_mention_notification_log (status, created_at);

drop trigger if exists set_community_mention_notification_log_updated_at
  on public.community_mention_notification_log;
create trigger set_community_mention_notification_log_updated_at
  before update on public.community_mention_notification_log
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_community_messages_updated_at
  on public.community_messages;
create trigger set_community_messages_updated_at
  before update on public.community_messages
  for each row execute procedure public.set_updated_at();

alter table public.community_messages enable row level security;
alter table public.community_message_mentions enable row level security;
alter table public.community_mention_notification_log enable row level security;

revoke all on table public.community_messages
  from public, anon, authenticated;
grant select on table public.community_messages
  to authenticated;

-- Mention identities and delivery state are accessed only by protected
-- functions and the notification Edge Function using its server key.
revoke all on table public.community_message_mentions
  from public, anon, authenticated;
revoke all on table public.community_mention_notification_log
  from public, anon, authenticated;

drop policy if exists "Authenticated users can receive room messages"
  on public.community_messages;
create policy "Authenticated users can receive room messages"
on public.community_messages
for select
to authenticated
using (
  deleted_at is null
  and public.current_user_role() is not null
  and exists (
    select 1
    from public.community_rooms
    where community_rooms.id = community_messages.room_id
      and community_rooms.is_active
      and not community_rooms.is_locked
      and (
        not community_rooms.is_staff_only
        or public.current_user_role() in ('admin', 'editor')
      )
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
  reply_to_message_id uuid,
  reply_to_full_name text,
  reply_to_avatar_path text,
  reply_to_body text,
  reply_to_created_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  can_delete boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_user_role() is null then
    raise exception 'Approved account required';
  end if;

  if not exists (
    select 1
    from public.community_rooms
    where community_rooms.id = selected_room_id
      and community_rooms.is_active
      and not community_rooms.is_locked
      and (
        not community_rooms.is_staff_only
        or public.current_user_role() in ('admin', 'editor')
      )
  ) then
    raise exception 'Community room not found or unavailable';
  end if;

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
    community_messages.reply_to_message_id,
    case
      when reply_profiles.id is not null then coalesce(
        nullif(trim(reply_profiles.nickname), ''),
        nullif(trim(reply_profiles.full_name), ''),
        'Member'
      )
    end as reply_to_full_name,
    reply_profiles.avatar_path as reply_to_avatar_path,
    case
      when reply_profiles.id is not null then reply_target.body
    end as reply_to_body,
    case
      when reply_profiles.id is not null then reply_target.created_at
    end as reply_to_created_at,
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
  left join public.community_messages as reply_target
    on reply_target.id = community_messages.reply_to_message_id
    and reply_target.deleted_at is null
  left join public.profiles as reply_profiles
    on reply_profiles.id = reply_target.user_id
    and reply_profiles.status = 'approved'
  where community_messages.room_id = selected_room_id
    and community_rooms.is_active
    and community_messages.deleted_at is null
    and profiles.status = 'approved'
  order by community_messages.created_at asc, community_messages.id asc
  limit 200;
end;
$$;

drop function if exists public.list_community_members();
create or replace function public.list_community_members()
returns table (
  profile_id uuid,
  display_name text,
  avatar_path text,
  role public.app_role
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_user_role() is null then
    raise exception 'Approved account required';
  end if;

  return query
  select
    profiles.id as profile_id,
    coalesce(
      nullif(trim(profiles.nickname), ''),
      nullif(trim(profiles.full_name), ''),
      'Member'
    ) as display_name,
    profiles.avatar_path,
    profiles.role
  from public.profiles
  where profiles.status = 'approved'
  order by lower(
    coalesce(
      nullif(trim(profiles.nickname), ''),
      nullif(trim(profiles.full_name), ''),
      'Member'
    )
  ), profiles.id;
end;
$$;

drop function if exists public.create_community_message(text, text, uuid, uuid[]);
drop function if exists public.create_community_message(text, text, uuid);
drop function if exists public.create_community_message(text, text);
create or replace function public.create_community_message(
  selected_room_id text,
  message_body text,
  selected_reply_to_message_id uuid,
  selected_mentioned_profile_ids uuid[]
)
returns table (
  id uuid,
  room_id text,
  profile_id uuid,
  full_name text,
  avatar_path text,
  role public.app_role,
  body text,
  reply_to_message_id uuid,
  reply_to_full_name text,
  reply_to_avatar_path text,
  reply_to_body text,
  reply_to_created_at timestamptz,
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
  reply_room_id text;
  requested_mention_count integer;
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

  requested_mention_count := cardinality(
    coalesce(selected_mentioned_profile_ids, '{}'::uuid[])
  );

  if requested_mention_count > 20 then
    raise exception 'A message can mention at most 20 members';
  end if;

  if exists (
    select 1
    from unnest(
      coalesce(selected_mentioned_profile_ids, '{}'::uuid[])
    ) as requested(profile_id)
    left join public.profiles as mentioned_profiles
      on mentioned_profiles.id = requested.profile_id
    where mentioned_profiles.id is null
      or mentioned_profiles.status <> 'approved'
  ) then
    raise exception 'Mentions must target approved members';
  end if;

  if selected_reply_to_message_id is not null then
    select community_messages.room_id
    into reply_room_id
    from public.community_messages
    join public.profiles
      on profiles.id = community_messages.user_id
      and profiles.status = 'approved'
    where community_messages.id = selected_reply_to_message_id
      and community_messages.deleted_at is null;

    if reply_room_id is null then
      raise exception 'The message you are replying to is no longer available';
    end if;

    if reply_room_id <> selected_room_id then
      raise exception 'You can only reply to messages in this room';
    end if;
  end if;

  insert into public.community_messages (
    room_id,
    user_id,
    body,
    reply_to_message_id
  )
  values (
    selected_room_id,
    auth.uid(),
    clean_body,
    selected_reply_to_message_id
  )
  returning community_messages.id into inserted_message_id;

  insert into public.community_message_mentions (
    message_id,
    mentioned_profile_id
  )
  select
    inserted_message_id,
    requested.profile_id
  from unnest(
    coalesce(selected_mentioned_profile_ids, '{}'::uuid[])
  ) as requested(profile_id)
  where requested.profile_id <> auth.uid()
  on conflict (message_id, mentioned_profile_id) do nothing;

  return query
  select message_row.*
  from public.list_community_messages(selected_room_id) as message_row
  where message_row.id = inserted_message_id;
end;
$$;

-- Keep the original three-argument call working for older clients.
create or replace function public.create_community_message(
  selected_room_id text,
  message_body text,
  selected_reply_to_message_id uuid
)
returns table (
  id uuid,
  room_id text,
  profile_id uuid,
  full_name text,
  avatar_path text,
  role public.app_role,
  body text,
  reply_to_message_id uuid,
  reply_to_full_name text,
  reply_to_avatar_path text,
  reply_to_body text,
  reply_to_created_at timestamptz,
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
  select message_row.*
  from public.create_community_message(
    selected_room_id,
    message_body,
    selected_reply_to_message_id,
    '{}'::uuid[]
  ) as message_row;
end;
$$;

-- Keep the original two-argument call working for older clients.
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
  reply_to_message_id uuid,
  reply_to_full_name text,
  reply_to_avatar_path text,
  reply_to_body text,
  reply_to_created_at timestamptz,
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
  select message_row.*
  from public.create_community_message(
    selected_room_id,
    message_body,
    null::uuid,
    '{}'::uuid[]
  ) as message_row;
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

drop function if exists public.list_community_message_attachments(text);
create or replace function public.list_community_message_attachments(
  selected_room_id text
)
returns table (
  attachment_id uuid,
  message_id uuid,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
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

  return query
  select
    attachments.id as attachment_id,
    attachments.message_id,
    attachments.storage_path,
    attachments.file_name,
    attachments.mime_type,
    attachments.size_bytes,
    attachments.created_at
  from public.community_message_attachments as attachments
  join public.community_messages as messages
    on messages.id = attachments.message_id
  join public.profiles as authors
    on authors.id = messages.user_id
    and authors.status = 'approved'
  where messages.room_id = selected_room_id
    and messages.deleted_at is null
  order by attachments.created_at asc, attachments.id asc;
end;
$$;

drop function if exists public.add_community_message_attachments(uuid, jsonb);
create or replace function public.add_community_message_attachments(
  selected_message_id uuid,
  selected_attachments jsonb
)
returns table (
  attachment_id uuid,
  message_id uuid,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  attachments jsonb := coalesce(selected_attachments, '[]'::jsonb);
  attachment jsonb;
  message_owner_id uuid;
  room_is_staff_only boolean;
  existing_attachment_count integer;
  existing_attachment_size bigint;
  total_attachment_size bigint := 0;
  clean_storage_path text;
  clean_file_name text;
  clean_mime_type text;
  clean_size_bytes bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_user_role() is null then
    raise exception 'Approved account required';
  end if;

  if jsonb_typeof(attachments) <> 'array' then
    raise exception 'Attachments must be an array';
  end if;

  if jsonb_array_length(attachments) = 0 then
    return;
  end if;

  if jsonb_array_length(attachments) > 5 then
    raise exception 'A message can include at most 5 attachments';
  end if;

  select
    messages.user_id,
    rooms.is_staff_only
  into
    message_owner_id,
    room_is_staff_only
  from public.community_messages as messages
  join public.community_rooms as rooms
    on rooms.id = messages.room_id
  where messages.id = selected_message_id
    and messages.deleted_at is null
    and rooms.is_active
    and not rooms.is_locked;

  if message_owner_id is null then
    raise exception 'Message not found or unavailable';
  end if;

  if message_owner_id <> auth.uid() then
    raise exception 'Only the message author can add attachments';
  end if;

  if room_is_staff_only
    and public.current_user_role() not in ('admin', 'editor')
  then
    raise exception 'Staff access required for this room';
  end if;

  select
    count(*)::integer,
    coalesce(sum(community_message_attachments.size_bytes), 0)::bigint
  into existing_attachment_count, existing_attachment_size
  from public.community_message_attachments
  where community_message_attachments.message_id = selected_message_id;

  if existing_attachment_count + jsonb_array_length(attachments) > 5 then
    raise exception 'A message can include at most 5 attachments';
  end if;

  for attachment in select value from jsonb_array_elements(attachments)
  loop
    clean_storage_path := trim(coalesce(attachment->>'storage_path', ''));
    clean_file_name := trim(coalesce(attachment->>'file_name', ''));
    clean_mime_type := lower(trim(coalesce(attachment->>'mime_type', '')));

    if clean_storage_path !~ (
      '^' || auth.uid()::text || '/' || selected_message_id::text ||
      '/[0-9a-f-]{36}$'
    ) then
      raise exception 'Invalid attachment path';
    end if;

    if char_length(clean_file_name) not between 1 and 255 then
      raise exception 'Attachment file name is invalid';
    end if;

    if clean_mime_type not in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/heic',
      'image/heif',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) then
      raise exception 'This file type is not supported';
    end if;

    if coalesce(attachment->>'size_bytes', '') !~ '^[0-9]{1,12}$' then
      raise exception 'Attachment file size is invalid';
    end if;

    clean_size_bytes := (attachment->>'size_bytes')::bigint;
    if clean_size_bytes not between 1 and 10485760 then
      raise exception 'Each attachment must be 10 MB or smaller';
    end if;

    total_attachment_size := total_attachment_size + clean_size_bytes;
  end loop;

  if existing_attachment_size + total_attachment_size > 26214400 then
    raise exception 'Attachments cannot exceed 25 MB per message';
  end if;

  for attachment in select value from jsonb_array_elements(attachments)
  loop
    clean_storage_path := trim(coalesce(attachment->>'storage_path', ''));
    clean_file_name := trim(coalesce(attachment->>'file_name', ''));
    clean_mime_type := lower(trim(coalesce(attachment->>'mime_type', '')));
    clean_size_bytes := (attachment->>'size_bytes')::bigint;

    return query
    insert into public.community_message_attachments (
      message_id,
      user_id,
      storage_path,
      file_name,
      mime_type,
      size_bytes
    )
    values (
      selected_message_id,
      auth.uid(),
      clean_storage_path,
      clean_file_name,
      clean_mime_type,
      clean_size_bytes
    )
    on conflict (message_id, storage_path) do update
    set
      file_name = excluded.file_name,
      mime_type = excluded.mime_type,
      size_bytes = excluded.size_bytes
    returning
      community_message_attachments.id as attachment_id,
      community_message_attachments.message_id,
      community_message_attachments.storage_path,
      community_message_attachments.file_name,
      community_message_attachments.mime_type,
      community_message_attachments.size_bytes,
      community_message_attachments.created_at;
  end loop;
end;
$$;

revoke all on function public.list_community_messages(text)
  from public, anon;
revoke all on function public.list_community_members()
  from public, anon;
revoke all on function public.create_community_message(text, text, uuid)
  from public, anon;
revoke all on function public.create_community_message(text, text, uuid, uuid[])
  from public, anon;
revoke all on function public.create_community_message(text, text)
  from public, anon;
revoke all on function public.delete_community_message(uuid)
  from public, anon;
revoke all on function public.list_community_message_attachments(text)
  from public, anon;
revoke all on function public.add_community_message_attachments(uuid, jsonb)
  from public, anon;

grant execute on function public.list_community_messages(text)
  to authenticated;
grant execute on function public.list_community_members()
  to authenticated;
grant execute on function public.create_community_message(text, text, uuid)
  to authenticated;
grant execute on function public.create_community_message(text, text, uuid, uuid[])
  to authenticated;
grant execute on function public.create_community_message(text, text)
  to authenticated;
grant execute on function public.delete_community_message(uuid)
  to authenticated;
grant execute on function public.list_community_message_attachments(text)
  to authenticated;
grant execute on function public.add_community_message_attachments(uuid, jsonb)
  to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'community-attachments',
  'community-attachments',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Approved members can view community attachments"
  on storage.objects;
create policy "Approved members can view community attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'community-attachments'
  and public.current_user_role() is not null
  and exists (
    select 1
    from public.community_messages as messages
    join public.community_rooms as rooms
      on rooms.id = messages.room_id
    where messages.id::text = (storage.foldername(name))[2]
      and messages.deleted_at is null
      and rooms.is_active
      and not rooms.is_locked
      and (
        not rooms.is_staff_only
        or public.current_user_role() in ('admin', 'editor')
      )
  )
);

drop policy if exists "Approved members can upload community attachments"
  on storage.objects;
create policy "Approved members can upload community attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-attachments'
  and public.current_user_role() is not null
  and name ~ (
    '^' || auth.uid()::text || '/[0-9a-f-]{36}/[0-9a-f-]{36}$'
  )
  and exists (
    select 1
    from public.community_messages as messages
    join public.community_rooms as rooms
      on rooms.id = messages.room_id
    where messages.id::text = (storage.foldername(name))[2]
      and messages.user_id = auth.uid()
      and messages.deleted_at is null
      and rooms.is_active
      and not rooms.is_locked
      and (
        not rooms.is_staff_only
        or public.current_user_role() in ('admin', 'editor')
      )
  )
);

drop policy if exists "Members can update their community attachments"
  on storage.objects;
create policy "Members can update their community attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-attachments'
  and public.current_user_role() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.community_messages as messages
    join public.community_rooms as rooms
      on rooms.id = messages.room_id
    where messages.id::text = (storage.foldername(name))[2]
      and messages.user_id = auth.uid()
      and messages.deleted_at is null
      and rooms.is_active
      and not rooms.is_locked
      and (
        not rooms.is_staff_only
        or public.current_user_role() in ('admin', 'editor')
      )
  )
)
with check (
  bucket_id = 'community-attachments'
  and public.current_user_role() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.community_messages as messages
    join public.community_rooms as rooms
      on rooms.id = messages.room_id
    where messages.id::text = (storage.foldername(name))[2]
      and messages.user_id = auth.uid()
      and messages.deleted_at is null
      and rooms.is_active
      and not rooms.is_locked
      and (
        not rooms.is_staff_only
        or public.current_user_role() in ('admin', 'editor')
      )
  )
);

drop policy if exists "Members and staff can delete community attachments"
  on storage.objects;
create policy "Members and staff can delete community attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-attachments'
  and public.current_user_role() is not null
  and (
    (
      (storage.foldername(name))[1] = auth.uid()::text
      and exists (
        select 1
        from public.community_messages as messages
        join public.community_rooms as rooms
          on rooms.id = messages.room_id
        where messages.id::text = (storage.foldername(name))[2]
          and messages.user_id = auth.uid()
          and messages.deleted_at is null
          and rooms.is_active
          and not rooms.is_locked
          and (
            not rooms.is_staff_only
            or public.current_user_role() in ('admin', 'editor')
          )
      )
    )
    or public.current_user_role() in ('admin', 'editor')
  )
);

do $$
begin
  alter publication supabase_realtime
    add table public.community_messages;
exception
  when duplicate_object then null;
end;
$$;
