// Pure in-memory members store for the standalone demo build (no backend).
//
// What it does:
//   * Seeds 18 demo members with payment dates relative to today.
//   * Persists to localStorage so adds/edits/renews/deletes survive
//     refresh — better demo UX than wiping on every reload.
//   * Computes status / days_remaining / revenue live on every read,
//     anchored to today in IST.
//   * Mirrors the exact context interface the pages already use:
//     async mutations + snapshot/restore for the 5-second undo flow.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { seedMembers, seedPayments } from '../data/mockMembers.js';
import {
  PLAN_LIST,
  computeEndDate,
  getDaysRemaining,
  getStatus,
  todayIST,
} from '../utils/memberUtils.js';

// Re-export so pages can import payment-method definitions from one place.
// (Defined further down in this file.)

const MembersContext = createContext(null);

const STORE_KEY = 'kgf-demo-members-v1';
const REMINDERS_KEY = 'kgf-demo-reminders-v1';
const PAYMENTS_KEY = 'kgf-demo-payments-v1';
const PLANS_KEY = 'kgf-demo-plans-v1';

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'gpay', label: 'GPay' },
];

const DEFAULT_PLANS = PLAN_LIST.map((p) => ({ ...p }));

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function loadMembers() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return seedMembers;
}

function saveMembers(members) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(members));
  } catch {
    /* quota / private mode — fine, in-memory state still works */
  }
}

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
    window.localStorage.setItem(
      REMINDERS_KEY,
      JSON.stringify([...setOfIds])
    );
  } catch {
    /* ignore */
  }
}

