import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { ColorGardenGame } from '@/games/colors/ColorGardenGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

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
              {t('games.colorGarden.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.colorGarden.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

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
              {t(syncState === 'syncing' ? 'feedback.keepGoing' : 'feedback.excellent')}
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
