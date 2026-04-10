import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { MascotIllustration } from '@/components/illustrations';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

interface ChildPlayShellProps {
  children: ReactNode;
}

type NavAudioKey = 'nav.home' | 'profile.title' | 'nav.parentArea' | 'nav.back';

const NAVIGATION_DELAY_MS = 140;
const PARENT_EXIT_ARMED_TIMEOUT_MS = 4500;

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

function keyToAudioPath(key: NavAudioKey): string {
  const segments = key.split('.').map((segment) => toKebabCase(segment));
  return `/audio/he/${segments.join('/')}.mp3`;
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 11.25L12 4.5L20.5 11.25V20A1.5 1.5 0 0 1 19 21.5H15V15.75H9V21.5H5A1.5 1.5 0 0 1 3.5 20V11.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfilesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 11.5A3.25 3.25 0 1 0 8.5 5A3.25 3.25 0 0 0 8.5 11.5ZM16.5 10A2.5 2.5 0 1 0 16.5 5A2.5 2.5 0 0 0 16.5 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 20C3.5 16.9 6 14.5 9.1 14.5H10.2C13.3 14.5 15.8 16.9 15.8 20M14.5 15.3C15.1 14.9 15.8 14.7 16.6 14.7H17.3C19.5 14.7 21.3 16.4 21.3 18.7V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ParentExitIcon({ armed }: { armed: boolean }) {
  if (armed) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5.5 12.3L9.5 16.3L18.5 7.3"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="10.2"
        width="14"
        height="10.3"
        rx="2.8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10.2V7.8A4 4 0 0 1 12 3.8A4 4 0 0 1 16 7.8V10.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChildPlayShell({ children }: ChildPlayShellProps) {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const audio = useAudioManager();
  const child = getActiveChildProfile();
  const navigationTimeoutRef = useRef<number | null>(null);
  const parentExitTimeoutRef = useRef<number | null>(null);
  const [parentExitArmed, setParentExitArmed] = useState(false);

  const clearNavigationTimeout = useCallback(() => {
    if (navigationTimeoutRef.current !== null) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  const clearParentExitTimeout = useCallback(() => {
    if (parentExitTimeoutRef.current !== null) {
      window.clearTimeout(parentExitTimeoutRef.current);
      parentExitTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearNavigationTimeout();
      clearParentExitTimeout();
    };
  }, [clearNavigationTimeout, clearParentExitTimeout]);

  useEffect(() => {
    setParentExitArmed(false);
    clearParentExitTimeout();
  }, [clearParentExitTimeout, location.pathname]);

  const playNavAudio = useCallback(
    (key: NavAudioKey) => {
      void audio.playNow(keyToAudioPath(key));
    },
    [audio],
  );

  const navigateWithAudioCue = useCallback(
    (path: string, key: NavAudioKey) => {
      if (location.pathname === path) {
        return;
      }

      playNavAudio(key);
      clearNavigationTimeout();
      navigationTimeoutRef.current = window.setTimeout(() => {
        navigate(path);
      }, NAVIGATION_DELAY_MS);
    },
    [clearNavigationTimeout, location.pathname, navigate, playNavAudio],
  );

  const armParentExit = useCallback(() => {
    playNavAudio('nav.parentArea');
    setParentExitArmed(true);
    clearParentExitTimeout();
    parentExitTimeoutRef.current = window.setTimeout(() => {
      setParentExitArmed(false);
    }, PARENT_EXIT_ARMED_TIMEOUT_MS);
  }, [clearParentExitTimeout, playNavAudio]);

  const cancelParentExit = useCallback(() => {
    playNavAudio('nav.back');
    setParentExitArmed(false);
    clearParentExitTimeout();
  }, [clearParentExitTimeout, playNavAudio]);

  const confirmParentExit = useCallback(() => {
    setParentExitArmed(false);
    clearParentExitTimeout();
    navigateWithAudioCue('/parent', 'nav.parentArea');
  }, [clearParentExitTimeout, navigateWithAudioCue]);

  const handleParentButtonClick = useCallback(() => {
    if (parentExitArmed) {
      confirmParentExit();
      return;
    }

    armParentExit();
  }, [armParentExit, confirmParentExit, parentExitArmed]);

  const isHomeActive = location.pathname === '/games' || location.pathname.startsWith('/games/');
  const isProfilesActive = location.pathname === '/profiles';

  return (
    <div className="child-play-shell">
      <header className="child-play-shell__header">
        <div className="child-play-shell__header-inner">
          <button
            type="button"
            className="child-play-shell__brand"
            aria-label={t('nav.home')}
            onClick={() => navigateWithAudioCue('/games', 'nav.home')}
          >
            <MascotIllustration variant="hero" size={36} className="child-play-shell__brand-mascot" />
            <span className="child-play-shell__brand-name">{t('branding.appName')}</span>
          </button>

          {child ? (
            <div className="child-play-shell__active-child" aria-live="polite">
              <span className="child-play-shell__active-child-emoji" aria-hidden="true">
                {child.emoji}
              </span>
              <span className="child-play-shell__active-child-name">{child.name}</span>
            </div>
          ) : null}

          <nav className="child-play-shell__nav" aria-label={t('nav.chooseGame')}>
            <button
              type="button"
              className={`child-play-shell__nav-button ${isHomeActive ? 'child-play-shell__nav-button--active' : ''}`}
              aria-label={t('nav.home')}
              onClick={() => navigateWithAudioCue('/games', 'nav.home')}
            >
              <span className="child-play-shell__nav-icon" aria-hidden="true">
                <HomeIcon />
              </span>
              <span className="child-play-shell__nav-label">{t('nav.home')}</span>
            </button>

            <button
              type="button"
              className={`child-play-shell__nav-button ${isProfilesActive ? 'child-play-shell__nav-button--active' : ''}`}
              aria-label={t('profile.title')}
              onClick={() => navigateWithAudioCue('/profiles', 'profile.title')}
            >
              <span className="child-play-shell__nav-icon" aria-hidden="true">
                <ProfilesIcon />
              </span>
              <span className="child-play-shell__nav-label">{t('profile.title')}</span>
            </button>

            <button
              type="button"
              className={`child-play-shell__nav-button ${parentExitArmed ? 'child-play-shell__nav-button--armed' : ''}`}
              aria-label={t('nav.parentArea')}
              aria-pressed={parentExitArmed}
              onClick={handleParentButtonClick}
            >
              <span className="child-play-shell__nav-icon" aria-hidden="true">
                <ParentExitIcon armed={parentExitArmed} />
              </span>
              <span className="child-play-shell__nav-label">{t('nav.parentArea')}</span>
            </button>
          </nav>
        </div>

        {parentExitArmed ? (
          <div className="child-play-shell__parent-exit" role="region" aria-live="polite">
            <button
              type="button"
              className="child-play-shell__parent-exit-action child-play-shell__parent-exit-action--cancel"
              onClick={cancelParentExit}
            >
              <span>{t('nav.back')}</span>
            </button>
            <button
              type="button"
              className="child-play-shell__parent-exit-action child-play-shell__parent-exit-action--confirm"
              onClick={confirmParentExit}
            >
              <span>{t('nav.parentArea')}</span>
            </button>
          </div>
        ) : null}
      </header>

      <main className="child-play-shell__content">{children}</main>

      <style>{`
        .child-play-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-theme-bg);
        }

        .child-play-shell__header {
          position: sticky;
          top: 0;
          z-index: 120;
          background: color-mix(in srgb, var(--color-bg-card) 86%, var(--color-theme-secondary) 14%);
          border-bottom: 2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent);
          box-shadow: var(--shadow-sm);
        }

        .child-play-shell__header-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: var(--space-sm) var(--space-md) var(--space-md);
          display: grid;
          gap: var(--space-sm);
        }

        .child-play-shell__brand {
          justify-self: start;
          border: 0;
          background: transparent;
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          min-height: var(--touch-min);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-full);
          color: var(--color-theme-primary);
          font-family: var(--font-family-display);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-extrabold);
        }

        .child-play-shell__brand:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--color-theme-secondary) 72%, white 28%);
          outline-offset: 2px;
        }

        .child-play-shell__brand-mascot {
          flex-shrink: 0;
        }

        .child-play-shell__active-child {
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          inline-size: fit-content;
          background: color-mix(in srgb, var(--color-bg-card) 70%, var(--color-accent-secondary) 30%);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 26%, transparent);
          border-radius: var(--radius-full);
          padding: var(--space-xs) var(--space-md);
          min-height: var(--touch-min);
        }

        .child-play-shell__active-child-emoji {
          font-size: 1.4rem;
          line-height: 1;
        }

        .child-play-shell__active-child-name {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .child-play-shell__nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-sm);
        }

        .child-play-shell__nav-button {
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 18%, transparent);
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-bg-card) 82%, white 18%);
          min-height: var(--touch-primary-action);
          padding: var(--space-sm) var(--space-xs);
          display: grid;
          justify-items: center;
          align-content: center;
          gap: var(--space-xs);
          color: var(--color-text-primary);
          transition: transform var(--motion-duration-quick) var(--motion-ease-standard),
            box-shadow var(--motion-duration-quick) var(--motion-ease-standard),
            background var(--motion-duration-quick) var(--motion-ease-standard);
          box-shadow: var(--shadow-sm);
        }

        .child-play-shell__nav-button:hover {
          transform: translateY(-1px);
        }

        .child-play-shell__nav-button:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--color-theme-secondary) 74%, white 26%);
          outline-offset: 2px;
        }

        .child-play-shell__nav-button--active {
          background: linear-gradient(
            160deg,
            color-mix(in srgb, var(--color-accent-secondary) 50%, var(--color-bg-card) 50%),
            color-mix(in srgb, var(--color-theme-secondary) 35%, var(--color-bg-card) 65%)
          );
          border-color: color-mix(in srgb, var(--color-theme-primary) 36%, transparent);
          box-shadow: 0 5px 14px color-mix(in srgb, var(--color-theme-secondary) 35%, transparent);
        }

        .child-play-shell__nav-button--armed {
          background: linear-gradient(
            160deg,
            color-mix(in srgb, var(--color-accent-info) 42%, var(--color-bg-card) 58%),
            color-mix(in srgb, var(--color-theme-secondary) 38%, var(--color-bg-card) 62%)
          );
          border-color: color-mix(in srgb, var(--color-theme-primary) 38%, transparent);
          animation: child-parent-exit-armed 1000ms var(--motion-ease-standard) infinite;
        }

        .child-play-shell__nav-icon {
          inline-size: 26px;
          block-size: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .child-play-shell__nav-icon svg {
          inline-size: 100%;
          block-size: 100%;
        }

        .child-play-shell__nav-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          line-height: var(--line-height-tight);
          text-align: center;
        }

        .child-play-shell__parent-exit {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 var(--space-md) var(--space-sm);
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-sm);
        }

        .child-play-shell__parent-exit-action {
          min-height: var(--touch-min);
          border-radius: var(--radius-md);
          border: 2px solid transparent;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .child-play-shell__parent-exit-action--cancel {
          background: color-mix(in srgb, var(--color-bg-card) 78%, var(--color-theme-secondary) 22%);
          border-color: color-mix(in srgb, var(--color-theme-primary) 24%, transparent);
        }

        .child-play-shell__parent-exit-action--confirm {
          background: color-mix(in srgb, var(--color-accent-secondary) 56%, var(--color-bg-card) 44%);
          border-color: color-mix(in srgb, var(--color-theme-primary) 38%, transparent);
        }

        .child-play-shell__content {
          flex: 1;
        }

        @keyframes child-parent-exit-armed {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }

        @media (max-width: 720px) {
          .child-play-shell__header-inner {
            padding: var(--space-sm) var(--space-sm) var(--space-sm);
          }

          .child-play-shell__brand-name {
            font-size: var(--font-size-md);
          }

          .child-play-shell__active-child-name {
            max-inline-size: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .child-play-shell__parent-exit {
            padding: 0 var(--space-sm) var(--space-sm);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .child-play-shell__nav-button,
          .child-play-shell__nav-button--armed {
            animation: none;
            transition: none;
            transform: none;
          }

          .child-play-shell__nav-button:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
