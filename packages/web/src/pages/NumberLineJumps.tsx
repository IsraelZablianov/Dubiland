import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { NumberLineJumpsGame } from '@/games/numbers/NumberLineJumpsGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const NUMBER_LINE_JUMPS_GAME: Game = {
  id: 'local-number-line-jumps',
  topicId: 'numbers',
  ageGroupId: '6-7',
  slug: 'numberLineJumps',
  nameKey: 'games.numberLineJumps.title',
  descriptionKey: 'games.numberLineJumps.subtitle',
  gameType: 'tap',
  componentKey: 'NumberLineJumpsGame',
  difficulty: 4,
  sortOrder: 3,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/number-line-jumps/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const NUMBER_LINE_JUMPS_LEVEL: GameLevel = {
  id: 'local-number-line-jumps-level-1',
  gameId: NUMBER_LINE_JUMPS_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
  },
  sortOrder: 1,
};

export default function NumberLineJumpsPage() {
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
      createdAt: '2026-04-10T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );
  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...NUMBER_LINE_JUMPS_LEVEL,
      configJson: {
        ...(NUMBER_LINE_JUMPS_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: NUMBER_LINE_JUMPS_GAME,
    level: runtimeLevel,
  });

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.numberLineJumps.title')}
        subtitle={t('games.numberLineJumps.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

        <NumberLineJumpsGame
          game={NUMBER_LINE_JUMPS_GAME}
          level={runtimeLevel}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.numberLineJumps.progressSummary', {
                accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
                hintTrend: t(
                  completionResult.summaryMetrics.hintTrend === 'improving'
                    ? 'feedback.excellent'
                    : completionResult.summaryMetrics.hintTrend === 'steady'
                      ? 'feedback.keepGoing'
                      : 'feedback.greatEffort',
                ),
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
