import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { FloatingElement } from '@/components/motion';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import { enableGuestMode, getActiveChildProfile, isGuestModeEnabled, setActiveChildProfile } from '@/lib/session';

export default function Login() {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const { user, signInWithGoogle, signInWithEmail, signUp } = useAuth();
  const activeChildProfile = getActiveChildProfile();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const canUseHostedAuth = isSupabaseConfigured;
  const hasConfiguredChild = Boolean(activeChildProfile && activeChildProfile.id !== 'guest');
  const canSkipOnboarding =
    hasConfiguredChild &&
    (!isSupabaseConfigured || isGuestModeEnabled() || Boolean(user));

  if (canSkipOnboarding) {
    return <Navigate to="/games" replace />;
  }

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
      setError(t('onboarding:googleNeedsSupabase'));
      return;
    }

    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : '';
      const looksDisabled = /not enabled|disabled|provider|unsupported/i.test(message);
      setError(looksDisabled ? t('onboarding:googleDisabledOnServer') : t('common:errors.generic'));
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
    } catch {
      setError(t('common:errors.generic'));
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
            <FloatingElement className="login-page__hero-mascot" delayMs={120}>
              <MascotIllustration variant="hero" size={148} />
            </FloatingElement>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('onboarding:welcome')}
            </h1>
            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-md)' }}>
              {t('onboarding:subtitle')}
            </p>
          </header>

          {/* Primary CTA — try for free (guest mode) */}
          <div className="login-page__guest-cta">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGuestContinue}
              style={{ width: '100%', color: 'var(--color-text-primary)' }}
            >
              {t('onboarding:continueAsGuest')}
            </Button>
            <FloatingElement className="login-page__guest-hint" delayMs={280}>
              <MascotIllustration variant="hint" size={72} />
            </FloatingElement>
          </div>

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
          <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xs)', textAlign: 'center' }}>
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

        .login-page__hero-mascot {
          display: flex;
          justify-content: center;
        }

        .login-page__guest-cta {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: var(--space-sm);
        }

        .login-page__guest-hint {
          inline-size: 72px;
          block-size: 72px;
          display: grid;
          place-items: center;
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
          color: var(--color-text-primary);
          font-size: var(--font-size-xs);
          white-space: nowrap;
        }

        @media (max-width: 560px) {
          .login-page__guest-cta {
            grid-template-columns: minmax(0, 1fr);
          }

          .login-page__guest-hint {
            justify-self: end;
          }
        }
      `}</style>
    </div>
  );
}
