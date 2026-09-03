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

In **Authentication > Providers > Email**, disable **Confirm email** so new
members can sign in immediately after creating an account. New profiles still
start in `pending` status until an administrator approves them.

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
2. With **Confirm email** disabled, the account is signed in immediately after signup.
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
assigning roles. It also adds the public member preview used by the homepage
avatar stack. Refresh `/admin`, then open **Users & Roles**.

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

## 12. Enable team management

Run:

```text
supabase/team.sql
```

This adds the shared staff directory, private profile photos, and task
assignment workflow. Administrators can assign and manage editor tasks, while
editors can update the status of work assigned to them. Refresh `/admin`, then
open **Team**.

## 13. Enable community chat and mention notifications

Run:

```text
supabase/community.sql
supabase/community-chat.sql
```

The chat tables keep member mentions as profile IDs rather than email
addresses. Approved members can read and send messages; pending accounts stay
locked out of the room messages. Deploy the
`send-community-mention-notification` Edge Function with JWT verification
enabled. It uses the same Resend secrets listed below and sends one email to
each approved mentioned member who has email notifications enabled.

## 14. Enable email notifications

Run:

```text
supabase/email_notifications.sql
```

Deploy the `send-content-notification` Edge Function with JWT verification
enabled. Then create a Resend account, verify a sender domain, and add these
secrets in **Supabase > Edge Functions > Secrets**:

```env
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=NwSSU CPE <updates@your-verified-domain.example>
SITE_URL=https://cpe-website-two.vercel.app
ALLOWED_ORIGINS=https://cpe-website-two.vercel.app
```

New accounts opt in to email notifications by default and can change the
preference from `/account`. When staff publish a new announcement or news
story, the Edge Function verifies the staff session, privately emails each
confirmed non-suspended user who remains opted in, and records the delivery so
later edits do not resend the same notice.

The bundled Supabase email provider is intentionally rate limited. If Auth
shows `email rate limit exceeded`, wait for the provider window to reset or
configure a verified custom SMTP provider under **Authentication > SMTP
Settings**. Do not solve this by repeatedly retrying signup or password
recovery.

## 15. Enable merchandise management

Run:

```text
supabase/merchandise.sql
```

This creates the public merchandise catalog, batch archive, size variants,
inventory records, member order history, and staff order workflow. Product
images reuse the public `organization-media` bucket and are uploaded by
approved admin or editor accounts under the `merchandise/` folder.

The storefront allows visitors to browse published and archived designs. Only
approved signed-in accounts can place an order. The `create_merch_order`
database function rechecks the product status, current price, requested stock,
and order total while locking the requested variants, so browser values cannot
be used to change a checkout total or oversell inventory.

After running the SQL, refresh `/admin`, open **Merchandise**, publish the
current products, add their size variants and stock, and use the **Orders** tab
to process submitted requests.

## 16. Apply security hardening

For a new project, run `supabase/security-hardening.sql` after all of the
feature scripts above. For an existing project, run the updated feature files
that are already installed, then run the hardening script last:

```text
supabase/community.sql
supabase/community-chat.sql
supabase/media.sql
supabase/resources.sql
supabase/merchandise.sql
supabase/security-hardening.sql
```

The hardening script is intentionally non-destructive. It adds URL checks for
new or updated records, removes direct Data API access to reaction/comment
tables, and removes the old five-argument `admin_update_profile` overload that
can conflict with the current signup/profile schema. Existing invalid legacy
URLs must be reviewed before the optional `VALIDATE CONSTRAINT` statements at
the bottom of the script are enabled.

Deploy the changed Edge Functions with JWT verification enabled:

- `admin-delete-user`
- `send-community-mention-notification`
- `send-content-notification` (only if email notifications remain enabled)

Set `ALLOWED_ORIGINS` as an Edge Function secret for each active function. Use
a comma-separated list only when more than one trusted origin is required,
for example the production URL and `http://localhost:5173` during local
testing. Keep preview or temporary origins out of production unless they are
deliberately part of the release workflow.

The Vercel response headers in `vercel.json` are applied on the next frontend
deployment. The repository does not contain a Supabase service-role key or a
Supabase management token, so SQL execution and Edge Function deployment must
be completed from the Supabase project by an administrator.

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
- Staff directory with private profile photos
- Administrator task assignment and editor task status updates
- Opt-in email notifications for newly published news and announcements
- Approved-member community chat with profile-ID mention notifications
- Merchandise storefront with batch archive, inventory-aware checkout, and
  staff-managed order requests
