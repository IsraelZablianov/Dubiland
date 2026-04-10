import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { MoreOrLessMarketGame } from '@/games/numbers/MoreOrLessMarketGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const MORE_OR_LESS_MARKET_GAME: Game = {
  id: 'local-more-or-less-market',
  topicId: 'numbers',
  ageGroupId: '5-6',
  slug: 'moreOrLessMarket',
  nameKey: 'games.moreOrLessMarket.title',
  descriptionKey: 'games.moreOrLessMarket.subtitle',
  gameType: 'match',
  componentKey: 'MoreOrLessMarketGame',
  difficulty: 3,
  sortOrder: 2,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/more-or-less-market/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const MORE_OR_LESS_MARKET_LEVEL: GameLevel = {
  id: 'local-more-or-less-market-level-1',
  gameId: MORE_OR_LESS_MARKET_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 9,
  },
  sortOrder: 1,
};

function getHintLevelValue(hintTrend: GameCompletionResult['summaryMetrics'] extends infer T
  ? T extends { hintTrend: infer H }
    ? H
    : never
  : never): string {
  if (hintTrend === 'improving') {
    return '1.0';
  }

  if (hintTrend === 'steady') {
    return '1.5';
  }

  return '2.2';
}

export default function MoreOrLessMarketPage() {
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
              {t('games.moreOrLessMarket.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('games.moreOrLessMarket.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <MoreOrLessMarketGame
          game={MORE_OR_LESS_MARKET_GAME}
          level={MORE_OR_LESS_MARKET_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.moreOrLessMarket.progressSummary', {
                comparisonType: '> / < / =',
                accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
                hintLevel: getHintLevelValue(completionResult.summaryMetrics.hintTrend),
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
