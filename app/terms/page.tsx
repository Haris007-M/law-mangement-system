import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { BRAND, LEGAL } from '@/lib/brand'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms govern your use of {BRAND.name} (the &quot;Service&quot;), provided by {LEGAL.company} (&quot;we&quot;, &quot;us&quot;).
        By signing in you agree to them. If you use the Service on behalf of a law firm, you confirm you are authorised to accept these terms for it.
      </p>

      <h2>1. The Service</h2>
      <p>
        {BRAND.name} is practice-management software: case records, a client portal, document storage, messaging, a calendar, tasks and invoicing.
        We are a software provider. We are not a law firm, we do not give legal advice, and nothing in the Service creates a lawyer-client relationship with us.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>Accounts are by invitation only. Administrators invite lawyers; lawyers invite their own clients.</li>
        <li>You must keep your sign-in details and authenticator device secure and notify us promptly of any unauthorised use.</li>
        <li>You are responsible for everything done under your account. We recommend turning on two-factor authentication.</li>
      </ul>

      <h2>3. Your content and confidentiality</h2>
      <p>
        You own the information you put into the Service (&quot;Your Content&quot;). We process it only to provide the Service, as described in our{' '}
        <a href="/privacy">Privacy Policy</a>. Lawyers remain solely responsible for meeting their own professional duties, including confidentiality,
        privilege, record-keeping, conflicts checks and compliance with the rules of their bar or regulator, and for deciding what to share with each client.
        Platform administrators can manage accounts but are not able to read case contents, messages or documents through the application.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>break the law, or upload unlawful, infringing or malicious content;</li>
        <li>attempt to access data or accounts that are not yours, or to bypass security or rate limits;</li>
        <li>probe, scan or overload the Service, or reverse engineer it except as the law allows;</li>
        <li>resell or provide the Service to third parties without our written agreement.</li>
      </ul>

      <h2>5. Availability and changes</h2>
      <p>
        We work to keep the Service available and secure but do not promise it will be uninterrupted or error-free. We may update, improve or
        discontinue features, and will give reasonable notice of material changes where we can. You are responsible for keeping your own copies of
        information you cannot afford to lose.
      </p>

      <h2>6. Fees</h2>
      <p>Fees, if any, are set out in your order or subscription agreement. Unless that agreement says otherwise, fees are non-refundable.</p>

      <h2>7. Suspension and termination</h2>
      <p>
        We may suspend or end access if these terms are breached, if required by law, or to protect the Service and its users. Suspending a lawyer
        account also suspends access for that lawyer&apos;s clients. You may stop using the Service at any time; ask us to delete your data
        and we will do so as described in the Privacy Policy, subject to legal retention duties.
      </p>

      <h2>8. Disclaimers and liability</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the fullest extent permitted by law, we exclude implied warranties
        and are not liable for indirect or consequential loss, loss of profits or data, or professional-liability claims arising from your use of the
        Service. Our total liability for any claim is limited to the fees you paid us in the 12 months before the claim. Nothing in these terms
        limits liability that cannot be limited by law.
      </p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of {LEGAL.jurisdiction}, and its courts have jurisdiction, subject to any mandatory consumer rights.</p>

      <h2>10. Changes to these terms</h2>
      <p>We may update these terms. If a change is material we will tell you in the Service or by email. Continued use after a change means you accept it.</p>

      <h2>11. Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.</p>
    </LegalPage>
  )
}
