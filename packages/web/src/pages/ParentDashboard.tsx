import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, StarRating } from '@/components/design-system';
import { FeatureIllustration, MascotIllustration } from '@/components/illustrations';
import { FloatingElement } from '@/components/motion';
import { DAILY_LEARNING_GOAL_MINUTES } from '@/constants/learningGoals';
import type { HintTrend, StableRange } from '@/games/engine';
import { useAuth } from '@/hooks/useAuth';
import { assetUrl } from '@/lib/assetUrl';
import { childAvatarToEmoji } from '@/lib/childAvatarEmoji';
import { loadSupabaseRuntime } from '@/lib/loadSupabaseRuntime';
import { clearActiveChildProfile, disableGuestMode, isGuestModeEnabled } from '@/lib/session';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';

type CurriculumDomain = 'math' | 'letters' | 'reading';
type CurriculumTrend = HintTrend;

interface CurriculumDomainMetrics {
  avgAccuracyPct14d: number | null;
  hintTrendLatest: CurriculumTrend | null;
  independenceTrendLatest: CurriculumTrend | null;
  progressionBandLatest: StableRange | null;
  lastSkillKey: string | null;
}

type ChildCurriculumMetrics = Record<CurriculumDomain, CurriculumDomainMetrics | null>;

const CURRICULUM_DOMAINS: CurriculumDomain[] = ['math', 'letters', 'reading'];

const DOMAIN_LABEL_KEY: Record<CurriculumDomain, 'topics.math' | 'topics.letters' | 'topics.reading'> = {
  math: 'topics.math',
  letters: 'topics.letters',
  reading: 'topics.reading',
};

const DOMAIN_EMOJI_BY_KEY: Record<CurriculumDomain, string> = {
  math: '🔢',
  letters: '🔤',
  reading: '📖',
};

const PARENT_DASHBOARD_BACKGROUND_URL = assetUrl('/images/backgrounds/home/home-storybook.webp');

const TREND_LABEL_KEY: Record<
  CurriculumTrend,
  | 'parentDashboard.curriculum.trends.improving'
  | 'parentDashboard.curriculum.trends.steady'
  | 'parentDashboard.curriculum.trends.needs_support'
> = {
  improving: 'parentDashboard.curriculum.trends.improving',
  steady: 'parentDashboard.curriculum.trends.steady',
  needs_support: 'parentDashboard.curriculum.trends.needs_support',
};

function createEmptyCurriculumMetrics(): ChildCurriculumMetrics {
  return { math: null, letters: null, reading: null };
}

function toCurriculumDomain(value: string | null | undefined): CurriculumDomain | null {
  if (!value) {
    return null;
  }

  if (value === 'math' || value === 'letters' || value === 'reading') {
    return value;
  }

  return null;
}

function toCurriculumTrend(value: string | null | undefined): CurriculumTrend | null {
  if (!value) {
    return null;
  }

  if (value === 'improving' || value === 'steady' || value === 'needs_support') {
    return value;
  }

  return null;
}

function toStableRange(value: string | null | undefined): StableRange | null {
  if (!value) {
    return null;
  }

  if (value === '1-3' || value === '1-5' || value === '1-10') {
    return value;
  }

  return null;
}

function formatAccuracy(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return `${Math.round(value)}%`;
}

function formatSkillLabel(skillKey: string): string {
  return skillKey
    .trim()
    .replace(/[_-]+/g, ' ')
    .slice(0, 96);
}

interface ChildProgressRow {
  id: string;
  name: string;
  emoji: string;
  lifetimeGamesPlayed: number;
  rolling7dGamesPlayed: number;
  lifetimeLearningMinutes: number;
  todayLearningMinutes: number;
  rolling7dLearningMinutes: number;
  streak: number;
  stars: number;
  curriculum: ChildCurriculumMetrics;
}

