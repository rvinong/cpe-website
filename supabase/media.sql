-- Run this file in the Supabase SQL Editor after supabase/schema.sql.

alter table public.profiles
  add column if not exists nickname text not null default '';

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
  card_image_path text,
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

alter table public.news_posts
  add column if not exists card_image_path text;

update public.news_posts
set card_image_path = image_path
where card_image_path is null
  and image_path is not null;

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

create table if not exists public.news_post_images (
  id uuid primary key default gen_random_uuid(),
  news_post_id uuid not null references public.news_posts(id) on delete cascade,
  image_path text not null unique,
  card_image_path text,
  alt_text text not null default '',
  caption text not null default '',
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_post_images
  add column if not exists card_image_path text;

update public.news_post_images
set card_image_path = image_path
where card_image_path is null;

create index if not exists news_post_images_post_order_idx
  on public.news_post_images (news_post_id, sort_order, created_at);

drop trigger if exists set_news_post_images_updated_at
  on public.news_post_images;
create trigger set_news_post_images_updated_at
  before update on public.news_post_images
  for each row execute procedure public.set_updated_at();

alter table public.news_post_images enable row level security;

drop policy if exists "Published news images are public"
  on public.news_post_images;
create policy "Published news images are public"
on public.news_post_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.news_posts
    where news_posts.id = news_post_images.news_post_id
      and news_posts.status = 'published'
      and news_posts.published_at is not null
      and news_posts.published_at <= now()
  )
);

drop policy if exists "Admins and editors can read news images"
  on public.news_post_images;
create policy "Admins and editors can read news images"
on public.news_post_images
for select
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can create news images"
  on public.news_post_images;
create policy "Admins and editors can create news images"
on public.news_post_images
for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'editor')
  and created_by = auth.uid()
);

drop policy if exists "Admins and editors can update news images"
  on public.news_post_images;
create policy "Admins and editors can update news images"
on public.news_post_images
for update
to authenticated
using (public.current_user_role() in ('admin', 'editor'))
with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Admins and editors can delete news images"
  on public.news_post_images;
create policy "Admins and editors can delete news images"
on public.news_post_images
for delete
to authenticated
using (public.current_user_role() in ('admin', 'editor'));

insert into public.news_post_images (
  news_post_id,
  image_path,
  card_image_path,
  alt_text,
  sort_order,
  created_by
)
select
  news_posts.id,
  news_posts.image_path,
  coalesce(news_posts.card_image_path, news_posts.image_path),
  news_posts.image_alt,
  0,
  news_posts.created_by
from public.news_posts
where news_posts.image_path is not null
  and news_posts.image_path <> ''
  and not exists (
    select 1
    from public.news_post_images
    where news_post_images.news_post_id = news_posts.id
      and news_post_images.image_path = news_posts.image_path
  );

create table if not exists public.news_reactions (
  id uuid primary key default gen_random_uuid(),
  news_post_id uuid not null references public.news_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null
    check (reaction_type in ('like', 'love', 'celebrate', 'wow', 'support')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (news_post_id, user_id)
);

create index if not exists news_reactions_post_type_idx
  on public.news_reactions (news_post_id, reaction_type);

drop trigger if exists set_news_reactions_updated_at
  on public.news_reactions;
create trigger set_news_reactions_updated_at
  before update on public.news_reactions
  for each row execute procedure public.set_updated_at();

alter table public.news_reactions enable row level security;

drop policy if exists "Signed-in users can react to published news"
  on public.news_reactions;
create policy "Signed-in users can react to published news"
on public.news_reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.news_posts
    where news_posts.id = news_reactions.news_post_id
      and news_posts.status = 'published'
      and news_posts.published_at is not null
      and news_posts.published_at <= now()
  )
);

drop policy if exists "Signed-in users can update their news reactions"
  on public.news_reactions;
create policy "Signed-in users can update their news reactions"
on public.news_reactions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Signed-in users can delete their news reactions"
  on public.news_reactions;
create policy "Signed-in users can delete their news reactions"
on public.news_reactions
for delete
to authenticated
using (user_id = auth.uid());

drop function if exists public.set_news_reaction(uuid, text);
drop function if exists public.clear_news_reaction(uuid);
drop function if exists public.get_news_reaction_summary(uuid);
drop function if exists public.get_news_reaction_members(uuid, text);

