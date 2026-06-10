import { NavLink } from 'react-router-dom';
import { IconHome, IconList, IconUser } from './icons.jsx';

const items = [
  { to: '/', label: 'Dashboard', Icon: IconHome, end: true },
  { to: '/members', label: 'Members', Icon: IconList, end: false },
  { to: '/account', label: 'Account', Icon: IconUser, end: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Primary">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={20} />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
