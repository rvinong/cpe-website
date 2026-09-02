-- Run this file in the Supabase SQL Editor for a new project.

create type public.app_role as enum ('student', 'faculty', 'editor', 'admin');
create type public.profile_status as enum ('pending', 'approved', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  nickname text not null default '',
  student_number text unique,
  year_level text not null default ''
    check (year_level in ('', '1st Year', '2nd Year', '3rd Year', '4th Year')),
  role public.app_role not null default 'student',
  status public.profile_status not null default 'pending',
  email_notifications boolean not null default true,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and status = 'approved';
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    student_number,
    nickname,
    role,
    year_level,
    email_notifications,
    status,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when lower(coalesce(new.raw_user_meta_data ->> 'account_type', 'student')) = 'faculty'
      then null
      else nullif(trim(coalesce(new.raw_user_meta_data ->> 'student_number', '')), '')
    end,
    '',
    case
      when lower(coalesce(new.raw_user_meta_data ->> 'account_type', 'student')) = 'faculty'
      then 'faculty'::public.app_role
      else 'student'::public.app_role
    end,
    case
      when coalesce(new.raw_user_meta_data ->> 'year_level', '') in (
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year'
      )
      then coalesce(new.raw_user_meta_data ->> 'year_level', '')
      else ''
    end,
    true,
    'pending'::public.profile_status,
    now(),
    now()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_email_notifications(enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set email_notifications = enabled
  where id = auth.uid();

  return enabled;
end;
$$;

revoke all on function public.set_email_notifications(boolean)
  from public, anon;
grant execute on function public.set_email_notifications(boolean)
  to authenticated;

create or replace function public.update_my_account_profile(
  target_nickname text,
  target_avatar_path text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_nickname text;
  clean_avatar_path text;
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
  ) then
    raise exception 'Approved account required';
  end if;

  clean_nickname := trim(coalesce(target_nickname, ''));

  if char_length(clean_nickname) > 40 then
    raise exception 'Nickname must be 40 characters or fewer';
  end if;

  clean_avatar_path := nullif(trim(coalesce(target_avatar_path, '')), '');

  if clean_avatar_path is not null
    and position(auth.uid()::text || '/' in clean_avatar_path) <> 1
  then
    raise exception 'Invalid avatar path';
  end if;

  update public.profiles
  set
    nickname = clean_nickname,
    avatar_path = clean_avatar_path
  where id = auth.uid()
  returning * into updated_profile;

  return updated_profile;
end;
$$;

revoke all on function public.update_my_account_profile(text, text)
  from public, anon;
grant execute on function public.update_my_account_profile(text, text)
  to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_approved_profile_avatar(
  target_avatar_path text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.avatar_path = target_avatar_path
      and profiles.status = 'approved'
  );
$$;

revoke all on function public.is_approved_profile_avatar(text)
  from public;
grant execute on function public.is_approved_profile_avatar(text)
  to anon, authenticated;

create policy "Public can view approved profile avatars"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'profile-avatars'
  and public.is_approved_profile_avatar(name)
);

create policy "Approved users can upload their own profile avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and public.current_user_role() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Approved users can update their own profile avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.current_user_role() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and public.current_user_role() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Approved users can delete their own profile avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.current_user_role() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read permitted profiles"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.current_user_role() = 'admin'
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text not null,
  body text not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_public_listing_idx
  on public.announcements (status, is_featured desc, published_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_announcements_updated_at
  before update on public.announcements
  for each row execute procedure public.set_updated_at();

alter table public.announcements enable row level security;

create policy "Published announcements are public"
on public.announcements
for select
to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

create policy "Admins and editors can read announcements"
on public.announcements
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can create announcements"
on public.announcements
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = auth.uid()
);

create policy "Admins and editors can update announcements"
on public.announcements
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can delete announcements"
on public.announcements
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

insert into public.announcements (
  slug,
  title,
  category,
  summary,
  body,
  status,
  is_featured,
  published_at
)
values (
  'website-coming-soon',
  'Website Coming Soon',
  'Website Update',
  'Our Computer Engineering Organization website is currently under development.',
  E'Our Computer Engineering Organization website is currently under development. This platform will soon provide announcements, academic resources, event updates, curriculum information, organization highlights, alumni archive, and other helpful features for students.\n\nThe Computer Engineering Organization is preparing a centralized online platform for current students, new students, and members of the organization. Once launched, the website will serve as a digital space for updates, learning materials, event documentation, merchandise notices, and organization-related information.\n\nStay tuned for more updates as we continue building and improving the website.',
  'published',
  true,
  '2026-06-01 08:00:00+08'
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text not null,
  description text not null,
  venue text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  registration_url text,
  image_path text,
  card_image_path text,
  image_alt text not null default '',
  show_in_gallery boolean not null default true,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled', 'archived')),
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create index events_public_listing_idx
  on public.events (status, is_featured desc, starts_at);

create index events_gallery_listing_idx
  on public.events (show_in_gallery, status, starts_at desc)
  where image_path is not null;

create trigger set_events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

alter table public.events enable row level security;

create policy "Published events are public"
on public.events
for select
to anon, authenticated
using (
  status in ('published', 'cancelled')
  and published_at is not null
  and published_at <= now()
);

create policy "Admins and editors can read events"
on public.events
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can create events"
on public.events
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = auth.uid()
);

create policy "Admins and editors can update events"
on public.events
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can delete events"
on public.events
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

-- After creating your first account, assign it as the first administrator:
-- update public.profiles
-- set role = 'admin', status = 'approved'
-- where id = (select id from auth.users where email = 'your-email@example.com');
