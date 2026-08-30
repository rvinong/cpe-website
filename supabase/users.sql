-- Run this file in the Supabase SQL Editor after supabase/schema.sql.

alter table public.profiles
  add column if not exists year_level text not null default '';

update public.profiles
set year_level = ''
where year_level = 'Irregular';

alter table public.profiles
  drop constraint if exists profiles_year_level_check;

alter table public.profiles
  add constraint profiles_year_level_check
  check (
    year_level in (
      '',
      '1st Year',
      '2nd Year',
      '3rd Year',
      '4th Year'
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    student_number,
    year_level,
    email_notifications
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'student_number', ''),
    case
      when coalesce(new.raw_user_meta_data ->> 'year_level', '') in (
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year'
      )
      then coalesce(new.raw_user_meta_data ->> 'year_level', '')
      else ''
    end,
    case
      when lower(
        coalesce(new.raw_user_meta_data ->> 'email_notifications', 'true')
      ) = 'false' then false
      else true
    end
  );
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and status = 'approved';
$$;

drop policy if exists "Admins and editors can read profiles"
  on public.profiles;
drop policy if exists "Admins can read profiles"
  on public.profiles;
drop policy if exists "Users can read their own profile"
  on public.profiles;
drop policy if exists "Users can read permitted profiles"
  on public.profiles;
create policy "Users can read permitted profiles"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.current_user_role() = 'admin'
);

drop policy if exists "Admins can update profiles and roles"
  on public.profiles;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop function if exists public.admin_list_profiles();
create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  email text,
  full_name text,
  student_number text,
  year_level text,
  role public.app_role,
  status public.profile_status,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public.current_user_role()
    is distinct from 'admin'::public.app_role
  then
    raise exception 'Administrator access required';
  end if;

  return query
  select
    profiles.id,
    users.email::text,
    profiles.full_name,
    profiles.student_number,
    profiles.year_level,
    profiles.role,
    profiles.status,
    profiles.created_at,
    profiles.updated_at
  from public.profiles as profiles
  join auth.users as users on users.id = profiles.id
  order by profiles.created_at desc;
end;
$$;

drop function if exists public.admin_update_profile(
  uuid,
  text,
  text,
  public.app_role,
  public.profile_status
);
create or replace function public.admin_update_profile(
  target_id uuid,
  target_full_name text,
  target_student_number text,
  target_year_level text,
  target_role public.app_role,
  target_status public.profile_status
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles;
  updated_profile public.profiles;
  active_admin_count integer;
  clean_year_level text;
begin
  if public.current_user_role()
    is distinct from 'admin'::public.app_role
  then
    raise exception 'Administrator access required';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = target_id;

  if current_profile.id is null then
    raise exception 'Profile not found';
  end if;

  if target_id = auth.uid()
    and (
      target_role is distinct from current_profile.role
      or target_status is distinct from current_profile.status
    )
  then
    raise exception 'You cannot change your own role or account status';
  end if;

  if current_profile.role = 'admin'
    and current_profile.status = 'approved'
    and (target_role <> 'admin' or target_status <> 'approved')
  then
    select count(*)
    into active_admin_count
    from public.profiles
    where role = 'admin'
      and status = 'approved';

    if active_admin_count <= 1 then
      raise exception 'At least one approved administrator is required';
    end if;
  end if;

  clean_year_level := trim(coalesce(target_year_level, ''));

  if clean_year_level not in (
    '',
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
  ) then
    raise exception 'Invalid year level';
  end if;

  update public.profiles
  set
    full_name = trim(coalesce(target_full_name, '')),
    student_number = nullif(trim(coalesce(target_student_number, '')), ''),
    year_level = clean_year_level,
    role = target_role,
    status = target_status
  where id = target_id
  returning * into updated_profile;

  return updated_profile;
end;
$$;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.admin_list_profiles() from public, anon;
revoke all on function public.admin_update_profile(
  uuid,
  text,
  text,
  text,
  public.app_role,
  public.profile_status
) from public, anon;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.admin_list_profiles() to authenticated;
grant execute on function public.admin_update_profile(
  uuid,
  text,
  text,
  text,
  public.app_role,
  public.profile_status
) to authenticated;
