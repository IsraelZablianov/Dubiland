import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { Build10WorkshopGame } from '@/games/numbers/Build10WorkshopGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const BUILD10_WORKSHOP_GAME: Game = {
  id: 'local-build10-workshop',
  topicId: 'numbers',
  ageGroupId: '5-6',
  slug: 'build10Workshop',
  nameKey: 'games.build10Workshop.title',
  descriptionKey: 'games.build10Workshop.subtitle',
  gameType: 'drag_drop',
  componentKey: 'Build10WorkshopGame',
  difficulty: 4,
  sortOrder: 4,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/build-10-workshop/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const BUILD10_WORKSHOP_LEVEL: GameLevel = {
  id: 'local-build10-workshop-level-1',
  gameId: BUILD10_WORKSHOP_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
  },
  sortOrder: 1,
};

export default function Build10WorkshopPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
  const child = useMemo<Child>(
    () => ({
      id: activeProfile?.id ?? 'guest',
      familyId: 'local-family',
      name: activeProfile?.name ?? t('profile.guestName'),
      avatar: activeProfile?.emoji ?? '🧒',
      theme: 'bear',
      birthDate: null,
      createdAt: '2026-04-11T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: BUILD10_WORKSHOP_GAME,
    level: BUILD10_WORKSHOP_LEVEL,
  });

  const masteredTotalsTextKey =
    completionResult?.summaryMetrics?.masteredTotalsKey === 'games.build10Workshop.summary.masteredTo20'
      ? 'games.build10Workshop.summary.masteredTo20'
      : 'games.build10Workshop.summary.masteredUpTo10';

  const unknownTrendKey:
    | 'games.build10Workshop.summary.trend.improving'
    | 'games.build10Workshop.summary.trend.steady'
    | 'games.build10Workshop.summary.trend.needs_support' =
    completionResult?.summaryMetrics?.unknownPartAccuracyTrend === 'improving'
      ? 'games.build10Workshop.summary.trend.improving'
      : completionResult?.summaryMetrics?.unknownPartAccuracyTrend === 'needs_support'
        ? 'games.build10Workshop.summary.trend.needs_support'
        : 'games.build10Workshop.summary.trend.steady';

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.build10Workshop.title')}
        subtitle={t('games.build10Workshop.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <Build10WorkshopGame
        game={BUILD10_WORKSHOP_GAME}
        level={BUILD10_WORKSHOP_LEVEL}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult?.summaryMetrics && (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.build10Workshop.progressSummary', {
              masteredTotals: t(masteredTotalsTextKey),
              alternateRate: `${completionResult.summaryMetrics.alternateDecompositionRate ?? 0}%`,
              unknownTrend: t(unknownTrendKey),
              accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
            })}
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {syncState === 'error'
              ? t('errors.generic')
              : syncState === 'syncing'
                ? t('feedback.keepGoing')
                : t('feedback.excellent')}
          </p>
          {syncState === 'error' && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="secondary" size="md" onClick={retryLastSync} aria-label={t('profile.retry')}>
                {t('profile.retry')}
              </Button>
            </div>
          )}
        </Card>
      )}
    </ChildRouteScaffold>
  );
}
