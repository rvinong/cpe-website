-- Run after the core schema and feature SQL files.
--
-- This script is intentionally non-destructive. URL constraints are added as
-- NOT VALID so existing rows are not rewritten or blocked during deployment;
-- new and updated rows are checked immediately. Review and clean any legacy
-- values, then validate the constraints when convenient.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.events'::regclass
      and conname = 'events_registration_url_http_check'
  ) then
    alter table public.events
      add constraint events_registration_url_http_check
      check (
        registration_url is null
        or registration_url ~* '^https?://[^[:space:]]+$'
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.student_resources'::regclass
      and conname = 'student_resources_external_url_http_check'
  ) then
    alter table public.student_resources
      add constraint student_resources_external_url_http_check
      check (
        external_url is null
        or external_url ~* '^https?://[^[:space:]]+$'
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.organization_profile'::regclass
      and conname = 'organization_profile_social_urls_http_check'
  ) then
    alter table public.organization_profile
      add constraint organization_profile_social_urls_http_check
      check (
        (facebook_url = '' or facebook_url ~* '^https?://[^[:space:]]+$')
        and (instagram_url = '' or instagram_url ~* '^https?://[^[:space:]]+$')
        and (youtube_url = '' or youtube_url ~* '^https?://[^[:space:]]+$')
        and (linkedin_url = '' or linkedin_url ~* '^https?://[^[:space:]]+$')
      ) not valid;
  end if;
end;
$$;

-- These tables are mutated through validated RPCs. Removing direct writes
-- closes the alternate Data API path while preserving the application flows.
revoke all on table public.news_reactions
  from public, anon, authenticated;
revoke all on table public.news_comments
  from public, anon, authenticated;

-- Remove the pre-year-level overload left by older users.sql versions.
drop function if exists public.admin_update_profile(
  uuid,
  text,
  text,
  public.app_role,
  public.profile_status
);

-- After running the updated feature files, optionally validate after reviewing
-- any existing rows that fail the checks:
-- alter table public.events validate constraint events_registration_url_http_check;
-- alter table public.student_resources validate constraint student_resources_external_url_http_check;
-- alter table public.organization_profile validate constraint organization_profile_social_urls_http_check;
