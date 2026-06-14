-- Run this file in the Supabase SQL Editor after supabase/users.sql.

alter table public.profiles
  add column if not exists avatar_path text;

create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null
    default auth.uid(),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_tasks_assigned_to_status_idx
  on public.team_tasks (assigned_to, status, due_date);

create index if not exists team_tasks_assigned_by_idx
  on public.team_tasks (assigned_by);

drop trigger if exists set_team_tasks_updated_at on public.team_tasks;
create trigger set_team_tasks_updated_at
  before update on public.team_tasks
  for each row execute procedure public.set_updated_at();

alter table public.team_tasks enable row level security;
revoke all on table public.team_tasks from anon, authenticated;

drop policy if exists "Team tasks use protected functions"
  on public.team_tasks;
create policy "Team tasks use protected functions"
on public.team_tasks
for all
to authenticated
using (false)
with check (false);

create or replace function public.staff_list_team_members()
returns table (
  id uuid,
  email text,
  full_name text,
  role public.app_role,
  avatar_path text,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  staff_role public.app_role;
begin
  staff_role := public.current_user_role();

  if staff_role is distinct from 'admin'::public.app_role
    and staff_role is distinct from 'editor'::public.app_role
  then
    raise exception 'Approved staff access required';
  end if;

  return query
  select
    profiles.id,
    users.email::text,
    profiles.full_name,
    profiles.role,
    profiles.avatar_path,
    profiles.created_at
  from public.profiles as profiles
  join auth.users as users on users.id = profiles.id
  where profiles.status = 'approved'
    and profiles.role in ('admin', 'editor')
  order by
    case when profiles.role = 'admin' then 0 else 1 end,
    profiles.full_name;
end;
$$;

create or replace function public.staff_list_team_tasks()
returns table (
  id uuid,
  title text,
  description text,
  assigned_to uuid,
  assigned_by uuid,
  status text,
  priority text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  assignee_name text,
  assignee_avatar_path text,
  assigner_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role public.app_role;
begin
  staff_role := public.current_user_role();

  if staff_role is distinct from 'admin'::public.app_role
    and staff_role is distinct from 'editor'::public.app_role
  then
    raise exception 'Approved staff access required';
  end if;

  return query
  select
    tasks.id,
    tasks.title,
    tasks.description,
    tasks.assigned_to,
    tasks.assigned_by,
    tasks.status,
    tasks.priority,
    tasks.due_date,
    tasks.completed_at,
    tasks.created_at,
    tasks.updated_at,
    assignee.full_name as assignee_name,
    assignee.avatar_path as assignee_avatar_path,
    assigner.full_name as assigner_name
  from public.team_tasks as tasks
  join public.profiles as assignee on assignee.id = tasks.assigned_to
  left join public.profiles as assigner on assigner.id = tasks.assigned_by
  where staff_role = 'admin'
    or tasks.assigned_to = auth.uid()
  order by
    case tasks.status
      when 'blocked' then 0
      when 'in_progress' then 1
      when 'todo' then 2
      else 3
    end,
    tasks.due_date nulls last,
    tasks.created_at desc;
end;
$$;

create or replace function public.admin_create_team_task(
  task_title text,
  task_description text,
  task_assigned_to uuid,
  task_priority text,
  task_due_date date
)
returns public.team_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  created_task public.team_tasks;
begin
  if public.current_user_role()
    is distinct from 'admin'::public.app_role
  then
    raise exception 'Administrator access required';
  end if;

  if nullif(trim(coalesce(task_title, '')), '') is null then
    raise exception 'Task title is required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = task_assigned_to
      and role = 'editor'
      and status = 'approved'
  ) then
    raise exception 'Tasks can only be assigned to approved editors';
  end if;

  insert into public.team_tasks (
    title,
    description,
    assigned_to,
    assigned_by,
    priority,
    due_date
  )
  values (
    trim(task_title),
    trim(coalesce(task_description, '')),
    task_assigned_to,
    auth.uid(),
    task_priority,
    task_due_date
  )
  returning * into created_task;

  return created_task;
end;
$$;

create or replace function public.admin_update_team_task(
  target_id uuid,
  task_title text,
  task_description text,
  task_assigned_to uuid,
  task_status text,
  task_priority text,
  task_due_date date
)
returns public.team_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  current_task public.team_tasks;
  updated_task public.team_tasks;
begin
  if public.current_user_role()
    is distinct from 'admin'::public.app_role
  then
    raise exception 'Administrator access required';
  end if;

  select *
  into current_task
  from public.team_tasks
  where id = target_id;

  if current_task.id is null then
    raise exception 'Task not found';
  end if;

  if nullif(trim(coalesce(task_title, '')), '') is null then
    raise exception 'Task title is required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = task_assigned_to
      and role = 'editor'
      and status = 'approved'
  ) then
    raise exception 'Tasks can only be assigned to approved editors';
  end if;

  update public.team_tasks
  set
    title = trim(task_title),
    description = trim(coalesce(task_description, '')),
    assigned_to = task_assigned_to,
    status = task_status,
    priority = task_priority,
    due_date = task_due_date,
    completed_at = case
      when task_status = 'done'
        then coalesce(current_task.completed_at, now())
      else null
    end
  where id = target_id
  returning * into updated_task;

  return updated_task;
