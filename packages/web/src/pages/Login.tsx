import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Card, useTheme } from '@/components/design-system';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { enableGuestMode, setActiveChildProfile } from '@/lib/session';

export default function Login() {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const { user, signInWithGoogle, signInWithEmail, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const canUseHostedAuth = isSupabaseConfigured;

  if (user) {
    return <Navigate to="/profiles" replace />;
  }

  const handleGuestContinue = () => {
    enableGuestMode();
    setActiveChildProfile({ id: 'guest', name: t('common:profile.guestName'), emoji: '🧒' });
    navigate('/profiles');
  };

  const handleGoogleSignIn = async () => {
    setError('');

    if (!canUseHostedAuth) {
      handleGuestContinue();
      return;
    }

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:errors.generic'));
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!canUseHostedAuth) {
      handleGuestContinue();
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:errors.generic'));
    }
  };

  const handlePinSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (pin.trim().length < 4) {
      setError(t('common:errors.generic'));
      return;
    }

    handleGuestContinue();
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--space-xl)',
        background: 'var(--color-theme-bg)',
      }}
    >
      <Card
        padding="lg"
        style={{
          width: 'min(440px, 100%)',
          display: 'grid',
          gap: 'var(--space-md)',
          border: '2px solid var(--color-bg-secondary)',
        }}
      >
        <header style={{ display: 'grid', gap: 'var(--space-xs)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--font-size-3xl)' }}>{themeConfig.mascotEmoji}</p>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
            }}
          >
            {t('onboarding:welcome')}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('onboarding:subtitle')}</p>
        </header>

        <form onSubmit={handlePinSubmit} style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            type="password"
            placeholder={t('onboarding:passwordPlaceholder')}
            aria-label={t('onboarding:passwordLabel')}
            style={{
              minHeight: 'var(--touch-min)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-bg-secondary)',
              padding: '0 var(--space-md)',
              fontSize: 'var(--font-size-lg)',
              fontFamily: 'var(--font-family-primary)',
              textAlign: 'center',
              letterSpacing: '0.4rem',
            }}
          />

          <Button variant="primary" size="lg" type="submit" disabled={pin.trim().length < 4}>
            {t('onboarding:continueAsGuest')}
          </Button>
        </form>

        <Button variant="secondary" size="lg" type="button" onClick={handleGoogleSignIn}>
          {t('onboarding:loginWithGoogle')}
        </Button>

        <form onSubmit={handleEmailSubmit} style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('onboarding:emailPlaceholder')}
            aria-label={t('onboarding:emailLabel')}
            autoComplete="email"
            style={{
              minHeight: 'var(--touch-min)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-bg-secondary)',
              padding: '0 var(--space-md)',
              fontSize: 'var(--font-size-md)',
              fontFamily: 'var(--font-family-primary)',
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('onboarding:passwordPlaceholder')}
            aria-label={t('onboarding:passwordLabel')}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            style={{
              minHeight: 'var(--touch-min)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-bg-secondary)',
              padding: '0 var(--space-md)',
              fontSize: 'var(--font-size-md)',
              fontFamily: 'var(--font-family-primary)',
            }}
          />

          <Button variant="secondary" size="lg" type="submit" disabled={!canUseHostedAuth}>
            {isSignUp ? t('onboarding:createAccount') : t('onboarding:loginWithEmail')}
          </Button>

          <Button
            variant="ghost"
            size="md"
            type="button"
            onClick={() => setIsSignUp((current) => !current)}
            disabled={!canUseHostedAuth}
          >
            {isSignUp ? t('onboarding:switchToSignIn') : t('onboarding:switchToSignUp')}
          </Button>
        </form>

        {error ? (
          <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        ) : null}
      </Card>
    </main>
  );
}
