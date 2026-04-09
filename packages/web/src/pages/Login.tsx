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

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const inputStyle: React.CSSProperties = {
    minHeight: 'var(--touch-min)',
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--color-bg-secondary)',
    padding: '0 var(--space-md)',
    fontSize: 'var(--font-size-md)',
    fontFamily: 'var(--font-family-primary)',
    outline: 'none',
    transition: 'var(--transition-fast)',
  };

  return (
    <div className="login-page">
      <div className="login-page__content">
        <Card
          padding="lg"
          style={{
            width: 'min(440px, 100%)',
            display: 'grid',
            gap: 'var(--space-lg)',
            border: '2px solid var(--color-bg-secondary)',
          }}
        >
          {/* Welcome header */}
          <header style={{ display: 'grid', gap: 'var(--space-sm)', textAlign: 'center' }}>
            <p style={{ fontSize: '3.5rem' }}>{themeConfig.mascotEmoji}</p>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('onboarding:welcome')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
              {t('onboarding:subtitle')}
            </p>
          </header>

          {/* Primary CTA — try for free (guest mode) */}
          <Button variant="primary" size="lg" onClick={handleGuestContinue} style={{ width: '100%' }}>
            {t('onboarding:continueAsGuest')}
          </Button>

          {/* Divider */}
          <div className="login-page__divider">
            <span>{t('onboarding:orSignIn')}</span>
          </div>

          {/* Google sign in */}
          <Button variant="secondary" size="lg" type="button" onClick={handleGoogleSignIn} style={{ width: '100%' }}>
            {t('onboarding:loginWithGoogle')}
          </Button>

          {/* Email toggle */}
          {!showEmailForm ? (
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={() => setShowEmailForm(true)}
              style={{ width: '100%' }}
            >
              {t('onboarding:loginWithEmail')}
            </Button>
          ) : (
            <form onSubmit={handleEmailSubmit} style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('onboarding:emailPlaceholder')}
                aria-label={t('onboarding:emailLabel')}
                autoComplete="email"
                style={inputStyle}
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('onboarding:passwordPlaceholder')}
                aria-label={t('onboarding:passwordLabel')}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                style={inputStyle}
              />

              <Button variant="secondary" size="lg" type="submit" disabled={!email || !password} style={{ width: '100%' }}>
                {isSignUp ? t('onboarding:createAccount') : t('onboarding:loginWithEmail')}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsSignUp((current) => !current)}
              >
                {isSignUp ? t('onboarding:switchToSignIn') : t('onboarding:switchToSignUp')}
              </Button>
            </form>
          )}

          {/* Hint for parents */}
          <p style={{ color: 'var(--color-text-light)', fontSize: 'var(--font-size-xs)', textAlign: 'center' }}>
            {t('onboarding:formHint')}
          </p>

          {error ? (
            <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>{error}</p>
          ) : null}
        </Card>
      </div>

      <style>{`
        .login-page__content {
          padding: var(--space-xl);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
        }

        .login-page__divider {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .login-page__divider::before,
        .login-page__divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-bg-secondary);
        }

        .login-page__divider span {
          color: var(--color-text-light);
          font-size: var(--font-size-xs);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
