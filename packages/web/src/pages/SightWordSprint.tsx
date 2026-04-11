import { useCallback, useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { SightWordSprintGame } from '@/games/reading/SightWordSprintGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const SIGHT_WORD_SPRINT_GAME: Game = {
  id: 'local-sight-word-sprint',
  topicId: 'reading',
  ageGroupId: '5-6',
  slug: 'sightWordSprint',
  nameKey: 'games.sightWordSprint.title',
  descriptionKey: 'games.sightWordSprint.subtitle',
  gameType: 'sight_word_fluency',
  componentKey: 'SightWordSprintGame',
  difficulty: 3,
  sortOrder: 4,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/sight-word-sprint/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const SIGHT_WORD_SPRINT_LEVEL: GameLevel = {
  id: 'local-sight-word-sprint-level-1',
  gameId: SIGHT_WORD_SPRINT_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
    timedStepUnlock: true,
  },
  sortOrder: 1,
};

export default function SightWordSprintPage() {
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
      createdAt: '2026-04-10T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );
  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...SIGHT_WORD_SPRINT_LEVEL,
      configJson: {
        ...(SIGHT_WORD_SPRINT_LEVEL.configJson as Record<string, unknown>),
        ageBand: activeProfile?.ageBand ?? '5-6',
      },
    }),
    [activeProfile?.ageBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: SIGHT_WORD_SPRINT_GAME,
    level: runtimeLevel,
  });

  const handleBackToGames = useCallback(() => {
    void audio.playNow('/audio/he/nav/back.mp3');
    navigate('/games');
  }, [audio, navigate]);

  return (
    <ChildRouteScaffold
      width="wide"
      mainStyle={{
        background:
          'radial-gradient(circle at 14% 12%, color-mix(in srgb, var(--color-theme-secondary) 18%, transparent), transparent 44%), linear-gradient(180deg, var(--color-theme-bg) 0%, color-mix(in srgb, var(--color-bg-card) 88%, white 12%) 100%)',
      }}
    >
      <ChildRouteHeader
        title={t('games.sightWordSprint.title')}
        subtitle={t('games.sightWordSprint.subtitle')}
      />

        <SightWordSprintGame
          game={SIGHT_WORD_SPRINT_GAME}
          level={runtimeLevel}
          child={child}
          onComplete={handleComplete}
          audio={audio}
          onRequestBack={handleBackToGames}
        />

        {completionResult && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
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
