import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useMembers } from '../context/MembersContext.jsx';
import { BrandHeader, LogoutButton } from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Avatar from '../components/Avatar.jsx';
import { PlanBadge } from '../components/Pills.jsx';
import {
  IconCash,
  IconSmartphone,
  IconChevronLeft,
  IconChevronRight,
  IconTrend,
  IconRupee,
} from '../components/icons.jsx';
import {
  formatINR,
  formatShortDate,
  todayIST,
} from '../utils/memberUtils.js';

// "2026-06" → "June 2026"
function formatMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

function shiftMonthKey(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function currentMonthKey() {
  return todayIST().slice(0, 7);
}

export default function Finance() {
  const { payments, getMember } = useMembers();
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  const monthPayments = useMemo(
    () =>
      payments
        .filter((p) => p.paidAt.startsWith(monthKey))
        .sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    [payments, monthKey]
  );

  const totals = useMemo(() => {
    let total = 0;
    let cashAmt = 0;
    let cashCount = 0;
    let gpayAmt = 0;
    let gpayCount = 0;
    for (const p of monthPayments) {
      total += p.amount;
      if (p.method === 'gpay') {
        gpayAmt += p.amount;
        gpayCount += 1;
      } else {
        cashAmt += p.amount;
        cashCount += 1;
      }
    }
    return { total, cashAmt, cashCount, gpayAmt, gpayCount };
  }, [monthPayments]);

  const cashPct =
    totals.total > 0 ? Math.round((totals.cashAmt / totals.total) * 100) : 0;
  const gpayPct =
    totals.total > 0 ? Math.round((totals.gpayAmt / totals.total) * 100) : 0;

  const isCurrentMonth = monthKey === currentMonthKey();
  const monthLabel = formatMonthKey(monthKey);

  return (
    <>
      <BrandHeader trailing={<LogoutButton />} />
      <main className="page">
        <div className="greeting">
          <h1>Revenue</h1>
          <p>Payments collected and how they were paid.</p>
        </div>

        {/* Month switcher */}
        <div className="month-switcher">
          <button
            type="button"
            className="month-nav"
            onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))}
            aria-label="Previous month"
          >
            <IconChevronLeft size={18} />
          </button>
          <div className="month-label">
            <div className="month-main">{monthLabel}</div>
            {isCurrentMonth && (
              <div className="month-sub">This month</div>
            )}
          </div>
          <button
            type="button"
            className="month-nav"
            onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))}
            aria-label="Next month"
          >
            <IconChevronRight size={18} />
          </button>
        </div>

        {/* Revenue total */}
        <div className="revenue-card">
          <span className="rev-label">{monthLabel} · Revenue</span>
          <div className="rev-amount">
            <span className="currency">₹</span>
            {formatINR(totals.total)}
          </div>
          <div className="rev-sub">
            {monthPayments.length === 0
              ? 'No payments collected'
              : `From ${monthPayments.length} payment${
                  monthPayments.length === 1 ? '' : 's'
                }`}
          </div>
        </div>

        {/* Method breakdown */}
        <div className="breakdown-card">
          <div className="breakdown-row">
            <span className="breakdown-ico cash">
              <IconCash size={18} />
            </span>
            <div className="breakdown-meta">
              <div className="breakdown-label">Cash</div>
              <div className="breakdown-sub">
                {totals.cashCount} payment
                {totals.cashCount === 1 ? '' : 's'} · {cashPct}%
              </div>
            </div>
            <div className="breakdown-amount">
              ₹{formatINR(totals.cashAmt)}
            </div>
          </div>
          <div className="breakdown-bar">
            <span
              className="breakdown-bar-cash"
              style={{ width: `${cashPct}%` }}
            />
            <span
              className="breakdown-bar-gpay"
              style={{ width: `${gpayPct}%` }}
            />
          </div>
          <div className="breakdown-row">
            <span className="breakdown-ico gpay">
              <IconSmartphone size={18} />
            </span>
            <div className="breakdown-meta">
              <div className="breakdown-label">GPay</div>
              <div className="breakdown-sub">
                {totals.gpayCount} payment
                {totals.gpayCount === 1 ? '' : 's'} · {gpayPct}%
              </div>
            </div>
            <div className="breakdown-amount">
              ₹{formatINR(totals.gpayAmt)}
            </div>
          </div>
        </div>

        <div className="section-heading">
          <h2>Payments</h2>
          <span>{monthPayments.length} this month</span>
        </div>

        {monthPayments.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <IconTrend size={20} />
            </div>
            <h3>No payments yet</h3>
            <p>Renewals collected in {monthLabel} will appear here.</p>
          </div>
        ) : (
          <div className="card-list">
            {monthPayments.map((p) => {
              const member = getMember(p.memberId);
              const isGpay = p.method === 'gpay';
              return (
                <Link
                  key={p.id}
                  to={member ? `/members/${p.memberId}` : '#'}
                  className="payment-row"
                  onClick={(e) => {
                    if (!member) e.preventDefault();
                  }}
                >
                  <Avatar name={p.memberName} photoUrl={member?.photoUrl} />
                  <div className="payment-info">
                    <div className="payment-name">{p.memberName}</div>
                    <div className="payment-meta">
                      <PlanBadge planId={p.planId} withPrice={false} />
                      <span className="sep" />
                      <span>{formatShortDate(p.paidAt)}</span>
                    </div>
                  </div>
                  <div className="payment-amount-block">
                    <div className="payment-amount">
                      ₹{formatINR(p.amount)}
                    </div>
                    <span className={`payment-method ${isGpay ? 'gpay' : 'cash'}`}>
                      {isGpay ? (
                        <IconSmartphone size={11} />
                      ) : (
                        <IconCash size={11} />
                      )}
                      {isGpay ? 'GPay' : 'Cash'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
