import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { IconCheckMark } from './icons.jsx';

const UndoContext = createContext(null);
const DEFAULT_DURATION = 5000;
const EXIT_MS = 220;

/**
 * Undo snackbar. Usage:
 *   showUndo({
 *     message: "Aarav's membership renewed",
 *     onUndo: () => { ... revert ... },
 *     duration: 5000, // optional
 *   });
 *
 * Only one snackbar is ever visible; calling showUndo again commits any
 * pending one (it stays applied) and starts a fresh timer for the new one.
 */
export function UndoProvider({ children }) {
  const [snack, setSnack] = useState(null);
  const timerRef = useRef(null);
  const exitTimerRef = useRef(null);

  const clearAllTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  };

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSnack((s) => (s ? { ...s, leaving: true } : null));
    exitTimerRef.current = setTimeout(() => setSnack(null), EXIT_MS);
  }, []);

  const showUndo = useCallback(
    ({ message, onUndo, duration = DEFAULT_DURATION }) => {
      clearAllTimers();
      const id = Date.now() + Math.random();
      setSnack({ id, message, onUndo, duration, leaving: false });
      timerRef.current = setTimeout(() => {
        // Auto-commit: action becomes permanent, snackbar slides out.
        timerRef.current = null;
        setSnack((s) => (s && s.id === id ? { ...s, leaving: true } : s));
        exitTimerRef.current = setTimeout(() => {
          setSnack((s) => (s && s.id === id ? null : s));
        }, EXIT_MS);
      }, duration);
    },
    []
  );

  const handleUndo = () => {
    if (!snack || snack.leaving) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      snack.onUndo?.();
    } finally {
      dismiss();
    }
  };

  useEffect(() => () => clearAllTimers(), []);

  return (
    <UndoContext.Provider value={{ showUndo, dismiss }}>
      {children}
      {snack && (
        <div
          className={`undo-snackbar ${snack.leaving ? 'leaving' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="undo-check" aria-hidden="true">
            <IconCheckMark size={16} />
          </span>
          <span className="undo-message">{snack.message}</span>
          <button
            type="button"
            className="undo-btn"
            onClick={handleUndo}
            aria-label="Undo last action"
          >
            Undo
          </button>
          <span
            className="undo-progress"
            key={snack.id}
            style={{ animationDuration: `${snack.duration}ms` }}
            aria-hidden="true"
          />
        </div>
      )}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error('useUndo must be used within UndoProvider');
  return ctx;
}
