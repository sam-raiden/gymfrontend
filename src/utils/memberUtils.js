/** "1 month" / "3 months" / "12 months" */
export function durationLabel(months) {
  const n = Math.max(1, Math.round(Number(months) || 1));
  return n === 1 ? '1 month' : `${n} months`;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// ---------------------------------------------------------------------------
// "Today" in IST (Asia/Kolkata).
//
// Every "today / now" decision in this app — days-remaining counts, status
// thresholds, renewal previews — runs against the gym's local timezone,
// regardless of where the device is or how its clock is set. We format the
// current moment in IST and return the calendar date as a YYYY-MM-DD string.
//
// The authoritative end_date is computed and stored server-side (also in
// IST). computeEndDate() here is only used to PREVIEW the next-month date
// in the add/renew confirmation modals — the server recomputes the
// canonical value on save, and the UI displays whatever it returns.
// ---------------------------------------------------------------------------

export function todayIST() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Backwards-compatible alias. Both names resolve to IST.
export const todayISO = todayIST;

// ---------------------------------------------------------------------------
// Date arithmetic on YYYY-MM-DD strings (timezone-independent — we only
// ever care about the calendar date, never the time component).
// ---------------------------------------------------------------------------

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatYMD(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

// month1 is 1-indexed (1 = Jan). Day 0 of "next" month = last day of given month.
function lastDayOfMonth(year, month1) {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/**
 * Add one calendar month. Returns the same day of the next month, clamped
 * to that month's last day if the same day doesn't exist.
 *
 *   2026-01-15 → 2026-02-15   (same day)
 *   2026-01-31 → 2026-02-28   (Feb 2026 has no 31st — not a leap year)
 *   2024-01-31 → 2024-02-29   (Feb 2024 has no 31st but is a leap year)
 *   2026-03-31 → 2026-04-30   (Apr has only 30 days)
 *   2026-12-15 → 2027-01-15   (year roll-over)
 */
export function addOneMonth(iso) {
  return addCalendarMonths(iso, 1);
}

/**
 * Add N calendar months. Same end-of-month clamping rule as addOneMonth
 * but applied once based on the *original* day, so repeated cycles don't
 * drift (e.g. Jan 31 + 2 months = Mar 31, not Mar 28).
 */
export function addCalendarMonths(iso, months) {
  if (!months || months <= 0) return iso;
  const { y, m, d } = parseISO(iso);
  const totalMonthIdx = (m - 1) + months; // 0-indexed month total
  const targetYear = y + Math.floor(totalMonthIdx / 12);
  const targetMonth = (totalMonthIdx % 12) + 1; // back to 1-12
  const day = Math.min(d, lastDayOfMonth(targetYear, targetMonth));
  return formatYMD(targetYear, targetMonth, day);
}

export function addDays(iso, days) {
  const { y, m, d } = parseISO(iso);
  const t = Date.UTC(y, m - 1, d) + days * MS_PER_DAY;
  const dt = new Date(t);
  return formatYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function daysBetween(fromISO, toISO) {
  const a = parseISO(fromISO);
  const b = parseISO(toISO);
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / MS_PER_DAY
  );
}

// ---------------------------------------------------------------------------
// Membership cycle logic
//
// One membership cycle = one calendar month from the payment date.
// See addOneMonth() above for the same-day-next-month + last-day clamp rule.
// ---------------------------------------------------------------------------

/**
 * End of the membership cycle = payment date + N calendar months.
 * Default 1 month preserves the original behaviour for callers that
 * haven't been updated to pass an explicit duration yet.
 */
export function computeEndDate(paymentDateISO, durationMonths = 1) {
  return addCalendarMonths(paymentDateISO, durationMonths);
}

export function getStatus(endDateISO, todayDate = todayIST()) {
  const days = daysBetween(todayDate, endDateISO);
  if (days < 0) return 'expired';
  if (days <= 7) return 'expiring';
  return 'active';
}

export function getDaysRemaining(endDateISO, todayDate = todayIST()) {
  return daysBetween(todayDate, endDateISO);
}

// ---------------------------------------------------------------------------
// Display helpers
//
// All dates render in readable India format "DD MMM YYYY" (e.g. 15 Feb 2026).
// Pure string formatting from YYYY-MM-DD parts — no Date() / no timezone
// slippage on display.
// ---------------------------------------------------------------------------

export function formatDate(iso) {
  if (!iso) return '';
  const { y, m, d } = parseISO(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatShortDate(iso) {
  if (!iso) return '';
  const { m, d } = parseISO(iso);
  return `${d} ${MONTHS[m - 1]}`;
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatINR(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function daysRemainingLabel(days) {
  if (days < 0) {
    const past = Math.abs(days);
    return past === 1 ? '1 day overdue' : `${past} days overdue`;
  }
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/** Urgency tone for a days-remaining pill: 'urgent' (today/overdue/1 day),
 * 'soon' (2-5 days), or 'later' (6-7 days). */
export function daysUrgencyTone(days) {
  if (days <= 1) return 'urgent';
  if (days <= 5) return 'soon';
  return 'later';
}
