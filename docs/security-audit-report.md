# ICpEP Connect Security Audit

**Assessment date:** 2026-09-03
**Assessment type:** Defensive source review with safe, non-destructive verification
**Scope:** React/Vite client, Supabase SQL and Storage policies, Supabase Edge Functions, Vercel configuration, authentication flows, dependencies, and user-data handling
**Status:** Conditional pass for the repository; production deployment is not certifiable until the manual Supabase steps in this report are completed

## 1. Executive Summary

The application is a React 19/Vite single-page portal hosted on Vercel with Supabase Auth, Postgres, Storage, Realtime, and Edge Functions. The browser uses only the Supabase publishable/anon key. No tracked service-role key, database password, private key, or Resend API key was found in the repository or reachable Git history inspected during this review.

The repository now has stronger authorization boundaries, safer URL handling, restricted Edge Function CORS, generic production errors, database URL checks, safer `SECURITY DEFINER` search paths, and Vercel security headers. The most important remaining issue is deployment state: source changes to SQL policies and Edge Functions do not change the live Supabase project until an administrator executes and deploys them.

**Conditional security score: 72/100.** This score reflects the hardened repository plus the unresolved production and operational controls. It is not a claim that the live project is fully secure.

### Priority actions

1. Run the updated SQL files and `supabase/security-hardening.sql` in the Supabase SQL Editor.
2. Deploy the changed Edge Functions with JWT verification enabled and set a production-only `ALLOWED_ORIGINS` secret.
3. Decide whether to keep email confirmation enabled. If immediate sign-in is required, disable Confirm email only after accepting the assurance tradeoff; configure custom SMTP for reliable email delivery and higher limits.
4. Add application-level rate limits for community writes, email fan-out, and account abuse flows.
5. Decide whether the intentionally public `organization-media` bucket may contain unpublished or orphaned files. Make it private and use signed URLs if it may contain confidential media.

## 2. Methodology and Limitations

The review used repository-wide file discovery, static code review, SQL/RLS/policy inspection, dependency audit, safe live read-only probes against the configured Supabase project, and local build/lint/unit-test verification. No destructive production testing, brute force, denial-of-service testing, mass requests, record deletion, or secret printing was performed.

The environment did not contain a Supabase CLI session, management API token, service-role key, Postgres connection string, or usable browser session. Therefore, the following could not be independently verified in the live project: effective PostgreSQL grants, installed RLS policy definitions, function owners/volatility, Storage policy state, deployed Edge Function source, and Auth rate-limit settings beyond the public Auth settings endpoint. Treat the SQL/function deployment checklist as required release work.

The canonical Vercel production alias was checked after deployment and its response headers matched `vercel.json`. A generated deployment URL returned additional Vercel platform protection headers instead; use the canonical alias/custom domain as the production verification target and re-check any preview/deployment URL separately if it is exposed to users.

## 3. Architecture and Security Map

### Application architecture

- **Frontend:** React 19, Vite 8, React Router, Tailwind CSS, Framer Motion, Lucide icons.
- **Hosting:** Vercel static deployment with an SPA rewrite to `index.html`.
- **Browser backend client:** `src/lib/supabase.js` creates one Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (with legacy anon-key compatibility).
- **Authentication:** Supabase email/password Auth, persisted browser session, automatic token refresh, and an `auth.users` insert trigger that creates a pending `public.profiles` row.
- **Authorization:** Database-derived `profiles.role` and `profiles.status`; approved status is required for member features, while admin/editor access is checked in RLS policies, RPCs, Edge Functions, and route guards.
- **Backend operations:** Supabase Data API table queries, protected Postgres RPCs, Storage object APIs, Realtime message subscriptions, and three active-purpose Edge Functions plus one retired endpoint. Merchandise checkout uses a server-side stock and price transaction rather than trusting browser totals.
- **External service:** Resend is called only from Edge Functions using a server-side secret.

### Request and trust boundaries

1. An untrusted browser submits Auth, table, RPC, Storage, and Realtime requests.
2. Supabase Auth issues the session; the database derives role and approval from `public.profiles` rather than trusting editable browser state.
3. Postgres RLS and protected functions enforce content, profile, community, resource, audit, alumni, team, and reaction/comment boundaries.
4. Private Storage objects are returned through policy-checked access or short-lived signed URLs. `organization-media` is public by design.
5. Edge Functions validate the bearer session, re-check the database role, and use server-only service and Resend secrets.
6. Vercel serves static assets and applies response headers; it does not contain application secrets or custom API routes.