create or replace function public.get_news_reaction_summary(
  selected_news_post_id uuid
)
returns table (
  reaction_type text,
  total integer,
  user_reaction text,
  reactor_names text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_reaction text;
begin
  if not exists (
    select 1
    from public.news_posts
    where id = selected_news_post_id
      and status = 'published'
      and published_at is not null
      and published_at <= now()
  ) and coalesce(public.current_user_role() in ('admin', 'editor'), false) = false then
    return;
  end if;

  if auth.uid() is not null then
    select news_reactions.reaction_type
    into current_reaction
    from public.news_reactions
    where news_reactions.news_post_id = selected_news_post_id
      and news_reactions.user_id = auth.uid()
    limit 1;
  end if;

  return query
  with allowed_reactions as (
    select unnest(
      array['like', 'love', 'celebrate', 'wow', 'support']::text[]
    ) as reaction_type
  ),
  ranked_reactor_names as (
    select
      news_reactions.reaction_type,
      coalesce(
        nullif(trim(profiles.nickname), ''),
        nullif(trim(profiles.full_name), ''),
        'Member'
      ) as full_name,
      row_number() over (
        partition by news_reactions.reaction_type
        order by news_reactions.updated_at desc, profiles.full_name
      ) as name_rank
    from public.news_reactions
    join public.profiles
      on profiles.id = news_reactions.user_id
    where news_reactions.news_post_id = selected_news_post_id
      and profiles.status = 'approved'
      and auth.uid() is not null
      and news_reactions.user_id <> auth.uid()
  ),
  reaction_name_previews as (
    select
      ranked_reactor_names.reaction_type,
      array_agg(
        ranked_reactor_names.full_name
        order by ranked_reactor_names.name_rank
      ) as reactor_names
    from ranked_reactor_names
    where ranked_reactor_names.name_rank <= 3
    group by ranked_reactor_names.reaction_type
  )
  select
    allowed_reactions.reaction_type,
    count(news_reactions.id)::integer as total,
    current_reaction as user_reaction,
    coalesce(
      reaction_name_previews.reactor_names,
      array[]::text[]
    ) as reactor_names
  from allowed_reactions
  left join public.news_reactions
    on news_reactions.news_post_id = selected_news_post_id
    and news_reactions.reaction_type = allowed_reactions.reaction_type
  left join reaction_name_previews
    on reaction_name_previews.reaction_type = allowed_reactions.reaction_type
  group by allowed_reactions.reaction_type, reaction_name_previews.reactor_names
  order by array_position(
    array['like', 'love', 'celebrate', 'wow', 'support']::text[],
    allowed_reactions.reaction_type
  );
end;
$$;

create or replace function public.set_news_reaction(
  selected_news_post_id uuid,
  selected_reaction_type text
)
returns table (
  reaction_type text,
  total integer,
  user_reaction text,
  reactor_names text[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if selected_reaction_type not in (
    'like',
    'love',
    'celebrate',
    'wow',
    'support'
  ) then
    raise exception 'Unsupported reaction type';
  end if;

  if not exists (
    select 1
    from public.news_posts
    where id = selected_news_post_id
      and status = 'published'
      and published_at is not null
      and published_at <= now()
  ) then
    raise exception 'News story not found';
  end if;

  insert into public.news_reactions (
    news_post_id,
    user_id,
    reaction_type
  )
  values (
    selected_news_post_id,
    auth.uid(),
    selected_reaction_type
  )
  on conflict (news_post_id, user_id)
  do update set
    reaction_type = excluded.reaction_type,
    updated_at = now();

  return query
  select *
  from public.get_news_reaction_summary(selected_news_post_id);
end;
$$;

create or replace function public.clear_news_reaction(
  selected_news_post_id uuid
)
returns table (
  reaction_type text,
  total integer,
  user_reaction text,
  reactor_names text[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  delete from public.news_reactions
  where news_post_id = selected_news_post_id
    and user_id = auth.uid();

  return query
  select *
  from public.get_news_reaction_summary(selected_news_post_id);
end;
$$;

create or replace function public.get_news_reaction_members(
  selected_news_post_id uuid,
  selected_reaction_type text
)
returns table (
  profile_id uuid,
  full_name text,
  avatar_path text,
  reaction_type text,
  reacted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if selected_reaction_type not in (
    'like',
    'love',
    'celebrate',
    'wow',
    'support'
  ) then
    raise exception 'Unsupported reaction type';
  end if;

  if not exists (
    select 1
    from public.news_posts
    where id = selected_news_post_id
      and status = 'published'
      and published_at is not null
      and published_at <= now()
  ) then
    raise exception 'News story not found';
  end if;

  return query
  select
    profiles.id as profile_id,
    coalesce(
      nullif(trim(profiles.nickname), ''),
      nullif(trim(profiles.full_name), ''),
      'Member'
    ) as full_name,
    profiles.avatar_path,
    news_reactions.reaction_type,
    news_reactions.updated_at as reacted_at
  from public.news_reactions
  join public.profiles
    on profiles.id = news_reactions.user_id
  where news_reactions.news_post_id = selected_news_post_id
    and news_reactions.reaction_type = selected_reaction_type
    and profiles.status = 'approved'
  order by news_reactions.updated_at desc, profiles.full_name;
end;
$$;

revoke all on function public.get_news_reaction_summary(uuid)
  from public, anon;
revoke all on function public.set_news_reaction(uuid, text)
  from public, anon;
revoke all on function public.clear_news_reaction(uuid)
  from public, anon;
revoke all on function public.get_news_reaction_members(uuid, text)
  from public, anon;

grant execute on function public.get_news_reaction_summary(uuid)
  to anon, authenticated;
grant execute on function public.set_news_reaction(uuid, text)
  to authenticated;
grant execute on function public.clear_news_reaction(uuid)
  to authenticated;
grant execute on function public.get_news_reaction_members(uuid, text)
  to authenticated;

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  news_post_id uuid not null references public.news_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.news_comments(id) on delete cascade,
  body text not null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(body)) between 1 and 1000)
);

create index if not exists news_comments_post_created_idx
  on public.news_comments (news_post_id, created_at desc)
  where deleted_at is null;

create index if not exists news_comments_parent_created_idx
  on public.news_comments (parent_comment_id, created_at)
  where deleted_at is null;

create index if not exists news_comments_user_idx
  on public.news_comments (user_id);

drop trigger if exists set_news_comments_updated_at
  on public.news_comments;
create trigger set_news_comments_updated_at
  before update on public.news_comments
  for each row execute procedure public.set_updated_at();

alter table public.news_comments enable row level security;

drop policy if exists "Published news comments are public"
  on public.news_comments;
create policy "Published news comments are public"
on public.news_comments
for select
to anon, authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.news_posts
    where news_posts.id = news_comments.news_post_id
      and news_posts.status = 'published'
      and news_posts.published_at is not null
      and news_posts.published_at <= now()
  )
  and (
    parent_comment_id is null
    or exists (
      select 1
      from public.news_comments as parent_comments
      where parent_comments.id = news_comments.parent_comment_id
        and parent_comments.news_post_id = news_comments.news_post_id
        and parent_comments.parent_comment_id is null
        and parent_comments.deleted_at is null
    )
  )
);

drop policy if exists "Approved users can create news comments"
  on public.news_comments;
create policy "Approved users can create news comments"
on public.news_comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.current_user_role() is not null
  and deleted_at is null
  and deleted_by is null
  and exists (
    select 1
    from public.news_posts
    where news_posts.id = news_comments.news_post_id
      and news_posts.status = 'published'
      and news_posts.published_at is not null
      and news_posts.published_at <= now()
  )
  and (
    parent_comment_id is null
    or exists (
      select 1
      from public.news_comments as parent_comments
      where parent_comments.id = news_comments.parent_comment_id
        and parent_comments.news_post_id = news_comments.news_post_id
        and parent_comments.parent_comment_id is null
        and parent_comments.deleted_at is null
    )
  )
);

