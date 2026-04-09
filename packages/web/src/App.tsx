import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Login from '@/pages/Login';

function Home() {
  const { t } = useTranslation(['common', 'onboarding']);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        background: 'linear-gradient(180deg, #FFF8E7, #F5E6C8)',
      }}
    >
      <span style={{ fontSize: '4rem' }}>🧸</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#5D3A1A' }}>דובילנד</h1>
      <p style={{ color: '#8B7355' }}>{t('onboarding:welcome')}</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
