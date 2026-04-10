import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, useTheme } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { useAuth } from '@/hooks/useAuth';
import { getActiveChildProfile, clearActiveChildProfile, disableGuestMode } from '@/lib/session';

export function AppHeader() {
  const { t } = useTranslation('common');
  const { themeConfig } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const child = getActiveChildProfile();

  const isHome = location.pathname === '/games';
  const isProfiles = location.pathname === '/profiles';
  const isParent = location.pathname === '/parent';

  const parentDisplayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    null;

  const handleSignOut = async () => {
    await signOut();
    clearActiveChildProfile();
    disableGuestMode();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/games" className="app-header__logo">
          {themeConfig.slug === 'bear' ? (
            <MascotIllustration variant="hero" size={34} className="app-header__mascot-image" />
          ) : (
            <span className="app-header__mascot">{themeConfig.mascotEmoji}</span>
          )}
          <span className="app-header__brand">{t('branding.appName')}</span>
        </Link>

        {child && !isProfiles && (
          <div className="app-header__child">
            <span className="app-header__child-emoji">{child.emoji}</span>
            <span className="app-header__child-name">{child.name}</span>
          </div>
        )}

        <nav className="app-header__nav">
          {!isHome && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
              {t('nav.home')}
            </Button>
          )}
          {!isProfiles && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/profiles')}>
              {t('profile.title')}
            </Button>
          )}
          {!isParent && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/parent')}>
              {t('nav.parentArea')}
            </Button>
          )}
          {user && (
            <div className="app-header__user">
              <span className="app-header__user-name">{parentDisplayName}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                {t('nav.signOut')}
              </Button>
            </div>
          )}
        </nav>
      </div>

      <style>{`
        .app-header {
          background: var(--color-bg-card);
          border-bottom: 2px solid var(--color-bg-secondary);
          box-shadow: var(--shadow-sm);
        }

        .app-header__inner {
          max-width: 1080px;
          margin: 0 auto;
          padding: var(--space-sm) var(--space-xl);
          display: flex;
          align-items: center;
          gap: var(--space-md);
          min-height: 56px;
        }

        .app-header__logo {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          text-decoration: none;
          flex-shrink: 0;
        }

        .app-header__mascot {
          font-size: 1.5rem;
        }

        .app-header__mascot-image {
          flex-shrink: 0;
        }

        .app-header__brand {
          font-family: var(--font-family-display);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-theme-primary);
        }

        .app-header__child {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
        }

        .app-header__child-emoji {
          font-size: 1.2rem;
        }

        .app-header__child-name {
          color: var(--color-text-primary);
          font-weight: var(--font-weight-medium);
        }

        .app-header__nav {
          margin-inline-start: auto;
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .app-header__user {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding-inline-start: var(--space-xs);
          border-inline-start: 1px solid var(--color-bg-secondary);
        }

        .app-header__user-name {
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .app-header__brand { display: none; }
          .app-header__child-name { display: none; }
          .app-header__user-name { display: none; }
        }
      `}</style>
    </header>
  );
}
