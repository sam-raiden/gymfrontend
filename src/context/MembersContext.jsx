// Members/payments/plans store backed by the kgf-backend API.
//
// What it does:
//   * On sign-in, fetches members + payments + active plans in parallel.
//   * Decorates snake_case API responses into the camelCase shape the
//     existing pages already expect (planInfo, daysRemaining, etc.).
//   * stats / expiringThisWeek are derived client-side from the fetched
//     members + payments so they stay in sync with local mutations
//     (renew/delete/undo) without an extra round trip per action.
//   * Mutations call the API first, then update local state from the
//     server's response — the server is always the source of truth for
//     status/expiry/price.
//   * "Reminder sent" is a frontend-only nicety (no backend concept) and
//     stays in localStorage.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { apiFetch, apiUpload } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { todayIST } from '../utils/memberUtils.js';

const MembersContext = createContext(null);

const REMINDERS_KEY = 'kgf-reminders-v1';

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'gpay', label: 'GPay' },
];

// ---------------------------------------------------------------------------
// Reminders — local-only, not part of the backend model.
// ---------------------------------------------------------------------------

function loadReminders() {
  try {
    const raw = window.localStorage.getItem(REMINDERS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveReminders(setOfIds) {
  try {
    window.localStorage.setItem(REMINDERS_KEY, JSON.stringify([...setOfIds]));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Decoration — snake_case API rows -> camelCase view models.
// ---------------------------------------------------------------------------

function decorateMember(m) {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    photoUrl: m.photo_url,
    plan: m.plan,
    paymentDate: m.payment_date,
    endDate: m.expiry_date,
    joinedOn: m.joined_on,
    status: m.status,
    daysRemaining: m.days_remaining,
    planInfo: {
      name: m.plan,
      price: m.plan_price,
      durationMonths: m.plan_duration_months,
    },
  };
}

function decoratePayment(p) {
  return {
    id: p.id,
    memberId: p.member_id,
    memberName: p.member_name,
    photoUrl: p.photo_url,
    plan: p.plan,
    amount: p.amount,
    method: (p.payment_method || 'CASH').toLowerCase(),
    paidAt: p.paid_at,
  };
}

function decoratePlan(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    durationMonths: p.duration_months,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MembersProvider({ children }) {
  const { isAuthed } = useAuth();

  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [remindersSent, setRemindersSent] = useState(loadReminders);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveReminders(remindersSent);
  }, [remindersSent]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, paymentsRes, plansRes] = await Promise.all([
        apiFetch('/api/v1/members'),
        apiFetch('/api/v1/payments'),
        apiFetch('/api/v1/plans'),
      ]);
      setMembers(membersRes.members.map(decorateMember));
      setPayments(paymentsRes.payments.map(decoratePayment));
      setPlans(plansRes.plans.map(decoratePlan));
    } catch (err) {
      setError(err?.message || 'Could not load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on sign-in; clear local state on sign-out.
  useEffect(() => {
    if (!isAuthed) {
      setMembers([]);
      setPayments([]);
      setPlans([]);
      setLoading(false);
      return;
    }
    refresh();
  }, [isAuthed, refresh]);

  const stats = useMemo(() => {
    let active = 0;
    let expiring = 0;
    let expired = 0;
    for (const m of members) {
      if (m.status === 'active') active += 1;
      else if (m.status === 'expiring') expiring += 1;
      else expired += 1;
    }
    const currentMonth = todayIST().slice(0, 7);
    const revenue = payments
      .filter((p) => p.paidAt.startsWith(currentMonth))
      .reduce((sum, p) => sum + p.amount, 0);
    return { total: members.length, active, expiring, expired, revenue };
  }, [members, payments]);

  const expiringThisWeek = useMemo(
    () =>
      members
        .filter((m) => m.status === 'expiring')
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    [members]
  );

  const getMember = useCallback(
    (id) => members.find((m) => String(m.id) === String(id)) || null,
    [members]
  );

  // ---- Mutations -------------------------------------------------------

  const addMember = useCallback(async (data) => {
    const { member } = await apiFetch('/api/v1/members', {
      method: 'POST',
      body: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        plan: data.plan,
        payment_date: data.paymentDate,
        photo_url: data.photoUrl ?? null,
      },
    });
    const decorated = decorateMember(member);
    setMembers((prev) => [decorated, ...prev]);
    return decorated.id;
  }, []);

  const updateMember = useCallback(async (id, data) => {
    const { member } = await apiFetch(`/api/v1/members/${id}`, {
      method: 'PATCH',
      body: {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        plan: data.plan,
        payment_date: data.paymentDate,
        photo_url: data.photoUrl ?? null,
      },
    });
    const decorated = decorateMember(member);
    setMembers((prev) => prev.map((m) => (m.id === id ? decorated : m)));
    return decorated;
  }, []);

  // Renew accepts:
  //   method  — 'cash' | 'gpay'  (mapped to 'CASH' | 'GPAY' for the API)
  //   planId  — the plan *name* to switch to during renewal; omit (or pass
  //             the member's current plan name) to keep it.
  //
  // The snapshot returned for undo captures the *previous* paymentDate,
  // plan, and the new payment record's id so restoreMember can revert all
  // three in one shot.
  const renewMember = useCallback(
    async (id, { method = 'cash', planId } = {}) => {
      const target = members.find((m) => m.id === id);
      if (!target) return null;

      const body = { payment_method: method.toUpperCase() };
      if (planId && planId !== target.plan) body.plan = planId;

      const { member, payment, previous } = await apiFetch(`/api/v1/members/${id}/renew`, {
        method: 'POST',
        body,
      });

      setMembers((prev) => prev.map((m) => (m.id === id ? decorateMember(member) : m)));
      setPayments((prev) => [
        decoratePayment({
          id: payment.id,
          member_id: id,
          member_name: target.name,
          photo_url: target.photoUrl,
          plan: payment.plan,
          amount: payment.amount,
          payment_method: payment.payment_method,
          paid_at: payment.paid_at,
        }),
        ...prev,
      ]);

      const snapshot = {
        kind: 'renew',
        id,
        paymentDate: previous.payment_date,
        plan: previous.plan,
        paymentId: payment.id,
      };

      let reminderWasSent = false;
      if (remindersSent.has(id)) {
        reminderWasSent = true;
        setRemindersSent((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }

      return { snapshot, reminderWasSent };
    },
    [members, remindersSent]
  );

  const removeMember = useCallback(
    async (id) => {
      const index = members.findIndex((m) => m.id === id);
      if (index === -1) return null;
      const target = members[index];

      await apiFetch(`/api/v1/members/${id}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m.id !== id));

      const snapshot = {
        kind: 'delete',
        data: {
          name: target.name,
          phone: target.phone,
          plan: target.plan,
          paymentDate: target.paymentDate,
          photoUrl: target.photoUrl || null,
        },
      };
      return { snapshot, index };
    },
    [members]
  );

  const restoreMember = useCallback(async (snapshot, index = 0) => {
    if (!snapshot) return;
    if (snapshot.kind === 'renew') {
      const { member } = await apiFetch(`/api/v1/members/${snapshot.id}`, {
        method: 'PATCH',
        body: { payment_date: snapshot.paymentDate, plan: snapshot.plan },
      });
      setMembers((prev) => prev.map((m) => (m.id === snapshot.id ? decorateMember(member) : m)));

      // Drop the payment record the renew created — undoing the renew
      // also undoes the revenue ticking up.
      if (snapshot.paymentId) {
        await apiFetch(`/api/v1/payments/${snapshot.paymentId}`, { method: 'DELETE' });
        setPayments((prev) => prev.filter((p) => p.id !== snapshot.paymentId));
      }
    } else if (snapshot.kind === 'delete') {
      const { member } = await apiFetch('/api/v1/members', {
        method: 'POST',
        body: {
          name: snapshot.data.name,
          phone: snapshot.data.phone,
          plan: snapshot.data.plan,
          payment_date: snapshot.data.paymentDate,
          photo_url: snapshot.data.photoUrl,
        },
      });
      const restored = decorateMember(member);
      setMembers((prev) => {
        const next = [...prev];
        const at = Math.max(0, Math.min(index, next.length));
        next.splice(at, 0, restored);
        return next;
      });
    }
  }, []);

  const restoreReminder = useCallback((id) => {
    setRemindersSent((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markReminderSent = useCallback((id) => {
    setRemindersSent((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const uploadMemberPhoto = useCallback(async (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const { member } = await apiUpload(`/api/v1/members/${id}/photo`, formData);
    const decorated = decorateMember(member);
    setMembers((prev) => prev.map((m) => (m.id === id ? decorated : m)));
    return decorated;
  }, []);

  // ---- Plan management ---------------------------------------------------
  //
  // Plans can be created with a custom name, price, and calendar-month
  // duration, or deactivated. Members already on a deactivated plan keep
  // their plan name (snapshot semantics).

  const addPlan = useCallback(async (data) => {
    const { plan } = await apiFetch('/api/v1/plans', {
      method: 'POST',
      body: {
        name: data.name,
        price: data.price,
        duration_months: data.durationMonths,
      },
    });
    const decorated = decoratePlan(plan);
    setPlans((prev) => [...prev, decorated]);
    return decorated;
  }, []);

  const removePlan = useCallback(async (id) => {
    await apiFetch(`/api/v1/plans/${id}`, { method: 'DELETE' });
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = {
    members,
    stats,
    expiringThisWeek,
    payments,
    plans,
    loading,
    error,
    getMember,
    addMember,
    updateMember,
    renewMember,
    uploadMemberPhoto,
    removeMember,
    restoreMember,
    restoreReminder,
    markReminderSent,
    remindersSent,
    addPlan,
    removePlan,
    refresh,
  };

  return (
    <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
  );
}

export function useMembers() {
  const ctx = useContext(MembersContext);
  if (!ctx) throw new Error('useMembers must be used within MembersProvider');
  return ctx;
}
