import { useCallback, useMemo, useState } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { GameCompletionResult } from '@/games/engine';
import { ConfusableLetterContrastGame } from '@/games/reading/ConfusableLetterContrastGame';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';

type SyncState = 'idle' | 'syncing' | 'synced';

type ConfusableCompletionResult = GameCompletionResult & {
  topConfusionPair?: string;
  transferSuccessRate?: number;
};

const CONFUSABLE_LETTER_CONTRAST_GAME: Game = {
  id: 'local-confusable-letter-contrast',
  topicId: 'reading',
  ageGroupId: '5-6',
  slug: 'confusableLetterContrast',
  nameKey: 'games.confusableLetterContrast.title',
  descriptionKey: 'games.confusableLetterContrast.subtitle',
  gameType: 'contrast_match_sort',
  componentKey: 'ConfusableLetterContrastGame',
  difficulty: 4,
  sortOrder: 6,
  thumbnailUrl: null,
  audioUrl: '/audio/he/games/confusable-letter-contrast/instructions/intro.mp3',
  isPublished: true,
  createdAt: '2026-04-10T00:00:00.000Z',
};

const CONFUSABLE_LETTER_CONTRAST_LEVEL: GameLevel = {
  id: 'local-confusable-letter-contrast-level-1',
  gameId: CONFUSABLE_LETTER_CONTRAST_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    sessionMinutesTarget: 5,
    fallbackAfterSamePairErrors: 2,
    slowModeHintsThreshold: 2,
    slowModeErrorsThreshold: 3,
    slowModeRounds: 2,
    masteryWindow: 6,
    masteryFirstTryThreshold: 5,
    masteryHintsMax: 1,
    antiRandomTapGuard: {
      wrongTapCount: 3,
      intervalMs: 450,
      windowMs: 5000,
      pauseMs: 1000,
    },
  },
  sortOrder: 1,
};

export default function ConfusableLetterContrastPage() {
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
  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...CONFUSABLE_LETTER_CONTRAST_LEVEL,
      configJson: {
        ...(CONFUSABLE_LETTER_CONTRAST_LEVEL.configJson as Record<string, unknown>),
        ageBand: activeProfile?.ageBand ?? '5-6',
      },
    }),
    [activeProfile?.ageBand],
  );

  const [completionResult, setCompletionResult] = useState<ConfusableCompletionResult | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');

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

  const handleComplete = useCallback((result: GameCompletionResult) => {
    setCompletionResult(result as ConfusableCompletionResult);
    setSyncState('syncing');

    window.setTimeout(() => {
      setSyncState('synced');
    }, 450);
  }, []);

  return (
    <ChildRouteScaffold
      width="wide"
      mainStyle={{
        background:
          'radial-gradient(circle at 14% 12%, color-mix(in srgb, var(--color-theme-secondary) 18%, transparent), transparent 44%), linear-gradient(180deg, var(--color-theme-bg) 0%, color-mix(in srgb, var(--color-bg-card) 88%, white 12%) 100%)',
      }}
    >
      <ChildRouteHeader
        title={t('games.confusableLetterContrast.title')}
        subtitle={t('games.confusableLetterContrast.subtitle')}
        leading={
          <Button variant="ghost" size="md" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

        <ConfusableLetterContrastGame
          game={CONFUSABLE_LETTER_CONTRAST_GAME}
          level={runtimeLevel}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {t('parentDashboard.games.confusableLetterContrast.progressSummary', {
                accuracy: `${completionResult.summaryMetrics.firstAttemptSuccessRate}%`,
                hintTrend: hintTrendLabel,
              })}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t('parentDashboard.games.confusableLetterContrast.confusions', {
                pair: completionResult.topConfusionPair ?? `${t('letters.symbols.dalet')}/${t('letters.symbols.resh')}`,
              })}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {syncState === 'syncing' ? t('feedback.keepGoing') : t('parentDashboard.games.confusableLetterContrast.nextStep')}
            </p>
          </Card>
        )}
    </ChildRouteScaffold>
  );
}
