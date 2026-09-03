-- Run this file in the Supabase SQL Editor after supabase/schema.sql.

create table if not exists public.announcements (
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

create index if not exists announcements_public_listing_idx
  on public.announcements (status, is_featured desc, published_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_announcements_updated_at
  on public.announcements;

create trigger set_announcements_updated_at
  before update on public.announcements
  for each row execute procedure public.set_updated_at();

alter table public.announcements enable row level security;

drop policy if exists "Published announcements are public"
  on public.announcements;
create policy "Published announcements are public"
on public.announcements
for select
to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists "Admins and editors can read announcements"
  on public.announcements;
create policy "Admins and editors can read announcements"
on public.announcements
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can create announcements"
  on public.announcements;
create policy "Admins and editors can create announcements"
on public.announcements
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = auth.uid()
);

drop policy if exists "Admins and editors can update announcements"
  on public.announcements;
create policy "Admins and editors can update announcements"
on public.announcements
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete announcements"
  on public.announcements;
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
)
on conflict (slug) do nothing;
