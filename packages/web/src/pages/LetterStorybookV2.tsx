import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { LetterStorybookV2Game } from '@/games/reading/LetterStorybookV2Game';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

type ProfileAgeBand = '3-4' | '4-5' | '5-6' | '6-7';

const LETTER_STORYBOOK_V2_GAME: Game = {
  id: 'local-letter-storybook-v2',
  topicId: 'reading',
  ageGroupId: '5-6',
  slug: 'letterStorybookV2',
  nameKey: 'games.letterStorybook.title',
  descriptionKey: 'games.letterStorybook.subtitle',
  gameType: 'storybook_letters',
  componentKey: 'LetterStorybookV2Game',
  difficulty: 4,
  sortOrder: 8,
  thumbnailUrl: '/images/games/thumbnails/interactiveHandbook/thumb-16x10.webp',
  audioUrl: '/audio/he/games/letter-storybook/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const LETTER_STORYBOOK_V2_LEVEL: GameLevel = {
  id: 'local-letter-storybook-v2-level-1',
  gameId: LETTER_STORYBOOK_V2_GAME.id,
  levelNumber: 2,
  configJson: {
    adaptive: true,
    storyVersion: 2,
    pages: 22,
    storyLetterCount: 22,
    chapterCount: 3,
    antiRandomTapGuard: {
      wrongTapCount: 3,
      windowMs: 2000,
      pauseMs: 1000,
    },
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

export default function LetterStorybookV2Page() {
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
      createdAt: '2026-04-11T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );

  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...LETTER_STORYBOOK_V2_LEVEL,
      levelNumber: levelNumberByAgeBand(profileAgeBand),
      configJson: {
        ...(LETTER_STORYBOOK_V2_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: LETTER_STORYBOOK_V2_GAME,
    level: runtimeLevel,
  });

  const completionSummary = useMemo(() => {
    if (!completionResult?.summaryMetrics) {
      return null;
    }

    const pagesCompleted = completionResult.roundsCompleted ?? 0;
    const lettersMastered = Math.min(
      22,
      Math.round((completionResult.summaryMetrics.firstAttemptSuccessRate / 100) * 22),
    );
    const hintTrendLabel = t(
      `parentDashboard.curriculum.trends.${completionResult.summaryMetrics.hintTrend}`,
    );

    return {
      pagesCompleted,
      lettersMastered,
      hintTrendLabel,
    };
  }, [completionResult, t]);

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.letterStorybook.title')}
        subtitle={t('games.letterStorybook.subtitle')}
        leading={
          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <LetterStorybookV2Game
        game={LETTER_STORYBOOK_V2_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {completionSummary ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.letterStorybook.progressSummary', {
              pagesCompleted: completionSummary.pagesCompleted,
              lettersMastered: completionSummary.lettersMastered,
              hintTrend: completionSummary.hintTrendLabel,
            })}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.games.letterStorybook.nextStep')}
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
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
      ) : null}
    </ChildRouteScaffold>
  );
}
