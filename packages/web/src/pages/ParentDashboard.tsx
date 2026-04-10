import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, StarRating } from '@/components/design-system';
import { FeatureIllustration, MascotIllustration } from '@/components/illustrations';
import { FloatingElement } from '@/components/motion';
import { DAILY_LEARNING_GOAL_MINUTES } from '@/constants/learningGoals';
import { useAuth } from '@/hooks/useAuth';
import { childAvatarToEmoji } from '@/lib/childAvatarEmoji';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearActiveChildProfile, disableGuestMode, isGuestModeEnabled } from '@/lib/session';

interface ChildProgressRow {
  id: string;
  name: string;
  emoji: string;
  lifetimeGamesPlayed: number;
  rolling7dGamesPlayed: number;
  lifetimeLearningMinutes: number;
  todayLearningMinutes: number;
  rolling7dLearningMinutes: number;
  rolling7dActiveDays: number;
  streak: number;
  stars: number;
}

export default function ParentDashboard() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [error, setError] = useState('');
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  const useHostedData = isSupabaseConfigured && Boolean(user) && !isGuestModeEnabled();
  const [children, setChildren] = useState<ChildProgressRow[]>([]);
  const [loading, setLoading] = useState(useHostedData);

  useEffect(() => {
    if (!useHostedData) {
      setChildren([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDashboard() {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem';

        const [{ data: dbChildren, error: childrenError }, { data: metricsRows, error: metricsError }] =
          await Promise.all([
            supabase
              .from('children')
              .select('id, name, avatar')
              .order('created_at', { ascending: true }),
            supabase.rpc('dubiland_parent_dashboard_metrics', { p_timezone: timezone }),
          ]);

        if (childrenError || metricsError) {
          throw new Error('Failed to fetch parent dashboard metrics.');
        }

        if (cancelled || !dbChildren?.length) {
          if (!cancelled) { setChildren([]); setLoading(false); }
          return;
        }

        const metricsByChildId = new Map((metricsRows ?? []).map((metric) => [metric.child_id, metric]));

        const rows: ChildProgressRow[] = dbChildren.map((child) => {
          const childMetrics = metricsByChildId.get(child.id);

          return {
            id: child.id,
            name: child.name,
            emoji: childAvatarToEmoji(child.avatar),
            lifetimeGamesPlayed: Number(childMetrics?.lifetime_session_count ?? 0),
            rolling7dGamesPlayed: Number(childMetrics?.rolling_7d_session_count ?? 0),
            lifetimeLearningMinutes: childMetrics?.lifetime_learning_minutes ?? 0,
            todayLearningMinutes: childMetrics?.today_learning_minutes ?? 0,
            rolling7dLearningMinutes: childMetrics?.rolling_7d_learning_minutes ?? 0,
            rolling7dActiveDays: childMetrics?.rolling_7d_active_days ?? 0,
            streak: childMetrics?.consecutive_play_streak_days ?? 0,
            stars: childMetrics?.best_stars_across_games ?? 0,
          };
        });

        if (!cancelled) { setChildren(rows); setLoading(false); }
      } catch {
        if (!cancelled) { setChildren([]); setLoading(false); }
      }
    }

    void fetchDashboard();
    return () => { cancelled = true; };
  }, [useHostedData]);

  const totals = useMemo(() => {
    return children.reduce(
      (acc, child) => {
        acc.lifetimeGamesPlayed += child.lifetimeGamesPlayed;
        acc.rolling7dGamesPlayed += child.rolling7dGamesPlayed;
        acc.lifetimeLearningMinutes += child.lifetimeLearningMinutes;
        acc.todayLearningMinutes += child.todayLearningMinutes;
        acc.streak = Math.max(acc.streak, child.streak);
        return acc;
      },
      { lifetimeGamesPlayed: 0, rolling7dGamesPlayed: 0, lifetimeLearningMinutes: 0, todayLearningMinutes: 0, streak: 0 },
    );
  }, [children]);

  const todayActivityProgress = totals.todayLearningMinutes > 0
    ? Math.min(100, Math.round((totals.todayLearningMinutes / DAILY_LEARNING_GOAL_MINUTES) * 100))
    : 0;

  const handleLogout = async () => {
    setError('');

    disableGuestMode();
    clearActiveChildProfile();

    if (isSupabaseConfigured) {
      try {
        await signOut();
      } catch {
        setError(t('errors.generic'));
        return;
      }
    }

    navigate('/');
  };

  const handleViewReports = () => {
    document
      .getElementById('parent-dashboard-weekly-progress')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAudioSettings = () => {
    setShowAudioSettings((current) => !current);
  };

  const handleManageChildren = () => {
    navigate('/profiles');
  };

  if (loading) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <MascotIllustration variant="loading" size={120} className="floating-element" />
      </main>
    );
  }

  return (
    <main
      style={{
        flex: 1,
        backgroundImage:
          'linear-gradient(180deg, color-mix(in srgb, var(--color-bg-primary) 90%, white 10%) 0%, color-mix(in srgb, var(--color-bg-secondary) 86%, white 14%) 100%), url(/images/backgrounds/home/home-storybook.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'soft-light, normal',
        padding: 'var(--space-xl)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(1040px, 100%)', display: 'grid', gap: 'var(--space-lg)' }}>
        <header className="parent-dashboard__header">
          <div className="parent-dashboard__header-copy">
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('parentDashboard.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('parentDashboard.subtitle')}</p>
          </div>

          <FloatingElement className="parent-dashboard__header-mascot">
            <MascotIllustration variant="hint" size="clamp(96px, 18vw, 120px)" />
          </FloatingElement>
        </header>

        <div className="parent-dashboard__summary-grid">
          <Card padding="lg" className="parent-dashboard__stat-card">
            <FeatureIllustration kind="games" size={56} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.gamesPlayed')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {totals.lifetimeGamesPlayed}
            </strong>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
              {t('parentDashboard.weeklyProgress')}: {totals.rolling7dGamesPlayed}
            </span>
          </Card>

          <Card padding="lg" className="parent-dashboard__stat-card">
            <FeatureIllustration kind="minutes" size={56} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.learningMinutes')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {totals.lifetimeLearningMinutes}
            </strong>
          </Card>

          <Card padding="lg" className="parent-dashboard__stat-card">
            <FeatureIllustration kind="streak" size={56} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.streak')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {totals.streak}
            </strong>
          </Card>

          <Card padding="lg" className="parent-dashboard__stat-card">
            <FeatureIllustration kind="activity" size={56} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.todayActivity')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {todayActivityProgress}%
            </strong>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
              {t('home.minutes', { count: totals.todayLearningMinutes })} / {t('home.minutes', { count: DAILY_LEARNING_GOAL_MINUTES })}
            </span>
          </Card>
        </div>

        <section id="parent-dashboard-weekly-progress" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.weeklyProgress')}
          </h2>

          <div className="parent-dashboard__weekly-list">
            {children.length > 0 ? (
              children.map((child) => (
                <Card
                  key={child.id}
                  padding="md"
                  style={{
                    border: '2px solid color-mix(in srgb, var(--color-theme-primary) 18%, transparent)',
                    background:
                      'linear-gradient(150deg, color-mix(in srgb, var(--color-bg-card) 88%, var(--color-theme-secondary) 12%), var(--color-bg-card))',
                  }}
                >
                  <div className="parent-dashboard__child-layout">
                    <div className="parent-dashboard__child-identity">
                      <Avatar name={child.name} emoji={child.emoji} size="lg" />
                      <div className="parent-dashboard__child-identity-copy">
                        <strong className="parent-dashboard__child-name">{child.name}</strong>
                        <StarRating value={child.stars} max={3} size="sm" />
                      </div>
                    </div>

                    <div className="parent-dashboard__child-metrics-grid">
                      <div className="parent-dashboard__child-metric">
                        <span className="parent-dashboard__child-metric-label">{t('parentDashboard.gamesPlayed')}</span>
                        <strong className="parent-dashboard__child-metric-value">{child.rolling7dGamesPlayed}</strong>
                      </div>

                      <div className="parent-dashboard__child-metric">
                        <span className="parent-dashboard__child-metric-label">{t('parentDashboard.learningMinutes')}</span>
                        <strong className="parent-dashboard__child-metric-value">{child.rolling7dLearningMinutes}</strong>
                      </div>

                      <div className="parent-dashboard__child-metric">
                        <span className="parent-dashboard__child-metric-label">{t('parentDashboard.todayActivity')}</span>
                        <strong className="parent-dashboard__child-metric-value">{child.rolling7dActiveDays}/7</strong>
                      </div>

                      <div className="parent-dashboard__child-metric">
                        <span className="parent-dashboard__child-metric-label">{t('parentDashboard.streak')}</span>
                        <strong className="parent-dashboard__child-metric-value">{child.streak}</strong>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card
                padding="lg"
                className="parent-dashboard__weekly-empty"
                style={{
                  border: '2px solid color-mix(in srgb, var(--color-theme-primary) 18%, transparent)',
                  background:
                    'linear-gradient(160deg, color-mix(in srgb, var(--color-bg-card) 90%, var(--color-theme-secondary) 10%), var(--color-bg-card))',
                }}
              >
                <MascotIllustration variant="hint" size={96} />
                <div className="parent-dashboard__weekly-empty-copy">
                  <strong style={{ color: 'var(--color-text-primary)' }}>{t('profile.noChildrenYet')}</strong>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {t('parentDashboard.weeklyProgress')}
                  </span>
                </div>
                <Button variant="secondary" size="md" onClick={handleManageChildren}>
                  {t('parentDashboard.manageChildren')}
                </Button>
              </Card>
            )}
          </div>
        </section>

        {showAudioSettings ? (
          <section id="parent-dashboard-audio-settings">
            <Card
              padding="md"
              style={{
                display: 'grid',
                gap: 'var(--space-sm)',
                border: '2px solid color-mix(in srgb, var(--color-theme-primary) 18%, transparent)',
                background:
                  'linear-gradient(150deg, color-mix(in srgb, var(--color-bg-card) 90%, var(--color-theme-secondary) 10%), var(--color-bg-card))',
              }}
            >
              <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
                {t('parentDashboard.audioSettings')}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>{t('parentDashboard.audioSettingsIntro')}</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {t('parentDashboard.audioSettingsDeviceHint')}
              </p>
              <Button variant="ghost" size="md" onClick={() => setShowAudioSettings(false)}>
                {t('nav.back')}
              </Button>
            </Card>
          </section>
        ) : null}

        <footer>
          <Card padding="md" className="parent-dashboard__actions-card">
            <div className="parent-dashboard__actions-main">
              <Button
                variant="secondary"
                size="md"
                onClick={handleViewReports}
                className="parent-dashboard__reports-button"
              >
                {t('parentDashboard.jumpToWeeklyProgress')}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleAudioSettings}
                aria-controls="parent-dashboard-audio-settings"
                aria-expanded={showAudioSettings}
              >
                {showAudioSettings ? t('parentDashboard.closeAudioSettings') : t('parentDashboard.audioSettings')}
              </Button>
            </div>
            <Button variant="danger" size="sm" onClick={handleLogout} className="parent-dashboard__logout-button">
              {t('parentDashboard.logout')}
            </Button>
          </Card>
        </footer>

        {error ? (
          <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        ) : null}
      </section>
      <style>{`
        .parent-dashboard__header {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-md);
        }

        .parent-dashboard__header-copy {
          display: grid;
          gap: var(--space-xs);
        }

        .parent-dashboard__header-mascot {
          justify-self: end;
        }

        .parent-dashboard__summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-md);
        }

        .parent-dashboard__stat-card {
          display: grid;
          gap: var(--space-xs);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent);
          background:
            linear-gradient(
              155deg,
              color-mix(in srgb, var(--color-bg-card) 84%, var(--color-theme-secondary) 16%),
              var(--color-bg-card)
            );
        }

        .parent-dashboard__weekly-list {
          display: grid;
          gap: var(--space-sm);
        }

        .parent-dashboard__child-layout {
          display: grid;
          grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
          align-items: center;
          gap: var(--space-md);
        }

        .parent-dashboard__child-identity {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .parent-dashboard__child-identity-copy {
          display: grid;
          gap: var(--space-xs);
        }

        .parent-dashboard__child-name {
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          line-height: var(--line-height-tight);
        }

        .parent-dashboard__child-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-sm);
        }

        .parent-dashboard__child-metric {
          min-height: 64px;
          display: grid;
          align-content: center;
          gap: 2px;
          border-radius: var(--radius-md);
          padding: var(--space-sm);
          background: color-mix(in srgb, var(--color-bg-card) 86%, var(--color-theme-secondary) 14%);
          border: 1px solid color-mix(in srgb, var(--color-theme-primary) 14%, transparent);
        }

        .parent-dashboard__child-metric-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .parent-dashboard__child-metric-value {
          font-size: var(--font-size-xl);
          color: var(--color-text-primary);
          line-height: var(--line-height-tight);
        }

        .parent-dashboard__weekly-empty {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: var(--space-md);
        }

        .parent-dashboard__weekly-empty-copy {
          display: grid;
          gap: var(--space-xs);
        }

        .parent-dashboard__actions-card {
          display: grid;
          gap: var(--space-sm);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 16%, transparent);
          background:
            linear-gradient(
              160deg,
              color-mix(in srgb, var(--color-bg-card) 90%, var(--color-theme-secondary) 10%),
              var(--color-bg-card)
            );
        }

        .parent-dashboard__actions-main {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .parent-dashboard__actions-main > button {
          flex: 1 1 220px;
        }

        .parent-dashboard__reports-button {
          border-color: color-mix(in srgb, var(--color-theme-primary) 70%, var(--color-theme-secondary) 30%);
          background: color-mix(in srgb, var(--color-theme-primary) 12%, var(--color-bg-card) 88%);
        }

        .parent-dashboard__logout-button {
          inline-size: fit-content;
          justify-self: start;
        }

        @media (max-width: 640px) {
          .parent-dashboard__header {
            grid-template-columns: 1fr;
            gap: var(--space-sm);
          }

          .parent-dashboard__header-mascot {
            justify-self: center;
          }

          .parent-dashboard__weekly-empty {
            grid-template-columns: 1fr;
            text-align: center;
            justify-items: center;
          }

          .parent-dashboard__actions-main > button {
            flex: 1 1 100%;
          }

          .parent-dashboard__logout-button {
            inline-size: 100%;
          }
        }

        @media (max-width: 860px) {
          .parent-dashboard__child-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .parent-dashboard__child-metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
