import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { useAuth } from '@/hooks/useAuth';
import { ensureCommonNamespaceLoaded, hasCommonNamespaceLoaded } from '@/i18n';
import { usePublicAuthState } from '@/hooks/usePublicAuthState';
import { trackParentFunnelEvent } from '@/lib/parentFunnelInstrumentation';
import {
  clearActiveChildProfile,
  disableGuestMode,
  getActiveChildProfile,
  isGuestModeEnabled,
} from '@/lib/session';

const PUBLIC_NAV_LINKS = [
  { key: 'home', path: '/' },
  { key: 'about', path: '/about' },
  { key: 'parents', path: '/parents' },
] as const;

const APP_NAV_LINKS = [
  { key: 'topics', path: '/games' },
  { key: 'about', path: '/about' },
  { key: 'parents', path: '/parents' },
] as const;

const MARKETING_HEADER_CTA_STYLE = {
  minHeight: 'var(--touch-primary-action)',
  padding: 'var(--space-sm) var(--space-lg)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-md)',
};

const APP_HEADER_ACTION_STYLE = {
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-primary)',
  border: '2px solid #B89B78',
};

function isMainNavActive(currentPath: string, navPath: string): boolean {
  if (navPath === '/games') {
    return currentPath === '/games' || currentPath.startsWith('/games/');
  }

  if (navPath === '/') {
    return currentPath === '/';
  }

  if (navPath === '/parents') {
    return currentPath === '/parents' || currentPath.startsWith('/parents/');
  }

  return currentPath === navPath;
}

