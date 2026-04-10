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
        background: 'var(--color-bg-primary)',
        padding: 'var(--space-xl)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(1080px, 100%)', display: 'grid', gap: 'var(--space-lg)' }}>
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
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

          <FloatingElement>
            <MascotIllustration variant="hint" size={110} />
          </FloatingElement>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
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

          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <FeatureIllustration kind="minutes" size={56} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.learningMinutes')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {totals.lifetimeLearningMinutes}
            </strong>
          </Card>

          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <FeatureIllustration kind="streak" size={56} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('parentDashboard.streak')}
            </span>
            <strong style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
              {totals.streak}
            </strong>
          </Card>

          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
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

          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {children.map((child) => (
              <Card key={child.id} padding="md">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                  }}
                >
                  <Avatar name={child.name} emoji={child.emoji} size="lg" />
                  <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{child.name}</strong>
                    <StarRating value={child.stars} max={3} size="sm" />
                  </div>

                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {t('parentDashboard.gamesPlayed')}: {child.rolling7dGamesPlayed}
                  </span>

                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {t('home.minutes', { count: child.rolling7dLearningMinutes })}
                  </span>

                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {t('parentDashboard.todayActivity')}: {child.rolling7dActiveDays}/7
                  </span>

                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {t('parentDashboard.streak')}: {child.streak}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {showAudioSettings ? (
          <section id="parent-dashboard-audio-settings">
            <Card padding="md" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
                {t('parentDashboard.audioSettings')}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>{t('parentDashboard.subtitle')}</p>
              <Button variant="ghost" size="md" onClick={() => setShowAudioSettings(false)}>
                {t('nav.back')}
              </Button>
            </Card>
          </section>
        ) : null}

        <footer style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="md" onClick={handleViewReports}>
            {t('parentDashboard.viewReports')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleAudioSettings}
            aria-controls="parent-dashboard-audio-settings"
            aria-expanded={showAudioSettings}
          >
            {t('parentDashboard.audioSettings')}
          </Button>
          <Button variant="danger" size="md" onClick={handleLogout}>
            {t('parentDashboard.logout')}
          </Button>
        </footer>

        {error ? (
          <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        ) : null}
      </section>
    </main>
  );
}
