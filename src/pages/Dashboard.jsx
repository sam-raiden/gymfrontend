import { Link, useNavigate } from 'react-router-dom';
import { useMembers } from '../context/MembersContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { BrandHeader, LogoutButton } from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { PlanBadge } from '../components/Pills.jsx';
import Avatar from '../components/Avatar.jsx';
import {
  IconUsers,
  IconCheck,
  IconClock,
  IconAlert,
  IconArrowRight,
  IconChevronRight,
} from '../components/icons.jsx';
import { formatINR, daysRemainingLabel, daysUrgencyTone } from '../utils/memberUtils.js';

function StatCard({ tone = 'accent', icon, label, value, to }) {
  const navigate = useNavigate();
  const Wrapper = to ? 'button' : 'div';
  return (
    <Wrapper
      className={`stat-card ${tone}`}
      onClick={to ? () => navigate(to) : undefined}
    >
      <div className="row-spread">
        <span className="stat-icon">{icon}</span>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </Wrapper>
  );
}

export default function Dashboard() {
  // expiringThisWeek comes straight from GET /dashboard so the list shown
  // here is what the backend considers urgent — no client-side recomputation.
  const { stats, expiringThisWeek } = useMembers();
  const { user } = useAuth();

  return (
    <>
      <Sidebar />
      <BrandHeader trailing={<LogoutButton />} />
      <main className="page">
        <div className="greeting">
          <h1>Welcome back, Owner</h1>
          <p>Here's how {user?.gymName || 'your gym'} is performing today.</p>
        </div>

        <div className="stat-grid">
          <StatCard
            tone="accent"
            icon={<IconUsers size={18} />}
            label="Total Members"
            value={stats.total}
            to="/members"
          />
          <StatCard
            tone="success"
            icon={<IconCheck size={18} />}
            label="Active"
            value={stats.active}
            to="/members?filter=active"
          />
          <StatCard
            tone="warning"
            icon={<IconClock size={18} />}
            label="Expiring Soon"
            value={stats.expiring}
            to="/members?filter=expiring"
          />
          <StatCard
            tone="danger"
            icon={<IconAlert size={18} />}
            label="Expired"
            value={stats.expired}
            to="/members?filter=expired"
          />
        </div>

        <Link to="/finance" className="revenue-card revenue-card-link">
          <span className="rev-label">Monthly Revenue</span>
          <div className="rev-amount">
            <span className="currency">₹</span>
            {formatINR(stats.revenue)}
          </div>
          <div className="rev-sub">
            Tap to see this month's payments
          </div>
          <span className="rev-chevron" aria-hidden="true">
            <IconChevronRight size={18} />
          </span>
        </Link>

        <div className="section-heading">
          <h2>Expiring this week</h2>
          <Link to="/members?filter=expiring" style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 600 }}>
            View all
          </Link>
        </div>

        {expiringThisWeek.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <IconCheck size={20} />
            </div>
            <h3>You're all caught up</h3>
            <p>No memberships expiring this week.</p>
          </div>
        ) : (
          <div className="card-list">
            <div className="expiring-table-head">
              <span />
              <span>Name</span>
              <span>Plan</span>
              <span>Days Left</span>
              <span />
            </div>
            {expiringThisWeek.map((m) => (
              <div key={m.id} className="expiring-card">
                <Avatar name={m.name} photoUrl={m.photoUrl} />
                <div className="info">
                  <div className="name">{m.name}</div>
                  <div className="meta">
                    <PlanBadge planName={m.plan} withPrice={false} />
                    <span className={`days-pill ${daysUrgencyTone(m.daysRemaining)}`}>
                      {daysRemainingLabel(m.daysRemaining)}
                    </span>
                  </div>
                </div>
                <span className="expiring-cell expiring-plan">
                  <PlanBadge planName={m.plan} withPrice={false} />
                </span>
                <span className={`expiring-cell expiring-days days-pill ${daysUrgencyTone(m.daysRemaining)}`}>
                  {daysRemainingLabel(m.daysRemaining)}
                </span>
                <Link to={`/members/${m.id}`} className="detail-btn" aria-label={`View ${m.name}`}>
                  <IconArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
