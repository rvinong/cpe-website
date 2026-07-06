# ICpEP Connect Development Journal

## Project Summary

ICpEP Connect began as a proposed website for the Computer Engineering organization and grew into a fuller student organization system. The project now works as a public information site, student portal, media archive, alumni yearbook, internal audit hub, and admin dashboard.

The main goal stayed simple throughout the journey: make one connected place where Computer Engineering students can find updates, resources, events, organization records, and community activity without needing to ask around or search through scattered posts.

## Phase 1: Building The Foundation

The first version focused on the public website structure:

- Home
- Announcements
- Student Portal
- About
- Events
- Alumni
- News & Gallery
- Account
- Admin Dashboard

The early challenge was deciding what the site should become. It could have stayed as a basic brochure website, but the project moved toward a real portal because the organization needed more than static pages.

Key frontend stack:

```txt
React + Vite
Tailwind CSS
Framer Motion
Lucide React
Supabase
Vercel
```

## Phase 2: Connecting Supabase

Supabase became the backend for authentication, profiles, dashboard data, storage, and RPC functions.

Important files:

```txt
src/lib/supabase.js
src/context/AuthProvider.jsx
supabase/schema.sql
supabase/users.sql
supabase/media.sql
supabase/events.sql
supabase/organization.sql
```

One important pattern was keeping role checks in the database instead of trusting frontend state. The app uses profile roles like `student`, `editor`, and `admin`, with approval status controlling access.

Example profile loading path:

```jsx
const profileColumns =
  'id, full_name, nickname, student_number, year_level, role, status, email_notifications, avatar_path'

const loadProfile = useCallback(async (user) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(profileColumns)
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    setProfile(null)
    setProfileError(error.message)
    return null
  }

  setProfile(data)
  return data
}, [])
```

Hardship: Supabase schema changes often caused frontend errors until the matching SQL was run. Errors like missing RPC functions or missing columns showed that the frontend and database must evolve together.

## Phase 3: Account And Identity System

The account page became more than login/signup. It now acts as the user's personal hub.

Added features:

- Login and signup
- Email confirmation support
- Profile approval status
- Profile picture
- Nickname
- Email notification preference
- Dashboard access button for admins/editors
- Year level during signup

Recent signup logic includes year level validation:

```jsx
if (activeMode === 'signup' && !formData.yearLevel) {
  setMessage({ type: 'error', text: 'Please select your year level.' })
  return
}

const { data, error } = await signUp({
  email: formData.email,
  password: formData.password,
  fullName: formData.fullName,
  studentNumber: formData.studentNumber,
  yearLevel: formData.yearLevel,
  emailNotifications: formData.emailNotifications,
})
```

Hardship: The dashboard access originally lived in the navbar, but that made the navigation feel crowded and inconsistent. The better solution was to keep `Account` in the navbar and show `Open Dashboard` inside the account hub only for approved admins/editors.

## Phase 4: Dashboard Growth

The dashboard became the control center of the organization.

Dashboard modules include:

- Announcements
- Events
- News & Gallery
- Resources
- Alumni
- Officers and faculty
- Users & Roles
- Team management
- Analytics
- Internal Audit

The Users & Roles module became important because account approval and role assignment are sensitive actions.

Example admin profile update payload:

```js
export async function updateAdminProfile(id, values) {
  return supabase.rpc('admin_update_profile', {
    target_id: id,
    target_full_name: values.fullName.trim(),
    target_student_number: values.studentNumber.trim() || null,
    target_year_level: values.yearLevel || '',
    target_role: values.role,
    target_status: values.status,
  })
}
```

Hardship: Admin tools needed to be powerful but hard to misuse. For example, admins should not accidentally remove their own admin access, and the database should prevent the last approved administrator from being demoted.

## Phase 5: News, Gallery, Reactions, And Comments

News & Gallery became one of the most complex parts of the project.

Major upgrades:

- Full news story pages
- Multiple photos per news post
- Albums/sliders instead of crowded photo grids
- Facebook-style reactions
- Reaction member list
- Comment system
- Comment identity using nickname/profile photo
- Mobile long-press reaction behavior

Important files:

```txt
src/lib/media.js
src/components/NewsCard.jsx
src/components/NewsReactionSummary.jsx
src/components/NewsComments.jsx
src/pages/NewsDetails.jsx
supabase/media.sql
```

Hardships:

- Supabase relationship errors appeared when tables or foreign keys were missing from the schema cache.
- Reaction RPCs had to match exactly between frontend and SQL.
- Mobile reaction behavior was surprisingly delicate. Long-press had to show reactions without selecting text or moving the card.
- Comments produced SQL ambiguity errors until the function column references were clarified.
- News card layouts became uneven when stories had different text lengths, so card actions had to be aligned consistently.

