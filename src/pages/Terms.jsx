import LegalLayout from '../components/LegalLayout.jsx';
import { WHATSAPP_NUMBER } from '../constants.js';

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated="June 13, 2026">
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account or using Retainr (the "Service"), you agree
          to these Terms of Service ("Terms"). If you do not agree, do not
          use the Service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          Retainr is a membership management platform that helps gyms and
          fitness studios track members, memberships, payments, renewals,
          and send WhatsApp reminders.
        </p>
      </section>

      <section>
        <h2>3. Accounts</h2>
        <p>
          You must provide accurate information when creating an account.
          You are responsible for keeping your login credentials
          confidential and for all activity under your account. Notify us
          immediately of any unauthorized use.
        </p>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose.</li>
          <li>Upload data you do not have the right to collect or store.</li>
          <li>Send unsolicited or unauthorized messages to individuals via the WhatsApp messaging feature.</li>
          <li>Attempt to access another gym's data or disrupt the Service.</li>
        </ul>
      </section>

      <section>
        <h2>5. Member Data &amp; Consent</h2>
        <p>
          You (the gym) are solely responsible for the accuracy of member
          data you enter and for obtaining any consents required by
          applicable law before storing member information or sending
          members WhatsApp messages through the Service.
        </p>
      </section>

      <section>
        <h2>6. Subscription &amp; Payments</h2>
        <p>
          Some features of Retainr may require a paid subscription. Fees,
          billing cycles, and payment methods will be communicated
          separately. Fees are non-refundable except as required by law.
        </p>
      </section>

      <section>
        <h2>7. Data Ownership</h2>
        <p>
          You retain ownership of all member data you upload. We do not
          claim ownership of your data and will not use it for purposes
          other than providing the Service, as described in our{' '}
          <a href="/privacy-policy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>8. Service Availability</h2>
        <p>
          We aim to keep the Service available and reliable but do not
          guarantee uninterrupted access. We may perform maintenance,
          updates, or temporary suspensions as needed.
        </p>
      </section>

      <section>
        <h2>9. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or
          terminate accounts that violate these Terms. Upon termination, we
          will retain or delete your data in accordance with our{' '}
          <a href="/privacy-policy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>10. Limitation of Liability</h2>
        <p>
          The Service is provided "as is" without warranties of any kind. To
          the maximum extent permitted by law, Retainr shall not be liable
          for indirect, incidental, or consequential damages arising from
          use of the Service.
        </p>
      </section>

      <section>
        <h2>11. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the
          Service after changes are posted constitutes acceptance of the
          revised Terms.
        </p>
      </section>

      <section>
        <h2>12. Governing Law</h2>
        <p>
          These Terms are governed by the laws of India, without regard to
          conflict-of-law principles.
        </p>
      </section>

      <section>
        <h2>13. Contact Us</h2>
        <p>
          Questions about these Terms? Contact us on{' '}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
            <strong>WhatsApp</strong>
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
