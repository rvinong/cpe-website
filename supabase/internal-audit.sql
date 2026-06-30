-- Run this file in the Supabase SQL Editor after supabase/schema.sql.

create table if not exists public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  report_type text not null
    check (report_type in ('accomplishment', 'liquidation', 'resolution')),
  period text not null default '',
  summary text not null default '',
  prepared_by text not null default '',
  reviewed_by text not null default '',
  approved_by text not null default '',
  resolution_number text not null default '',
  funds_received numeric(12, 2) check (funds_received is null or funds_received >= 0),
  total_expenses numeric(12, 2) check (total_expenses is null or total_expenses >= 0),
  remaining_balance numeric(12, 2) check (remaining_balance is null or remaining_balance >= 0),
  file_path text,
  file_name text,
  file_size bigint check (file_size is null or file_size >= 0),
  mime_type text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audit_reports_public_listing_idx
  on public.audit_reports (
    is_featured desc,
    published_at desc,
    sort_order,
    title
  )
  where status = 'published'
    and published_at is not null;

create index if not exists audit_reports_admin_listing_idx
  on public.audit_reports (updated_at desc);

create index if not exists audit_reports_created_by_idx
  on public.audit_reports (created_by);

drop trigger if exists set_audit_reports_updated_at
  on public.audit_reports;
create trigger set_audit_reports_updated_at
  before update on public.audit_reports
  for each row execute procedure public.set_updated_at();

alter table public.audit_reports enable row level security;

drop policy if exists "Published audit reports are public"
  on public.audit_reports;
create policy "Published audit reports are public"
on public.audit_reports
for select
to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists "Admins and editors can read audit reports"
  on public.audit_reports;
create policy "Admins and editors can read audit reports"
on public.audit_reports
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can create audit reports"
  on public.audit_reports;
create policy "Admins and editors can create audit reports"
on public.audit_reports
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = (select auth.uid())
);

drop policy if exists "Admins and editors can update audit reports"
  on public.audit_reports;
create policy "Admins and editors can update audit reports"
on public.audit_reports
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete audit reports"
  on public.audit_reports;
create policy "Admins and editors can delete audit reports"
on public.audit_reports
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
  'internal-audit-reports',
  'internal-audit-reports',
  false,
  20971520,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Published audit report files are public"
  on storage.objects;
create policy "Published audit report files are public"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'internal-audit-reports'
  and exists (
    select 1
    from public.audit_reports
    where audit_reports.file_path = storage.objects.name
      and audit_reports.status = 'published'
      and audit_reports.published_at is not null
      and audit_reports.published_at <= now()
  )
);

drop policy if exists "Admins and editors can read audit report files"
  on storage.objects;
create policy "Admins and editors can read audit report files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'internal-audit-reports'
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can upload audit report files"
  on storage.objects;
create policy "Admins and editors can upload audit report files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'internal-audit-reports'
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can update audit report files"
  on storage.objects;
create policy "Admins and editors can update audit report files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'internal-audit-reports'
  and public.current_user_role() in ('admin', 'editor')
)
with check (
  bucket_id = 'internal-audit-reports'
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Admins and editors can delete audit report files"
  on storage.objects;
create policy "Admins and editors can delete audit report files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'internal-audit-reports'
  and public.current_user_role() in ('admin', 'editor')
);
