import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { SightWordSprintGame } from '@/games/reading/SightWordSprintGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

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
        background:
          'radial-gradient(circle at 14% 12%, color-mix(in srgb, var(--color-theme-secondary) 18%, transparent), transparent 44%), linear-gradient(180deg, var(--color-theme-bg) 0%, color-mix(in srgb, var(--color-bg-card) 88%, white 12%) 100%)',
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
                margin: 0,
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('games.sightWordSprint.title')}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{t('games.sightWordSprint.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/home')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <SightWordSprintGame
          game={SIGHT_WORD_SPRINT_GAME}
          level={SIGHT_WORD_SPRINT_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {syncState === 'syncing' ? t('feedback.keepGoing') : t('feedback.excellent')}
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