export function PublicHeader() {
  const { t } = useTranslation(['public', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commonNamespaceReady, setCommonNamespaceReady] = useState(() => hasCommonNamespaceLoaded());
  const { signOut } = useAuth();
  const child = getActiveChildProfile();

  const guestModeEnabled = isGuestModeEnabled();
  const { hasAuthenticatedUser, loading } = usePublicAuthState(!guestModeEnabled);
  const isAuthenticated = guestModeEnabled || hasAuthenticatedUser;
  const showPublicActions = !isAuthenticated && !loading;
  const showAppActions = isAuthenticated;
  const homeDestination = '/';
  const navLinks = showAppActions ? APP_NAV_LINKS : PUBLIC_NAV_LINKS;
  const isProfiles = location.pathname === '/profiles';
  const isParentArea = location.pathname === '/parent';
  const headerClassName = `public-header ${showAppActions ? 'public-header--app' : 'public-header--public'}`;
  const isParentsRoute = location.pathname === '/parents' || location.pathname === '/parents/faq';

  useEffect(() => {
    if (!showAppActions || commonNamespaceReady) {
      return;
    }

    let active = true;

    void ensureCommonNamespaceLoaded().then(() => {
      if (!active) return;
      setCommonNamespaceReady(true);
    });

    return () => {
      active = false;
    };
  }, [commonNamespaceReady, showAppActions]);

  const goToAppRoute = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    disableGuestMode();
    clearActiveChildProfile();
    setMenuOpen(false);

    try {
      await signOut();
    } catch {
      // Keep navigation fallback even if remote sign-out fails.
    }

    navigate('/');
  };

  const handlePublicLoginCtaClick = (ctaId: 'header_login' | 'header_try_free') => {
    if (isParentsRoute) {
      trackParentFunnelEvent('parents_to_login_cta_click', {
        sourcePath: location.pathname,
        targetPath: '/login',
        ctaId,
      });
    }

    setMenuOpen(false);
  };

  return (
    <header className={headerClassName}>
      <div className="public-header__inner">
        <Link to={homeDestination} className="public-header__logo" aria-label={t('header.logoAlt')}>
          <MascotIllustration variant="hero" size={42} className="public-header__logo-icon" />
          <span className="public-header__logo-text">{t('footer.aboutTitle')}</span>
        </Link>

        <button
          className="public-header__menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
        >
          <span className={`public-header__hamburger ${menuOpen ? 'public-header__hamburger--open' : ''}`} />
        </button>

        <nav className={`public-header__nav ${menuOpen ? 'public-header__nav--open' : ''}`}>
          {navLinks.map(({ key, path }) => (
            <Link
              key={key}
              to={path}
              className={`public-header__nav-link ${isMainNavActive(location.pathname, path) ? 'public-header__nav-link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {t(`header.${key}`)}
            </Link>
          ))}
        </nav>

        <div className={`public-header__actions ${menuOpen ? 'public-header__actions--open' : ''}`}>
          {showPublicActions && (
            <div className="public-header__public-actions">
              <Link to="/login" onClick={() => handlePublicLoginCtaClick('header_login')}>
                <Button variant="ghost" size="sm">{t('header.login')}</Button>
              </Link>
              <Link to="/login" onClick={() => handlePublicLoginCtaClick('header_try_free')}>
                <Button variant="primary" size="sm" style={MARKETING_HEADER_CTA_STYLE}>
                  {t('header.tryFree')}
                </Button>
              </Link>
            </div>
          )}

          {showAppActions && commonNamespaceReady && (
            <div className="public-header__app-actions">
              {child && (
                <div className="public-header__child">
                  <span className="public-header__child-emoji">{child.emoji}</span>
                  <span className="public-header__child-name">{child.name}</span>
                </div>
              )}

              <div className="public-header__app-nav">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isProfiles}
                  onClick={() => goToAppRoute('/profiles')}
                  style={APP_HEADER_ACTION_STYLE}
                >
                  {t('common:profile.title')}
                </Button>
                <Button variant="secondary" size="sm" disabled={isParentArea} onClick={() => goToAppRoute('/parent')}>
                  {t('common:nav.parentArea')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void handleSignOut()} style={APP_HEADER_ACTION_STYLE}>
                  {t('common:nav.signOut')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .public-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--color-bg-primary);
          border-bottom: 1px solid var(--color-bg-secondary);
          box-shadow: var(--shadow-sm);
        }

        .public-header__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-sm) var(--space-xl);
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          min-height: 64px;
        }

        .public-header__logo {
          --public-header-logo-touch-min: max(var(--touch-min-primary, 44px), 44px);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          flex-shrink: 0;
          min-inline-size: var(--public-header-logo-touch-min);
          min-block-size: var(--public-header-logo-touch-min);
          padding-inline: var(--space-xs);
          padding-block: var(--space-2xs);
          border-radius: var(--radius-md);
        }

        .public-header__logo-icon {
          flex-shrink: 0;
        }

        .public-header__logo-text {
          font-family: var(--font-family-display);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .public-header__nav {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex: 1;
          min-inline-size: 0;
        }

        .public-header__nav-link {
          text-decoration: none;
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
          padding-inline: var(--space-sm);
          padding-block: var(--space-xs);
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
          min-block-size: max(var(--touch-min-secondary), var(--touch-min));
          display: flex;
          align-items: center;
        }

        .public-header__nav-link:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-secondary);
        }

        .public-header__nav-link--active {
          color: var(--color-theme-primary);
          font-weight: var(--font-weight-bold);
        }

        .public-header__actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-shrink: 0;
          min-inline-size: 0;
        }

        .public-header__actions a {
          text-decoration: none;
        }

        .public-header__public-actions {
          display: flex;
          align-items: center;
          gap: max(12px, var(--space-sm));
        }

        .public-header__app-actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .public-header__app-nav {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        @media (max-width: 1024px) {
          .public-header--app .public-header__inner {
            flex-wrap: wrap;
            row-gap: var(--space-sm);
          }

          .public-header--app .public-header__actions {
            margin-inline-start: auto;
            max-inline-size: 100%;
          }

          .public-header--app .public-header__app-actions {
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .public-header--app .public-header__app-nav {
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .public-header--app .public-header__nav {
            order: 3;
            flex-basis: 100%;
            flex-wrap: wrap;
            justify-content: flex-start;
          }

          .public-header--app .public-header__child {
            max-inline-size: 100%;
          }
        }

        .public-header__child {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          min-height: var(--touch-min);
        }

        .public-header__child-emoji {
          font-size: 1.2rem;
        }

        .public-header__child-name {
          color: var(--color-text-primary);
          font-weight: var(--font-weight-medium);
        }

        .public-header__menu-toggle {
          display: none;
          background: none;
          border: none;
          padding: var(--space-sm);
          min-width: var(--touch-min);
          min-height: var(--touch-min);
          align-items: center;
          justify-content: center;
        }

        .public-header__hamburger,
        .public-header__hamburger::before,
        .public-header__hamburger::after {
          display: block;
          width: 24px;
          height: 3px;
          background: var(--color-text-primary);
          border-radius: 2px;
          transition: var(--transition-fast);
          position: relative;
        }

        .public-header__hamburger::before,
        .public-header__hamburger::after {
          content: '';
          position: absolute;
          right: 0;
        }

        .public-header__hamburger::before { top: -8px; }
        .public-header__hamburger::after { top: 8px; }

        .public-header__hamburger--open {
          background: transparent;
        }

        .public-header__hamburger--open::before {
          top: 0;
          transform: rotate(45deg);
        }

        .public-header__hamburger--open::after {
          top: 0;
          transform: rotate(-45deg);
        }

        @media (max-width: 768px) {
          .public-header__menu-toggle {
            display: flex;
          }

          .public-header__nav,
          .public-header__actions {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 100%;
            right: 0;
            left: 0;
            background: var(--color-bg-primary);
            padding: var(--space-md) var(--space-xl);
            border-bottom: 1px solid var(--color-bg-secondary);
            box-shadow: var(--shadow-md);
          }

          .public-header__nav--open,
          .public-header__actions--open {
            display: flex;
          }

          .public-header__nav--open {
            padding-bottom: 0;
          }

          .public-header__actions--open {
            padding-top: 0;
            padding-bottom: var(--space-lg);
            flex-direction: column;
            align-items: stretch;
          }

          .public-header__public-actions,
          .public-header__app-actions {
            width: 100%;
            justify-content: center;
          }

          .public-header__app-actions {
            flex-direction: column;
          }

          .public-header__app-nav {
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }

          .public-header__child {
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
}
