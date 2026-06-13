import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMembers } from '../context/MembersContext.jsx';
import { BrandHeader, LogoutButton } from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { StatusPill, PlanBadge } from '../components/Pills.jsx';
import Avatar from '../components/Avatar.jsx';
import { IconSearch, IconPlus, IconUsers, IconChevronRight } from '../components/icons.jsx';
import { daysRemainingLabel, formatShortDate } from '../utils/memberUtils.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expiring', label: 'Expiring' },
  { id: 'expired', label: 'Expired' },
];

export default function MembersList() {
  const { members, stats } = useMembers();
  const [params, setParams] = useSearchParams();
  const initialFilter = params.get('filter') || 'all';
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'days', dir: 'asc' });

  useEffect(() => {
    const fromUrl = params.get('filter') || 'all';
    setFilter(fromUrl);
  }, [params]);

  const counts = {
    all: stats.total,
    active: stats.active,
    expiring: stats.expiring,
    expired: stats.expired,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dir = sort.dir === 'asc' ? 1 : -1;
    return members
      .filter((m) => (filter === 'all' ? true : m.status === filter))
      .filter((m) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        switch (sort.key) {
          case 'name':
            return a.name.localeCompare(b.name) * dir;
          case 'phone':
            return a.phone.localeCompare(b.phone) * dir;
          case 'plan':
            return a.plan.localeCompare(b.plan) * dir;
          case 'expiry':
            return (a.endDate < b.endDate ? -1 : a.endDate > b.endDate ? 1 : 0) * dir;
          case 'status':
            return a.status.localeCompare(b.status) * dir;
          case 'days':
          default:
            // expiring soonest first, then active by days remaining, expired most-recently expired first
            return (a.daysRemaining - b.daysRemaining) * dir;
        }
      });
  }, [members, filter, query, sort]);

  const handleFilter = (id) => {
    setFilter(id);
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('filter');
    else next.set('filter', id);
    setParams(next, { replace: true });
  };

  const handleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  const sortIcon = (key) => (sort.key === key ? (sort.dir === 'asc' ? '↑' : '↓') : '');

  return (
    <>
      <Sidebar />
      <BrandHeader trailing={<LogoutButton />} />
      <main className="page members-page">
        <div className="greeting">
          <h1>Members</h1>
          <p>{stats.total} members in your roster.</p>
        </div>

        <div className="members-toolbar">
          <div className="search-wrap">
            <span className="search-icon">
              <IconSearch size={18} />
            </span>
            <input
              type="search"
              className="search-input"
              placeholder="Search by name or phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Link to="/members/new" className="btn-primary members-add-btn">
            <IconPlus size={18} />
            Add Member
          </Link>
        </div>

        <div className="filter-tabs" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`filter-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => handleFilter(f.id)}
            >
              {f.label}
              <span className="count">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <IconUsers size={20} />
            </div>
            <h3>No members found</h3>
            <p>
              {query
                ? `Nothing matches "${query}".`
                : 'No members in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="card-list">
            <div className="members-table-head">
              <span />
              <button type="button" onClick={() => handleSort('name')}>
                Name <span className="sort-ico">{sortIcon('name')}</span>
              </button>
              <button type="button" onClick={() => handleSort('phone')}>
                Phone <span className="sort-ico">{sortIcon('phone')}</span>
              </button>
              <button type="button" onClick={() => handleSort('plan')}>
                Plan <span className="sort-ico">{sortIcon('plan')}</span>
              </button>
              <button type="button" onClick={() => handleSort('expiry')}>
                Expiry Date <span className="sort-ico">{sortIcon('expiry')}</span>
              </button>
              <button type="button" onClick={() => handleSort('status')}>
                Status <span className="sort-ico">{sortIcon('status')}</span>
              </button>
              <button type="button" onClick={() => handleSort('days')}>
                Days Left <span className="sort-ico">{sortIcon('days')}</span>
              </button>
              <span />
            </div>
            {filtered.map((m) => (
              <Link key={m.id} to={`/members/${m.id}`} className="member-row">
                <Avatar name={m.name} photoUrl={m.photoUrl} />
                <div className="member-info">
                  <div className="name">{m.name}</div>
                  <div className="meta">
                    <PlanBadge planName={m.plan} price={m.planInfo.price} />
                    <span className="sep" />
                    <StatusPill status={m.status} />
                  </div>
                </div>
                <span className="member-cell member-phone">{m.phone}</span>
                <span className="member-cell member-plan">
                  <PlanBadge planName={m.plan} price={m.planInfo.price} />
                </span>
                <span className="member-cell member-expiry">{formatShortDate(m.endDate)}</span>
                <span className="member-cell member-status">
                  <StatusPill status={m.status} />
                </span>
                <span className={`days-pill ${m.status}`}>
                  {daysRemainingLabel(m.daysRemaining)}
                </span>
                <span className="member-cell member-actions">
                  <IconChevronRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Link to="/members/new" className="fab" aria-label="Add member">
        <IconPlus size={22} />
      </Link>

      <BottomNav />
    </>
  );
}
