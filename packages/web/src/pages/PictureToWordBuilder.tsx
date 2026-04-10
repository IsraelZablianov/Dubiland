import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
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

  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const handleComplete = useCallback((result: GameCompletionResult) => {
    setCompletionResult(result);
    setSyncState('syncing');

    window.setTimeout(() => {
      setSyncState('synced');
    }, 450);
  }, []);

  return (
    <main
      style={{
        flex: 1,
        background: 'var(--color-theme-bg)',
        padding: 'var(--space-lg)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: 'min(1180px, 100%)', display: 'grid', gap: 'var(--space-md)' }}>
        <header
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('games.pictureToWordBuilder.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.pictureToWordBuilder.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <PictureToWordBuilderGame
          game={PICTURE_TO_WORD_BUILDER_GAME}
          level={PICTURE_TO_WORD_BUILDER_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
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
      </section>
    </main>
  );
}
