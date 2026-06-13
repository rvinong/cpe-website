-- Run this file in the Supabase SQL Editor for a new project.

create type public.app_role as enum ('student', 'editor', 'admin');
create type public.profile_status as enum ('pending', 'approved', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  student_number text unique,
  role public.app_role not null default 'student',
  status public.profile_status not null default 'pending',
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
  where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, student_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'student_number', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Admins and editors can read profiles"
on public.profiles
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

create policy "Admins can update profiles and roles"
on public.profiles
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

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