### Routes and privileged areas

Public routes include `/`, `/about`, `/announcements`, `/announcements/:id`, `/alumni`, `/community`, `/events`, `/gallery`, `/gallery/news/:slug`, `/internal-audit`, `/student-portal`, and `/merchandise`. `/account` handles authentication and a user's own profile. `/admin` is guarded in the client and must remain protected by the database policies/RPCs even when a user manually navigates to it.

Admin sections are announcements, events, news/gallery, organization, alumni, resources, internal audit, team, Merchandise, and Users & Roles. Users & Roles requires an approved `admin` profile. Editors manage approved content, merchandise, and orders but do not receive user-management or account-deletion authority.

## 4. Data Inventory and Privacy Review

| Data | Stored in | Intended readers | Review result |
| --- | --- | --- | --- |
| Full name, nickname, student number, year, role, status, avatar path | `profiles` | User sees own row; admin sees the user-management view; approved member previews expose only name/avatar/role/count | Student number and email are not in the public preview; public role exposure is intentional but should be reviewed as a minimization choice |
| Auth email and Auth metadata | `auth.users` | Supabase Auth; admin-only RPCs/Edge Functions when operationally required | Not selected by public content queries; email confirmation status is used for notification eligibility |
| Announcements, events, news, gallery, organization content | Public tables | Published records are public; drafts/staff views are staff-only | RLS and published/time checks are present in source |
| Alumni names, photos, professional details, leadership, achievements | `alumni_profiles`, `alumni_leadership` | Published consent-confirmed profiles are public; drafts and management data are staff-only | Publication requires consent; review deletion/retention policy with the organization |
| Audit report metadata and PDFs | `audit_reports`, private `internal-audit-reports` bucket | Published metadata/files are public; drafts and management access are staff-only | Prepared/reviewed/approved fields are optional and public only when the report is published |
| Student resources | `student_resources`, private `student-resources` bucket | Approved members for published resources; staff for all management records | Object access is now tied to a published database row |
| Community messages, mentions, attachments | Community tables and private `community-attachments` bucket | Approved room members; staff-only rooms are restricted to admin/editor | Names/avatar paths are intentionally returned for chat UX; email addresses are not returned |
| Merchandise catalog, variants, and order snapshots | `merchandise_products`, `merchandise_variants`, `merchandise_orders`, `merchandise_order_items`, public `organization-media` product images | Published/archive catalog is public; approved members see their own orders; approved admin/editor accounts manage catalog and orders | Checkout stores name, email, phone, campus-collection preference, payment preference, note, and item snapshots. No address, card number, or payment credential is collected |
| Staff tasks and staff directory | `team_tasks`, `profiles`, private `staff-avatars` bucket | Approved staff; admin has team-wide task access | Editors see assigned tasks; admin-only task mutations are enforced by RPCs |
| Notification delivery state | Email log tables | Edge Functions only; no anon/authenticated table grants | Logs retain recipient counts/status, not message secrets or provider response bodies |

The application does not use `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function`. User text is rendered as React text, and email HTML escapes user-controlled message/title fields. The public member preview intentionally exposes approved names, avatar paths, roles, and an exact approved-member count; remove the role/count if the organization's privacy policy does not need them.

## 5. API and Server-Operation Inventory

There are no Vercel API routes, Next.js server actions, webhooks, payment endpoints, or custom server routes in this repository. The effective API surface is Supabase's Data API/Storage/Realtime plus the listed RPCs and Edge Functions.

### Browser-to-Supabase table operations

