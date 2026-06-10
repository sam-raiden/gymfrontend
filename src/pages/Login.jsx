import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconMail,
  IconLock,
  IconArrowRight,
} from '../components/icons.jsx';

export default function Login() {
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // If already signed in (token persisted across refresh), bounce in.
  useEffect(() => {
    if (isAuthed) {
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthed, location.state, navigate]);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    login(email.trim());
    const redirectTo = location.state?.from || '/';
    navigate(redirectTo, { replace: true });
  };

  const useDemoCreds = () => {
    setEmail('owner@kaigreen.fit');
    setPassword('demo123');
  };

  return (
    <div className="login-screen">
      <div className="login-content">
        <div className="login-brand">
          <div className="login-logo">KG</div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">
            Sign in to manage Kai Green Fitness members.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
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
                placeholder="owner@kaigreen.fit"
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

          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            Login
            <IconArrowRight size={18} />
          </button>
        </form>

        <button
          type="button"
          className="login-hint login-hint-clickable"
          onClick={useDemoCreds}
        >
          <span>
            Demo build — <strong>any email & password</strong> will sign you in.
            Tap to autofill.
          </span>
        </button>

        <div className="login-footer">© 2026 Kai Green Fitness</div>
      </div>
    </div>
  );
}
