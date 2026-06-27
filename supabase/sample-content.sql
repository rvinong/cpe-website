-- Optional starter content for non-news/gallery sections.
-- Run this after the main Supabase setup files if the site needs demo content.

update public.organization_profile
set
  membership_eligibility = case
    when trim(coalesce(membership_eligibility, '')) = '' then
      'Open to bona fide Computer Engineering students of NwSSU who support the objectives and activities of the organization.'
    else membership_eligibility
  end,
  membership_process = case
    when trim(coalesce(membership_process, '')) = '' then
      'Students may complete the membership form, confirm their school details, and wait for officer or adviser verification through the portal.'
    else membership_process
  end,
  membership_requirements = case
    when trim(coalesce(membership_requirements, '')) = '' then
      'Use a valid student email or school record, provide accurate profile information, and follow the organization guidelines for responsible participation.'
    else membership_requirements
  end,
  contact_email = case
    when trim(coalesce(contact_email, '')) = '' then 'nwssu.icpep.se@gmail.com'
    else contact_email
  end,
  office_hours = case
    when trim(coalesce(office_hours, '')) = '' then 'Monday to Friday, 8:00 AM - 5:00 PM'
    else office_hours
  end,
  facebook_url = case
    when trim(coalesce(facebook_url, '')) = '' then 'https://www.facebook.com/bScpEofNwssU'
    else facebook_url
  end
where id = 1;

insert into public.organization_officers (
  name,
  position,
  academic_year,
  sort_order
)
select seed.name, seed.position, seed.academic_year, seed.sort_order
from (
  values
    ('Sample Student President', 'President', '2026-2027', 10),
    ('Sample Student Secretary', 'Secretary', '2026-2027', 20),
    ('Engr. Sample Faculty Adviser', 'Faculty Adviser', '2026-2027', 90),
    ('Engr. Sample Program Mentor', 'Program Mentor', '2026-2027', 100)
) as seed(name, position, academic_year, sort_order)
where not exists (
  select 1
  from public.organization_officers existing
  where existing.name = seed.name
    and existing.position = seed.position
    and existing.academic_year = seed.academic_year
);

insert into public.organization_milestones (
  year,
  title,
  description,
  sort_order
)
select seed.year, seed.title, seed.description, seed.sort_order
from (
  values
    (
      '1996',
      'Program Opening Approval',
      'The opening of the Bachelor of Science in Computer Engineering program was approved under Board Resolution No. 62, series of 1996.',
      10
    ),
    (
      '2018',
      'OBE-Aligned Curriculum Adoption',
      'The revised curriculum was first implemented in SY 2018-2019, adopting an outcomes-based education direction for the program.',
      20
    )
) as seed(year, title, description, sort_order)
where not exists (
  select 1
  from public.organization_milestones existing
  where existing.year = seed.year
    and existing.title = seed.title
);

insert into public.alumni_profiles (
  name,
  batch,
  professional_role,
  organization,
  organization_history,
  highlight,
  status,
  is_featured,
  consent_confirmed,
  sort_order,
  published_at
)
select
  seed.name,
  seed.batch,
  seed.professional_role,
  seed.organization,
  seed.organization_history,
  seed.highlight,
  'published',
  seed.is_featured,
  true,
  seed.sort_order,
  now()
from (
  values
    (
      'Sample Alumni Mikaela Santos',
      '2022',
      'Software QA Analyst',
      'Visayas Tech Solutions',
      'Former documentation lead who helped organize technical review sessions and student project showcases.',
      'Supports junior students by sharing testing workflows, portfolio tips, and early-career software engineering lessons.',
      true,
      10
    ),
    (
      'Sample Alumni Carlo Dela Cruz',
      '2021',
      'Network Support Engineer',
      'Regional IT Services',
      'Served as a technical committee volunteer for laboratory support and peer troubleshooting activities.',
      'Works with campus-style network deployments and encourages students to build practical troubleshooting habits.',
      false,
      20
    )
) as seed(
  name,
  batch,
  professional_role,
  organization,
  organization_history,
  highlight,
  is_featured,
  sort_order
)
where not exists (
  select 1
  from public.alumni_profiles existing
  where existing.name = seed.name
    and existing.batch = seed.batch
);

insert into public.events (
  slug,
  title,
  category,
  summary,
  description,
  venue,
  starts_at,
  ends_at,
  registration_url,
  image_path,
  image_alt,
  show_in_gallery,
  status,
  is_featured,
  published_at
)
select
  seed.slug,
  seed.title,
  seed.category,
  seed.summary,
  seed.description,
  seed.venue,
  seed.starts_at,
  seed.ends_at,
  null,
  null,
  seed.image_alt,
  false,
  'published',
  seed.is_featured,
  now()
from (
  values
    (
      'sample-cpe-orientation-peer-mentoring',
      'Sample CpE Orientation and Peer Mentoring Day',
      'Academic',
      'A welcome session introducing students to organization programs, peer support channels, and responsible campus involvement.',
      'This sample event can be replaced with the official orientation schedule once the organization confirms the date, venue, and program flow.',
      'CEA Computer Laboratory',
      '2026-07-15 09:00:00+08'::timestamptz,
      '2026-07-15 12:00:00+08'::timestamptz,
      'Students attending a Computer Engineering orientation',
      true
    ),
    (
      'sample-embedded-systems-mini-workshop',
      'Sample Embedded Systems Mini Workshop',
      'Workshop',
      'A beginner-friendly practical session on microcontrollers, sensors, wiring checks, and simple firmware testing.',
      'This sample workshop gives the events page enough structure while the official student activity calendar is still being prepared.',
      'Electronics Laboratory',
      '2026-08-08 13:00:00+08'::timestamptz,
      '2026-08-08 16:00:00+08'::timestamptz,
      'Computer Engineering students working with embedded systems',
      false
    )
) as seed(
  slug,
  title,
  category,
  summary,
  description,
  venue,
  starts_at,
  ends_at,
  image_alt,
  is_featured
)
where not exists (
  select 1
  from public.events existing
  where existing.slug = seed.slug
);

insert into public.student_resources (
  title,
  category,
  description,
  course_code,
  academic_year,
  external_url,
  status,
  sort_order
)
select
  seed.title,
  seed.category,
  seed.description,
  seed.course_code,
  seed.academic_year,
  seed.external_url,
  'published',
  seed.sort_order
from (
  values
    (
      'Sample Programming Logic Starter Guide',
      'tutorials',
      'A starter guide for flowcharts, pseudocode, variables, control structures, and basic problem-solving practice.',
      'CpE 2',
      '2026-2027',
      'https://example.com/cpe-programming-logic-guide',
      10
    ),
    (
      'Sample Data Structures Review Sheet',
      'reviewers',
      'A concise review sheet covering arrays, linked lists, stacks, queues, trees, and algorithm analysis checkpoints.',
      'CpE 5',
      '2026-2027',
      'https://example.com/cpe-data-structures-review',
      20
    )
) as seed(
  title,
  category,
  description,
  course_code,
  academic_year,
  external_url,
  sort_order
)
where not exists (
  select 1
  from public.student_resources existing
  where existing.title = seed.title
    and existing.category = seed.category
);
