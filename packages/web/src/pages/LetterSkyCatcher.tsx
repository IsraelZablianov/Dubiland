import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { LetterSkyCatcherGame } from '@/games/letters/LetterSkyCatcherGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const LETTER_SKY_CATCHER_GAME: Game = {
  id: 'local-letter-sky-catcher',
  topicId: 'letters',
  ageGroupId: '4-7',
  slug: 'letterSkyCatcher',
  nameKey: 'games.letterSkyCatcher.title',
  descriptionKey: 'games.letterSkyCatcher.subtitle',
  gameType: 'runner_match',
  componentKey: 'LetterSkyCatcherGame',
  difficulty: 3,
  sortOrder: 3,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/letter-sky-catcher/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const LETTER_SKY_CATCHER_LEVEL: GameLevel = {
  id: 'local-letter-sky-catcher-level-1',
  gameId: LETTER_SKY_CATCHER_GAME.id,
  levelNumber: 2,
  configJson: {
    adaptive: true,
    rounds: 6,
  },
  sortOrder: 1,
};

export default function LetterSkyCatcherPage() {
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

  const fallbackConfusionPair = `${t('letters.symbols.bet')} / ${t('letters.symbols.pe')}`;

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
              {t('games.letterSkyCatcher.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.letterSkyCatcher.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <LetterSkyCatcherGame
          game={LETTER_SKY_CATCHER_GAME}
          level={LETTER_SKY_CATCHER_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.letterSkyCatcher.progressSummary', {
                accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
                hintTrend:
                  completionResult.summaryMetrics.hintTrend === 'improving'
                    ? t('feedback.excellent')
                    : completionResult.summaryMetrics.hintTrend === 'steady'
                      ? t('feedback.keepGoing')
                      : t('feedback.greatEffort'),
              })}
            </p>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {t('parentDashboard.games.letterSkyCatcher.letterConfusions', {
                pair: fallbackConfusionPair,
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
