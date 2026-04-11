import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { GameCompletionResult } from '@/games/engine';
import { PictureToWordBuilderGame } from '@/games/reading/PictureToWordBuilderGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const PICTURE_TO_WORD_BUILDER_GAME: Game = {
  id: 'local-picture-to-word-builder',
  topicId: 'reading',
  ageGroupId: '5-7',
  slug: 'pictureToWordBuilder',
  nameKey: 'games.pictureToWordBuilder.title',
  descriptionKey: 'games.pictureToWordBuilder.subtitle',
  gameType: 'drag_drop',
  componentKey: 'PictureToWordBuilderGame',
  difficulty: 3,
  sortOrder: 3,
  thumbnailUrl: '/images/games/thumbnails/pictureToWordBuilder/thumb-16x10.webp',
  audioUrl: '/audio/he/games/picture-to-word-builder/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const PICTURE_TO_WORD_BUILDER_LEVEL: GameLevel = {
  id: 'local-picture-to-word-builder-level-1',
  gameId: PICTURE_TO_WORD_BUILDER_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
  },
  sortOrder: 1,
};

export default function PictureToWordBuilderPage() {
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
      ...PICTURE_TO_WORD_BUILDER_LEVEL,
      configJson: {
        ...(PICTURE_TO_WORD_BUILDER_LEVEL.configJson as Record<string, unknown>),
        ageBand: activeProfile?.ageBand ?? '5-6',
      },
    }),
    [activeProfile?.ageBand],
  );

  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const handleComplete = useCallback((result: GameCompletionResult) => {
    setCompletionResult(result);
    setSyncState('syncing');

    window.setTimeout(() => {
      setSyncState('synced');
    }, 450);
  }, []);

  const handleBackToGames = useCallback(() => {
    void audio.playNow('/audio/he/nav/back.mp3');
    navigate('/games');
  }, [audio, navigate]);

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('games.pictureToWordBuilder.title')}
        subtitle={t('games.pictureToWordBuilder.subtitle')}
      />

        <PictureToWordBuilderGame
          game={PICTURE_TO_WORD_BUILDER_GAME}
          level={runtimeLevel}
          child={child}
          onComplete={handleComplete}
          audio={audio}
          onRequestBack={handleBackToGames}
        />

        {completionResult && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t(
                syncState === 'syncing'
                  ? 'feedback.keepGoing'
                  : 'games.pictureToWordBuilder.roundComplete.wordBuilt',
              )}
            </p>
          </Card>
        )}
    </ChildRouteScaffold>
  );
}
