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
      <div className="not-found__panel">
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
      </div>

      <style>{`
        .not-found {
          min-height: max(62vh, 420px);
          display: grid;
          place-items: center;
          padding: var(--space-3xl) var(--space-xl);
          background:
            radial-gradient(circle at 12% 10%, color-mix(in srgb, var(--color-theme-secondary) 26%, transparent), transparent 36%),
            radial-gradient(circle at 84% 18%, color-mix(in srgb, var(--color-theme-primary) 18%, transparent), transparent 40%),
            transparent;
        }

        .not-found__panel {
          inline-size: min(680px, 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: var(--space-md);
          padding: clamp(var(--space-lg), 3.4vw, var(--space-2xl));
          border-radius: var(--radius-xl);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 14%, transparent);
          background:
            linear-gradient(
              165deg,
              color-mix(in srgb, var(--color-bg-card) 90%, var(--color-theme-secondary) 10%),
              var(--color-bg-card)
            );
          box-shadow: var(--shadow-card);
        }

        .not-found a { text-decoration: none; }

        .not-found__code {
          font-family: var(--font-family-display);
          font-size: clamp(4rem, 10vw, 8rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-theme-primary);
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

        .not-found__actions a {
          display: inline-flex;
        }

        @media (max-width: 640px) {
          .not-found {
            padding: var(--space-lg) var(--space-md);
          }

          .not-found__panel {
            padding: var(--space-lg) var(--space-md);
          }

          .not-found__actions {
            inline-size: 100%;
          }

          .not-found__actions a {
            inline-size: 100%;
          }

          .not-found__actions a > button {
            inline-size: 100%;
          }
        }
      `}</style>
    </div>
  );
}
