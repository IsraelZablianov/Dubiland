import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { TimeAndRoutineBuilderGame } from '@/games/numbers/TimeAndRoutineBuilderGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const TIME_AND_ROUTINE_BUILDER_GAME: Game = {
  id: 'local-time-and-routine-builder',
  topicId: 'numbers',
  ageGroupId: '6-7',
  slug: 'timeAndRoutineBuilder',
  nameKey: 'games.timeAndRoutineBuilder.title',
  descriptionKey: 'games.timeAndRoutineBuilder.subtitle',
  gameType: 'sequence',
  componentKey: 'TimeAndRoutineBuilderGame',
  difficulty: 4,
  sortOrder: 5,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/time-and-routine-builder/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const TIME_AND_ROUTINE_BUILDER_LEVEL: GameLevel = {
  id: 'local-time-and-routine-builder-level-1',
  gameId: TIME_AND_ROUTINE_BUILDER_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
    promotionGates: {
      l1ToL2: { firstAttemptSuccessMinPct: 80, window: 6 },
      l2ToL3: { firstAttemptSuccessMinPct: 80, hintUsageMaxPct: 30, window: 8 },
    },
    remediation: {
      consecutiveMissesForRangeReduce: 2,
      consecutiveFirstAttemptSuccessForPromotion: 3,
      misconceptionThreshold: 3,
      misconceptions: ['before_after', 'clock_anchor'],
    },
  },
  sortOrder: 1,
};

type TimeAndRoutineMisconceptionTrend = {
  before_after?: number;
  clock_anchor?: number;
};

export default function TimeAndRoutineBuilderPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
  const profileAgeBand = toChildAgeBand(activeProfile?.ageBand) ?? undefined;

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

  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...TIME_AND_ROUTINE_BUILDER_LEVEL,
      configJson: {
        ...(TIME_AND_ROUTINE_BUILDER_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: TIME_AND_ROUTINE_BUILDER_GAME,
    level: runtimeLevel,
  });

  const metrics = completionResult?.summaryMetrics;
  const misconceptionTrend = metrics?.misconceptionTrend as TimeAndRoutineMisconceptionTrend | undefined;

  const topMisconception = useMemo(() => {
    const beforeAfterScore = misconceptionTrend?.before_after ?? 0;
    const clockAnchorScore = misconceptionTrend?.clock_anchor ?? 0;
    return beforeAfterScore >= clockAnchorScore ? 'before_after' : 'clock_anchor';
  }, [misconceptionTrend?.before_after, misconceptionTrend?.clock_anchor]);

  const sequenceAccuracy = Math.round(metrics?.sequenceEvidenceScore ?? 0);
  const clockAccuracy = Math.round(metrics?.decodeAccuracy ?? 0);
  const hintReliance = Math.round(metrics?.listenParticipation ?? 0);

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.timeAndRoutineBuilder.title')}
        subtitle={t('games.timeAndRoutineBuilder.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <TimeAndRoutineBuilderGame
        game={TIME_AND_ROUTINE_BUILDER_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {metrics && (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.timeAndRoutineBuilder.progressSummary', {
              sequenceAccuracy: `${sequenceAccuracy}%`,
              clockAccuracy: `${clockAccuracy}%`,
              hintReliance: `${hintReliance}%`,
              topMisconception: t(`games.timeAndRoutineBuilder.misconceptions.${topMisconception}`),
            })}
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {syncState === 'error'
              ? t('errors.generic')
              : syncState === 'syncing'
                ? t('feedback.keepGoing')
                : t('parentDashboard.games.timeAndRoutineBuilder.nextStep')}
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
