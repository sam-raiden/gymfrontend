import { Link, useNavigate } from 'react-router-dom';
import { useMembers } from '../context/MembersContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { BrandHeader, LogoutButton } from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { PlanBadge } from '../components/Pills.jsx';
import Avatar from '../components/Avatar.jsx';
import {
  IconUsers,
  IconCheck,
  IconCheckMark,
  IconClock,
  IconAlert,
  IconSend,
  IconArrowRight,
  IconChevronRight,
} from '../components/icons.jsx';
import { formatINR, daysRemainingLabel } from '../utils/memberUtils.js';

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
  const { stats, expiringThisWeek, remindersSent, markReminderSent } =
    useMembers();
  const { user } = useAuth();
  const { showToast } = useToast();

  const greetingName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'there';

  return (
    <>
      <BrandHeader trailing={<LogoutButton />} />
      <main className="page">
        <div className="greeting">
          <h1>Welcome back, {greetingName}</h1>
          <p>Here's how Kai Green Fitness is performing today.</p>
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
            {expiringThisWeek.map((m) => {
              const sent = remindersSent.has(m.id);
              return (
                <div key={m.id} className="expiring-card">
                  <div className="top">
                    <Avatar name={m.name} photoUrl={m.photoUrl} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="name">{m.name}</div>
                      <div className="meta">
                        <PlanBadge planId={m.plan} withPrice={false} />
                        <span className={`days-pill ${m.status}`}>
                          {daysRemainingLabel(m.daysRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className={`reminder-btn ${sent ? 'sent' : ''}`}
                      onClick={() => {
                        if (sent) return;
                        markReminderSent(m.id);
                        showToast(`Reminder sent to ${m.name.split(' ')[0]}`);
                      }}
                    >
                      {sent ? (
                        <>
                          <IconCheckMark size={14} /> Reminder sent
                        </>
                      ) : (
                        <>
                          <IconSend size={14} /> Send Reminder
                        </>
                      )}
                    </button>
                    <Link to={`/members/${m.id}`} className="detail-btn">
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
