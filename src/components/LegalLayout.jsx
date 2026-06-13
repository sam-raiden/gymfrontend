import { Link } from 'react-router-dom';
import { IconChevronLeft } from './icons.jsx';

export default function LegalLayout({ title, updated, children }) {
  return (
    <div className="legal-screen">
      <div className="legal-content">
        <Link to="/" className="legal-back">
          <IconChevronLeft size={18} />
          Back to Retainr
        </Link>
        <h1 className="legal-title">{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
        {children}
      </div>
    </div>
  );
}
