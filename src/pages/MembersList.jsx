import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMembers } from '../context/MembersContext.jsx';
import { BrandHeader, LogoutButton } from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { StatusPill, PlanBadge } from '../components/Pills.jsx';
import Avatar from '../components/Avatar.jsx';
import { IconSearch, IconPlus, IconUsers } from '../components/icons.jsx';
import { daysRemainingLabel } from '../utils/memberUtils.js';

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
        // expiring soonest first, then active by days remaining, expired most-recently expired first
        return a.daysRemaining - b.daysRemaining;
      });
  }, [members, filter, query]);

  const handleFilter = (id) => {
    setFilter(id);
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('filter');
    else next.set('filter', id);
    setParams(next, { replace: true });
  };

  return (
    <>
      <BrandHeader trailing={<LogoutButton />} />
      <main className="page">
        <div className="greeting">
          <h1>Members</h1>
          <p>{stats.total} members in your roster.</p>
        </div>

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
            {filtered.map((m) => (
              <Link key={m.id} to={`/members/${m.id}`} className="member-row">
                <Avatar name={m.name} photoUrl={m.photoUrl} />
                <div className="member-info">
                  <div className="name">{m.name}</div>
                  <div className="meta">
                    <PlanBadge planId={m.plan} />
                    <span className="sep" />
                    <StatusPill status={m.status} />
                  </div>
                </div>
                <span className={`days-pill ${m.status}`}>
                  {daysRemainingLabel(m.daysRemaining)}
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
