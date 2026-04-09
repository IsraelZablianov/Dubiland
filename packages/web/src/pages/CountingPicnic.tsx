import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { CountingPicnicGame } from '@/games/numbers/CountingPicnicGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const COUNTING_PICNIC_GAME: Game = {
  id: 'local-counting-picnic',
  topicId: 'numbers',
  ageGroupId: '3-5',
  slug: 'countingPicnic',
  nameKey: 'games.countingPicnic.title',
  descriptionKey: 'games.countingPicnic.subtitle',
  gameType: 'drag_drop',
  componentKey: 'CountingPicnicGame',
  difficulty: 2,
  sortOrder: 1,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/counting-picnic/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-09T00:00:00.000Z',
};

const COUNTING_PICNIC_LEVEL: GameLevel = {
  id: 'local-counting-picnic-level-1',
  gameId: COUNTING_PICNIC_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
  },
  sortOrder: 1,
};

export default function CountingPicnicPage() {
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
      createdAt: '2026-04-09T00:00:00.000Z',
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
              {t('games.countingPicnic.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.countingPicnic.subtitle')}</p>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/home')}
            aria-label={t('nav.back')}
          >
            {t('nav.back')}
          </Button>
        </header>

        <CountingPicnicGame
          game={COUNTING_PICNIC_GAME}
          level={COUNTING_PICNIC_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.countingPicnic.progressSummary', {
                range: completionResult.summaryMetrics.highestStableRange,
                successRate: completionResult.summaryMetrics.firstAttemptSuccessRate,
              })}
            </p>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {syncState === 'syncing' ? t('feedback.keepGoing') : t('feedback.excellent')}
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
