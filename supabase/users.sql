-- Run this file in the Supabase SQL Editor after supabase/schema.sql.

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

create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  email text,
  full_name text,
  student_number text,
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
    profiles.role,
    profiles.status,
    profiles.created_at,
    profiles.updated_at
  from public.profiles as profiles
  join auth.users as users on users.id = profiles.id
  order by profiles.created_at desc;
end;
$$;

create or replace function public.admin_update_profile(
  target_id uuid,
  target_full_name text,
  target_student_number text,
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

  update public.profiles
  set
    full_name = trim(coalesce(target_full_name, '')),
    student_number = nullif(trim(coalesce(target_student_number, '')), ''),
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
  public.app_role,
  public.profile_status
) from public, anon;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.admin_list_profiles() to authenticated;
grant execute on function public.admin_update_profile(
  uuid,
  text,
  text,
  public.app_role,
  public.profile_status
) to authenticated;
