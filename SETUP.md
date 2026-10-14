# Setup guide

Flow: **super admin → creates lawyers → each lawyer creates their own clients.**
Everyone chooses their own password from a one-time link. Nobody can sign up on their own.

## 0. Requirements
Node.js 20.9 or newer (22 LTS recommended) and a free Supabase project.

## 1. Install
    npm install

## 2. Environment
Copy `.env.local.example` to `.env.local` and fill it in.
Required: the three Supabase values (Project Settings → API).
Optional: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_NAME`, and the SMTP block for automatic emails.
**Restart `npm run dev` after every change to `.env.local`.**

## 3. Database
Open `supabase/schema.sql`, **copy its contents**, paste them into Supabase → SQL Editor → Run
(choose "Run this query" if it warns about destructive operations; nothing is deleted).
It is safe to re-run after every update. It creates the tables, security rules, triggers and the private
`case-documents` storage bucket.
Check: `select public.rate_limit_hit('test', 5, 60);` should return `true`.

## 4. Create your super admin (once)
    npm run create-admin -- you@example.com "StrongPass123" "Your Name"
Password: 10+ characters with a letter and a number.

## 5. Start with a clean database (remove test data)
If you created test accounts or sample data while trying the app, remove everything except super admins:

    npm run clean-slate            # shows what would be deleted, changes nothing
    npm run clean-slate -- --yes   # deletes cases, documents, invoices, lawyers and clients, and clears logs

## 6. Supabase dashboard settings
- Authentication → Sign In / Providers → Email: turn OFF "Allow new users to sign up".
- Authentication → URL Configuration: Site URL = your app URL; add `<your app URL>/**` to Redirect URLs.
- Email OTP expiration: set to 86400 (24 h) so invite links last a day. Minimum password length: 10.
- Paid plans: set session timeouts under Authentication → Sessions.

## 6b. Email notifications and daily reminders
Notifications need SMTP (see "Email" below). Reminders also need a scheduler to call
`GET /api/cron/reminders` once a day with the header `Authorization: Bearer <CRON_SECRET>`.
- **Vercel:** set `CRON_SECRET` in the project's environment variables. `vercel.json` already schedules it (05:00 UTC daily); Vercel sends the header for you.
- **Anywhere else:** use any scheduler (cron-job.org, GitHub Actions, server cron) to call that URL with the header.
Test it: `curl -H "Authorization: Bearer YOUR_SECRET" https://your-domain/api/cron/reminders`.

## 6c. Two-factor authentication
Settings → **Two-factor authentication** → Set up → scan the QR code → enter the 6-digit code.
From then on sign-in asks for the code after the password. To turn it off a current code is required.
Lost phone: your admin (for lawyers) or your lawyer (for clients) clicks **Reset 2FA**; the platform owner runs
`npm run reset-2fa -- their@email.com`. (Supabase TOTP is available on all plans; make sure MFA is not disabled under Authentication → Multi-Factor.)

## 6d. Mobile and "Add to Home Screen"
Nothing to configure. On a phone, open your deployed site (HTTPS), then:
- **iPhone (Safari):** Share → Add to Home Screen.
- **Android (Chrome):** menu → Install app / Add to Home screen.
It then opens full-screen with its own icon. Re-run `supabase/schema.sql` once so the admin charts have data
(they simply stay empty until you do).

## 7. Run
    npm run dev       # http://localhost:3000
    npm run build && npm start

## Try the full flow
1. `/login` as super admin → **Lawyers** → create a lawyer. Copy the link (or email is sent if SMTP is set) and open it in a private window → Continue → set a password → lawyer dashboard.
2. As the lawyer: **Clients** → create a client → open that link in another private window → client dashboard.
3. As the lawyer: **Cases → New case** for the client. Open the case: post a message, upload a document (tick "Share with the client"), add a hearing (tick "Show to the client"), create an invoice (save as "Sent").
4. As the client: see the case, read the message, download the shared document, see the appointment and invoice, reply, upload a file.
5. As super admin: **Dashboard** shows totals; **Audit log** shows what happened. Note you can never open the case.

Testing on one computer: use a private window per account. Real users on their own devices never hit this.

## Email (recommended for production)
Fill `SMTP_*` and `MAIL_FROM` in `.env.local`. Any SMTP provider works (Resend, Brevo, Mailgun, Amazon SES).
You need a domain you own for professional sending. With SMTP on, the inviter never sees the link,
so a lawyer cannot take over a client's account, and "Forgot password" works.

## Production checklist
- Same env vars on your host; `NEXT_PUBLIC_SITE_URL=https://your-domain.com`; HTTPS only.
- Host must pass `x-forwarded-for` (Vercel does) so IP rate limits work.
- Rotate any key that has ever been shared. Never expose `SUPABASE_SERVICE_ROLE_KEY`.
- Run `npm run clean-slate` once before going live to make sure no test accounts or sample data remain.
- Turn on Supabase backups (paid plans) and point-in-time recovery for client data.

## Before you launch
- Edit the **Terms** and **Privacy** pages' company details via the `NEXT_PUBLIC_COMPANY_NAME / SUPPORT_EMAIL / JURISDICTION` variables, and have a qualified lawyer review the text.

## Troubleshooting
- **"Too many attempts" for everyone / uploads fail:** you did not run the latest `schema.sql`.
- **Emails do not arrive:** look for `sendMail failed:` in the terminal; verify the sender domain with your provider.
- **Sent to a 2FA page but cannot pass it:** check your phone's clock is set to automatic; codes depend on it.
- **Upload says too large:** limit is 8 MB per file (change `MAX_UPLOAD_BYTES` in `lib/constants.ts` and the `bodySizeLimit` in `next.config.ts`).
- **Invite link says invalid or expired:** use "Resend invite email" / "Get setup link" on that person's row.