| Surface | Methods | Auth and authorization | Inputs and validation | Sensitive data/rate limit |
| --- | --- | --- | --- | --- |
| Published announcements/events/news/gallery/organization/audit/alumni | `GET`/PostgREST `select` | Anonymous published policies; staff can read drafts where defined | Fixed column lists in client; database status/time/consent policies | Public content; no application rate limit beyond Supabase/platform controls |
| Profiles | `GET` own row | Authenticated user can read own profile; admin RPC reads all profile/email data | Fixed columns; no direct user update policy | Student number/status are private; no app rate limit |
| Staff content management | `POST`, `PATCH`, `DELETE` through PostgREST | RLS requires approved admin/editor; created-by checks are used on inserts | Client forms validate basic lengths/types; database enums/checks enforce key states | Drafts and management data; no app rate limit |
| Community rooms | `GET` | Active room listing is public; message/post access uses approved/room checks | Room ID is treated as an identifier and rechecked in RPCs | Room metadata is public; no app rate limit |
| Merchandise catalog | `GET`/PostgREST `select` | Published and archived products/variants are public; drafts require staff access | Fixed columns; product status, price, and variant stock are database-constrained | Public catalog and product images; no private customer data in catalog rows |
| Merchandise order request | `POST`/protected RPC | Approved authenticated member only; function derives the user email and rechecks product status, price, and stock | Cart size, quantity, contact fields, fixed campus collection, payment choice, and notes are validated in the function; row locks make stock decrement atomic | Order PII is visible only to the member and staff; this is not an online payment gateway |
| Private Storage | `GET` signed object, `POST` upload, `PATCH`/replace, `DELETE` | Bucket policies check approval, staff role, owner path, or published row | Browser MIME/size checks plus bucket MIME/size limits; no magic-byte scan | Private documents/photos; upload abuse controls remain incomplete |

### Postgres RPCs

All listed functions are called through `supabase.rpc`. Sensitive functions are `SECURITY DEFINER`, set an explicit search path, and revoke public/anon execution where appropriate. Role checks must still be applied in the live database by running the current SQL.

- **Auth/profile:** `current_user_role`, `get_public_member_preview`, `admin_list_profiles`, `admin_update_profile`, `set_email_notifications`, `update_my_account_profile`, `current_user_is_approved`.
- **Legacy community forum:** `list_community_posts`, `list_community_comments`, `create_community_post`, `create_community_comment`, `delete_community_post`, `delete_community_comment`.
- **Community chat:** `list_community_messages`, `list_community_members`, three compatible `create_community_message` signatures, `delete_community_message`, `list_community_message_attachments`, `add_community_message_attachments`.
- **News reactions/comments:** `get_news_reaction_summary`, `set_news_reaction`, `clear_news_reaction`, `get_news_reaction_members`, `get_news_comment_summary`, `list_news_comments`, `create_news_comment`, `delete_news_comment`.
- **Team:** `staff_list_team_members`, `staff_list_team_tasks`, `admin_create_team_task`, `admin_update_team_task`, `staff_update_team_task_status`, `admin_delete_team_task`, `staff_set_avatar_path`.
- **Merchandise:** `create_merch_order`, `admin_set_merch_order_status`, `admin_delete_merch_order`.

The current community read functions cap chat messages at 200 but the legacy forum lists and attachment metadata query are not paginated. Write RPCs also have no application-level per-user rate limit. These are resource-abuse and scraping risks, not authorization bypasses.

### Edge Functions

| Function | Method | Required authorization | Data/side effect | Status |
| --- | --- | --- | --- | --- |
| `admin-delete-user` | `POST` | Approved admin; cannot delete self or the last approved admin | Removes avatar copies and deletes a Supabase Auth user, cascading profile data | Hardened source; deploy manually |
| `send-community-mention-notification` | `POST` | Approved message author; targets approved mentioned users with notifications enabled | Reads message/mention/profile email data and sends Resend email | Hardened source; no app rate limit; no current frontend caller found |
| `send-content-notification` | `POST` | Approved admin/editor and published content ID | Enumerates opted-in confirmed users and sends a Resend batch; writes idempotency log | Hardened source; broad fan-out needs operational limits; no current frontend caller found |
| `resend-email` | Any | None | Returns `410 Gone`; legacy endpoint is retired | Safe fallback; remove deployed function if no longer needed |

## 6. Supabase Database and RLS Audit

### Tables and effective policy intent

