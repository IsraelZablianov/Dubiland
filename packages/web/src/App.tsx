import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Home() {
  const { t } = useTranslation(['common', 'onboarding']);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <span style={{ fontSize: '4rem' }}>🧸</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>דובילנד</h1>
      <p>{t('onboarding:welcome')}</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
