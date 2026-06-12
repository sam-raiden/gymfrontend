// "New plan" modal used from the Account page.
//
// Owner enters a name, calendar-month duration, and price. On Create we
// hand the validated values to MembersContext.addPlan() and close.
//
// Reuses the modal-card / modal-backdrop / btn-primary styling so it
// visually matches the renewal and confirm dialogs.
import { useEffect, useRef, useState } from 'react';

import { IconCheck, IconRupee, IconX, IconSparkle } from './icons.jsx';

const DEFAULT_FORM = { name: '', durationMonths: '1', price: '' };

export default function PlanCreateModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(DEFAULT_FORM);
    setError(null);
    setSubmitting(false);
    const t = setTimeout(() => nameRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmedName = form.name.trim();
  const months = Number(form.durationMonths);
  const price = Number(form.price);

  const valid =
    trimmedName.length >= 2 &&
    Number.isFinite(months) &&
    months >= 1 &&
    months <= 36 &&
    Number.isFinite(price) &&
    price >= 0;

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        name: trimmedName,
        durationMonths: months,
        price: Math.round(price),
      });
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Could not create plan.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => onClose?.()} role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="plan-create-title" tabIndex={-1} ref={dialogRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon accent">
          <IconSparkle size={20} />
        </div>
        <h2 id="plan-create-title" className="modal-title">New Plan</h2>
        <p className="modal-body">Add a custom membership plan for your gym.</p>

        <form className="plan-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="plan-name">Plan name</label>
            <input
              id="plan-name"
              ref={nameRef}
              type="text"
              className="input no-icon"
              placeholder="e.g. Premium, Annual"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              maxLength={40}
              disabled={submitting}
            />
          </div>

          <div className="plan-form-row">
            <div className="field">
              <label htmlFor="plan-duration">Duration</label>
              <div className="input-with-suffix">
                <input
                  id="plan-duration"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={36}
                  step={1}
                  className="input no-icon"
                  value={form.durationMonths}
                  onChange={(e) => setField('durationMonths', e.target.value)}
                  disabled={submitting}
                />
                <span className="input-suffix">months</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="plan-price">Price</label>
              <div className="input-with-prefix">
                <span className="input-prefix">
                  <IconRupee size={14} />
                </span>
                <input
                  id="plan-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  className="input no-icon"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setField('price', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="plan-form-error" role="alert">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => onClose?.()} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!valid || submitting}>
              <IconCheck size={16} />
              {submitting ? 'Creating…' : 'Create Plan'}
            </button>
          </div>
        </form>

        <button type="button" className="modal-close-x" onClick={() => onClose?.()} aria-label="Close" disabled={submitting}>
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
}
