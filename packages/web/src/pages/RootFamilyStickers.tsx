import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult } from '@/games/engine';
import { RootFamilyStickersGame } from '@/games/reading/RootFamilyStickersGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

const ROOT_FAMILY_STICKERS_GAME: Game = {
  id: 'local-root-family-stickers',
  topicId: 'reading',
  ageGroupId: '6-7',
  slug: 'rootFamilyStickers',
  nameKey: 'games.rootFamilyStickers.title',
  descriptionKey: 'games.rootFamilyStickers.subtitle',
  gameType: 'sort_build_read',
  componentKey: 'RootFamilyStickersGame',
  difficulty: 4,
  sortOrder: 5,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/root-family-stickers/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const ROOT_FAMILY_STICKERS_LEVEL: GameLevel = {
  id: 'local-root-family-stickers-level-1',
  gameId: ROOT_FAMILY_STICKERS_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    rounds: 7,
    supportsSlowMode: true,
    decoyCapPercent: 17,
  },
  sortOrder: 1,
};

export default function RootFamilyStickersPage() {
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

  const hintTrendLabel = useMemo(() => {
    if (!completionResult?.summaryMetrics) {
      return t('feedback.keepGoing');
    }

    if (completionResult.summaryMetrics.hintTrend === 'improving') {
      return t('feedback.excellent');
    }

    if (completionResult.summaryMetrics.hintTrend === 'steady') {
      return t('feedback.keepGoing');
    }

    return t('feedback.greatEffort');
  }, [completionResult?.summaryMetrics, t]);

  return (
    <main
      style={{
        flex: 1,
        background:
          'radial-gradient(circle at 10% 14%, color-mix(in srgb, var(--color-theme-secondary) 20%, transparent), transparent 44%), linear-gradient(180deg, var(--color-theme-bg) 0%, color-mix(in srgb, var(--color-bg-card) 88%, white 12%) 100%)',
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
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
              }}
            >
              {t('games.rootFamilyStickers.title')}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{t('games.rootFamilyStickers.subtitle')}</p>
          </div>

          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        </header>

        <RootFamilyStickersGame
          game={ROOT_FAMILY_STICKERS_GAME}
          level={ROOT_FAMILY_STICKERS_LEVEL}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.rootFamilyStickers.progressSummary', {
                accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
                hintTrend: hintTrendLabel,
              })}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t('parentDashboard.games.rootFamilyStickers.confusions', {
                confusedRoots: `${t('roots.common.kra')} / ${t('roots.common.ktv')}`,
                affixPattern: t('games.rootFamilyStickers.hints.affixIsExtra'),
              })}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {syncState === 'syncing' ? t('feedback.keepGoing') : t('parentDashboard.games.rootFamilyStickers.nextStep')}
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}

