// Confirmation modal for "Renew for Next Month".
//
// Wraps three decisions into a single screen so the owner sees everything
// before the money changes hands:
//
//   1. Which plan is the member renewing on
//      (pre-selected to their current plan, but switchable)
//   2. How was payment received
//      (Cash / GPay segmented control)
//   3. What the new expiry date will be
//      (recalculated on the fly from the selected plan's duration)
//
// On confirm we hand back { planId, method } so MemberDetail can call
// renewMember() and queue the undo snackbar exactly the way the rest of
// the app does.
import { useEffect, useMemo, useRef, useState } from 'react';

import { useMembers, PAYMENT_METHODS } from '../context/MembersContext.jsx';
import {
  IconCash,
  IconCalendar,
  IconRefresh,
  IconSmartphone,
  IconX,
} from './icons.jsx';
import {
  addCalendarMonths,
  durationLabel,
  formatDate,
  formatINR,
  todayIST,
} from '../utils/memberUtils.js';

const METHOD_META = {
  cash: { Icon: IconCash, label: 'Cash' },
  gpay: { Icon: IconSmartphone, label: 'GPay' },
};

export default function RenewalModal({ isOpen, member, onClose, onConfirm }) {
  const { plans } = useMembers();

  // Initial selection: member's current plan, falling back to the first
  // active plan if their plan has been deleted.
  const initialPlanId = useMemo(() => {
    if (!member) return plans[0]?.id;
    return plans.find((p) => p.id === member.plan)?.id || plans[0]?.id;
  }, [member, plans]);

  const [planId, setPlanId] = useState(initialPlanId);
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);
  const dialogRef = useRef(null);

  // Reset selection whenever the modal is opened against a (possibly new) member.
  useEffect(() => {
    if (!isOpen) return;
    setPlanId(initialPlanId);
    setMethod(PAYMENT_METHODS[0].id);
  }, [isOpen, initialPlanId]);

  // Esc closes, just like ConfirmDialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  const selectedPlan =
    plans.find((p) => p.id === planId) || plans[0];
  if (!selectedPlan) return null;

  const newExpiry = formatDate(
    addCalendarMonths(todayIST(), selectedPlan.durationMonths || 1)
  );

  const planChanged = member.plan && member.plan !== selectedPlan.id;

  const handleConfirm = () => {
    onConfirm?.({ planId: selectedPlan.id, method });
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        className="modal-card modal-card-renew"
        role="dialog"
        aria-modal="true"
        aria-labelledby="renew-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-icon accent">
          <IconRefresh size={20} />
        </div>
        <h2 id="renew-title" className="modal-title">
          Confirm Renewal
        </h2>
        <p className="modal-body">
          Renew <strong>{member.name}</strong>'s membership.
        </p>

        {/* ---- Plan picker --------------------------------------------- */}
        <div className="modal-picker">
          <div className="modal-picker-label">Plan</div>
          <div
            className="plan-list-picker"
            role="radiogroup"
            aria-label="Plan"
          >
            {plans.map((p) => {
              const selected = p.id === selectedPlan.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  role="radio"
                  aria-checked={selected}
                  className={`plan-list-option ${selected ? 'selected' : ''}`}
                  onClick={() => setPlanId(p.id)}
                >
                  <span className="plan-list-radio" aria-hidden="true" />
                  <div className="plan-list-info">
                    <div className="plan-list-name">{p.name}</div>
                    <div className="plan-list-meta">
                      {durationLabel(p.durationMonths)}
                    </div>
                  </div>
                  <div className="plan-list-price">
                    ₹{formatINR(p.price)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- New expiry callout ------------------------------------- */}
        <div className="renew-expiry-pill">
          <span className="ico">
            <IconCalendar size={14} />
          </span>
          <span>
            New expiry · <strong>{newExpiry}</strong>
          </span>
        </div>

        {planChanged && (
          <div className="renew-plan-changed">
            Switching plan: <strong>{selectedPlan.name}</strong> applies from
            today.
          </div>
        )}

        {/* ---- Payment method picker ---------------------------------- */}
        <div className="modal-picker">
          <div className="modal-picker-label">Payment method</div>
          <div
            className="modal-picker-options"
            role="radiogroup"
            aria-label="Payment method"
          >
            {PAYMENT_METHODS.map((m) => {
              const meta = METHOD_META[m.id];
              const Icon = meta?.Icon;
              const selected = method === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  role="radio"
                  aria-checked={selected}
                  className={`modal-picker-option ${selected ? 'selected' : ''}`}
                  onClick={() => setMethod(m.id)}
                >
                  {Icon && <Icon size={16} />}
                  <span>{meta?.label || m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onClose?.()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirm}
          >
            Confirm · ₹{formatINR(selectedPlan.price)}
          </button>
        </div>

        <button
          type="button"
          className="modal-close-x"
          onClick={() => onClose?.()}
          aria-label="Close"
        >
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
}
