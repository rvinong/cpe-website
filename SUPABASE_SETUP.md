# Supabase Backend Setup

## 1. Create the project

Create a Supabase project, then open **Project Settings > API**.

Copy `.env.example` to `.env.local` and add:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SITE_URL=https://cpe-website-two.vercel.app
```

Never put the Supabase service-role key in this frontend project.

In **Authentication > URL Configuration**, set:

- Site URL: `https://cpe-website-two.vercel.app`
- Redirect URL: `https://cpe-website-two.vercel.app/account`
- Local redirect URL: `http://localhost:5173/account`

The production URL must be present in the redirect allow list or Supabase will
fall back to the configured Site URL.

## 2. Create the authentication profile schema

Open the Supabase SQL Editor and run:

```text
supabase/schema.sql
```

This creates:

- Student, editor, and admin roles
- Pending, approved, and suspended profile states
- A profile row for every new authentication account
- Row Level Security policies

## 3. Create the first administrator

1. Run the website and sign up normally.
2. Confirm the account email if email confirmation is enabled.
3. Run this in the SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'admin', status = 'approved'
where id = (
  select id
  from auth.users
  where email = 'your-email@example.com'
);
```

4. Sign out and sign in again.
5. Open `/admin`, or use the **Dashboard** header button.

## 4. Local development

Restart Vite after creating or changing `.env.local`:

```powershell
npm run dev
```

Without environment values, the public website still runs and `/admin`
shows a backend setup screen.

## 5. Enable announcement management

Open the Supabase SQL Editor and run:

```text
supabase/announcements.sql
```

This creates the announcement table, public/staff Row Level Security
policies, and the initial website announcement. Refresh `/admin`, then open
**Announcements** in the dashboard sidebar.

## 6. Enable event management

Open the Supabase SQL Editor and run:

```text
supabase/events.sql
```

This creates the events table and its public/staff Row Level Security
policies. Refresh `/admin`, then open **Events** in the dashboard sidebar.

## 7. Enable news and gallery management

Open the Supabase SQL Editor and run:

```text
supabase/media.sql
```

This creates the news and gallery tables, a public
`organization-media` Storage bucket, an 8 MB image limit, and staff-only
upload/update/delete policies. Refresh `/admin`, then open
**News & Gallery**.

## 8. Enable organization profile management

Open the Supabase SQL Editor and run:

```text
supabase/organization.sql
```

This creates the organization profile, officer directory, and history
milestone tables with public read access and staff-only management policies.
Refresh `/admin`, then open **About Content**.

## 9. Enable user and role administration

Open the Supabase SQL Editor and run:

```text
supabase/users.sql
```

This limits staff access to approved accounts and adds administrator-only
functions for reviewing profiles, approving members, suspending access, and
assigning roles. Refresh `/admin`, then open **Users & Roles**.

## 10. Enable alumni management

Open the Supabase SQL Editor and run:

```text
supabase/alumni.sql
```

This creates the alumni yearbook table with public access to consent-confirmed
published profiles and staff-only management policies. Refresh `/admin`, then
open **Alumni**.

## 11. Enable student resource management

Open the Supabase SQL Editor and run:

```text
supabase/resources.sql
```

This creates the student resource table and a private 20 MB Storage bucket.
Only approved accounts can read published resources and create short-lived
download links. Refresh `/admin`, then open **Resources**.

## Current backend scope

Implemented:

- Email/password sign-up and sign-in
- Persistent authentication sessions
- Automatic profile creation
- Role-protected admin route
- Admin dashboard foundation
- Sign-out
- Announcements database table
- Admin announcement create/edit/publish/archive/delete workflow
- Public announcements loaded from Supabase
- Events database and management workflow
- Admin event create/edit/publish/cancel/archive/delete workflow
- Public upcoming, cancelled, and completed event views
- News and gallery management workflow
- Staff-managed JPG, PNG, and WebP uploads
- Public organization news and approved gallery archive
- Organization profile, contact, membership, and homepage statistics management
- Officer directory and history milestone management
- Alumni yearbook, consent confirmation, and spotlight management
- Approved-member student resource library
- Administrator-only account approval, suspension, and role management
