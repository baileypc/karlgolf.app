// Karl's GIR - App Router
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePageTracking } from '@/hooks/usePageTracking';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import TrackRoundPage from '@/pages/TrackRoundPage';
import TrackLivePage from '@/pages/TrackLivePage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import OfflinePage from '@/pages/OfflinePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid var(--border-secondary)',
          borderTop: '3px solid var(--color-interactive)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  // Track page visits automatically
  usePageTracking();

  return (
    <>
      <PWAInstallPrompt />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/track-live" element={<TrackLivePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/offline" element={<OfflinePage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Track Round - Public route (works for both guest and logged-in users) */}
        <Route path="/track-round" element={<TrackRoundPage />} />

        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
