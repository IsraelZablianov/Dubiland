import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { NumberLineJumpsGame } from '@/games/numbers/NumberLineJumpsGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const NUMBER_LINE_JUMPS_GAME: Game = {
  id: 'local-number-line-jumps',
  topicId: 'numbers',
  ageGroupId: '6-7',
  slug: 'numberLineJumps',
  nameKey: 'games.numberLineJumps.title',
  descriptionKey: 'games.numberLineJumps.subtitle',
  gameType: 'tap',
  componentKey: 'NumberLineJumpsGame',
  difficulty: 4,
  sortOrder: 3,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/number-line-jumps/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const NUMBER_LINE_JUMPS_LEVEL: GameLevel = {
  id: 'local-number-line-jumps-level-1',
  gameId: NUMBER_LINE_JUMPS_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 8,
  },
  sortOrder: 1,
};

export default function NumberLineJumpsPage() {
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
              {t('games.numberLineJumps.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.numberLineJumps.subtitle')}</p>
          </div>

          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <NumberLineJumpsGame
          game={NUMBER_LINE_JUMPS_GAME}
          level={NUMBER_LINE_JUMPS_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.numberLineJumps.progressSummary', {
                accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
                hintTrend: t(
                  completionResult.summaryMetrics.hintTrend === 'improving'
                    ? 'feedback.excellent'
                    : completionResult.summaryMetrics.hintTrend === 'steady'
                      ? 'feedback.keepGoing'
                      : 'feedback.greatEffort',
                ),
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
