import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import type { GameCompletionResult } from '@/games/engine';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { ShvaSoundSwitchGame } from '@/games/reading/ShvaSoundSwitchGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

type ShvaSoundSwitchCompletion = GameCompletionResult & {
  independentRate?: number;
  assistedRate?: number;
  confusionPair?: string;
};

const SHVA_SOUND_SWITCH_GAME: Game = {
  id: 'local-shva-sound-switch',
  topicId: 'reading',
  ageGroupId: '6-7',
  slug: 'shvaSoundSwitch',
  nameKey: 'games.shvaSoundSwitch.title',
  descriptionKey: 'games.shvaSoundSwitch.subtitle',
  gameType: 'shva_choose_blend',
  componentKey: 'ShvaSoundSwitchGame',
  difficulty: 5,
  sortOrder: 48,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/shva-sound-switch/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const SHVA_SOUND_SWITCH_LEVEL: GameLevel = {
  id: 'local-shva-sound-switch-level-1',
  gameId: SHVA_SOUND_SWITCH_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    progressionOrder: ['L1', 'L2', 'L3'],
    stageTargets: {
      l1Rounds: 10,
      l2Rounds: 12,
      l3Rounds: 12,
    },
    promotionGates: {
      l1ToL2: {
        firstTryAccuracyMin: 80,
        hintUsageMax: 2,
        window: 10,
      },
      l2ToL3: {
        firstTryAccuracyMin: 85,
        blendAccuracyMin: 80,
        randomInterventionsMax: 1,
        window: 12,
      },
    },
    antiRandomTapGuard: {
      triggerWrongTaps: 3,
      triggerWindowMs: 2000,
      freezeMs: 1200,
      reducedChoiceRounds: 1,
    },
    slowMode: {
      triggerHintsPerBlock: 2,
      triggerConsecutiveErrors: 2,
      rounds: 2,
      boundaryDelayMs: 400,
    },
  },
  sortOrder: 1,
};

export default function ShvaSoundSwitchPage() {
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
      ...SHVA_SOUND_SWITCH_LEVEL,
      configJson: {
        ...(SHVA_SOUND_SWITCH_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const {
    completionResult: syncedCompletionResult,
    syncState,
    handleComplete,
    retryLastSync,
  } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: SHVA_SOUND_SWITCH_GAME,
    level: runtimeLevel,
  });

  const completionResult = syncedCompletionResult as ShvaSoundSwitchCompletion | null;
  const accuracy = completionResult?.summaryMetrics?.decodeAccuracy ?? completionResult?.score ?? 0;
  const hintTrendLabel = completionResult?.summaryMetrics
    ? t(`parentDashboard.curriculum.trends.${completionResult.summaryMetrics.hintTrend}` as never)
    : t('parentDashboard.curriculum.trends.steady');

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.shvaSoundSwitch.title')}
        subtitle={t('games.shvaSoundSwitch.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <ShvaSoundSwitchGame
        game={SHVA_SOUND_SWITCH_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult?.summaryMetrics ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.shvaSoundSwitch.progressSummary', {
              accuracy: `${accuracy}`,
              hintTrend: hintTrendLabel,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.shvaSoundSwitch.confusions', {
              contrastPair:
                completionResult.confusionPair ?? `${t('words.pronunciation.dvar')} / ${t('words.pronunciation.davar')}`,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.shvaSoundSwitch.nextStep')}
          </p>
          {syncState === 'error' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="secondary" size="md" onClick={retryLastSync} aria-label={t('profile.retry')}>
                {t('profile.retry')}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </ChildRouteScaffold>
  );
}
