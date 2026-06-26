-- Run this file in the Supabase SQL Editor after supabase/users.sql.

alter table public.profiles
  add column if not exists nickname text not null default '';

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

drop policy if exists "Approved users can view profile avatars"
  on storage.objects;
create policy "Approved users can view profile avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.current_user_role() is not null
);

drop policy if exists "Approved users can upload their own profile avatar"
  on storage.objects;
create policy "Approved users can upload their own profile avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and public.current_user_role() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Approved users can update their own profile avatar"
  on storage.objects;
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

drop policy if exists "Approved users can delete their own profile avatar"
  on storage.objects;
create policy "Approved users can delete their own profile avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.current_user_role() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
