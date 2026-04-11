import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import type { ParentSummaryMetrics } from '@/games/engine';
import { DecodableStoryReaderGame } from '@/games/reading/DecodableStoryReaderGame';
import { READING_RUNTIME_MATRIX, toReadingAgeBand, type ReadingAgeBand } from '@/games/reading/readingRuntimeMatrix';
import { useAudioManager } from '@/hooks/useAudioManager';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

type HintTrend = ParentSummaryMetrics['hintTrend'];
type DecodableAgeBand = ReadingAgeBand;

const DECODABLE_MICRO_STORIES_GAME: Game = {
  id: 'local-decodable-micro-stories',
  topicId: 'reading',
  ageGroupId: '3-7',
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

function toAgeBandLabelKey(ageBand: DecodableAgeBand): 'contentFilters.age.band.3_4' | 'contentFilters.age.band.5_6' | 'contentFilters.age.band.6_7' {
  if (ageBand === '3-4') return 'contentFilters.age.band.3_4';
  if (ageBand === '6-7') return 'contentFilters.age.band.6_7';
  return 'contentFilters.age.band.5_6';
}

export default function DecodableMicroStoriesPage() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();
  const activeProfile = getActiveChildProfile();
  const runtimeAgeBand = useMemo(() => toReadingAgeBand(activeProfile?.ageBand), [activeProfile?.ageBand]);

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
      ...DECODABLE_MICRO_STORIES_LEVEL,
      configJson: {
        ...(DECODABLE_MICRO_STORIES_LEVEL.configJson as Record<string, unknown>),
        ageBand: runtimeAgeBand,
        pages: READING_RUNTIME_MATRIX[runtimeAgeBand].decodable.storyPages,
      },
    }),
  [runtimeAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: DECODABLE_MICRO_STORIES_GAME,
    level: runtimeLevel,
  });

  const hintTrendSummaryKey = useMemo(() => {
    const trend = completionResult?.summaryMetrics?.hintTrend;
    if (!trend) return null;
    return toHintTrendSummaryKey(trend);
  }, [completionResult?.summaryMetrics?.hintTrend]);

  const parentProgressSummaryKey = useMemo(() => {
    const candidate = `parentDashboard.games.decodableMicroStories.ageBand.${runtimeAgeBand}.progressSummary`;
    return i18n.exists(candidate, { ns: 'common' })
      ? candidate
      : 'parentDashboard.games.decodableMicroStories.progressSummary';
  }, [i18n, runtimeAgeBand]);

  const parentNextStepKey = useMemo(() => {
    const candidate = `parentDashboard.games.decodableMicroStories.ageBand.${runtimeAgeBand}.nextStep`;
    return i18n.exists(candidate, { ns: 'common' }) ? candidate : 'parentDashboard.games.decodableMicroStories.nextStep';
  }, [i18n, runtimeAgeBand]);

  const completionMetrics = completionResult?.summaryMetrics;
  const metricBadgeLine = useMemo(() => {
    if (!completionMetrics) return null;

    if (completionMetrics.ageBand === '3-4' && typeof completionMetrics.listenParticipation === 'number') {
      return `👂 ${completionMetrics.listenParticipation}%`;
    }
    if (completionMetrics.ageBand === '6-7') {
      const decodePart =
        typeof completionMetrics.decodeAccuracy === 'number' ? `📖 ${completionMetrics.decodeAccuracy}%` : null;
      const evidencePart =
        typeof completionMetrics.sequenceEvidenceScore === 'number' ? `🧩 ${completionMetrics.sequenceEvidenceScore}%` : null;
      return [decodePart, evidencePart].filter(Boolean).join(' · ');
    }
    if (typeof completionMetrics.decodeAccuracy === 'number') {
      return `📖 ${completionMetrics.decodeAccuracy}%`;
    }
    return null;
  }, [completionMetrics]);

  return (
    <ChildRouteScaffold
      width="wide"
      mainStyle={{
        background:
          'radial-gradient(circle at 14% 14%, color-mix(in srgb, var(--color-theme-secondary) 22%, transparent), transparent 42%), linear-gradient(180deg, var(--color-theme-bg) 0%, color-mix(in srgb, var(--color-bg-card) 90%, white 10%) 100%)',
      }}
    >
      <ChildRouteHeader
        title={t('games.decodableMicroStories.title')}
        subtitle={t('games.decodableMicroStories.subtitle')}
        details={t(toAgeBandLabelKey(runtimeAgeBand))}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

        <DecodableStoryReaderGame
          game={DECODABLE_MICRO_STORIES_GAME}
          level={runtimeLevel}
          child={child}
          onComplete={handleComplete}
          audio={audio}
        />

        {completionResult?.summaryMetrics && (
          <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
              {t(parentProgressSummaryKey as any, {
                successRate: completionResult.summaryMetrics.firstAttemptSuccessRate,
                hintTrend: hintTrendSummaryKey ? t(hintTrendSummaryKey as any) : '',
              })}
            </p>
            {metricBadgeLine && <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{metricBadgeLine}</p>}
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t(parentNextStepKey as any)}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {syncState === 'error'
                ? t('errors.generic')
                : syncState === 'syncing'
                  ? t('feedback.keepGoing')
                  : t('feedback.excellent')}
            </p>
            {syncState === 'error' && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Button variant="secondary" size="md" onClick={retryLastSync} aria-label={t('profile.retry')}>
                  {t('profile.retry')}
                </Button>
              </div>
            )}
          </Card>
        )}
    </ChildRouteScaffold>
  );
}