| Table group | RLS/source posture | Anonymous access | Authenticated access |
| --- | --- | --- | --- |
| `profiles` | RLS enabled; direct writes are absent; admin profile actions use protected RPCs | None except the deliberately minimized preview RPC | Own profile; admin list/update through role-checked RPCs |
| `announcements`, `events`, `news_posts`, `news_post_images`, `gallery_photos` | RLS enabled; published/time-filtered public reads; admin/editor CRUD | Published rows only | Published rows plus staff management rows for admin/editor |
| `organization_profile`, `organization_officers`, `organization_milestones` | RLS enabled; public read; staff-only writes | Public organization content | Same public content; staff CRUD |
| `alumni_profiles`, `alumni_leadership` | RLS enabled; publication requires consent for alumni profiles | Published consent-confirmed rows | Same plus staff management rows |
| `audit_reports` | RLS enabled; published public read; staff management | Published rows | Published plus staff rows |
| `student_resources` | RLS enabled; approved/published read; staff CRUD | None | Approved members see published; staff see/manage all |
| `merchandise_products`, `merchandise_variants` | RLS enabled; published/archive catalog reads; approved admin/editor CRUD | Published and archived products with available variants | Same public catalog; staff see/manage drafts, products, and variants |
| `merchandise_orders`, `merchandise_order_items` | RLS enabled; direct writes revoked; protected RPCs create/update/delete orders | None | Approved members read their own orders/items; admin/editor read orders and can update status or delete orders through role-checked RPCs |
| `community_rooms` | RLS enabled; active room metadata read | Active room metadata | Active room metadata |
| `community_posts`, `community_comments` | Direct table grants are revoked; protected RPCs enforce active/unlocked/staff-room boundaries | Public-room forum reads only through functions | Approved posting/deletion through functions |
| `community_messages` | Direct writes are revoked; authenticated Realtime select policy and protected RPCs | None | Approved members in active/unlocked permitted rooms |
| `community_message_attachments`, mentions, notification logs | Direct grants revoked; metadata/functions or Edge Function only | None | Attachment access is room/approval checked; mention/log tables are not direct client data |
| `news_reactions`, `news_comments` | RLS enabled and direct anon/authenticated table grants revoked; RPCs are the application path | Summary only for public published news | Approved members mutate/read identities through RPCs |
| `team_tasks` | Direct grants revoked; RPC-only with admin/editor checks | None | Admin team view; editor assigned-task view/status update |
| `email_notification_log` | Direct grants revoked | None | Edge Function/service key only |

### Function and privilege review

- Role checks derive from `public.profiles` and `status = 'approved'`; user-supplied metadata can select only the safe `student` or `faculty` signup path in `handle_new_user`.
- Admin role/status mutation is restricted to the six-argument `admin_update_profile`; the obsolete five-argument overload is dropped by the updated users SQL and hardening script.
- `SECURITY DEFINER` functions qualify table names and now use `search_path = public, pg_temp` or the intentionally empty path for the public preview function. This reduces object-shadowing risk from `pg_temp` and unqualified names.
- Dynamic SQL and user-controlled table/column identifiers were not found. Supabase client calls use parameterized query builders/RPC arguments.
- Direct table access to reactions/comments and community private metadata is removed in source to prevent alternate Data API paths from exposing user IDs or changing ownership/relationship columns.
- No database views were found in the repository. Live catalog inspection is still required before treating this as complete for the deployed project.

### Authorization abuse cases reviewed

- A normal user cannot make themselves `admin` by changing metadata/profile fields; profile writes are absent and admin RPCs re-check the caller.
- User A cannot update User B's profile through the account profile RPC; it updates only `auth.uid()`.
- User A cannot delete User B's community message/comment unless the caller is approved admin/editor; message attachment upload/update paths must belong to the author's message.
- Resource object reads now require a published `student_resources.file_path` match for ordinary approved members, preventing draft/orphan object reads.
- Locked and staff-only legacy forum rooms are checked inside the `SECURITY DEFINER` read/write functions, preventing a public RPC caller from bypassing room state.
- News reactions/comments use published-post and approved-member checks; direct DML is revoked.
- Merchandise checkout derives the customer identity, forces campus collection, locks published variants, validates stock and price in the database, inserts item snapshots, and decrements inventory atomically. Staff order cancellation restores stock through a role-checked function, while staff deletion restores only unfinished-order reservations before cascading the order-item snapshots.

## 7. Storage and Upload Audit

