// Demo auth — accepts any email + password. Persists the "session" in
// localStorage so a page refresh keeps the user signed in, matching the
// feel of a real login.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'kgf-demo-user-v1';

function loadStoredUser() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* localStorage blocked */
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  useEffect(() => {
    try {
      if (user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  const login = useCallback((email) => {
    const cleaned = (email || '').trim();
    const handle = cleaned.split('@')[0] || 'owner';
    setUser({
      email: cleaned || 'owner@kaigreen.fit',
      name: handle,
      fullName: handle.charAt(0).toUpperCase() + handle.slice(1),
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthed: !!user,
        bootstrapping: false,
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