export default function ParentDashboard() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [error, setError] = useState('');

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
        const supabase = await loadSupabaseRuntime();
        if (!supabase) {
          throw new Error('Supabase runtime is unavailable.');
        }

        const [
          { data: dbChildren, error: childrenError },
          { data: metricsRows, error: metricsError },
          { data: curriculumRows, error: curriculumError },
        ] =
          await Promise.all([
            supabase
              .from('children')
              .select('id, name, avatar')
              .order('created_at', { ascending: true }),
            supabase.rpc('dubiland_parent_dashboard_metrics', { p_timezone: timezone }),
            supabase.rpc('dubiland_parent_dashboard_curriculum_metrics', { p_timezone: timezone }),
          ]);

        if (childrenError || metricsError) {
          throw new Error('Failed to fetch parent dashboard metrics.');
        }

        if (cancelled || !dbChildren?.length) {
          if (!cancelled) { setChildren([]); setLoading(false); }
          return;
        }

        const metricsByChildId = new Map((metricsRows ?? []).map((metric) => [metric.child_id, metric]));
        const curriculumByChildId = new Map<string, ChildCurriculumMetrics>();

        if (!curriculumError) {
          for (const row of curriculumRows ?? []) {
            const domain = toCurriculumDomain(row.domain);
            if (!domain) {
              continue;
            }

            const existing = curriculumByChildId.get(row.child_id) ?? createEmptyCurriculumMetrics();
            existing[domain] = {
              avgAccuracyPct14d: row.avg_accuracy_pct_14d ?? null,
              hintTrendLatest: toCurriculumTrend(row.hint_trend_latest),
              independenceTrendLatest: toCurriculumTrend(row.independence_trend_latest),
              progressionBandLatest: toStableRange(row.progression_band_latest),
              lastSkillKey: row.last_skill_key ?? null,
            };
            curriculumByChildId.set(row.child_id, existing);
          }
        }

        const rows: ChildProgressRow[] = dbChildren.map((child) => {
          const childMetrics = metricsByChildId.get(child.id);
          const childCurriculum = curriculumByChildId.get(child.id) ?? createEmptyCurriculumMetrics();

          return {
            id: child.id,
            name: child.name,
            emoji: childAvatarToEmoji(child.avatar),
            lifetimeGamesPlayed: Number(childMetrics?.lifetime_session_count ?? 0),
            rolling7dGamesPlayed: Number(childMetrics?.rolling_7d_session_count ?? 0),
            lifetimeLearningMinutes: childMetrics?.lifetime_learning_minutes ?? 0,
            todayLearningMinutes: childMetrics?.today_learning_minutes ?? 0,
            rolling7dLearningMinutes: childMetrics?.rolling_7d_learning_minutes ?? 0,
            streak: childMetrics?.consecutive_play_streak_days ?? 0,
            stars: childMetrics?.best_stars_across_games ?? 0,
            curriculum: childCurriculum,
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
  const hasChildren = children.length > 0;

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
    const scrollBehavior: ScrollBehavior =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';

    document
      .getElementById('parent-dashboard-weekly-progress')
      ?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  };

  const handleManageChildren = () => {
    navigate('/profiles');
  };

  if (loading) {
    return (
      <div className="parent-dashboard__loading" aria-busy="true">
        <MascotIllustration variant="loading" size={120} className="floating-element" />
      </div>
    );
  }

  return (
    <div className="parent-dashboard__page">
      <section className="parent-dashboard__content">
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
            <p style={{ color: 'var(--color-text-primary)' }}>{t('parentDashboard.subtitle')}</p>
          </div>

          <FloatingElement className="parent-dashboard__header-mascot">
            <MascotIllustration variant="hint" size="clamp(96px, 18vw, 120px)" />
          </FloatingElement>
        </header>

        {hasChildren ? (
          <>
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
                {children.map((child) => (
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

                      <div className="parent-dashboard__child-details">
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
                            <strong className="parent-dashboard__child-metric-value">
                              {Math.min(100, Math.round((child.todayLearningMinutes / DAILY_LEARNING_GOAL_MINUTES) * 100))}%
                            </strong>
                          </div>

                          <div className="parent-dashboard__child-metric">
                            <span className="parent-dashboard__child-metric-label">{t('parentDashboard.streak')}</span>
                            <strong className="parent-dashboard__child-metric-value">{child.streak}</strong>
                          </div>
                        </div>

                        <section
                          className="parent-dashboard__curriculum-section"
                          aria-label={t('parentDashboard.curriculum.sectionTitle')}
                        >
                          <header className="parent-dashboard__curriculum-header">
                            <h3 className="parent-dashboard__curriculum-title">{t('parentDashboard.curriculum.sectionTitle')}</h3>
                            <p className="parent-dashboard__curriculum-subtitle">{t('parentDashboard.curriculum.sectionSubtitle')}</p>
                          </header>

                          <div className="parent-dashboard__curriculum-grid">
                            {CURRICULUM_DOMAINS.map((domain) => {
                              const domainMetrics = child.curriculum[domain];
                              const unavailable = t('parentDashboard.curriculum.unavailable');
                              const avgAccuracyLabel = formatAccuracy(domainMetrics?.avgAccuracyPct14d ?? null) ?? unavailable;
                              const hintTrendLabel = domainMetrics?.hintTrendLatest
                                ? t(TREND_LABEL_KEY[domainMetrics.hintTrendLatest])
                                : unavailable;
                              const independenceTrendLabel = domainMetrics?.independenceTrendLatest
                                ? t(TREND_LABEL_KEY[domainMetrics.independenceTrendLatest])
                                : unavailable;
                              const progressionBandLabel = domainMetrics?.progressionBandLatest ?? unavailable;
                              const lastSkillLabel = domainMetrics?.lastSkillKey
                                ? formatSkillLabel(domainMetrics.lastSkillKey)
                                : unavailable;

                              return (
                                <article key={domain} className="parent-dashboard__curriculum-card">
                                  <header className="parent-dashboard__curriculum-card-header">
                                    <span className="parent-dashboard__curriculum-domain-icon" aria-hidden="true">
                                      {DOMAIN_EMOJI_BY_KEY[domain]}
                                    </span>
                                    <strong className="parent-dashboard__curriculum-domain-name">{t(DOMAIN_LABEL_KEY[domain])}</strong>
                                  </header>

                                  {domainMetrics ? (
                                    <dl className="parent-dashboard__curriculum-metric-list">
                                      <div className="parent-dashboard__curriculum-metric-row">
                                        <dt className="parent-dashboard__curriculum-metric-label">
                                          {t('parentDashboard.curriculum.labels.accuracy14d')}
                                        </dt>
                                        <dd className="parent-dashboard__curriculum-metric-value">{avgAccuracyLabel}</dd>
                                      </div>

                                      <div className="parent-dashboard__curriculum-metric-row">
                                        <dt className="parent-dashboard__curriculum-metric-label">
                                          {t('parentDashboard.curriculum.labels.hintTrend')}
                                        </dt>
                                        <dd className="parent-dashboard__curriculum-metric-value">{hintTrendLabel}</dd>
                                      </div>

                                      <div className="parent-dashboard__curriculum-metric-row">
                                        <dt className="parent-dashboard__curriculum-metric-label">
                                          {t('parentDashboard.curriculum.labels.independenceTrend')}
                                        </dt>
                                        <dd className="parent-dashboard__curriculum-metric-value">{independenceTrendLabel}</dd>
                                      </div>

                                      <div className="parent-dashboard__curriculum-metric-row">
                                        <dt className="parent-dashboard__curriculum-metric-label">
                                          {t('parentDashboard.curriculum.labels.progressionBand')}
                                        </dt>
                                        <dd className="parent-dashboard__curriculum-metric-value">{progressionBandLabel}</dd>
                                      </div>

                                      <div className="parent-dashboard__curriculum-metric-row">
                                        <dt className="parent-dashboard__curriculum-metric-label">
                                          {t('parentDashboard.curriculum.labels.lastSkill')}
                                        </dt>
                                        <dd className="parent-dashboard__curriculum-metric-value">{lastSkillLabel}</dd>
                                      </div>
                                    </dl>
                                  ) : (
                                    <p className="parent-dashboard__curriculum-empty">{t('parentDashboard.curriculum.noData')}</p>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          <Card
            padding="lg"
            className="parent-dashboard__empty-state"
            style={{
              border: '2px solid color-mix(in srgb, var(--color-theme-primary) 18%, transparent)',
              background: 'var(--color-bg-card)',
            }}
          >
            <MascotIllustration variant="hint" size={96} />
            <div className="parent-dashboard__empty-state-copy">
              <strong style={{ color: 'var(--color-text-primary)' }}>{t('profile.noChildrenYet')}</strong>
              <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
                {t('parentDashboard.subtitle')}
              </span>
            </div>
            <Button variant="secondary" size="md" onClick={handleManageChildren}>
              {t('parentDashboard.manageChildren')}
            </Button>
          </Card>
        )}

        <footer>
          <Card padding="md" className="parent-dashboard__actions-card">
            <div className="parent-dashboard__actions-main">
              {hasChildren ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleViewReports}
                  className="parent-dashboard__reports-button"
                >
                  {t('parentDashboard.jumpToWeeklyProgress')}
                </Button>
              ) : null}
              <Button variant={hasChildren ? 'ghost' : 'secondary'} size="md" onClick={handleManageChildren}>
                {t('parentDashboard.manageChildren')}
              </Button>
            </div>
            <Button variant="danger" size="md" onClick={handleLogout} className="parent-dashboard__logout-button">
              {t('parentDashboard.logout')}
            </Button>
          </Card>
        </footer>

        {error ? (
          <p style={{ color: 'var(--color-accent-danger)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        ) : null}
      </section>
      <style>{`
        .parent-dashboard__page {
          flex: 1;
          background-image:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-bg-primary) 90%, white 10%) 0%,
              color-mix(in srgb, var(--color-bg-secondary) 86%, white 14%) 100%
            ),
            url(${PARENT_DASHBOARD_BACKGROUND_URL});
          background-size: cover;
          background-position: center;
          background-blend-mode: soft-light, normal;
          padding: clamp(var(--space-md), 2.5vw, var(--space-xl));
          display: flex;
          justify-content: center;
        }

        .parent-dashboard__loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
        }

        .parent-dashboard__content {
          width: min(1040px, 100%);
          display: grid;
          gap: var(--space-lg);
          padding: clamp(var(--space-md), 2.4vw, var(--space-lg));
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border-subtle);
          background: var(--color-bg-card);
          box-shadow: var(--shadow-card);
          overflow: clip;
        }

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

        .parent-dashboard__child-details {
          display: grid;
          gap: var(--space-sm);
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

        .parent-dashboard__curriculum-section {
          display: grid;
          gap: var(--space-sm);
        }

        .parent-dashboard__curriculum-header {
          display: grid;
          gap: var(--space-xs);
        }

        .parent-dashboard__curriculum-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .parent-dashboard__curriculum-subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
        }

        .parent-dashboard__curriculum-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-sm);
        }

        .parent-dashboard__curriculum-card {
          display: grid;
          gap: var(--space-sm);
          border-radius: var(--radius-md);
          padding: var(--space-sm);
          border: 1px solid color-mix(in srgb, var(--color-theme-primary) 16%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 90%, var(--color-theme-secondary) 10%);
        }

        .parent-dashboard__curriculum-card-header {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .parent-dashboard__curriculum-domain-icon {
          inline-size: 24px;
          block-size: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-md);
          line-height: 1;
        }

        .parent-dashboard__curriculum-domain-name {
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-tight);
        }

        .parent-dashboard__curriculum-metric-list {
          margin: 0;
          display: grid;
          gap: var(--space-xs);
        }

        .parent-dashboard__curriculum-metric-row {
          margin: 0;
          min-block-size: 44px;
          display: grid;
          align-content: center;
          gap: 2px;
        }

        .parent-dashboard__curriculum-metric-label {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
        }

        .parent-dashboard__curriculum-metric-value {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-tight);
          font-weight: var(--font-weight-semibold);
        }

        .parent-dashboard__curriculum-empty {
          margin: 0;
          min-block-size: 44px;
          display: grid;
          align-content: center;
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          line-height: var(--line-height-relaxed);
        }

        .parent-dashboard__empty-state {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: var(--space-md);
        }

        .parent-dashboard__empty-state-copy {
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
          min-inline-size: max(var(--touch-min-primary), 120px);
        }

        @media (max-width: 640px) {
          .parent-dashboard__header {
            grid-template-columns: 1fr;
            gap: var(--space-sm);
          }

          .parent-dashboard__page {
            padding: var(--space-lg);
          }

          .parent-dashboard__content {
            padding: var(--space-md);
          }

          .parent-dashboard__header-mascot {
            justify-self: center;
          }

          .parent-dashboard__empty-state {
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

          .parent-dashboard__curriculum-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .parent-dashboard__child-metrics-grid {
            grid-template-columns: 1fr;
          }

          .parent-dashboard__curriculum-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
