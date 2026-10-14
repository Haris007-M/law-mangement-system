# LexDesk: law firm practice management

A secure, multi-tenant web app for law firms: cases, client portal, documents, calendar,
tasks, messaging and billing. Built with **Next.js 16, React 19, Supabase (Postgres + Auth + Storage) and Tailwind CSS 4**.

Rebrand it in one line: `lib/brand.ts` (or `NEXT_PUBLIC_APP_NAME`).

## Look and feel

A 60 / 30 / 10 colour system: soft slate-white background `#F8FAFC` and white cards (60%), dark slate-navy `#0F172A`
for text and the sidebar (30%), muted metallic gold `#C5A880` for primary actions (10%), and deep crimson `#B91C1C`
reserved for critical alerts. Serif headings (Playfair Display) with Geist for text.

- Retheme everything from one place: the `@theme` block in `app/globals.css`.
- Product name and tagline: `lib/brand.ts` (or `NEXT_PUBLIC_APP_NAME`).
- Logo: `public/logo.png` (mark), `public/logo-full-dark.png` / `logo-full-light.png` (with wordmark), favicon `app/icon.png`.
- Dashboard banners: `public/images/banner-admin.jpg`, `banner-lawyer.jpg`, `banner-client.jpg`; landing hero `public/images/hero.jpg`.
  Replace any file with your own picture of the same name (about 1920×520 for banners) to change it.

## Three portals, strict boundaries

| Capability | Super admin | Lawyer | Client |
|---|:---:|:---:|:---:|
| Create lawyer accounts | ✅ | ❌ | ❌ |
| Create client accounts | ❌ | ✅ (own clients) | ❌ |
| Suspend / reactivate accounts | lawyers | own clients | ❌ |
| Platform totals (lawyers, clients, cases, storage) | ✅ | ❌ | ❌ |
| Audit log | ✅ | ❌ | ❌ |
| Account directory (names, emails, status) | all | own clients | own lawyer |
| **Case contents** (details, messages, documents) | ❌ never | ✅ own cases | ✅ own cases, read-only details |
| Create / edit cases | ❌ | ✅ | ❌ |
| Private case notes | ❌ | ✅ (only they can read) | ❌ |
| Messages on a case | ❌ | ✅ | ✅ |
| Upload documents | ❌ | ✅ (choose to share) | ✅ (to their own cases) |
| See documents | ❌ | all in own cases | only shared + own uploads |
| Calendar and tasks | ❌ | ✅ | sees only events shared with them |
| Create invoices, mark paid / void | ❌ | ✅ | ❌ |
| View / print invoices | ❌ | ✅ | ✅ (never drafts) |
| Edit own profile, change password | ✅ | ✅ | ✅ |

The key promise for buyers: **the platform owner cannot read client matters.** This is enforced in the
database (row level security), not just hidden in the interface.

## Responsive and mobile-app ready

- **Charts behind the dashboard numbers** (new cases per week, client growth, tasks due in the next 7 days, invoices, and for admins new lawyers, clients, cases and uploads per week, all counts only).
- **Phones and tablets get an app-style layout:** top bar with your account menu, bottom tab bar, slide-up "More" menu,
  safe-area support for notched phones, 16px inputs (no iOS zoom), large touch targets, and tables that turn into cards.
- **Installable:** "Add to Home Screen" opens it full-screen like a native app (web manifest + icons included).
- Desktop (1024px and up) keeps the sidebar layout.

## What's new in this version

- **Two-factor login (TOTP).** Any user can turn it on in Settings (Google/Microsoft Authenticator, Authy, 1Password...).
  It is enforced **in the database**, not just the interface, so a stolen password cannot read data even through the API.
  Lost phone? Admins can reset lawyers, lawyers can reset their clients, or run `npm run reset-2fa -- email`.
- **Email notifications.** New message, document shared or sent by the client, new appointment, invoice sent and paid.
  Users can switch them off in Settings. Emails contain no case details, only a link back in.
- **Daily reminders.** One digest of hearings, meetings, deadlines and due or overdue tasks (`/api/cron/reminders`).
- **Edit and delete.** Cases (typed confirmation, files removed too), tasks, events and invoices
  (only drafts can be edited or deleted; sent invoices are voided so the record stays honest).
- **Branded 404, error and loading screens**, plus **Terms of Service** and **Privacy Policy** pages.

## Pages

- **Super admin:** Dashboard · Lawyers · Clients · Audit log · Settings
- **Lawyer:** Dashboard · Clients (+ detail) · Cases (+ workspace with Overview, Messages, Documents, Tasks, Schedule, Private notes, Billing) · Calendar · Tasks · Documents · Billing (+ printable invoices) · Settings
- **Client:** Dashboard · My cases (+ Overview, Messages, Documents, Appointments, Invoices) · Documents · Appointments · Invoices (+ printable) · Settings
- **Public:** Landing page · Sign in (+ 2FA step) · Forgot password · Set password (invite link) · Terms · Privacy

## Security model

- Invitation-only. No public sign-up. Accounts are created by their parent role.
- Row level security on every table; helper functions guarantee tenant isolation. A trigger guarantees a client's lawyer is really a lawyer.
- Suspending a lawyer automatically blocks all of their clients.
- Every page and every server action re-checks the signed-in role (layouts alone are not trusted).
- Private file bucket with no direct access: downloads go through a permission-checked, 60-second signed link, and are audit logged.
- Login, password reset, invites, uploads and messages are rate limited (Postgres based, works across servers).
- Password policy (10+ chars, letter and number), httpOnly session cookies, security headers, `no-referrer` so link tokens never leak.
- One-time invite links are verified on click (not on page load), so mail/chat link scanners cannot burn them.
- Optional two-factor authentication enforced by the database (`mfa_ok()` in every access rule).
- Append-only audit log of sensitive actions.
- Email delivery via any SMTP provider. Without SMTP the app shows the one-time link for the inviter to send.

## Quick start

See **SETUP.md**. In short:

```bash
npm install
cp .env.local.example .env.local      # fill in Supabase keys
# paste the CONTENTS of supabase/schema.sql into the Supabase SQL Editor and run it
npm run create-admin -- you@example.com "StrongPass123" "Your Name"
npm run dev
```

## Project layout

```
app/admin, app/lawyer, app/client   the three portals (layout + pages + server actions)
app/actions                          shared actions (auth, account, documents, messages)
app/api/documents/[id]               secure download route
components/                          UI kit (sidebar shell, cards, forms, lists)
lib/                                 auth helpers, validation, formatting, mail, rate limit, audit
supabase/schema.sql                  tables, RLS policies, triggers, storage bucket (re-runnable)
scripts/                             create-super-admin, reset-2fa, clean-slate
proxy.ts                             session refresh + role routing (Next 16 "proxy")
```

## Roadmap ideas (not included)

Online payments (Stripe), e-signature, time tracking, email/SMS reminders,
conflict-of-interest checks, multi-language / RTL.
