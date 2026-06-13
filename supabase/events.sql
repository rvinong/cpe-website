-- Run this file in the Supabase SQL Editor after supabase/schema.sql.

create table if not exists public.events (
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

create index if not exists events_public_listing_idx
  on public.events (status, is_featured desc, starts_at);

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

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

alter table public.events enable row level security;

drop policy if exists "Published events are public" on public.events;
create policy "Published events are public"
on public.events
for select
to anon, authenticated
using (
  status in ('published', 'cancelled')
  and published_at is not null
  and published_at <= now()
);

drop policy if exists "Admins and editors can read events" on public.events;
create policy "Admins and editors can read events"
on public.events
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can create events" on public.events;
create policy "Admins and editors can create events"
on public.events
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = auth.uid()
);

drop policy if exists "Admins and editors can update events" on public.events;
create policy "Admins and editors can update events"
on public.events
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete events" on public.events;
create policy "Admins and editors can delete events"
on public.events
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));
