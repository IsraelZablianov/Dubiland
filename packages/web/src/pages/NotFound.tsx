import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { FloatingElement } from '@/components/motion';
import { usePublicAuthState } from '@/hooks/usePublicAuthState';
import { isGuestModeEnabled } from '@/lib/session';

export default function NotFound() {
  const { t } = useTranslation('public');
  const guestModeEnabled = isGuestModeEnabled();
  const { hasAuthenticatedUser } = usePublicAuthState(!guestModeEnabled);
  const isAuthenticated = guestModeEnabled || hasAuthenticatedUser;
  const primaryPath = isAuthenticated ? '/games' : '/';
  const primaryLabel = isAuthenticated ? t('notFound.backApp') : t('notFound.backHome');
  const secondaryPath = isAuthenticated ? '/' : '/login';
  const secondaryLabel = isAuthenticated ? t('notFound.backHome') : t('notFound.backApp');

  return (
    <div className="not-found">
      <FloatingElement className="not-found__mascot">
        <MascotIllustration variant="loading" size={160} />
      </FloatingElement>
      <h1 className="not-found__code">404</h1>
      <h2 className="not-found__title">{t('notFound.title')}</h2>
      <p className="not-found__text">{t('notFound.text')}</p>
      <div className="not-found__actions">
        <Link to={primaryPath}>
          <Button variant="primary" size="lg">{primaryLabel}</Button>
        </Link>
        <Link to={secondaryPath}>
          <Button variant="secondary" size="lg">{secondaryLabel}</Button>
        </Link>
      </div>

      <style>{`
        .not-found {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-3xl) var(--space-xl);
          text-align: center;
          gap: var(--space-md);
        }

        .not-found a { text-decoration: none; }

        .not-found__code {
          font-family: var(--font-family-display);
          font-size: clamp(4rem, 10vw, 8rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-bg-secondary);
          line-height: 1;
        }

        .not-found__title {
          font-family: var(--font-family-display);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .not-found__text {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
          max-width: 400px;
        }

        .not-found__actions {
          display: flex;
          gap: var(--space-md);
          flex-wrap: wrap;
          justify-content: center;
          margin-top: var(--space-md);
        }
      `}</style>
    </div>
  );
}
