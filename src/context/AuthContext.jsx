// Auth backed by the kgf-backend API. The JWT is persisted in localStorage
// so a page refresh keeps the user signed in; on first load we re-verify it
// against GET /api/v1/me so a stale/expired token bounces back to /login
// instead of showing cached data.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { apiFetch, clearAuthToken, getAuthToken, setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { gym, staff }
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    if (!token) {
      setBootstrapping(false);
      return undefined;
    }
    apiFetch('/api/v1/me')
      .then(({ gym, staff }) => {
        if (!cancelled) setSession({ gym, staff });
      })
      .catch(() => {
        clearAuthToken();
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setSession(null);
  }, []);

  // Stale/expired token — drop the session so the route guard redirects.
  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthToken();
      setSession(null);
    };
    window.addEventListener('kgf:unauthorized', onUnauthorized);
    return () => window.removeEventListener('kgf:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, gym, staff } = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setAuthToken(token);
    setSession({ gym, staff });
  }, []);

  const user = session
    ? {
        email: session.staff.email,
        role: session.staff.role,
        name: session.gym.owner_name,
        gymName: session.gym.name,
        gym: session.gym,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthed: !!session,
        bootstrapping,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
