import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { t } = useTranslation('onboarding');
  const { user, signInWithGoogle, signInWithEmail, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(180deg, #FFF8E7, #F5E6C8)',
      }}
    >
      <span style={{ fontSize: '5rem', marginBottom: '0.5rem' }}>🧸</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem', color: '#5D3A1A' }}>דובילנד</h1>

      <button
        type="button"
        onClick={signInWithGoogle}
        style={{
          width: '280px',
          padding: '0.8rem',
          borderRadius: '30px',
          border: 'none',
          background: '#FF6B6B',
          color: 'white',
          fontSize: '1.1rem',
          fontWeight: 600,
          boxShadow: '0 4px 0 #cc5555',
          marginBottom: '0.8rem',
          fontFamily: 'inherit',
        }}
      >
        {t('loginWithGoogle')}
      </button>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '280px' }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          style={{
            padding: '0.7rem',
            borderRadius: '12px',
            border: '2px solid #E8D5B0',
            fontSize: '1rem',
            fontFamily: 'inherit',
            textAlign: 'right',
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          style={{
            padding: '0.7rem',
            borderRadius: '12px',
            border: '2px solid #E8D5B0',
            fontSize: '1rem',
            fontFamily: 'inherit',
            textAlign: 'right',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.8rem',
            borderRadius: '30px',
            border: '2px solid #E8D5B0',
            background: '#fff',
            color: '#5D3A1A',
            fontSize: '1rem',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          {isSignUp ? t('createAccount') : t('loginWithEmail')}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        style={{
          background: 'none',
          border: 'none',
          color: '#8B7355',
          marginTop: '1rem',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
        }}
      >
        {isSignUp ? t('loginWithEmail') : t('createAccount')}
      </button>

      {error && <p style={{ color: '#FF6B6B', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
