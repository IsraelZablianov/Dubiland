import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { LetterTracingTrailGame } from '@/games/letters/LetterTracingTrailGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const LETTER_TRACING_TRAIL_GAME: Game = {
  id: 'local-letter-tracing-trail',
  topicId: 'letters',
  ageGroupId: '3-5',
  slug: 'letterTracingTrail',
  nameKey: 'games.letterTracingTrail.title',
  descriptionKey: 'games.letterTracingTrail.subtitle',
  gameType: 'trace',
  componentKey: 'LetterTracingTrailGame',
  difficulty: 2,
  sortOrder: 2,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/letter-tracing-trail/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const LETTER_TRACING_TRAIL_LEVEL: GameLevel = {
  id: 'local-letter-tracing-trail-level-1',
  gameId: LETTER_TRACING_TRAIL_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
  },
  sortOrder: 1,
};

export default function LetterTracingTrailPage() {
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

  const roundsCompleted = completionResult?.roundsCompleted ?? 0;

  const independentLetters = useMemo(() => {
    if (!completionResult?.summaryMetrics) {
      return 0;
    }

    return Math.round((roundsCompleted * completionResult.summaryMetrics.firstAttemptSuccessRate) / 100);
  }, [completionResult, roundsCompleted]);

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
              {t('games.letterTracingTrail.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.letterTracingTrail.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <LetterTracingTrailGame
          game={LETTER_TRACING_TRAIL_GAME}
          level={LETTER_TRACING_TRAIL_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.letterTracingTrail.progressSummary', {
                attemptedLetters: roundsCompleted,
                independentLetters,
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
