import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/design-system';

const NAV_LINKS = [
  { key: 'home', path: '/' },
  { key: 'about', path: '/about' },
  { key: 'parents', path: '/parents' },
] as const;

export function PublicHeader() {
  const { t } = useTranslation('public');
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Link to="/" className="public-header__logo" aria-label={t('header.logoAlt')}>
          <span className="public-header__logo-icon">🧸</span>
          <span className="public-header__logo-text">דובילנד</span>
        </Link>

        <button
          className="public-header__menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'סגור תפריט' : 'פתח תפריט'}
        >
          <span className={`public-header__hamburger ${menuOpen ? 'public-header__hamburger--open' : ''}`} />
        </button>

        <nav className={`public-header__nav ${menuOpen ? 'public-header__nav--open' : ''}`}>
          {NAV_LINKS.map(({ key, path }) => (
            <Link
              key={key}
              to={path}
              className={`public-header__nav-link ${location.pathname === path ? 'public-header__nav-link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {t(`header.${key}`)}
            </Link>
          ))}
        </nav>

        <div className={`public-header__actions ${menuOpen ? 'public-header__actions--open' : ''}`}>
          <Link to="/login" onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" size="sm">{t('header.login')}</Button>
          </Link>
          <Link to="/login" onClick={() => setMenuOpen(false)}>
            <Button variant="primary" size="sm">{t('header.tryFree')}</Button>
          </Link>
        </div>
      </div>

      <style>{`
        .public-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 248, 231, 0.95);
          backdrop-filter: blur(12px);
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
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          flex-shrink: 0;
        }

        .public-header__logo-icon {
          font-size: 2rem;
        }

        .public-header__logo-text {
          font-family: var(--font-family-display);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-theme-primary);
        }

        .public-header__nav {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex: 1;
        }

        .public-header__nav-link {
          text-decoration: none;
          color: var(--color-text-secondary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
          min-height: var(--touch-min);
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
        }

        .public-header__actions a {
          text-decoration: none;
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
            background: rgba(255, 248, 231, 0.98);
            backdrop-filter: blur(12px);
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
            flex-direction: row;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
}
