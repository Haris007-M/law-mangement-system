import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { BRAND, LEGAL } from '@/lib/brand'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what personal information {BRAND.name} handles, why, and the choices you have. {LEGAL.company} (&quot;we&quot;, &quot;us&quot;)
        provides the Service. For the legal matters you or your lawyer record in it, your lawyer or law firm decides what is collected and why, and acts as the
        &quot;controller&quot; of that information; we process it on their behalf as the &quot;processor&quot;.
      </p>

      <h2>1. Information we handle</h2>
      <ul>
        <li><strong>Account details:</strong> name, email address, phone, firm name, role, and sign-in security data (including whether two-factor authentication is on).</li>
        <li><strong>Case information:</strong> case records, messages, private notes, calendar entries, tasks, invoices and uploaded documents entered by lawyers and clients.</li>
        <li><strong>Activity records:</strong> an audit log of sensitive actions (for example account creation, document uploads and downloads, invoice changes) and technical logs such as IP address for security and rate limiting.</li>
        <li><strong>Email:</strong> the notification emails we send, if enabled.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>to provide and secure the Service, including sign-in and access control;</li>
        <li>to send invitations, password-reset links, notifications and reminders you can switch off in Settings;</li>
        <li>to detect abuse, enforce limits, investigate incidents and keep audit records;</li>
        <li>to meet legal obligations.</li>
      </ul>
      <p>We do not sell personal information, and we do not use case content for advertising.</p>

      <h2>3. Who can see what</h2>
      <p>
        Access rules are enforced in the database. A lawyer sees only their own clients and cases. A client sees only their own cases and the items their lawyer
        shares. Private lawyer notes are visible only to the lawyer. Platform administrators can manage accounts and see usage totals, but cannot read case
        contents, messages or documents through the application.
      </p>

      <h2>4. Cookies</h2>
      <p>
        We use only essential cookies that keep you signed in and protect your session. We do not use advertising or tracking cookies, so no cookie banner is needed.
      </p>

      <h2>5. Service providers and storage</h2>
      <p>
        We use trusted providers to run the Service: cloud hosting, a managed database and file storage (Supabase), and an email delivery provider.
        They process information only on our instructions and under appropriate safeguards. Data may be stored in the region selected for your deployment.
      </p>

      <h2>6. Security</h2>
      <p>
        Measures include encrypted connections, private file storage with short-lived download links, row-level access rules, rate-limited sign-in,
        optional two-factor authentication, and audit logging. No system is perfectly secure; if a breach affecting you occurs we will notify you as the law requires.
      </p>

      <h2>7. Retention and deletion</h2>
      <p>
        We keep information while your account is active and for as long as your lawyer needs it for their records. When an account or case is deleted, the
        related data is removed from the live system; backups expire on their normal cycle. Some records may be kept longer where the law requires.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, export or delete your information, to object to or restrict processing, and
        to complain to a data-protection authority. For information about a legal matter, contact your lawyer first; for your account or this policy, contact us.
      </p>

      <h2>9. International transfers</h2>
      <p>If information is transferred across borders, we use appropriate safeguards where the law requires them.</p>

      <h2>10. Children</h2>
      <p>The Service is not directed to children, and accounts are created only for adults or by their lawyer on their behalf.</p>

      <h2>11. Changes</h2>
      <p>We may update this policy and will tell you about material changes in the Service or by email.</p>

      <h2>12. Contact</h2>
      <p>Privacy questions or requests: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.</p>
    </LegalPage>
  )
}
