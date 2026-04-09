import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RouteMetadataManager } from '@/seo/RouteMetadataManager';

const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const ParentDashboard = lazy(() => import('@/pages/ParentDashboard'));
const ProfilePicker = lazy(() => import('@/pages/ProfilePicker'));

function RouteFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-theme-bg)',
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <span style={{ fontSize: '3rem' }}>🧸</span>
    </div>
  );
}

export default function App() {
  return (
    <>
      <RouteMetadataManager />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <ProfilePicker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
