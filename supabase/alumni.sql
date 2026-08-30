-- Run this file in the Supabase SQL Editor after supabase/media.sql.

create table if not exists public.alumni_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  batch text not null,
  professional_role text not null default '',
  organization text not null default '',
  organization_history text not null default '',
  highlight text not null default '',
  photo_path text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  consent_confirmed boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or consent_confirmed)
);

create index if not exists alumni_profiles_public_listing_idx
  on public.alumni_profiles (
    status,
    is_featured desc,
    batch desc,
    sort_order,
    name
  );

create index if not exists alumni_profiles_created_by_idx
  on public.alumni_profiles (created_by);

drop trigger if exists set_alumni_profiles_updated_at
  on public.alumni_profiles;
create trigger set_alumni_profiles_updated_at
  before update on public.alumni_profiles
  for each row execute procedure public.set_updated_at();

alter table public.alumni_profiles enable row level security;

drop policy if exists "Published alumni profiles are public"
  on public.alumni_profiles;
create policy "Published alumni profiles are public"
on public.alumni_profiles
for select
to anon
using (
  status = 'published'
  and consent_confirmed
  and published_at is not null
  and published_at <= now()
);

drop policy if exists "Authenticated users can read alumni profiles"
  on public.alumni_profiles;
drop policy if exists "Admins and editors can read alumni profiles"
  on public.alumni_profiles;
create policy "Authenticated users can read alumni profiles"
on public.alumni_profiles
for select
to authenticated
using (
  (
    status = 'published'
    and consent_confirmed
    and published_at is not null
    and published_at <= now()
  )
  or public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can create alumni profiles"
  on public.alumni_profiles;
create policy "Admins and editors can create alumni profiles"
on public.alumni_profiles
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = (select auth.uid())
);

drop policy if exists "Admins and editors can update alumni profiles"
  on public.alumni_profiles;
create policy "Admins and editors can update alumni profiles"
on public.alumni_profiles
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete alumni profiles"
  on public.alumni_profiles;
create policy "Admins and editors can delete alumni profiles"
on public.alumni_profiles
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

create table if not exists public.alumni_leadership (
  id uuid primary key default gen_random_uuid(),
  alumni_profile_id uuid not null references public.alumni_profiles(id) on delete cascade,
  organization text not null default '',
  position text not null default '',
  category text not null default 'Student Organization',
  term text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(organization)) > 0),
  check (char_length(trim(position)) > 0)
);

create index if not exists alumni_leadership_profile_order_idx
  on public.alumni_leadership (alumni_profile_id, sort_order, organization, position);

create index if not exists alumni_leadership_created_by_idx
  on public.alumni_leadership (created_by);

drop trigger if exists set_alumni_leadership_updated_at
  on public.alumni_leadership;
create trigger set_alumni_leadership_updated_at
  before update on public.alumni_leadership
  for each row execute procedure public.set_updated_at();

alter table public.alumni_leadership enable row level security;

revoke all on table public.alumni_leadership from anon, authenticated;
grant select on table public.alumni_leadership to anon, authenticated;
grant insert, update, delete on table public.alumni_leadership to authenticated;

drop policy if exists "Published alumni leadership is public"
  on public.alumni_leadership;
create policy "Published alumni leadership is public"
on public.alumni_leadership
for select
to anon
using (
  exists (
    select 1
    from public.alumni_profiles
    where alumni_profiles.id = alumni_leadership.alumni_profile_id
      and alumni_profiles.status = 'published'
      and alumni_profiles.consent_confirmed
      and alumni_profiles.published_at is not null
      and alumni_profiles.published_at <= now()
  )
);

drop policy if exists "Authenticated users can read alumni leadership"
  on public.alumni_leadership;
create policy "Authenticated users can read alumni leadership"
on public.alumni_leadership
for select
to authenticated
using (
  (
    exists (
      select 1
      from public.alumni_profiles
      where alumni_profiles.id = alumni_leadership.alumni_profile_id
        and alumni_profiles.status = 'published'
        and alumni_profiles.consent_confirmed
        and alumni_profiles.published_at is not null
        and alumni_profiles.published_at <= now()
    )
  )
  or public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can create alumni leadership"
  on public.alumni_leadership;
create policy "Admins and editors can create alumni leadership"
on public.alumni_leadership
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = (select auth.uid())
);

drop policy if exists "Admins and editors can update alumni leadership"
  on public.alumni_leadership;
create policy "Admins and editors can update alumni leadership"
on public.alumni_leadership
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete alumni leadership"
  on public.alumni_leadership;
create policy "Admins and editors can delete alumni leadership"
on public.alumni_leadership
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));
