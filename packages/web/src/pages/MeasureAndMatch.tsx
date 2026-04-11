import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { MeasureAndMatchGame } from '@/games/numbers/MeasureAndMatchGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const MEASURE_AND_MATCH_GAME: Game = {
  id: 'local-measure-and-match',
  topicId: 'numbers',
  ageGroupId: '6-7',
  slug: 'measureAndMatch',
  nameKey: 'games.measureAndMatch.title',
  descriptionKey: 'games.measureAndMatch.subtitle',
  gameType: 'drag_drop',
  componentKey: 'MeasureAndMatchGame',
  difficulty: 4,
  sortOrder: 6,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/measure-and-match/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const MEASURE_AND_MATCH_LEVEL: GameLevel = {
  id: 'local-measure-and-match-level-1',
  gameId: MEASURE_AND_MATCH_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 9,
    promotionGates: {
      l1ToL2: { firstAttemptSuccessMinPct: 75, window: 8 },
      l2ToL3: { firstAttemptSuccessMinPct: 80, hintUsageMaxPct: 30, window: 10 },
    },
    remediation: {
      consecutiveMissesForReduceChoices: 2,
      consecutiveFirstAttemptSuccessForBoost: 3,
      confusionTags: ['perceptual-guess', 'term-mixup', 'tool-ignore'],
    },
  },
  sortOrder: 1,
};

export default function MeasureAndMatchPage() {
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
      ...MEASURE_AND_MATCH_LEVEL,
      configJson: {
        ...(MEASURE_AND_MATCH_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: MEASURE_AND_MATCH_GAME,
    level: runtimeLevel,
  });

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.measureAndMatch.title')}
        subtitle={t('games.measureAndMatch.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <MeasureAndMatchGame
        game={MEASURE_AND_MATCH_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult && (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>
            {t(
              syncState === 'error'
                ? 'errors.generic'
                : syncState === 'syncing'
                  ? 'feedback.keepGoing'
                  : 'feedback.excellent',
            )}
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
