import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { ShapeSafariGame } from '@/games/numbers/ShapeSafariGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const SHAPE_SAFARI_GAME: Game = {
  id: 'local-shape-safari',
  topicId: 'numbers',
  ageGroupId: '3-6',
  slug: 'shapeSafari',
  nameKey: 'games.shapeSafari.title',
  descriptionKey: 'games.shapeSafari.subtitle',
  gameType: 'drag_drop',
  componentKey: 'ShapeSafariGame',
  difficulty: 2,
  sortOrder: 3,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/shape-safari/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const SHAPE_SAFARI_LEVEL: GameLevel = {
  id: 'local-shape-safari-level-1',
  gameId: SHAPE_SAFARI_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 6,
  },
  sortOrder: 1,
};

export default function ShapeSafariPage() {
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
              {t('games.shapeSafari.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.shapeSafari.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/home')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <ShapeSafariGame
          game={SHAPE_SAFARI_GAME}
          level={SHAPE_SAFARI_LEVEL}
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

