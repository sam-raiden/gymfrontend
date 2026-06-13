import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { ConfirmProvider } from './components/ConfirmDialog.jsx';
import { UndoProvider } from './components/UndoSnackbar.jsx';
import Landing from './pages/Landing.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import Terms from './pages/Terms.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MembersList from './pages/MembersList.jsx';
import MemberDetail from './pages/MemberDetail.jsx';
import MemberForm from './pages/MemberForm.jsx';
import Account from './pages/Account.jsx';
import Finance from './pages/Finance.jsx';

function RequireAuth({ children }) {
  const { isAuthed, bootstrapping } = useAuth();
  const location = useLocation();
  if (bootstrapping) {
    // First load with a stashed token — verifying against /auth/me. Show a
    // minimal splash instead of flashing to /login.
    return (
      <div className="auth-splash">
        <div className="auth-splash-logo">R</div>
        <div className="auth-splash-text">Signing you in…</div>
      </div>
    );
  }
  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <UndoProvider>
          <div className="app-shell">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/members"
                element={
                  <RequireAuth>
                    <MembersList />
                  </RequireAuth>
                }
              />
              <Route
                path="/members/new"
                element={
                  <RequireAuth>
                    <MemberForm />
                  </RequireAuth>
                }
              />
              <Route
                path="/members/:id"
                element={
                  <RequireAuth>
                    <MemberDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/members/:id/edit"
                element={
                  <RequireAuth>
                    <MemberForm />
                  </RequireAuth>
                }
              />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
              <Route
                path="/finance"
                element={
                  <RequireAuth>
                    <Finance />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </UndoProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
