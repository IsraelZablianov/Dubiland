import { useMemo } from 'react';
import type { Child, Game, GameLevel } from '@dubiland/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/design-system';
import type { HintTrend } from '@/games/engine';
import {
  LearningVideoCheckpointGame,
  type BlendToReadCompletionResult,
} from '@/games/reading/LearningVideoCheckpointGame';
import { createBlendToReadRuntimeSeedConfig } from '@/games/reading/blendToReadRuntimeAdapter';
import { ChildRouteHeader, ChildRouteScaffold } from '@/components/layout';
import { useAudioManager } from '@/hooks/useAudioManager';
import { toChildAgeBand } from '@/lib/concurrentChoiceLimit';
import { getActiveChildProfile } from '@/lib/session';
import { useGameAttemptSync } from './useGameAttemptSync';

const BLEND_TO_READ_VIDEO_SHORTS_GAME: Game = {
  id: 'local-blend-to-read-video-shorts',
  topicId: 'reading',
  ageGroupId: '5-6',
  slug: 'blendToReadVideoShorts',
  nameKey: 'videos.blendToRead.title',
  descriptionKey: 'videos.blendToRead.instructions.checkpointPrompt',
  gameType: 'interactive_video_blending',
  componentKey: 'LearningVideoCheckpointGame',
  difficulty: 4,
  sortOrder: 8,
  thumbnailUrl: null,
  audioUrl: '/audio/he/videos/blend-to-read/title.mp3',
  isPublished: true,
  createdAt: '2026-04-11T00:00:00.000Z',
};

const BLEND_TO_READ_VIDEO_SHORTS_LEVEL: GameLevel = {
  id: 'local-blend-to-read-video-shorts-level-1',
  gameId: BLEND_TO_READ_VIDEO_SHORTS_GAME.id,
  levelNumber: 1,
  configJson: {
    adaptive: true,
    checkpointCountPerEpisode: 3,
    sessionEpisodeTarget: 3,
    ...createBlendToReadRuntimeSeedConfig(),
  },
  sortOrder: 1,
};

const REPLAY_TREND_TEXT_KEY_BY_VALUE: Record<HintTrend, string> = {
  improving: 'feedback.excellent',
  steady: 'feedback.keepGoing',
  needs_support: 'feedback.greatEffort',
};

export default function BlendToReadVideoShortsPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const audio = useAudioManager();

  const activeProfile = getActiveChildProfile();
  const profileAgeBand = toChildAgeBand(activeProfile?.ageBand) ?? undefined;

  const child = useMemo<Child>(
    () => ({
      id: activeProfile?.id ?? 'guest',
      familyId: 'local-family',
      name: activeProfile?.name ?? t('profile.guestName'),
      avatar: activeProfile?.emoji ?? '🧒',
      theme: 'bear',
      birthDate: null,
      createdAt: '2026-04-11T00:00:00.000Z',
    }),
    [activeProfile?.emoji, activeProfile?.id, activeProfile?.name, t],
  );

  const runtimeLevel = useMemo<GameLevel>(
    () => ({
      ...BLEND_TO_READ_VIDEO_SHORTS_LEVEL,
      configJson: {
        ...(BLEND_TO_READ_VIDEO_SHORTS_LEVEL.configJson as Record<string, unknown>),
        profileAgeBand,
      },
    }),
    [profileAgeBand],
  );

  const { completionResult, syncState, handleComplete, retryLastSync } = useGameAttemptSync({
    childId: child.id,
    childAgeBand: activeProfile?.ageBand,
    game: BLEND_TO_READ_VIDEO_SHORTS_GAME,
    level: runtimeLevel,
  });

  const blendToReadMetrics = (completionResult as BlendToReadCompletionResult | null)?.blendToReadMetrics ?? null;

  return (
    <ChildRouteScaffold width="wide">
      <ChildRouteHeader
        title={t('videos.blendToRead.title')}
        subtitle={t('videos.blendToRead.instructions.checkpointPrompt')}
        leading={
          <Button variant="secondary" size="lg" onClick={() => navigate('/games')} aria-label={t('nav.back')}>
            {t('nav.back')}
          </Button>
        }
      />

      <LearningVideoCheckpointGame
        game={BLEND_TO_READ_VIDEO_SHORTS_GAME}
        level={runtimeLevel}
        child={child}
        onComplete={handleComplete}
        audio={audio}
      />

      {blendToReadMetrics ? (
        <Card padding="md" style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            {t('parentDashboard.videos.blendToRead.progressSummary', {
              accuracy: `${blendToReadMetrics.accuracyPct}%`,
              replayTrend: t(REPLAY_TREND_TEXT_KEY_BY_VALUE[blendToReadMetrics.replayTrend] as any),
            })}
          </p>

          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('parentDashboard.videos.blendToRead.patternBreakdown', {
              focusPattern: t(`videos.blendToRead.episodes.${blendToReadMetrics.focusEpisodeId}.title` as any),
              patternAccuracy: `${blendToReadMetrics.focusEpisodeAccuracyPct}%`,
              nextPattern: t(`videos.blendToRead.episodes.${blendToReadMetrics.nextEpisodeId}.title` as any),
            })}
          </p>

          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {syncState === 'error'
              ? t('errors.generic')
              : syncState === 'syncing'
                ? t('feedback.keepGoing')
                : t('parentDashboard.videos.blendToRead.nextStep')}
          </p>

          {syncState === 'error' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="secondary" size="md" onClick={retryLastSync} aria-label={t('profile.retry')}>
                {t('profile.retry')}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </ChildRouteScaffold>
  );
}