drop policy if exists "Authors and staff can soft delete news comments"
  on public.news_comments;
create policy "Authors and staff can soft delete news comments"
on public.news_comments
for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'editor')
)
with check (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'editor')
);

drop function if exists public.get_news_comment_summary(uuid);
drop function if exists public.list_news_comments(uuid);
drop function if exists public.create_news_comment(uuid, uuid, text);
drop function if exists public.delete_news_comment(uuid);

create or replace function public.get_news_comment_summary(
  selected_news_post_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  visible_count integer;
begin
  if not exists (
    select 1
    from public.news_posts
    where news_posts.id = selected_news_post_id
      and news_posts.status = 'published'
      and news_posts.published_at is not null
      and news_posts.published_at <= now()
  ) and coalesce(public.current_user_role() in ('admin', 'editor'), false) = false then
    return 0;
  end if;

  select count(*)::integer
  into visible_count
  from public.news_comments as visible_comments
  where visible_comments.news_post_id = selected_news_post_id
    and visible_comments.deleted_at is null
    and (
      visible_comments.parent_comment_id is null
      or exists (
        select 1
        from public.news_comments as parent_comments
        where parent_comments.id = visible_comments.parent_comment_id
          and parent_comments.news_post_id = visible_comments.news_post_id
          and parent_comments.parent_comment_id is null
          and parent_comments.deleted_at is null
      )
    );

  return coalesce(visible_count, 0);
end;
$$;

create or replace function public.list_news_comments(
  selected_news_post_id uuid
)
returns table (
  id uuid,
  parent_comment_id uuid,
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
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.news_posts
    where news_posts.id = selected_news_post_id
      and news_posts.status = 'published'
      and news_posts.published_at is not null
      and news_posts.published_at <= now()
  ) then
    return;
  end if;

  return query
  select
    news_comments.id,
    news_comments.parent_comment_id,
    profiles.id as profile_id,
    coalesce(
      nullif(trim(profiles.nickname), ''),
      nullif(trim(profiles.full_name), ''),
      'Member'
    ) as full_name,
    profiles.avatar_path,
    news_comments.body,
    news_comments.created_at,
    news_comments.updated_at,
    (
      auth.uid() = news_comments.user_id
      or public.current_user_role() in ('admin', 'editor')
    ) as can_delete
  from public.news_comments
  join public.profiles
    on profiles.id = news_comments.user_id
  where news_comments.news_post_id = selected_news_post_id
    and news_comments.deleted_at is null
    and profiles.status = 'approved'
    and (
      news_comments.parent_comment_id is null
      or exists (
        select 1
        from public.news_comments as parent_comments
        where parent_comments.id = news_comments.parent_comment_id
          and parent_comments.news_post_id = news_comments.news_post_id
          and parent_comments.parent_comment_id is null
          and parent_comments.deleted_at is null
      )
    )
  order by
    case when news_comments.parent_comment_id is null then 0 else 1 end,
    case
      when news_comments.parent_comment_id is null
        then extract(epoch from news_comments.created_at) * -1
      else extract(epoch from news_comments.created_at)
    end;
end;
$$;

create or replace function public.create_news_comment(
  selected_news_post_id uuid,
  selected_parent_comment_id uuid,
  comment_body text
)
returns table (
  id uuid,
  parent_comment_id uuid,
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
set search_path = public
as $$
declare
  clean_body text;
  inserted_comment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'approved'
  ) then
    raise exception 'Approved account required';
  end if;

  if not exists (
    select 1
    from public.news_posts
    where news_posts.id = selected_news_post_id
      and news_posts.status = 'published'
      and news_posts.published_at is not null
      and news_posts.published_at <= now()
  ) then
    raise exception 'News story not found';
  end if;

  clean_body := trim(coalesce(comment_body, ''));

  if clean_body = '' then
    raise exception 'Comment cannot be empty';
  end if;

  if char_length(clean_body) > 1000 then
    raise exception 'Comment must be 1000 characters or fewer';
  end if;

  if selected_parent_comment_id is not null then
    if not exists (
      select 1
      from public.news_comments as parent_comments
      where parent_comments.id = selected_parent_comment_id
        and parent_comments.news_post_id = selected_news_post_id
        and parent_comments.parent_comment_id is null
        and parent_comments.deleted_at is null
    ) then
      raise exception 'Replies can only be added to visible parent comments';
    end if;
  end if;

  insert into public.news_comments (
    news_post_id,
    user_id,
    parent_comment_id,
    body
  )
  values (
    selected_news_post_id,
    auth.uid(),
    selected_parent_comment_id,
    clean_body
  )
  returning news_comments.id into inserted_comment_id;

  return query
  select *
  from public.list_news_comments(selected_news_post_id) as comment_rows
  where comment_rows.id = inserted_comment_id;
end;
$$;

create or replace function public.delete_news_comment(
  selected_comment_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_news_post_id uuid;
  target_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select news_comments.news_post_id, news_comments.user_id
  into target_news_post_id, target_user_id
  from public.news_comments
  where news_comments.id = selected_comment_id
    and news_comments.deleted_at is null;

  if target_news_post_id is null then
    raise exception 'Comment not found';
  end if;

  if target_user_id <> auth.uid()
    and coalesce(public.current_user_role() in ('admin', 'editor'), false) = false
  then
    raise exception 'Not allowed to delete this comment';
  end if;

  update public.news_comments
  set
    deleted_at = now(),
    deleted_by = auth.uid()
  where news_comments.id = selected_comment_id
    and news_comments.deleted_at is null;

  return public.get_news_comment_summary(target_news_post_id);
end;
$$;

revoke all on function public.get_news_comment_summary(uuid)
  from public, anon;
revoke all on function public.list_news_comments(uuid)
  from public, anon;
revoke all on function public.create_news_comment(uuid, uuid, text)
  from public, anon;
revoke all on function public.delete_news_comment(uuid)
  from public, anon;

grant execute on function public.get_news_comment_summary(uuid)
  to anon, authenticated;
grant execute on function public.list_news_comments(uuid)
  to anon, authenticated;
grant execute on function public.create_news_comment(uuid, uuid, text)
  to authenticated;
grant execute on function public.delete_news_comment(uuid)
  to authenticated;

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album text not null,
  category text not null,
  description text not null default '',
  alt_text text not null,
  image_path text not null unique,
  card_image_path text,
  captured_on date not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gallery_photos
  add column if not exists card_image_path text;

update public.gallery_photos
set card_image_path = image_path
where card_image_path is null;

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
