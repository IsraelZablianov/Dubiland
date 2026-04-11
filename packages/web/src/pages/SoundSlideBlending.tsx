import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import type { GameCompletionResult } from '@/games/engine';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { SoundSlideBlendingGame } from '@/games/reading/SoundSlideBlendingGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

type SoundSlideBlendingCompletion = GameCompletionResult & {
  independentRate?: number;
  assistedRate?: number;
  confusionPairKey?: string;
};

const SOUND_SLIDE_BLENDING_GAME: Game = {
  id: 'local-sound-slide-blending',
  topicId: 'reading',
  ageGroupId: '5-6',
  slug: 'soundSlideBlending',
  nameKey: 'games.soundSlideBlending.title',
  descriptionKey: 'games.soundSlideBlending.subtitle',
  gameType: 'syllable_blend_slide',
  componentKey: 'SoundSlideBlendingGame',
  difficulty: 4,
  sortOrder: 46,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/sound-slide-blending/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const SOUND_SLIDE_BLENDING_LEVEL: GameLevel = {
  id: 'local-sound-slide-blending-level-1',
  gameId: SOUND_SLIDE_BLENDING_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    progressionOrder: ['L1', 'L2A', 'L2B', 'L3A', 'L3B'],
    stageTargets: {
      l1Rounds: 10,
      l2aRounds: 10,
      l2bRounds: 20,
      l3aRounds: 5,
      l3bRounds: 15,
    },
    antiRandomTapGuard: {
      tier1TapThreshold: 4,
      tier1WindowMs: 1500,
      tier2TapThreshold: 6,
      tier2WindowMs: 2000,
      tier2MissThreshold: 3,
      tier2MissWindowMs: 20000,
      tier2PauseMs: 1200,
    },
  },
  sortOrder: 1,
};

export default function SoundSlideBlendingPage() {
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
      ...SOUND_SLIDE_BLENDING_LEVEL,
      configJson: {
        ...(SOUND_SLIDE_BLENDING_LEVEL.configJson as Record<string, unknown>),
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
    game: SOUND_SLIDE_BLENDING_GAME,
    level: runtimeLevel,
  });

  const completionResult = syncedCompletionResult as SoundSlideBlendingCompletion | null;
  const accuracy = completionResult?.summaryMetrics?.decodeAccuracy ?? completionResult?.score ?? 0;
  const independentRate =
    completionResult?.independentRate ?? completionResult?.summaryMetrics?.sequenceEvidenceScore ?? 0;
  const assistedRate = completionResult?.assistedRate ?? Math.max(0, 100 - independentRate);
  const confusionPair = completionResult?.confusionPairKey
    ? t(completionResult.confusionPairKey as never)
    : t('games.soundSlideBlending.progression.itemBank.nearFoils.baPatahVsBaQamats');
  const hintTrendLabel = completionResult?.summaryMetrics
    ? t(`parentDashboard.curriculum.trends.${completionResult.summaryMetrics.hintTrend}` as never)
    : t('parentDashboard.curriculum.trends.steady');

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.soundSlideBlending.title')}
        subtitle={t('games.soundSlideBlending.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <SoundSlideBlendingGame
        game={SOUND_SLIDE_BLENDING_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult?.summaryMetrics ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.soundSlideBlending.progressSummary', {
              accuracy: `${accuracy}`,
              hintTrend: hintTrendLabel,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.soundSlideBlending.confusions', {
              nikudPair: confusionPair,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.soundSlideBlending.independenceSplit', {
              independentRate: `${independentRate}`,
              assistedRate: `${assistedRate}`,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.soundSlideBlending.nextStep')}
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
