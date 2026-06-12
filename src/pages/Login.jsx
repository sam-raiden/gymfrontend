import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiError } from '../api/client.js';
import { IconMail, IconLock, IconArrowRight, IconAlert, IconDumbbell } from '../components/icons.jsx';

const WHATSAPP_NUMBER = '91XXXXXXXXXX';

export default function Login() {
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // If already signed in (token persisted across refresh), bounce in.
  useEffect(() => {
    if (isAuthed) {
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthed, location.state, navigate]);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-content">
        <div className="login-brand">
          <div className="login-logo">
            <IconDumbbell size={28} strokeWidth={2} />
          </div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">
            Sign in to manage your gym's members on Retainr.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error" role="alert">
              <IconAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <span className="input-icon">
                <IconMail size={18} />
              </span>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">
                <IconLock size={18} />
              </span>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={!canSubmit || submitting}>
            {submitting ? 'Please wait…' : 'Login'}
            {!submitting && <IconArrowRight size={18} />}
          </button>
        </form>

        <div className="login-hint">
          <span>
            To register your gym, contact us on{' '}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
              <strong>WhatsApp</strong>
            </a>
          </span>
        </div>

        <div className="login-footer">© 2026 Retainr</div>
      </div>
    </div>
  );
}
