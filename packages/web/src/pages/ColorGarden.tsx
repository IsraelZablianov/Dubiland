import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { ColorGardenGame } from '@/games/colors/ColorGardenGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const COLOR_GARDEN_GAME: Game = {
  id: 'local-color-garden',
  topicId: 'numbers',
  ageGroupId: '3-6',
  slug: 'colorGarden',
  nameKey: 'games.colorGarden.title',
  descriptionKey: 'games.colorGarden.subtitle',
  gameType: 'match',
  componentKey: 'ColorGardenGame',
  difficulty: 2,
  sortOrder: 2,
  thumbnailUrl: '/images/games/thumbnails/colorGarden/thumb-16x10.webp',
  audioUrl: '/audio/he/games/color-garden/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const COLOR_GARDEN_LEVEL: GameLevel = {
  id: 'local-color-garden-level-1',
  gameId: COLOR_GARDEN_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 6,
  },
  sortOrder: 1,
};

export default function ColorGardenPage() {
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

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: COLOR_GARDEN_GAME,
    level: COLOR_GARDEN_LEVEL,
  });

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.colorGarden.title')}
        subtitle={t('games.colorGarden.subtitle')}
        leading={
          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

        <ColorGardenGame
          game={COLOR_GARDEN_GAME}
          level={COLOR_GARDEN_LEVEL}
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