| Bucket | Visibility | Access controls | Remaining concern |
| --- | --- | --- | --- |
| `profile-avatars` | Private | Approved user owns first path segment; public read only when path is the avatar of an approved profile | Browser MIME/size checks and bucket limits are not content scanning |
| `staff-avatars` | Private | Approved staff can read; staff upload/update/delete is scoped to own path | Path format could be made stricter; no magic-byte scan |
| `organization-media` | Public | Approved admin/editor upload/update/delete; public URLs are usable by anyone who knows a path | Orphan, unpublished, or deleted-record media remains publicly fetchable if its path is known |
| `organization-media` (`merchandise/`) | Public | Same approved admin/editor upload/update/delete policy; product rows store generated paths | Product artwork is intentionally public, but the shared bucket has the same orphan/unpublished path concern; do not place customer order documents here |
| `student-resources` | Private | Staff writes; approved members read only published rows whose file path matches the object | MIME metadata is client-declared; no antivirus/magic-byte scan |
| `internal-audit-reports` | Private | Staff management; published report row gates public object read | Same upload scanning limitation; publication intentionally makes the PDF public |
| `community-attachments` | Private | Approved room member read; message author path-bound upload/update; owner/staff delete | Metadata query is unpaginated; no malware scan |

Client filenames are sanitized into generated paths for resources, audit files, media, alumni, and avatars. Community attachment paths use the authenticated user ID, message ID, and a generated UUID. Database/bucket size and MIME restrictions exist, but browser MIME declarations are not proof of file content. Do not allow untrusted users to upload active HTML/SVG/script content without a server-side content scanner or a stricter content-disposition policy.

## 8. Authentication and Session Review

- Email/password sign-up and password login are delegated to Supabase Auth; passwords are not stored by this application.
- The session is persisted by the Supabase browser client and refreshed automatically. This is standard for a SPA but means XSS prevention is critical because a successful XSS can act as the user.
- The profile trigger creates new records as `pending`; approved status is required for community, resources, reactions/comments, and admin access.
- Faculty accounts omit student number; student accounts use the nullable unique student-number column. The live project previously showed the expected profiles columns and accepted the `faculty` role enum.
- `redirect` after login is now restricted to same-origin absolute paths; protocol-relative `//host` destinations and external URLs are rejected.
- Supabase Auth currently reports `mailer_autoconfirm = false` in the live public settings probe, so email confirmation is enabled. The built-in provider is rate limited; repeated signup/recovery attempts will produce `email rate limit exceeded`.
- Confirm email is a product/security decision, not a frontend bug. Disabling it gives immediate sessions but removes the email ownership check. Custom SMTP is the correct operational fix for delivery and higher configurable limits.
- No OAuth, magic-link implementation, custom password hashing, password reset handler, or token logging was found in the repository.

## 9. Input, Output, and Protocol Review

### XSS and injection

No raw HTML rendering or JavaScript-evaluation sinks were found. React escapes names, descriptions, posts, comments, messages, alumni details, and admin-entered text. Edge email templates escape interpolated HTML values. SQL uses Supabase builders or typed RPC arguments; no string-concatenated SQL or dynamic identifiers were found.

External URL fields are now restricted to `http`/`https` in the frontend helper and database checks. Image paths accept local assets, safe HTTP(S) URLs, or validated Storage paths. Community link extraction accepts only HTTP(S) links. These controls reduce `javascript:`, `data:`, protocol-relative, and control-character URL abuse; they do not establish trust in the destination or protect users from phishing.

### CSRF and CORS

The browser stores the Supabase session in local storage and sends bearer authorization headers, so ordinary cross-site cookie form CSRF is not the primary architecture risk. Edge Function CORS no longer uses `Access-Control-Allow-Origin: *`; it allows only configured HTTP(S) origins and returns `Vary: Origin`. CORS is not an authorization control, so each function still validates the bearer token and database role.

### Security headers

`vercel.json` now adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and a restrictive CSP. The CSP keeps `unsafe-inline` because the theme bootstrap is inline in `index.html`; migrate that bootstrap to an external script or nonce/hash if a strict CSP is required. HSTS was not forced in source because custom-domain and all-subdomain HTTPS readiness must be confirmed first.

## 10. Findings by Severity

### Critical