function loadPayments() {
  try {
    const raw = window.localStorage.getItem(PAYMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return seedPayments;
}

function savePayments(payments) {
  try {
    window.localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  } catch {
    /* ignore */
  }
}

function loadPlans() {
  try {
    const raw = window.localStorage.getItem(PLANS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migration: ensure every saved plan has durationMonths.
        return parsed.map((p) => ({
          durationMonths: 1,
          builtin: false,
          ...p,
        }));
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PLANS;
}

function savePlans(plans) {
  try {
    window.localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Decoration — attaches computed fields to a raw row so callers don't have
// to import logic helpers everywhere.
// ---------------------------------------------------------------------------

function decorate(member, today, plansList) {
  // Look up the live plan. If a custom plan was deleted while a member
  // still references it, fall back to the first plan so the UI never breaks.
  const plan =
    plansList.find((p) => p.id === member.plan) ||
    plansList[0] ||
    DEFAULT_PLANS[0];
  const endDate = computeEndDate(member.paymentDate, plan.durationMonths || 1);
  return {
    ...member,
    planInfo: plan,
    endDate,
    status: getStatus(endDate, today),
    daysRemaining: getDaysRemaining(endDate, today),
  };
}

// ---------------------------------------------------------------------------
// ID generation for newly-added members
// ---------------------------------------------------------------------------

let _idCounter = 1000;
function nextId() {
  _idCounter += 1;
  return `m-${_idCounter}`;
}

let _paymentCounter = 9000;
function nextPaymentId() {
  _paymentCounter += 1;
  return `p-${_paymentCounter}`;
}

let _planCounter = 100;
function nextPlanId() {
  _planCounter += 1;
  return `plan-${Date.now().toString(36)}-${_planCounter}`;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MembersProvider({ children }) {
  const [members, setMembers] = useState(loadMembers);
  const [remindersSent, setRemindersSent] = useState(loadReminders);
  const [payments, setPayments] = useState(loadPayments);
  const [plans, setPlans] = useState(loadPlans);

  // Persist on every change so closing the tab doesn't lose the demo state.
  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveReminders(remindersSent);
  }, [remindersSent]);

  useEffect(() => {
    savePayments(payments);
  }, [payments]);

  useEffect(() => {
    savePlans(plans);
  }, [plans]);

  const referenceDate = useMemo(() => todayIST(), []);

  const decoratedMembers = useMemo(
    () => members.map((m) => decorate(m, referenceDate, plans)),
    [members, referenceDate, plans]
  );

  const getPlan = useCallback(
    (id) =>
      plans.find((p) => p.id === id) ||
      plans[0] ||
      DEFAULT_PLANS[0],
    [plans]
  );

  const stats = useMemo(() => {
    let active = 0;
    let expiring = 0;
    let expired = 0;
    let revenue = 0;
    for (const m of decoratedMembers) {
      if (m.status === 'active') {
        active += 1;
        revenue += m.planInfo.price;
      } else if (m.status === 'expiring') {
        expiring += 1;
      } else {
        expired += 1;
      }
    }
    return {
      total: decoratedMembers.length,
      active,
      expiring,
      expired,
      revenue,
    };
  }, [decoratedMembers]);

  const expiringThisWeek = useMemo(
    () =>
      decoratedMembers
        .filter((m) => m.status === 'expiring')
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    [decoratedMembers]
  );

  const getMember = useCallback(
    (id) =>
      decoratedMembers.find((m) => String(m.id) === String(id)) || null,
    [decoratedMembers]
  );

  // ---- Mutations -------------------------------------------------------
  //
  // Functions are async (returning resolved promises) to match the page
  // code that uses `await` everywhere. Internally everything is sync.

  const addMember = useCallback(async (data) => {
    const id = nextId();
    const newMember = {
      id,
      name: data.name.trim(),
      phone: data.phone.trim(),
      plan: data.plan,
      paymentDate: data.paymentDate,
      joinedOn: data.paymentDate,
      photoUrl: data.photoUrl || null,
    };
    setMembers((prev) => [newMember, ...prev]);
    return id;
  }, []);

  const updateMember = useCallback(async (id, data) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              name: data.name !== undefined ? data.name.trim() : m.name,
              phone: data.phone !== undefined ? data.phone.trim() : m.phone,
              plan: data.plan !== undefined ? data.plan : m.plan,
              paymentDate:
                data.paymentDate !== undefined
                  ? data.paymentDate
                  : m.paymentDate,
              photoUrl:
                data.photoUrl !== undefined ? data.photoUrl : m.photoUrl,
            }
          : m
      )
    );
  }, []);

  // Renew accepts:
  //   method  — 'cash' | 'gpay'  (defaults to cash)
  //   planId  — switch the member to a different plan during renewal;
  //             omit (or pass the member's current planId) to keep it.
  //
  // The snapshot returned for undo captures the *previous* paymentDate,
  // plan and the new payment-record id so restoreMember can revert all
  // three in one shot.
  const renewMember = useCallback(
    async (id, { method = 'cash', planId } = {}) => {
      let snapshot = null;
      let reminderWasSent = false;
      let paymentRecord = null;

      setMembers((prev) => {
        const target = prev.find((m) => m.id === id);
        if (!target) return prev;
        const today = todayIST();
        const effectivePlanId = planId || target.plan;
        const plan = getPlan(effectivePlanId);
        paymentRecord = {
          id: nextPaymentId(),
          memberId: id,
          memberName: target.name,
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          method,
          paidAt: today,
        };
        snapshot = {
          kind: 'renew',
          id,
          paymentDate: target.paymentDate,
          plan: target.plan,
          paymentId: paymentRecord.id,
        };
        return prev.map((m) =>
          m.id === id
            ? { ...m, paymentDate: today, plan: effectivePlanId }
            : m
        );
      });

      if (paymentRecord) {
        setPayments((prev) => [paymentRecord, ...prev]);
      }

      if (remindersSent.has(id)) {
        reminderWasSent = true;
        setRemindersSent((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
      return snapshot ? { snapshot, reminderWasSent } : null;
    },
    [remindersSent, getPlan]
  );

  const removeMember = useCallback(async (id) => {
    let snapshot = null;
    let index = -1;
    setMembers((prev) => {
      index = prev.findIndex((m) => m.id === id);
      if (index === -1) return prev;
      const target = prev[index];
      snapshot = {
        kind: 'delete',
        data: {
          name: target.name,
          phone: target.phone,
          plan: target.plan,
          paymentDate: target.paymentDate,
          joinedOn: target.joinedOn,
          photoUrl: target.photoUrl || null,
        },
      };
      return prev.filter((m) => m.id !== id);
    });
    return snapshot ? { snapshot, index } : null;
  }, []);

  const restoreMember = useCallback(async (snapshot, index = 0) => {
    if (!snapshot) return;
    if (snapshot.kind === 'renew') {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === snapshot.id
            ? {
                ...m,
                paymentDate: snapshot.paymentDate,
                // Restore the prior plan too (renew may have switched it).
                plan: snapshot.plan ?? m.plan,
              }
            : m
        )
      );
      // Drop the payment record the renew created — undoing the renew
      // also undoes the revenue ticking up.
      if (snapshot.paymentId) {
        setPayments((prev) =>
          prev.filter((p) => p.id !== snapshot.paymentId)
        );
      }
    } else if (snapshot.kind === 'delete') {
      const restored = { id: nextId(), ...snapshot.data };
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

  // ---- Plan management ------------------------------------------------
  //
  // Owner-managed plans persist in localStorage. Adding/removing here
  // updates the picker shown in MemberForm AND in the renewal modal.
  // Builtin plans (Standard, Weight Loss) come from DEFAULT_PLANS — they
  // can't be removed because seed data + UI examples depend on them, but
  // the owner can add as many custom plans as they like.

  const addPlan = useCallback(async ({ name, price, durationMonths }) => {
    const trimmedName = (name || '').trim();
    const cleanedPrice = Math.max(0, Math.round(Number(price) || 0));
    const cleanedMonths = Math.max(1, Math.round(Number(durationMonths) || 1));
    if (trimmedName.length < 2) {
      throw new Error('Plan name must be at least 2 characters.');
    }
    const newPlan = {
      id: nextPlanId(),
      name: trimmedName,
      price: cleanedPrice,
      durationMonths: cleanedMonths,
      builtin: false,
    };
    setPlans((prev) => [...prev, newPlan]);
    return newPlan;
  }, []);

  const removePlan = useCallback(
    async (id) => {
      const target = plans.find((p) => p.id === id);
      if (!target) return false;
      if (target.builtin) {
        throw new Error("Built-in plans can't be removed.");
      }
      const inUse = members.some((m) => m.plan === id);
      if (inUse) {
        throw new Error(
          'This plan is currently assigned to members. Move them to another plan first.'
        );
      }
      setPlans((prev) => prev.filter((p) => p.id !== id));
      return true;
    },
    [plans, members]
  );

  const value = {
    members: decoratedMembers,
    stats,
    expiringThisWeek,
    payments,
    plans,
    loading: false,
    error: null,
    referenceDate,
    getMember,
    getPlan,
    addMember,
    updateMember,
    renewMember,
    removeMember,
    restoreMember,
    restoreReminder,
    markReminderSent,
    remindersSent,
    addPlan,
    removePlan,
    refresh: () => {},
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
