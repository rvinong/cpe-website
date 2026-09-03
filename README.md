# ICpEP Connect

Frontend portal for the NwSSU Computer Engineering Organization, built with
React, Vite, Tailwind CSS, Supabase, Framer Motion, and Lucide icons.

## Local setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and provide:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SITE_URL=https://your-production-domain.example
```

## Supabase

Run these files in the Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/announcements.sql`
3. `supabase/events.sql`
4. `supabase/media.sql`
5. `supabase/organization.sql`
6. `supabase/users.sql`
7. `supabase/alumni.sql`
8. `supabase/resources.sql`
9. `supabase/team.sql`
10. `supabase/account_profiles.sql`
11. `supabase/email_notifications.sql`
12. `supabase/community.sql`
13. `supabase/community-chat.sql`
14. `supabase/merchandise.sql`
15. `supabase/security-hardening.sql`

See `SUPABASE_SETUP.md` for administrator setup and backend details.

## Verification

```bash
npm run lint
npm run build
npm test
```

The `main` branch is connected to Vercel for automatic production
deployments.
