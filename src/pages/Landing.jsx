import { Link } from 'react-router-dom';
import { IconArrowRight, IconWhatsApp, IconClock, IconUsers, IconBell } from '../components/icons.jsx';
import { WHATSAPP_NUMBER } from '../constants.js';

const FEATURES = [
  {
    icon: <IconClock size={20} />,
    title: 'Automatic renewal tracking',
    text: "See exactly who's expiring this week, no spreadsheets needed.",
  },
  {
    icon: <IconBell size={20} />,
    title: 'WhatsApp renewal reminders',
    text: 'Members get nudged automatically before their plan lapses.',
  },
  {
    icon: <IconUsers size={20} />,
    title: 'One dashboard for everything',
    text: 'Members, payments, and revenue — all in one simple view.',
  },
];

export default function Landing() {
  return (
    <div className="landing-screen">
      <div className="landing-content">
        <div className="landing-brand">
          <img src="/icon-512.png" alt="Retainr" className="landing-logo" />
          <h1 className="landing-title">Retainr</h1>
          <p className="landing-tagline">Never lose a gym member again</p>
        </div>

        <ul className="landing-features">
          {FEATURES.map((f) => (
            <li key={f.title} className="landing-feature">
              <span className="landing-feature-icon">{f.icon}</span>
              <div>
                <div className="landing-feature-title">{f.title}</div>
                <div className="landing-feature-text">{f.text}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="landing-actions">
          <a
            className="btn-primary"
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconWhatsApp size={18} />
            Contact us on WhatsApp
          </a>
          <Link className="btn-secondary" to="/login">
            Login
            <IconArrowRight size={18} />
          </Link>
        </div>

        <div className="landing-footer">
          <div className="landing-footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
          <div>© 2026 Retainr</div>
        </div>
      </div>
    </div>
  );
}
