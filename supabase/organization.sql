-- Run this file in the Supabase SQL Editor after supabase/schema.sql.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'organization-media',
  'organization-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.organization_profile (
  id smallint primary key default 1 check (id = 1),
  name text not null,
  overview text not null,
  mission text not null default '',
  vision text not null default '',
  footer_description text not null default '',
  glance_heading text not null,
  glance_description text not null,
  campus_address text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  office_hours text not null default '',
  facebook_url text not null default '',
  instagram_url text not null default '',
  youtube_url text not null default '',
  linkedin_url text not null default '',
  membership_eligibility text not null default '',
  membership_process text not null default '',
  membership_requirements text not null default '',
  years_value integer not null default 0 check (years_value >= 0),
  years_suffix text not null default '+',
  events_value integer not null default 0 check (events_value >= 0),
  events_suffix text not null default '+',
  members_value integer not null default 0 check (members_value >= 0),
  members_suffix text not null default '+',
  curriculum_units_value integer not null default 0
    check (curriculum_units_value >= 0),
  curriculum_units_suffix text not null default '',
  partners_value integer not null default 0 check (partners_value >= 0),
  partners_suffix text not null default '+',
  updated_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_organization_profile_updated_at
  on public.organization_profile;
create trigger set_organization_profile_updated_at
  before update on public.organization_profile
  for each row execute procedure public.set_updated_at();

alter table public.organization_profile enable row level security;

drop policy if exists "Organization profile is public"
  on public.organization_profile;
create policy "Organization profile is public"
on public.organization_profile
for select
to anon, authenticated
using (true);

drop policy if exists "Admins and editors can create organization profile"
  on public.organization_profile;
create policy "Admins and editors can create organization profile"
on public.organization_profile
for insert
to authenticated
with check (
  id = 1
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can update organization profile"
  on public.organization_profile;
create policy "Admins and editors can update organization profile"
on public.organization_profile
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (
  id = 1
  and public.current_user_role() in ('admin', 'editor')
);

create table if not exists public.organization_officers (
  id uuid primary key default gen_random_uuid(),
  person_type text not null default 'officer'
    check (person_type in ('officer', 'faculty')),
  name text not null,
  position text not null,
  academic_year text not null default '',
  photo_path text,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_officers
  add column if not exists person_type text not null default 'officer',
  add column if not exists photo_path text;

alter table public.organization_officers
  drop constraint if exists organization_officers_person_type_check;

alter table public.organization_officers
  add constraint organization_officers_person_type_check
  check (person_type in ('officer', 'faculty'));

create index if not exists organization_officers_sort_idx
  on public.organization_officers (sort_order, person_type, position, name);

drop trigger if exists set_organization_officers_updated_at
  on public.organization_officers;
create trigger set_organization_officers_updated_at
  before update on public.organization_officers
  for each row execute procedure public.set_updated_at();

alter table public.organization_officers enable row level security;

drop policy if exists "Organization officers are public"
  on public.organization_officers;
create policy "Organization officers are public"
on public.organization_officers
for select
to anon, authenticated
using (true);

drop policy if exists "Admins and editors can create officers"
  on public.organization_officers;
create policy "Admins and editors can create officers"
on public.organization_officers
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = (select auth.uid())
);

drop policy if exists "Admins and editors can update officers"
  on public.organization_officers;
create policy "Admins and editors can update officers"
on public.organization_officers
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete officers"
  on public.organization_officers;
create policy "Admins and editors can delete officers"
on public.organization_officers
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

create table if not exists public.organization_milestones (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  description text not null,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_milestones_sort_idx
  on public.organization_milestones (sort_order, year);

drop trigger if exists set_organization_milestones_updated_at
  on public.organization_milestones;
create trigger set_organization_milestones_updated_at
  before update on public.organization_milestones
  for each row execute procedure public.set_updated_at();

alter table public.organization_milestones enable row level security;

drop policy if exists "Organization milestones are public"
  on public.organization_milestones;
create policy "Organization milestones are public"
on public.organization_milestones
for select
to anon, authenticated
using (true);

drop policy if exists "Admins and editors can create milestones"
  on public.organization_milestones;
create policy "Admins and editors can create milestones"
on public.organization_milestones
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = (select auth.uid())
);

drop policy if exists "Admins and editors can update milestones"
  on public.organization_milestones;
create policy "Admins and editors can update milestones"
on public.organization_milestones
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete milestones"
  on public.organization_milestones;
create policy "Admins and editors can delete milestones"
on public.organization_milestones
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can upload organization media"
  on storage.objects;
create policy "Admins and editors can upload organization media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization-media'
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can update organization media"
  on storage.objects;
create policy "Admins and editors can update organization media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization-media'
  and public.current_user_role() in ('admin', 'editor')
)
with check (
  bucket_id = 'organization-media'
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can delete organization media"
  on storage.objects;
create policy "Admins and editors can delete organization media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization-media'
  and public.current_user_role() in ('admin', 'editor')
);

insert into public.organization_profile (
  id,
  name,
  overview,
  mission,
  vision,
  footer_description,
  glance_heading,
  glance_description,
  campus_address,
  membership_eligibility,
  membership_process,
  membership_requirements,
  years_value,
  events_value,
  members_value,
  curriculum_units_value,
  partners_value
)
values (
  1,
  'NwSSU Computer Engineering Organization',
  'A student-led community for Computer Engineering students at Northwest Samar State University, supporting learning, collaboration, technical growth, and meaningful student involvement.',
  '',
  '',
  'Developing capable, ethical, and innovative computer engineers through learning, service, and collaboration.',
  'NwSSU Computer Engineering Organization at a Glance',
  'A student-led organization committed to excellence, innovation, collaboration, and the advancement of Computer Engineering.',
  'CEA Building, NwSSU Main Campus, Calbayog City, Samar',
  '',
  '',
  '',
  25,
  50,
  300,
  179,
  10
)
on conflict (id) do nothing;
