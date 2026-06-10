// Seed data for the in-memory demo store.
//
// Both members and their payment history are anchored to today (IST) so
// the demo always shows a fresh, well-distributed mix regardless of when
// it's opened. Edits made in the running app override these via the
// localStorage layer in MembersContext.
import { addDays, getPlan, todayIST } from '../utils/memberUtils.js';

const TODAY = todayIST();
const daysAgo = (n) => addDays(TODAY, -n);

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export const seedMembers = [
  // ---- Active (>7 days remaining) ----
  { id: 'm-001', name: 'Aarav Sharma',   phone: '+91 98201 14523', plan: 'standard',   paymentDate: daysAgo(18), joinedOn: daysAgo(260) },
  { id: 'm-003', name: 'Rohan Mehta',    phone: '+91 90042 33871', plan: 'standard',   paymentDate: daysAgo(8),  joinedOn: daysAgo(640) },
  { id: 'm-004', name: 'Ananya Reddy',   phone: '+91 88456 71203', plan: 'weightLoss', paymentDate: daysAgo(5),  joinedOn: daysAgo(140) },
  { id: 'm-006', name: 'Kavya Iyer',     phone: '+91 90123 45678', plan: 'weightLoss', paymentDate: daysAgo(3),  joinedOn: daysAgo(200) },
  { id: 'm-009', name: 'Diya Kapoor',    phone: '+91 98321 65478', plan: 'standard',   paymentDate: daysAgo(13), joinedOn: daysAgo(540) },
  { id: 'm-012', name: 'Aditya Rao',     phone: '+91 88123 44556', plan: 'standard',   paymentDate: daysAgo(15), joinedOn: daysAgo(240) },
  { id: 'm-015', name: 'Riya Sinha',     phone: '+91 97543 22118', plan: 'weightLoss', paymentDate: daysAgo(11), joinedOn: daysAgo(330) },
  { id: 'm-017', name: 'Tara Menon',     phone: '+91 99342 55667', plan: 'weightLoss', paymentDate: daysAgo(7),  joinedOn: daysAgo(170) },

  // ---- Expiring (0..7 days remaining) ----
  { id: 'm-002', name: 'Priya Patel',    phone: '+91 99876 22189', plan: 'weightLoss', paymentDate: daysAgo(23), joinedOn: daysAgo(180) },
  { id: 'm-008', name: 'Ishaan Joshi',   phone: '+91 99001 22345', plan: 'weightLoss', paymentDate: daysAgo(25), joinedOn: daysAgo(290) },
  { id: 'm-010', name: 'Karan Verma',    phone: '+91 97123 88990', plan: 'weightLoss', paymentDate: daysAgo(28), joinedOn: daysAgo(360) },
  { id: 'm-013', name: 'Sneha Bhatia',   phone: '+91 90871 22334', plan: 'weightLoss', paymentDate: daysAgo(24), joinedOn: daysAgo(420) },
  { id: 'm-016', name: 'Dev Khanna',     phone: '+91 98712 33445', plan: 'standard',   paymentDate: daysAgo(29), joinedOn: daysAgo(620) },

  // ---- Expired (past end date) ----
  { id: 'm-005', name: 'Vikram Singh',   phone: '+91 97653 90218', plan: 'standard',   paymentDate: daysAgo(44), joinedOn: daysAgo(380) },
  { id: 'm-007', name: 'Arjun Nair',     phone: '+91 89876 54321', plan: 'standard',   paymentDate: daysAgo(31), joinedOn: daysAgo(460) },
  { id: 'm-011', name: 'Meera Gupta',    phone: '+91 96789 11223', plan: 'standard',   paymentDate: daysAgo(49), joinedOn: daysAgo(450) },
  { id: 'm-014', name: 'Yash Malhotra',  phone: '+91 99812 77665', plan: 'standard',   paymentDate: daysAgo(35), joinedOn: daysAgo(500) },
  { id: 'm-018', name: 'Nikhil Bose',    phone: '+91 90876 44551', plan: 'standard',   paymentDate: daysAgo(38), joinedOn: daysAgo(450) },
];

// ---------------------------------------------------------------------------
// Payment history
//
// For each member we generate 1–3 cycles of payment history walking
// backwards from their current paymentDate (one entry per ~30 days). The
// method (cash / gpay) is alternated deterministically per member+cycle
// so the Finance screen always shows a healthy mix to demo.
// ---------------------------------------------------------------------------

function generateSeedPayments(members) {
  const payments = [];
  members.forEach((m, idx) => {
    const plan = getPlan(m.plan);
    const cycles = 1 + (idx % 3); // 1, 2, or 3 historical entries
    for (let c = 0; c < cycles; c++) {
      const paidAt = c === 0 ? m.paymentDate : addDays(m.paymentDate, -30 * c);
      const method = (idx + c) % 2 === 0 ? 'cash' : 'gpay';
      payments.push({
        id: `p-${m.id}-${c}`,
        memberId: m.id,
        memberName: m.name,
        planId: m.plan,
        planName: plan.name,
        amount: plan.price,
        method,
        paidAt,
      });
    }
  });
  // Newest first.
  payments.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  return payments;
}

export const seedPayments = generateSeedPayments(seedMembers);