**None found in the repository review.** No service-role or private provider credential was found in tracked source, frontend environment examples, build output, or inspected Git history. Any service-role key ever pasted into chat, an issue, a public log, or a client bundle must still be rotated immediately.

### High

**H-01 - Production security state is pending SQL/Edge deployment.**

The repository contains fixes for community room authorization, private resource object reads, community attachment ownership, reaction/comment alternate DML paths, URL validation, and Edge Function CORS/error handling. A live project continues to use its currently installed policies/functions until the updated SQL is executed and functions are redeployed. An attacker could exploit an old installed policy even though the source is fixed. **Remediation:** run the documented SQL order and deploy the changed functions with JWT verification; perform the post-deployment checks in Section 12.

### Medium

**M-01 - No application-level rate limiting on community writes or notification fan-out.**

Approved members can repeatedly call message/comment/post RPCs, and an authorized staff caller can trigger an email fan-out function. Length limits and idempotency logs reduce impact but do not stop spam, scraping, or resource exhaustion. **Remediation:** add per-user/IP quotas, cooldowns, CAPTCHA/Turnstile for signup where appropriate, and an admin-approved queue for email fan-out. Keep limits server-side in Postgres/Edge infrastructure.

**M-02 - Public organization media bucket exposes known object paths.**

`organization-media` is intentionally public for published organization/news/alumni images. Public bucket semantics mean an orphaned, unpublished, or deleted-record object can still be fetched if its path is known. **Remediation:** keep it public only if all uploaded media is non-confidential and add cleanup/lifecycle jobs; otherwise make it private and use signed URLs with published-row checks.

**M-03 - Upload checks trust declared MIME metadata.**

The browser, Storage bucket, and database allowlists restrict declared MIME type and size, but none performs magic-byte validation or malware scanning. A compromised/abusive approved account can upload a mislabeled file. **Remediation:** validate file signatures server-side, scan untrusted files, store downloads with safe content disposition, and quarantine before publication.

**M-04 - Community attachment metadata and legacy forum reads are not paginated.**

Chat messages are capped at 200, but the attachment side query and legacy forum functions can grow with room history. This can increase database, signed-URL, and browser work and assist scraping. **Remediation:** paginate by stable timestamp/ID, bound attachments to the displayed message window or an explicit capped media view, and add per-user request budgets.

**M-05 - Public member preview reveals approved identity metadata.**

The intentional homepage member feature returns approved display name, avatar path, role, and exact total count. It does not return email or student number. **Remediation:** document consent/legitimate-interest basis, consider omitting role and exact count, and provide an opt-out if the organization requires one.

**M-06 - CSP still permits inline scripts/styles.**

The headers are materially stronger, but `unsafe-inline` is present for the inline theme bootstrap and existing inline styling patterns. **Remediation:** move the theme bootstrap to a static file and progressively replace inline styles or use a nonce/hash-based CSP.

### Low / operational

