-- Run this file in the Supabase SQL Editor after supabase/schema.sql.

create or replace function public.current_user_is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
  );
$$;

create table if not exists public.student_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null
    check (
      category in ('reviewers', 'lecture-notes', 'lab-manuals', 'tutorials')
    ),
  description text not null default '',
  course_code text not null default '',
  academic_year text not null default '',
  file_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  external_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (file_path is not null and external_url is null)
    or (file_path is null and external_url is not null)
  )
);

create index if not exists student_resources_listing_idx
  on public.student_resources (
    status,
    category,
    sort_order,
    title
  );

create index if not exists student_resources_created_by_idx
  on public.student_resources (created_by);

drop trigger if exists set_student_resources_updated_at
  on public.student_resources;
create trigger set_student_resources_updated_at
  before update on public.student_resources
  for each row execute procedure public.set_updated_at();

alter table public.student_resources enable row level security;

drop policy if exists "Approved members and staff can read resources"
  on public.student_resources;
create policy "Approved members and staff can read resources"
on public.student_resources
for select
to authenticated
using (
  (
    status = 'published'
    and public.current_user_is_approved()
  )
  or public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can read resources"
  on public.student_resources;

drop policy if exists "Admins and editors can create resources"
  on public.student_resources;
create policy "Admins and editors can create resources"
on public.student_resources
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = (select auth.uid())
);

revoke all on function public.current_user_is_approved() from public, anon;
grant execute on function public.current_user_is_approved() to authenticated;

drop policy if exists "Admins and editors can update resources"
  on public.student_resources;
create policy "Admins and editors can update resources"
on public.student_resources
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete resources"
  on public.student_resources;
create policy "Admins and editors can delete resources"
on public.student_resources
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'student-resources',
  'student-resources',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Approved members can download student resources"
  on storage.objects;
create policy "Approved members can download student resources"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-resources'
  and public.current_user_is_approved()
);

drop policy if exists "Admins and editors can upload student resources"
  on storage.objects;
create policy "Admins and editors can upload student resources"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-resources'
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can update student resources"
  on storage.objects;
create policy "Admins and editors can update student resources"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-resources'
  and public.current_user_role() in ('admin', 'editor')
)
with check (
  bucket_id = 'student-resources'
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can delete student resources"
  on storage.objects;
create policy "Admins and editors can delete student resources"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-resources'
  and public.current_user_role() in ('admin', 'editor')
);