## Phase 6: UI, UX, Dark Mode, And Mobile

The site went through many visual refinements.

Design upgrades:

- Cleaner homepage sections
- Better hero layout
- More polished navigation
- Rounded cards and consistent spacing
- Dark mode refinements
- Mobile header fixes
- Better card hover states
- Footer credit with GitHub icon
- Reduced visual clutter in repeated sections

Hardship: Dark mode could not just be a color inversion. Some components looked fine in light mode but lost contrast in dark mode, especially news detail headers, cards, and decorative corner shapes.

Another recurring issue was mobile layout. Features that felt natural on desktop, like hover reactions, needed different behavior on touch screens.

## Phase 7: Student Portal And Academic Content

The Student Portal was shaped around useful student access:

- Resources
- Curriculum guide
- News & Gallery shortcut
- Alumni archive
- Merchandise
- About

Academic content was adjusted to match the curriculum information provided. Featured programs were narrowed to curriculum-aligned areas instead of generic tech categories.

Hardship: Some content was only available from screenshots, so the site had to use only the necessary information instead of copying everything blindly.

## Phase 8: Alumni Yearbook

The alumni page evolved into a yearbook-style archive.

Upgrades:

- Alumni profile photos
- Batch filtering
- Compact portrait grid
- Profile modal/details
- Admin-managed alumni entries

Hardship: The first yearbook layout had too much empty space when grouped by batch. The better direction was to let users choose a batch filter at the top and keep the grid compact.

## Phase 9: Internal Audit And Transparency

The Internal Audit page was added to hold transparency records.

Main categories:

- Accomplishment Report
- Liquidation Report
- Resolutions

The homepage also gained a transparency snapshot connected to this idea, showing counts such as approved project proposals, approved resolutions, and activities.

Hardship: The page needed to feel official without becoming too heavy. It had to support transparency, but still match the site's friendly student-portal design.

## Phase 10: Personality Features

The project also gained small personality details:

- Pixel Pals
- Byte assistant
- Smooth motion
- Friendly empty states
- More playful micro-interactions

Pixel Pals was inspired by VS Code pets, but redesigned as tiny robots that fit the ICpEP Connect identity.

Hardship: The robots had to feel fun without blocking content, distracting users, or hurting mobile usability. Motion also had to respect users who prefer reduced motion.

## Database Hardships

The hardest backend moments usually came from schema mismatch:

- Missing table relationships
- Missing RPC functions
- Schema cache delays
- SQL function argument mismatch
- Storage bucket policies
- Private avatar access
- Profile fields added after users already existed

Example SQL pattern for year level:

```sql
alter table public.profiles
  add column if not exists year_level text not null default '';

alter table public.profiles
  add constraint profiles_year_level_check
  check (
    year_level in (
      '',
      '1st Year',
      '2nd Year',
      '3rd Year',
      '4th Year',
      'Irregular'
    )
  );
```

Lesson learned: every frontend feature that stores data needs a matching database plan, fallback behavior, and a clear admin path.

## UI Hardships

Some UI problems looked small but took real thinking:

- Uneven news card action rows
- Mobile long-press reaction behavior
- Dark mode contrast loss
- Header text disappearing on mobile
- Hover decorations showing unwanted gray edges
- Album photos needing rounded-corner fitting
- Dashboard cards needing useful but compact information

Lesson learned: a good interface is not just pretty. It has to behave well under different content lengths, devices, themes, and user states.

## Project Lessons

The biggest lessons from building ICpEP Connect:

- A student organization website becomes more valuable when it is also a system.
- Authentication is not finished until roles, approval, and profile identity are clear.
- Supabase SQL and frontend code must be kept in sync.
- Mobile interactions need their own design decisions.
- Dark mode needs intentional contrast, not automatic color swaps.
- Admin dashboards should prevent mistakes, not just expose controls.
- Real content matters more than placeholder polish.

## Current State

ICpEP Connect now includes:

- Public organization website
- Student account system
- Admin/editor dashboard
- News publishing
- Reactions and comments
- Resource management
- Events management
- Alumni yearbook
- Internal audit records
- User roles and approval
- Profile photos and nicknames
- Year-level tracking
- Light/dark mode
- Mobile-responsive UI

## Reflection

ICpEP Connect became more than a website. It became a living organization portal: a place for announcements, academic support, community interaction, transparency, archives, and student identity.

The journey was not just about adding pages. It was about turning separate student needs into one connected experience, then refining the details until the site felt useful, official, and alive.
