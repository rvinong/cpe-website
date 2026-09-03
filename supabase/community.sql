-- Run after supabase/schema.sql and supabase/users.sql.
-- Community reads are exposed through functions so profile identity fields stay controlled.

create table if not exists public.community_rooms (
  id text primary key,
  title text not null,
  short_title text not null,
  description text not null default '',
  tone text not null default 'blue',
  is_active boolean not null default true,
  is_locked boolean not null default false,
  is_staff_only boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.community_rooms (
  id,
  title,
  short_title,
  description,
  tone,
  is_staff_only,
  sort_order
)
values
  (
    'general',
    'General Lounge',
    'General',
    'Open student conversations and quick organization questions.',
    'blue',
    false,
    1
  ),
  (
    'academic-help',
    'Academic Help',
    'Academics',
    'Ask about subjects, reviewers, programming, and study tips.',
    'emerald',
    false,
    2
  ),
  (
    'events-talk',
    'Events Talk',
    'Events',
    'Questions and reminders around upcoming activities.',
    'orange',
    false,
    3
  ),
  (
    'announcements-qa',
    'Announcements Q&A',
    'Q&A',
    'Clarifications about official announcements and notices.',
    'violet',
    false,
    4
  ),
  (
    'resource-requests',
    'Resource Requests',
    'Requests',
    'Request reviewers, notes, tutorials, or learning materials.',
    'cyan',
    false,
    5
  ),
  (
    'officer-notices',
    'Officer Notices',
    'Officers',
    'Pinned reminders and verified updates from officers.',
    'navy',
    true,
    6
  )
on conflict (id) do nothing;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.community_rooms(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  body text not null check (char_length(trim(body)) between 1 and 1200),
  is_pinned boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_room_order_idx
  on public.community_posts (room_id, is_pinned desc, updated_at desc)
  where deleted_at is null;

create index if not exists community_posts_user_idx
  on public.community_posts (user_id);

create index if not exists community_comments_post_order_idx
  on public.community_comments (post_id, created_at)
  where deleted_at is null;

create index if not exists community_comments_user_idx
  on public.community_comments (user_id);

drop trigger if exists set_community_rooms_updated_at
  on public.community_rooms;
create trigger set_community_rooms_updated_at
  before update on public.community_rooms
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_community_posts_updated_at
  on public.community_posts;
create trigger set_community_posts_updated_at
  before update on public.community_posts
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_community_comments_updated_at
  on public.community_comments;
create trigger set_community_comments_updated_at
  before update on public.community_comments
  for each row execute procedure public.set_updated_at();

alter table public.community_rooms enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

revoke all on table public.community_rooms
  from public, anon, authenticated;
revoke all on table public.community_posts
  from public, anon, authenticated;
revoke all on table public.community_comments
  from public, anon, authenticated;
grant select on table public.community_rooms
  to anon, authenticated;

drop policy if exists "Active community rooms are public"
  on public.community_rooms;
create policy "Active community rooms are public"
on public.community_rooms
for select
to anon, authenticated
using (is_active);

-- Posts and comments are intentionally read and mutated through the functions below.
-- With RLS enabled and no direct table policies, the Data API cannot expose extra fields.

drop function if exists public.list_community_posts(text);
create or replace function public.list_community_posts(
  selected_room_id text
)
returns table (
  id uuid,
  room_id text,
  profile_id uuid,
  full_name text,
  avatar_path text,
  role public.app_role,
  title text,
  body text,
  is_pinned boolean,
  comment_count bigint,
  created_at timestamptz,
  updated_at timestamptz,
  can_delete boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Keep the legacy forum API subject to the same room boundary as chat.
  -- This function is callable by anonymous visitors for public rooms, so a
  -- staff-only or locked room must return no rows instead of relying on RLS.
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
    return;
  end if;

  return query
  select
    community_posts.id,
    community_posts.room_id,
    profiles.id as profile_id,
    coalesce(
      nullif(trim(profiles.nickname), ''),
      nullif(trim(profiles.full_name), ''),
      'Member'
    ) as full_name,
    profiles.avatar_path,
    profiles.role,
    community_posts.title,
    community_posts.body,
    community_posts.is_pinned,
    (
      select count(*)
      from public.community_comments
      where community_comments.post_id = community_posts.id
        and community_comments.deleted_at is null
    ) as comment_count,
    community_posts.created_at,
    community_posts.updated_at,
    (
      auth.uid() = community_posts.user_id
      or coalesce(public.current_user_role() in ('admin', 'editor'), false)
    ) as can_delete
  from public.community_posts
  join public.community_rooms
    on community_rooms.id = community_posts.room_id
  join public.profiles
    on profiles.id = community_posts.user_id
  where community_posts.room_id = selected_room_id
    and community_rooms.is_active
    and not community_rooms.is_locked
    and (
      not community_rooms.is_staff_only
      or public.current_user_role() in ('admin', 'editor')
    )
    and community_posts.deleted_at is null
    and profiles.status = 'approved'
  order by community_posts.is_pinned desc, community_posts.updated_at desc;
end;
$$;

drop function if exists public.list_community_comments(uuid);
create or replace function public.list_community_comments(
  selected_post_id uuid
)
returns table (
  id uuid,
  post_id uuid,
  profile_id uuid,
  full_name text,
  avatar_path text,
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
  if not exists (
    select 1
    from public.community_posts
    join public.community_rooms
      on community_rooms.id = community_posts.room_id
    where community_posts.id = selected_post_id
      and community_posts.deleted_at is null
      and community_rooms.is_active
      and not community_rooms.is_locked
      and (
        not community_rooms.is_staff_only
        or public.current_user_role() in ('admin', 'editor')
      )
  ) then
    return;
  end if;

  return query
  select
    community_comments.id,
    community_comments.post_id,
    profiles.id as profile_id,
    coalesce(
      nullif(trim(profiles.nickname), ''),
      nullif(trim(profiles.full_name), ''),
      'Member'
    ) as full_name,
    profiles.avatar_path,
    community_comments.body,
    community_comments.created_at,
    community_comments.updated_at,
    (
      auth.uid() = community_comments.user_id
      or coalesce(public.current_user_role() in ('admin', 'editor'), false)
    ) as can_delete
  from public.community_comments
  join public.community_posts
    on community_posts.id = community_comments.post_id
  join public.community_rooms
    on community_rooms.id = community_posts.room_id
  join public.profiles
    on profiles.id = community_comments.user_id
  where community_comments.post_id = selected_post_id
    and community_comments.deleted_at is null
    and community_posts.deleted_at is null
    and community_rooms.is_active
    and not community_rooms.is_locked
    and (
      not community_rooms.is_staff_only
      or public.current_user_role() in ('admin', 'editor')
    )
    and profiles.status = 'approved'
  order by community_comments.created_at asc;
end;
$$;

drop function if exists public.create_community_post(text, text, text);
create or replace function public.create_community_post(
  selected_room_id text,
  post_title text,
  post_body text
)
returns table (
  id uuid,
  room_id text,
  profile_id uuid,
  full_name text,
  avatar_path text,
  role public.app_role,
  title text,
  body text,
  is_pinned boolean,
  comment_count bigint,
  created_at timestamptz,
  updated_at timestamptz,
  can_delete boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  clean_title text;
  clean_body text;
  inserted_post_id uuid;
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

  clean_title := trim(coalesce(post_title, ''));
  clean_body := trim(coalesce(post_body, ''));

  if clean_title = '' then
    raise exception 'Post title cannot be empty';
  end if;
  if char_length(clean_title) > 120 then
    raise exception 'Post title must be 120 characters or fewer';
  end if;
  if clean_body = '' then
    raise exception 'Post body cannot be empty';
  end if;
  if char_length(clean_body) > 1200 then
    raise exception 'Post body must be 1200 characters or fewer';
  end if;

  insert into public.community_posts (room_id, user_id, title, body)
  values (selected_room_id, auth.uid(), clean_title, clean_body)
  returning community_posts.id into inserted_post_id;

  return query
  select post_row.*
  from public.list_community_posts(selected_room_id) as post_row
  where post_row.id = inserted_post_id;
end;
$$;

drop function if exists public.create_community_comment(uuid, text);
create or replace function public.create_community_comment(
  selected_post_id uuid,
  comment_body text
)
returns table (
  id uuid,
  post_id uuid,
  profile_id uuid,
  full_name text,
  avatar_path text,
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
  inserted_comment_id uuid;
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
  from public.community_posts
  join public.community_rooms
    on community_rooms.id = community_posts.room_id
  where community_posts.id = selected_post_id
    and community_posts.deleted_at is null
    and community_rooms.is_active
    and not community_rooms.is_locked;

  if not found then
    raise exception 'Discussion not found';
  end if;

  if room_is_staff_only
    and public.current_user_role() not in ('admin', 'editor')
  then
    raise exception 'Staff access required for this room';
  end if;

  clean_body := trim(coalesce(comment_body, ''));

  if clean_body = '' then
    raise exception 'Reply cannot be empty';
  end if;
  if char_length(clean_body) > 1000 then
    raise exception 'Reply must be 1000 characters or fewer';
  end if;

  insert into public.community_comments (post_id, user_id, body)
  values (selected_post_id, auth.uid(), clean_body)
  returning community_comments.id into inserted_comment_id;

  return query
  select comment_row.*
  from public.list_community_comments(selected_post_id) as comment_row
  where comment_row.id = inserted_comment_id;
end;
$$;

drop function if exists public.delete_community_post(uuid);
create or replace function public.delete_community_post(
  selected_post_id uuid
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

  select community_posts.user_id
  into owner_id
  from public.community_posts
  where community_posts.id = selected_post_id
    and community_posts.deleted_at is null;

  if owner_id is null then
    raise exception 'Discussion not found';
  end if;

  if owner_id <> auth.uid()
    and coalesce(public.current_user_role() in ('admin', 'editor'), false) = false
  then
    raise exception 'Not allowed to remove this discussion';
  end if;

  update public.community_posts
  set deleted_at = now(), deleted_by = auth.uid()
  where community_posts.id = selected_post_id
    and community_posts.deleted_at is null;

  update public.community_comments
  set deleted_at = now(), deleted_by = auth.uid()
  where community_comments.post_id = selected_post_id
    and community_comments.deleted_at is null;

  return true;
end;
$$;

drop function if exists public.delete_community_comment(uuid);
create or replace function public.delete_community_comment(
  selected_comment_id uuid
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

  select community_comments.user_id
  into owner_id
  from public.community_comments
  where community_comments.id = selected_comment_id
    and community_comments.deleted_at is null;

  if owner_id is null then
    raise exception 'Reply not found';
  end if;

  if owner_id <> auth.uid()
    and coalesce(public.current_user_role() in ('admin', 'editor'), false) = false
  then
    raise exception 'Not allowed to remove this reply';
  end if;

  update public.community_comments
  set deleted_at = now(), deleted_by = auth.uid()
  where community_comments.id = selected_comment_id
    and community_comments.deleted_at is null;

  return true;
end;
$$;

revoke all on function public.list_community_posts(text)
  from public;
revoke all on function public.list_community_comments(uuid)
  from public;
revoke all on function public.create_community_post(text, text, text)
  from public, anon;
revoke all on function public.create_community_comment(uuid, text)
  from public, anon;
revoke all on function public.delete_community_post(uuid)
  from public, anon;
revoke all on function public.delete_community_comment(uuid)
  from public, anon;

grant execute on function public.list_community_posts(text)
  to anon, authenticated;
grant execute on function public.list_community_comments(uuid)
  to anon, authenticated;
grant execute on function public.create_community_post(text, text, text)
  to authenticated;
grant execute on function public.create_community_comment(uuid, text)
  to authenticated;
grant execute on function public.delete_community_post(uuid)
  to authenticated;
grant execute on function public.delete_community_comment(uuid)
  to authenticated;
