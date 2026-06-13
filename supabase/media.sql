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

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text not null,
  body text not null,
  image_path text,
  image_alt text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_posts_public_listing_idx
  on public.news_posts (status, is_featured desc, published_at desc);

drop trigger if exists set_news_posts_updated_at on public.news_posts;
create trigger set_news_posts_updated_at
  before update on public.news_posts
  for each row execute procedure public.set_updated_at();

alter table public.news_posts enable row level security;

drop policy if exists "Published news is public" on public.news_posts;
create policy "Published news is public"
on public.news_posts
for select
to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists "Admins and editors can read news" on public.news_posts;
create policy "Admins and editors can read news"
on public.news_posts
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can create news" on public.news_posts;
create policy "Admins and editors can create news"
on public.news_posts
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = auth.uid()
);

drop policy if exists "Admins and editors can update news" on public.news_posts;
create policy "Admins and editors can update news"
on public.news_posts
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete news" on public.news_posts;
create policy "Admins and editors can delete news"
on public.news_posts
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album text not null,
  category text not null,
  description text not null default '',
  alt_text text not null,
  image_path text not null unique,
  captured_on date not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_photos_public_listing_idx
  on public.gallery_photos (status, captured_on desc, sort_order, created_at);

drop trigger if exists set_gallery_photos_updated_at
  on public.gallery_photos;
create trigger set_gallery_photos_updated_at
  before update on public.gallery_photos
  for each row execute procedure public.set_updated_at();

alter table public.gallery_photos enable row level security;

drop policy if exists "Published gallery photos are public"
  on public.gallery_photos;
create policy "Published gallery photos are public"
on public.gallery_photos
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins and editors can read gallery photos"
  on public.gallery_photos;
create policy "Admins and editors can read gallery photos"
on public.gallery_photos
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can create gallery photos"
  on public.gallery_photos;
create policy "Admins and editors can create gallery photos"
on public.gallery_photos
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = auth.uid()
);

drop policy if exists "Admins and editors can update gallery photos"
  on public.gallery_photos;
create policy "Admins and editors can update gallery photos"
on public.gallery_photos
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete gallery photos"
  on public.gallery_photos;
create policy "Admins and editors can delete gallery photos"
on public.gallery_photos
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
