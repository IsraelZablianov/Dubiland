import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult, ParentSummaryMetrics } from '@/games/engine';
import { DecodableStoryReaderGame } from '@/games/reading/DecodableStoryReaderGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';
type HintTrend = ParentSummaryMetrics['hintTrend'];

const DECODABLE_MICRO_STORIES_GAME: Game = {
  id: 'local-decodable-micro-stories',
  topicId: 'reading',
  ageGroupId: '5-6',
  slug: 'decodableMicroStories',
  nameKey: 'games.decodableMicroStories.title',
  descriptionKey: 'games.decodableMicroStories.subtitle',
  gameType: 'story_decode',
  componentKey: 'DecodableStoryReaderGame',
  difficulty: 4,
  sortOrder: 5,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/decodable-micro-stories/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const DECODABLE_MICRO_STORIES_LEVEL: GameLevel = {
  id: 'local-decodable-micro-stories-level-1',
  gameId: DECODABLE_MICRO_STORIES_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    pages: 6,
    checkpointCadence: 1,
  },
  sortOrder: 1,
};

function toHintTrendSummaryKey(hintTrend: HintTrend): string {
  if (hintTrend === 'improving') return 'games.decodableMicroStories.summary.hintTrend.improving';
  if (hintTrend === 'steady') return 'games.decodableMicroStories.summary.hintTrend.steady';
  return 'games.decodableMicroStories.summary.hintTrend.needsSupport';
}

export default function DecodableMicroStoriesPage() {
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
    }, 500);
  }, []);

  const hintTrendSummaryKey = useMemo(() => {
    const trend = completionResult?.summaryMetrics?.hintTrend;
    if (!trend) return null;
    return toHintTrendSummaryKey(trend);
  }, [completionResult?.summaryMetrics?.hintTrend]);

  return (
    <main
      style={{
        flex: 1,
        background:
          'radial-gradient(circle at 14% 14%, color-mix(in srgb, var(--color-theme-secondary) 22%, transparent), transparent 42%), linear-gradient(180deg, var(--color-theme-bg) 0%, color-mix(in srgb, var(--color-bg-card) 90%, white 10%) 100%)',
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
          <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('games.decodableMicroStories.title')}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t('games.decodableMicroStories.subtitle')}
            </p>
          </div>

          <Button variant="secondary" size="lg" onClick={() => navigate('/home')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <DecodableStoryReaderGame
          game={DECODABLE_MICRO_STORIES_GAME}
          level={DECODABLE_MICRO_STORIES_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.decodableMicroStories.progressSummary', {
                successRate: completionResult.summaryMetrics.firstAttemptSuccessRate,
                hintTrend: hintTrendSummaryKey ? t(hintTrendSummaryKey as any) : '',
              })}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t('parentDashboard.games.decodableMicroStories.nextStep')}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {syncState === 'syncing' ? t('feedback.keepGoing') : t('feedback.excellent')}
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
