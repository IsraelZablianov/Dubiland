import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { LetterSkyCatcherGame } from '@/games/letters/LetterSkyCatcherGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

type ProfileAgeBand = '3-4' | '4-5' | '5-6' | '6-7';

const LETTER_SKY_CATCHER_GAME: Game = {
  id: 'local-letter-sky-catcher',
  topicId: 'letters',
  ageGroupId: '4-7',
  slug: 'letterSkyCatcher',
  nameKey: 'games.letterSkyCatcher.title',
  descriptionKey: 'games.letterSkyCatcher.subtitle',
  gameType: 'runner_match',
  componentKey: 'LetterSkyCatcherGame',
  difficulty: 3,
  sortOrder: 3,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/letter-sky-catcher/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const LETTER_SKY_CATCHER_LEVEL: GameLevel = {
  id: 'local-letter-sky-catcher-level-1',
  gameId: LETTER_SKY_CATCHER_GAME.id,
  levelNumber: 2,
  configJson: {
    adaptive: true,
    rounds: 6,
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

export default function LetterSkyCatcherPage() {
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
      ...LETTER_SKY_CATCHER_LEVEL,
      levelNumber: levelNumberByAgeBand(profileAgeBand),
      configJson: {
        ...(LETTER_SKY_CATCHER_LEVEL.configJson as Record<string, unknown>),
        defaultBand: profileAgeBand,
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: LETTER_SKY_CATCHER_GAME,
    level: runtimeLevel,
  });

  const fallbackConfusionPair = `${t('letters.symbols.bet')} / ${t('letters.symbols.pe')}`;

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.letterSkyCatcher.title')}
        subtitle={t('games.letterSkyCatcher.subtitle')}
        leading={
          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <LetterSkyCatcherGame
        game={LETTER_SKY_CATCHER_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionResult?.summaryMetrics && (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.letterSkyCatcher.progressSummary', {
              accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
              hintTrend:
                completionResult.summaryMetrics.hintTrend === 'improving'
                  ? t('feedback.excellent')
                  : completionResult.summaryMetrics.hintTrend === 'steady'
                    ? t('feedback.keepGoing')
                    : t('feedback.greatEffort'),
            })}
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.letterSkyCatcher.letterConfusions', {
              pair: fallbackConfusionPair,
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
