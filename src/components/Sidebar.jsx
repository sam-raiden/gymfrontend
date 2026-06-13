import { NavLink } from 'react-router-dom';
import { IconHome, IconList, IconUser } from './icons.jsx';

const items = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconHome, end: true },
  { to: '/members', label: 'Members', Icon: IconList, end: false },
  { to: '/account', label: 'Account', Icon: IconUser, end: false },
];

export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="sidebar-brand">
        <div className="brand-logo">R</div>
        <span className="sidebar-brand-text">Retainr</span>
      </div>
      <div className="sidebar-nav">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
