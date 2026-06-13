import LegalLayout from '../components/LegalLayout.jsx';
import { WHATSAPP_NUMBER } from '../constants.js';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 13, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          Retainr ("Retainr", "we", "us", "our") provides a membership
          management platform for gyms and fitness studios ("the Service").
          This Privacy Policy explains how we collect, use, store, and
          protect information when a gym and its staff use the Service.
        </p>
      </section>

      <section>
        <h2>2. Who This Policy Covers</h2>
        <p>This policy applies to two kinds of data:</p>
        <ul>
          <li>
            <strong>Staff accounts</strong> — gym owners and staff who sign
            in to Retainr to manage their gym.
          </li>
          <li>
            <strong>Member data</strong> — information about gym members,
            entered into Retainr by gym staff.
          </li>
        </ul>
        <p>
          If you are a gym member, your gym (not Retainr) is responsible for
          collecting your consent before adding your details to the
          platform. Please contact your gym directly with questions about
          your personal data.
        </p>
      </section>

      <section>
        <h2>3. Information We Collect</h2>
        <ul>
          <li>
            <strong>Staff account info</strong> — name, email, phone number,
            password (stored as a one-way hash), and role.
          </li>
          <li>
            <strong>Gym info</strong> — gym name and membership plans
            configured by the owner.
          </li>
          <li>
            <strong>Member data</strong> — name, phone number, profile photo,
            membership plan, and payment/renewal history entered by staff.
          </li>
          <li>
            <strong>Technical data</strong> — basic request logs (such as IP
            address and timestamps) used for security and troubleshooting.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. How We Use Information</h2>
        <ul>
          <li>To provide the core service: member tracking, renewal reminders, dashboards, and payment records.</li>
          <li>To send WhatsApp renewal reminders on behalf of the gym (see Section 5).</li>
          <li>To keep accounts secure, including rate-limiting and abuse prevention.</li>
          <li>To maintain and improve the Service.</li>
        </ul>
      </section>

      <section>
        <h2>5. WhatsApp Messaging</h2>
        <p>
          Where a gym enables it, Retainr may send automated WhatsApp
          messages — such as membership renewal reminders — to phone numbers
          stored in member data, using a WhatsApp Business Solution Provider
          (BSP). Message content is limited to gym-related notifications.
          The gym is responsible for ensuring it has the right to contact its
          members this way.
        </p>
      </section>

      <section>
        <h2>6. Data Storage &amp; Security</h2>
        <ul>
          <li>Data is stored in a managed Postgres database and object storage provided by Supabase, encrypted in transit (TLS) and at rest.</li>
          <li>Each gym's data is isolated using row-level security (RLS) — one gym cannot access another gym's data.</li>
          <li>Dashboard access requires authentication via signed JSON Web Tokens (JWT).</li>
          <li>Member photos are stored in a private bucket and served through access-controlled URLs.</li>
        </ul>
      </section>

      <section>
        <h2>7. Data Sharing</h2>
        <p>We do not sell personal data. We only share it with:</p>
        <ul>
          <li>Supabase, our database and storage infrastructure provider.</li>
          <li>Our WhatsApp Business Solution Provider, solely to deliver messages requested by the gym.</li>
          <li>Law enforcement or regulators, where legally required.</li>
        </ul>
      </section>

      <section>
        <h2>8. Data Retention</h2>
        <p>
          We retain staff account and member data for as long as the gym's
          account is active. A gym owner may request deletion of their gym's
          data at any time; we will delete it within a reasonable period,
          subject to any legal record-keeping requirements.
        </p>
      </section>

      <section>
        <h2>9. Your Rights</h2>
        <p>
          Depending on your location, you may have the right to access,
          correct, or request deletion of your personal data. Gym members
          should direct such requests to their gym, who can action them
          through Retainr or by contacting us.
        </p>
      </section>

      <section>
        <h2>10. Children's Data</h2>
        <p>
          Retainr is intended for use by gym businesses and their adult
          staff. We do not knowingly collect data from children under 13.
        </p>
      </section>

      <section>
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Continued use
          of the Service after changes are posted constitutes acceptance of
          the revised policy.
        </p>
      </section>

      <section>
        <h2>12. Contact Us</h2>
        <p>
          Questions about this policy? Contact us on{' '}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
            <strong>WhatsApp</strong>
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
