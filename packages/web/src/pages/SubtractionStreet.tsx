import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { SubtractionStreetGame } from '@/games/numbers/SubtractionStreetGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const SUBTRACTION_STREET_GAME: Game = {
  id: 'local-subtraction-street',
  topicId: 'numbers',
  ageGroupId: '6-7',
  slug: 'subtractionStreet',
  nameKey: 'games.subtractionStreet.title',
  descriptionKey: 'games.subtractionStreet.subtitle',
  gameType: 'tap',
  componentKey: 'SubtractionStreetGame',
  difficulty: 4,
  sortOrder: 4,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/subtraction-street/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const SUBTRACTION_STREET_LEVEL: GameLevel = {
  id: 'local-subtraction-street-level-1',
  gameId: SUBTRACTION_STREET_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 9,
  },
  sortOrder: 1,
};

export default function SubtractionStreetPage() {
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
      ...SUBTRACTION_STREET_LEVEL,
      configJson: {
        ...(SUBTRACTION_STREET_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: SUBTRACTION_STREET_GAME,
    level: runtimeLevel,
  });

  const metrics = completionResult?.summaryMetrics;
  const accuracyByRange = metrics?.accuracyByRange as { within10?: number; within20?: number } | undefined;
  const misconceptionTrend = metrics?.misconceptionTrend as
    | {
        overshoot?: number;
        direction?: number;
        crossing10?: number;
      }
    | undefined;

  const topMisconception = useMemo(() => {
    if (!misconceptionTrend) {
      return t('games.subtractionStreet.misconceptions.overshoot');
    }

    const entries: Array<[keyof typeof misconceptionTrend, number]> = [
      ['overshoot', misconceptionTrend.overshoot ?? 0],
      ['direction', misconceptionTrend.direction ?? 0],
      ['crossing10', misconceptionTrend.crossing10 ?? 0],
    ];

    entries.sort((left, right) => right[1] - left[1]);
    const key = entries[0]?.[0] ?? 'overshoot';

    return t(`games.subtractionStreet.misconceptions.${key}`);
  }, [misconceptionTrend, t]);

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.subtractionStreet.title')}
        subtitle={t('games.subtractionStreet.subtitle')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <SubtractionStreetGame
        game={SUBTRACTION_STREET_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {metrics && (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.games.subtractionStreet.progressSummary', {
              within10Accuracy: `${accuracyByRange?.within10 ?? 0}%`,
              within20Accuracy: `${accuracyByRange?.within20 ?? 0}%`,
              topMisconception,
            })}
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {syncState === 'error'
              ? t('errors.generic')
              : syncState === 'syncing'
                ? t('feedback.keepGoing')
                : t('parentDashboard.games.subtractionStreet.nextStep')}
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
