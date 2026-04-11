import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAudioManager } from '@/hooks/useAudioManager';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';

interface ChildPlayShellProps {
  children: ReactNode;
}

const NAVIGATION_AUDIO_DELAY_MS = 140;

const CHILD_NAV_ITEMS = [
  {
    key: 'home',
    path: '/games',
    icon: '🏠',
    labelKey: 'common:nav.home',
    audioKey: 'nav.home',
  },
  {
    key: 'profiles',
    path: '/profiles',
    icon: '👧',
    labelKey: 'common:profile.title',
    audioKey: 'profile.title',
  },
  {
    key: 'parent',
    path: '/parent',
    icon: '🔒',
    labelKey: 'common:nav.parentArea',
    audioKey: 'nav.parentArea',
  },
] as const;

function isChildNavActive(pathname: string, destination: string): boolean {
  if (destination === '/games') {
    return pathname === '/games' || pathname.startsWith('/games/');
  }

  return pathname === destination;
}

export function ChildPlayShell({ children }: ChildPlayShellProps) {
  const { t } = useTranslation(['common']);
  const location = useLocation();
  const navigate = useNavigate();
  const audio = useAudioManager();
  const transitionTimerRef = useRef<number | null>(null);
  const [parentExitArmed, setParentExitArmed] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current != null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setParentExitArmed(false);
    setPendingPath(null);
  }, [location.pathname]);

  const playNavigationCue = (audioKey: string) => {
    const audioPath = resolveAudioPathFromKey(audioKey, 'common');
    return audio.playNow(audioPath).catch(() => {
      // Navigation should continue even when audio cannot play.
    });
  };

  const navigateWithCue = (path: string, audioKey: string) => {
    if (pendingPath) {
      return;
    }

    if (location.pathname === path) {
      return;
    }

    setPendingPath(path);
    void playNavigationCue(audioKey);

    if (transitionTimerRef.current != null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(() => {
      navigate(path);
    }, NAVIGATION_AUDIO_DELAY_MS);
  };

  const handlePrimaryNav = (item: (typeof CHILD_NAV_ITEMS)[number]) => {
    if (item.path === '/parent') {
      if (!parentExitArmed) {
        setParentExitArmed(true);
        void playNavigationCue(item.audioKey);
      }
      return;
    }

    navigateWithCue(item.path, item.audioKey);
  };

  const handleParentExitCancel = () => {
    if (pendingPath) {
      return;
    }

    setParentExitArmed(false);
    void playNavigationCue('nav.back');
  };

  const handleParentExitConfirm = () => {
    navigateWithCue('/parent', 'nav.parentArea');
  };

  return (
    <div className="child-play-shell">
      <header className="child-play-shell__chrome">
        <nav className="child-play-shell__nav" aria-label={t('common:nav.chooseTopic')}>
          {CHILD_NAV_ITEMS.map((item) => {
            const isActive = isChildNavActive(location.pathname, item.path);
            return (
              <button
                key={item.key}
                type="button"
                className={`child-play-shell__nav-button ${isActive ? 'child-play-shell__nav-button--active' : ''}`}
                onClick={() => handlePrimaryNav(item)}
                disabled={pendingPath != null}
                aria-current={isActive ? 'page' : undefined}
                aria-label={t(item.labelKey)}
              >
                <span className="child-play-shell__nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="child-play-shell__nav-label">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {parentExitArmed ? (
          <div className="child-play-shell__parent-guard" role="group" aria-label={t('common:profile.parentZone')}>
            <p className="child-play-shell__parent-guard-title">{t('common:profile.parentZone')}</p>
            <div className="child-play-shell__parent-guard-actions">
              <button
                type="button"
                className="child-play-shell__guard-button child-play-shell__guard-button--confirm"
                onClick={handleParentExitConfirm}
                disabled={pendingPath != null}
                aria-label={t('common:nav.parentArea')}
              >
                <span className="child-play-shell__guard-icon" aria-hidden="true">
                  ✅
                </span>
                {t('common:nav.parentArea')}
              </button>

              <button
                type="button"
                className="child-play-shell__guard-button child-play-shell__guard-button--cancel"
                onClick={handleParentExitCancel}
                disabled={pendingPath != null}
                aria-label={t('common:nav.back')}
              >
                <span className="child-play-shell__guard-icon" aria-hidden="true">
                  ↩️
                </span>
                {t('common:nav.back')}
              </button>
            </div>
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

        .child-play-shell__chrome {
          position: sticky;
          inset-block-start: 0;
          z-index: 80;
          display: grid;
          gap: var(--space-xs);
          padding-inline: var(--space-md);
          padding-block: var(--space-sm);
          background: color-mix(in srgb, var(--color-bg-card) 88%, white 12%);
          border-block-end: 1px solid var(--color-border-subtle);
          box-shadow: var(--shadow-sm);
        }

        .child-play-shell__nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-sm);
        }

        .child-play-shell__nav-button {
          min-block-size: var(--touch-primary-action, 72px);
          min-inline-size: var(--touch-primary-action, 72px);
          border: 2px solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-bg-secondary) 65%, white 35%);
          display: grid;
          place-items: center;
          gap: var(--space-2xs);
          padding-inline: var(--space-sm);
          padding-block: var(--space-xs);
          font-family: inherit;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          transition: transform var(--motion-duration-fast), box-shadow var(--motion-duration-fast), border-color var(--motion-duration-fast);
        }

        .child-play-shell__nav-button:not(:disabled):hover {
          transform: translateY(-1px);
          border-color: var(--color-theme-primary);
          box-shadow: var(--shadow-md);
        }

        .child-play-shell__nav-button:disabled {
          opacity: 0.7;
          cursor: progress;
        }

        .child-play-shell__nav-button--active {
          border-color: var(--color-theme-primary);
          background: color-mix(in srgb, var(--color-theme-primary) 16%, white 84%);
        }

        .child-play-shell__nav-icon {
          font-size: 1.75rem;
          line-height: 1;
        }

        .child-play-shell__nav-label {
          line-height: 1.2;
          text-align: center;
        }

        .child-play-shell__parent-guard {
          display: grid;
          gap: var(--space-xs);
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 10%, white 90%);
          padding-inline: var(--space-sm);
          padding-block: var(--space-sm);
        }

        .child-play-shell__parent-guard-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          text-align: center;
        }

        .child-play-shell__parent-guard-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-sm);
        }

        .child-play-shell__guard-button {
          min-block-size: var(--touch-primary-action, 72px);
          border: 0;
          border-radius: var(--radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2xs);
          font-family: inherit;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          padding-inline: var(--space-sm);
        }

        .child-play-shell__guard-button:disabled {
          opacity: 0.7;
        }

        .child-play-shell__guard-button--confirm {
          background: color-mix(in srgb, var(--color-theme-primary) 85%, white 15%);
        }

        .child-play-shell__guard-button--cancel {
          background: color-mix(in srgb, var(--color-bg-secondary) 70%, white 30%);
        }

        .child-play-shell__guard-icon {
          font-size: 1.15rem;
          line-height: 1;
        }

        .child-play-shell__content {
          flex: 1;
        }

        @media (max-width: 900px) {
          .child-play-shell__chrome {
            padding-inline: var(--space-sm);
          }

          .child-play-shell__nav {
            gap: var(--space-xs);
          }

          .child-play-shell__nav-button {
            font-size: var(--font-size-xs);
          }
        }
      `}</style>
    </div>
  );
}
