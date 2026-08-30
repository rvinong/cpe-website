-- Run this file after supabase/users.sql.

alter type public.app_role add value if not exists 'faculty';

alter table public.profiles
  add column if not exists email_notifications boolean not null default true;

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
    role,
    year_level,
    email_notifications
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'student_number', ''),
    case
      when lower(coalesce(new.raw_user_meta_data ->> 'account_type', 'student')) = 'faculty'
      then 'faculty'::public.app_role
      else 'student'::public.app_role
    end,
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

create or replace function public.set_email_notifications(enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set email_notifications = enabled
  where id = auth.uid();

  return enabled;
end;
$$;

revoke all on function public.set_email_notifications(boolean)
  from public, anon;
grant execute on function public.set_email_notifications(boolean)
  to authenticated;

create table if not exists public.email_notification_log (
  id bigint generated always as identity primary key,
  content_type text not null
    check (content_type in ('announcement', 'news')),
  content_id uuid not null,
  recipient_count integer not null default 0
    check (recipient_count >= 0),
  sent_at timestamptz not null default now(),
  sent_by uuid references public.profiles(id) on delete set null,
  unique (content_type, content_id)
);

create index if not exists email_notification_log_sent_by_idx
  on public.email_notification_log (sent_by);

alter table public.email_notification_log enable row level security;

revoke all on table public.email_notification_log from anon, authenticated;
