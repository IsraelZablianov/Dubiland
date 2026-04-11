import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { LetterTracingTrailGame } from '@/games/letters/LetterTracingTrailGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

type ProfileAgeBand = '3-4' | '4-5' | '5-6' | '6-7';

const LETTER_TRACING_TRAIL_GAME: Game = {
  id: 'local-letter-tracing-trail',
  topicId: 'letters',
  ageGroupId: '3-5',
  slug: 'letterTracingTrail',
  nameKey: 'games.letterTracingTrail.title',
  descriptionKey: 'games.letterTracingTrail.subtitle',
  gameType: 'trace',
  componentKey: 'LetterTracingTrailGame',
  difficulty: 2,
  sortOrder: 2,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/letter-tracing-trail/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const LETTER_TRACING_TRAIL_LEVEL: GameLevel = {
  id: 'local-letter-tracing-trail-level-1',
  gameId: LETTER_TRACING_TRAIL_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
  },
  sortOrder: 1,
};

function resolveAgeBand(value: unknown): ProfileAgeBand {
  return value === '3-4' || value === '4-5' || value === '5-6' || value === '6-7'
    ? value
    : '5-6';
}

function levelNumberByAgeBand(ageBand: ProfileAgeBand): 1 | 2 | 3 {
  if (ageBand === '3-4' || ageBand === '4-5') return 1;
  if (ageBand === '5-6') return 2;
  return 3;
}

export default function LetterTracingTrailPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
  const profileAgeBand = resolveAgeBand(activeProfile?.ageBand);
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
      ...LETTER_TRACING_TRAIL_LEVEL,
      levelNumber: levelNumberByAgeBand(profileAgeBand),
      configJson: {
        ...(LETTER_TRACING_TRAIL_LEVEL.configJson as Record<string, unknown>),
        defaultBand: profileAgeBand,
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: LETTER_TRACING_TRAIL_GAME,
    level: runtimeLevel,
  });

  const roundsCompleted = completionResult?.roundsCompleted ?? 0;

  const independentLetters = useMemo(() => {
    if (!completionResult?.summaryMetrics) {
      return 0;
    }

    return Math.round((roundsCompleted * completionResult.summaryMetrics.firstAttemptSuccessRate) / 100);
  }, [completionResult, roundsCompleted]);

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.letterTracingTrail.title')}
        subtitle={t('games.letterTracingTrail.subtitle')}
        leading={
          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

        <LetterTracingTrailGame
          game={LETTER_TRACING_TRAIL_GAME}
          level={runtimeLevel}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.letterTracingTrail.progressSummary', {
                attemptedLetters: roundsCompleted,
                independentLetters,
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