end;
$$;

create or replace function public.staff_update_team_task_status(
  target_id uuid,
  next_status text
)
returns public.team_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role public.app_role;
  current_task public.team_tasks;
  updated_task public.team_tasks;
begin
  staff_role := public.current_user_role();

  if next_status not in ('todo', 'in_progress', 'blocked', 'done') then
    raise exception 'Invalid task status';
  end if;

  select *
  into current_task
  from public.team_tasks
  where id = target_id;

  if current_task.id is null then
    raise exception 'Task not found';
  end if;

  if staff_role is distinct from 'admin'::public.app_role
    and (
      staff_role is distinct from 'editor'::public.app_role
      or current_task.assigned_to is distinct from auth.uid()
    )
  then
    raise exception 'You can only update tasks assigned to you';
  end if;

  update public.team_tasks
  set
    status = next_status,
    completed_at = case
      when next_status = 'done'
        then coalesce(current_task.completed_at, now())
      else null
    end
  where id = target_id
  returning * into updated_task;

  return updated_task;
end;
$$;

create or replace function public.admin_delete_team_task(target_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role()
    is distinct from 'admin'::public.app_role
  then
    raise exception 'Administrator access required';
  end if;

  delete from public.team_tasks where id = target_id;
  return found;
end;
$$;

create or replace function public.staff_set_avatar_path(
  target_avatar_path text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_role public.app_role;
  clean_path text;
begin
  staff_role := public.current_user_role();

  if staff_role is distinct from 'admin'::public.app_role
    and staff_role is distinct from 'editor'::public.app_role
  then
    raise exception 'Approved staff access required';
  end if;

  clean_path := nullif(trim(coalesce(target_avatar_path, '')), '');

  if clean_path is not null
    and position(auth.uid()::text || '/' in clean_path) <> 1
  then
    raise exception 'Invalid avatar path';
  end if;

  update public.profiles
  set avatar_path = clean_path
  where id = auth.uid();

  return clean_path;
end;
$$;

revoke all on function public.staff_list_team_members()
  from public, anon;
revoke all on function public.staff_list_team_tasks()
  from public, anon;
revoke all on function public.admin_create_team_task(
  text, text, uuid, text, date
) from public, anon;
revoke all on function public.admin_update_team_task(
  uuid, text, text, uuid, text, text, date
) from public, anon;
revoke all on function public.staff_update_team_task_status(uuid, text)
  from public, anon;
revoke all on function public.admin_delete_team_task(uuid)
  from public, anon;
revoke all on function public.staff_set_avatar_path(text)
  from public, anon;

grant execute on function public.staff_list_team_members()
  to authenticated;
grant execute on function public.staff_list_team_tasks()
  to authenticated;
grant execute on function public.admin_create_team_task(
  text, text, uuid, text, date
) to authenticated;
grant execute on function public.admin_update_team_task(
  uuid, text, text, uuid, text, text, date
) to authenticated;
grant execute on function public.staff_update_team_task_status(uuid, text)
  to authenticated;
grant execute on function public.admin_delete_team_task(uuid)
  to authenticated;
grant execute on function public.staff_set_avatar_path(text)
  to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'staff-avatars',
  'staff-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff can view team avatars"
  on storage.objects;
create policy "Staff can view team avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'staff-avatars'
  and public.current_user_role() in ('admin', 'editor')
);

drop policy if exists "Staff can upload their own avatar"
  on storage.objects;
create policy "Staff can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'staff-avatars'
  and public.current_user_role() in ('admin', 'editor')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Staff can update their own avatar"
  on storage.objects;
create policy "Staff can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'staff-avatars'
  and public.current_user_role() in ('admin', 'editor')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'staff-avatars'
  and public.current_user_role() in ('admin', 'editor')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Staff can delete their own avatar"
  on storage.objects;
create policy "Staff can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'staff-avatars'
  and public.current_user_role() in ('admin', 'editor')
  and (storage.foldername(name))[1] = auth.uid()::text
);
