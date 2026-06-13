# Supabase Backend Setup

## 1. Create the project

Create a Supabase project, then open **Project Settings > API**.

Copy `.env.example` to `.env.local` and add:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never put the Supabase service-role key in this frontend project.

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

Next:

- Organization profile and About content management
