import { useNavigate } from 'react-router-dom';
import { IconChevronLeft, IconLogout } from './icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function BrandHeader({ trailing }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-logo">KG</div>
        <div className="brand-text">
          <strong>Kai Green Fitness</strong>
          <span>Members</span>
        </div>
      </div>
      <div className="header-actions">{trailing}</div>
    </header>
  );
}

export function PageHeader({ title, backTo, trailing, onBack }) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) return onBack();
    if (backTo) return navigate(backTo);
    navigate(-1);
  };
  return (
    <header className="app-header">
      <button className="back-btn" onClick={handleBack} aria-label="Back">
        <IconChevronLeft size={18} />
        Back
      </button>
      <div className="page-title">{title}</div>
      <div className="header-actions">{trailing || <span style={{ width: 38 }} />}</div>
    </header>
  );
}

export function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      className="icon-btn"
      aria-label="Sign out"
      onClick={() => {
        logout();
        navigate('/login', { replace: true });
      }}
    >
      <IconLogout size={18} />
    </button>
  );
}