**L-01 - Built-in Supabase email provider limits availability.** The live setting has confirmation enabled and the built-in provider is rate limited. This explains `email rate limit exceeded`; it is not fixed by retrying from the UI. Configure custom SMTP and wait for the provider window to reset. See the official [Auth configuration](https://supabase.com/docs/guides/auth/general-configuration) and [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits) documentation.

**L-02 - Error detail is still surfaced in some staff-facing UI paths.** Admin components may display Supabase error messages to signed-in staff for troubleshooting. This is useful during setup but can expose schema/constraint names. Replace broad raw error rendering with allowlisted friendly messages if the project is exposed to untrusted staff accounts; keep full details only in protected logs.

**L-03 - No automated integration/RLS test suite is present.** Local tests cover URL safety only. Add a disposable Supabase test project or local Supabase CI suite with anonymous, pending, approved student/faculty, editor, and admin cases.

**L-04 - Notification functions appear unused by the current frontend.** No current `functions.invoke` call was found for the content or mention notification functions. Disable/remove deployed functions if the feature is retired; unused privileged endpoints increase maintenance and secret exposure surface.

## 11. OWASP and API-Security Mapping

| Area | Assessment |
| --- | --- |
| A01 Broken Access Control / BOLA | Strong source controls after patch; live deployment pending. IDs are rechecked in RPCs and Storage policies. |
| A02 Cryptographic Failures | Password handling is delegated to Supabase Auth; HTTPS/Supabase TLS is assumed. No custom crypto or private key in source. Review retention and HSTS readiness. |
| A03 Injection | No SQL injection or unsafe HTML sink found. Database checks and React escaping are used. |
| A04 Insecure Design / Sensitive Business Flow | Approval workflow exists; rate limits, upload scanning, and email queue controls remain. |
| A05 Security Misconfiguration | Wildcard Edge CORS and raw provider error responses were fixed in source; live function/header verification remains. Confirm email/quota settings need an operational decision. |
| A06 Vulnerable Components | `npm audit --omit=optional` found zero vulnerabilities; avoid unplanned dependency upgrades. |
| A07 Identification/Auth Failures | Managed Auth, pending profiles, role checks, and same-origin redirects are present. Email confirmation is currently enabled and provider-limited. |
| A08 Software/Data Integrity | Direct reaction/comment writes and unsafe object paths were tightened; constraints protect roles/statuses/content states. |
| A09 Logging/Monitoring | Supabase/Postgres and Edge logs are available; provider response bodies are no longer returned. Add alerting for failed logins, role changes, deletion, abuse, and function failures. |
| A10 SSRF | No backend fetch of user-supplied URLs was found. Resend URLs are fixed; browser external links are restricted to HTTP(S). |
| API Security Top 10 | BOLA/BFLA/BOPLA are addressed by RPC/RLS checks; unrestricted resource consumption and inventory/monitoring controls remain the main gaps. |

## 12. Access-Control Matrix

| Resource | Anonymous | Pending/suspended | Approved student/faculty | Approved editor | Approved admin |
| --- | --- | --- | --- | --- | --- |
| Published public content | Read | Read | Read | CRUD plus drafts | CRUD plus drafts |
| Own profile | None | Auth/profile read as available | Read/update own nickname/avatar/preferences | Same | Same |
| Other profiles/email/student number | None | None | No direct access; limited chat/member preview where intended | Staff RPC scope | Admin user RPC scope |
| Community public rooms | Room metadata; legacy public-room reads only | No messages | Read/send in active unlocked non-staff rooms | Staff-room access and moderation | Same |
| Private resources | None | None | Read published resources | Read/manage all | Read/manage all |
| Audit PDFs | Published only | Published only | Published only | Manage all | Manage all |
| Alumni drafts/consent data | None | None | Published consent-confirmed only | Manage | Manage |
| Reactions/comments | Public summaries/comments for published news | No mutation | Approved mutation/identity RPCs | Same plus moderation | Same plus moderation |
| Team tasks | None | None | None | Read assigned/update assigned status | Full team CRUD |
| Users & Roles | None | None | None | None | Admin-only list/update/delete |
| Auth account deletion | None | None | Own sign-out only | None | Admin Edge Function; self/last-admin protections |

## 13. Implemented Repository Changes

- Added `src/lib/safeUrl.js` and unit tests for HTTP(S), local assets, Storage paths, and same-origin redirects.
- Rejected dot-segment Storage paths and escaped generated notification links before inserting them into email HTML attributes.
- Rejected unsafe external URL schemes in resource, event, organization, alumni, media, footer, and event-page paths.
- Replaced the login redirect check with a same-origin path allowlist.
- Added URL checks to new/future event, resource, and organization social URL records and a non-destructive hardening migration for existing projects.
- Closed legacy community forum reads/writes for locked and staff-only rooms.
- Bound community attachment Storage writes, updates, and deletes to the authenticated message owner and active room.
- Restricted student-resource object reads to published database rows and staff roles.
- Removed direct Data API grants for news reactions/comments while preserving protected RPC flows.
- Removed the obsolete five-argument `admin_update_profile` overload.
- Hardened Edge Function CORS to configured origins, removed raw provider response bodies, sanitized email subjects, and returned generic failures.
- Added Vercel security headers and a CSP.
- Added `supabase/merchandise.sql` with catalog, batch archive, size inventory, order snapshots, RLS, and protected checkout/status/delete functions.
- Added the public `/merchandise` storefront with product details, cart persistence, approved-member order requests, and order history.
- Added the admin Merchandise workspace for product images, publication status, variants/stock, and order-status processing.
- Added `npm test` and the four URL safety tests.
- Added the deployment instructions to `SUPABASE_SETUP.md` and `README.md`.

## 14. Verification Evidence

The following completed successfully on 2026-09-03:

- `npm test`: 4 passed, 0 failed.
- `npm run lint`: passed.
- `npm run build`: passed; Vite transformed 2,299 modules.
- `git diff --check`: passed.
- `npm audit --omit=optional`: 0 vulnerabilities reported.
- Static searches found no `Access-Control-Allow-Origin: *`, `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, or unsafe login redirect pattern in the reviewed source.
- `deno` was unavailable locally, so Edge Function TypeScript compilation was not run locally.
- The canonical production alias returned HTTP 200 with the configured `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` headers.

Read-only live probes previously confirmed:

- Supabase Auth signup is enabled and email auto-confirm is disabled.
- The live `profiles` REST schema contains no `email` column; admin email access is correctly modeled through `auth.users` in the admin RPC source.
- The live role enum accepts `faculty` and rejects an invalid role value.
- The public member preview returned seven approved profiles without email or student number.

## 15. Required Manual Release Checklist

### Supabase SQL

1. Back up or export the project schema according to the organization's change process.
2. Run the currently installed feature files that correspond to the project, including `community.sql`, `community-chat.sql`, `media.sql`, and `resources.sql` where applicable.
3. Run `supabase/merchandise.sql` to create the catalog, batch archive, inventory, order tables, RLS policies, and protected order functions.
4. Run `supabase/security-hardening.sql` last. It is designed to be non-destructive and adds URL checks as `NOT VALID`, removes direct reaction/comment grants, and drops the old profile-function overload.
5. Review existing invalid URL rows and run the optional `VALIDATE CONSTRAINT` statements only after cleanup.
6. Inspect live `pg_policies`, table grants, function grants/owners, Storage policies, and bucket visibility using an administrator connection.

### Edge Functions and secrets

1. Deploy `admin-delete-user` and any still-used notification functions with JWT verification enabled.
2. Store `SUPABASE_SERVICE_ROLE_KEY`/secret key, Resend key, and sender address only in Supabase Edge Function secrets. Never put them in `VITE_*` variables or client code.
3. Set `ALLOWED_ORIGINS` to the exact HTTPS production origin(s), comma-separated only when needed. Do not include arbitrary preview deployments in production.
4. Add monitoring and server-side rate limits before re-enabling notification fan-out.

### Auth and email

1. In Supabase Auth settings, choose deliberately between immediate sign-in and email ownership verification. If the intended product behavior is immediate entry, disabling Confirm email is acceptable only with the approval workflow, strong password policy, abuse controls, and recovery process understood.
2. Configure verified custom SMTP rather than relying on the built-in provider for production. Wait for the current rate-limit window instead of repeatedly retrying signup.
3. Configure redirect allowlists to the production account URL and the minimum required local development URL.

### Vercel and operations

1. Deploy the frontend so the `vercel.json` headers become active, then verify headers on the production alias and any custom domain.
2. Add HSTS only after every production hostname is HTTPS-ready and the domain policy is understood.
3. Monitor Auth failures, database errors, rejected Storage requests, Edge Function failures, role/status changes, account deletion, and unusual community volume.
4. Establish retention/deletion rules for profiles, chat messages, attachments, alumni consent records, and notification logs.

## 16. Secret Rotation Requirements

No rotation is required solely from the repository scan: no private secret value was found in tracked files, and the browser's publishable Supabase key is public by design. Rotate immediately if a Supabase service-role/secret key, database password, Resend API key, SMTP credential, JWT secret, or similar credential was ever exposed outside the Supabase secret store, including a public repository, client bundle, issue, chat, screenshot, or log. After rotation, redeploy affected Edge Functions and revoke the old credential.

## 17. Residual Risk Acceptance

Before calling the application production-ready, an owner should explicitly accept or remediate the public media bucket behavior, upload scanning gap, absence of app-level rate limits, public member metadata, CSP `unsafe-inline`, and the lack of live/integration RLS tests. The repository is in a substantially safer state, but the production boundary is only as strong as the SQL policies and Edge Function versions actually deployed in Supabase.
