import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

const ConfirmContext = createContext(null);

/**
 * Promise-based confirm. Two signatures:
 *
 *   1) Plain confirm — returns boolean
 *      const ok = await confirm({ title, body, confirmLabel, tone, icon });
 *      if (!ok) return;
 *
 *   2) With a picker — returns { ok, picker }
 *      const result = await confirm({
 *        title, body,
 *        picker: {
 *          label: 'Payment method',
 *          defaultValue: 'cash',
 *          options: [
 *            { id: 'cash', label: 'Cash', icon: <IconCash /> },
 *            { id: 'gpay', label: 'GPay', icon: <IconPhone /> },
 *          ],
 *        },
 *      });
 *      if (!result.ok) return;
 *      doRenew({ method: result.picker });
 *
 * `body` may be a string or a JSX node (so callers can <strong> the name etc).
 * `tone` is 'accent' (default) or 'danger' — controls the icon chip and the
 * confirm button gradient.
 */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [pickerValue, setPickerValue] = useState(null);
  const resolverRef = useRef(null);
  const hasPickerRef = useRef(false);
  const dialogRef = useRef(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      // If a prior dialog is still open, resolve it as cancel so we never
      // leave a hanging promise behind.
      if (resolverRef.current) {
        if (hasPickerRef.current) {
          resolverRef.current({ ok: false, picker: null });
        } else {
          resolverRef.current(false);
        }
      }
      const hasPicker = !!opts?.picker?.options?.length;
      hasPickerRef.current = hasPicker;
      resolverRef.current = resolve;
      if (hasPicker) {
        setPickerValue(
          opts.picker.defaultValue ?? opts.picker.options[0]?.id ?? null
        );
      } else {
        setPickerValue(null);
      }
      setDialog(opts || {});
    });
  }, []);

  const resolve = useCallback(
    (ok) => {
      const r = resolverRef.current;
      const hasPicker = hasPickerRef.current;
      const value = pickerValue;
      resolverRef.current = null;
      hasPickerRef.current = false;
      setDialog(null);
      if (r) {
        if (hasPicker) r({ ok, picker: value });
        else r(ok);
      }
    },
    [pickerValue]
  );

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') resolve(false);
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, resolve]);

  const picker = dialog?.picker;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="modal-backdrop"
          onClick={() => resolve(false)}
          role="presentation"
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            tabIndex={-1}
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
          >
            {dialog.icon && (
              <div className={`modal-icon ${dialog.tone || 'accent'}`}>
                {dialog.icon}
              </div>
            )}
            <h2 id="confirm-title" className="modal-title">
              {dialog.title}
            </h2>
            {dialog.body &&
              (typeof dialog.body === 'string' ? (
                <p className="modal-body">{dialog.body}</p>
              ) : (
                <div className="modal-body">{dialog.body}</div>
              ))}

            {picker && picker.options?.length > 0 && (
              <div className="modal-picker">
                {picker.label && (
                  <div className="modal-picker-label">{picker.label}</div>
                )}
                <div
                  className="modal-picker-options"
                  role="radiogroup"
                  aria-label={picker.label || 'Choose an option'}
                >
                  {picker.options.map((opt) => {
                    const selected = pickerValue === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        role="radio"
                        aria-checked={selected}
                        className={`modal-picker-option ${
                          selected ? 'selected' : ''
                        }`}
                        onClick={() => setPickerValue(opt.id)}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => resolve(false)}
              >
                {dialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                className={
                  dialog.tone === 'danger' ? 'btn-danger' : 'btn-primary'
                }
                onClick={() => resolve(true)}
                autoFocus={dialog.tone !== 'danger'}
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
